from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, date
from bson import ObjectId
from database import get_db
from models import PunchRequest
from auth_utils import get_current_user
from face_service import compare_faces, anti_spoofing_check
from geo_service import is_within_geofence
import numpy as np

router = APIRouter()

def calc_status(punch_in: datetime, punch_out: datetime) -> tuple:
    delta = punch_out - punch_in
    hours = delta.total_seconds() / 3600
    if hours >= 8:
        status = "present"
    else:
        status = "incomplete"
    return round(hours, 2), status

@router.post("/punch-in")
async def punch_in(req: PunchRequest, current_user=Depends(get_current_user)):
    db = get_db()
    today = date.today().isoformat()

    # Check already punched in today
    existing = await db.attendance.find_one({
        "user_id": str(current_user["_id"]),
        "date": today
    })
    if existing and existing.get("punch_in"):
        raise HTTPException(400, "Already punched in today")

    # Anti-spoofing check
    # if not anti_spoofing_check(req.face_image):
    #     raise HTTPException(400, "Liveness check failed. Please use a live camera, not a photo.")

    # Face recognition
    stored_encoding = current_user.get("face_encoding")
    if not stored_encoding:
        raise HTTPException(400, "No face registered. Please register first.")

    result = compare_faces(stored_encoding, req.face_image)
    if not result["matched"]:
        raise HTTPException(401, f"Face not recognized (confidence: {result['confidence']}%). Please try again.")

    # Geofence check
    geo = is_within_geofence(req.latitude, req.longitude)
    # Warn but don't block (can make strict by raising exception)

    now = datetime.utcnow()
    attendance_doc = {
        "user_id": str(current_user["_id"]),
        "user_name": current_user["name"],
        "date": today,
        "punch_in": now,
        "punch_out": None,
        "hours_worked": None,
        "status": "incomplete",
        "location_in": {"lat": req.latitude, "lng": req.longitude, **geo},
        "location_out": None,
        "selfie_in": req.face_image,
        "selfie_out": None,
        "face_confidence_in": result["confidence"],
        "is_fake": False,
        "created_at": now
    }

    if existing:
        await db.attendance.update_one({"_id": existing["_id"]}, {"$set": attendance_doc})
        doc_id = str(existing["_id"])
    else:
        res = await db.attendance.insert_one(attendance_doc)
        doc_id = str(res.inserted_id)

    return {
        "message": "Punch-in successful",
        "time": now.isoformat(),
        "confidence": result["confidence"],
        "geofence": geo
    }

@router.post("/punch-out")
async def punch_out(req: PunchRequest, current_user=Depends(get_current_user)):
    db = get_db()
    today = date.today().isoformat()

    record = await db.attendance.find_one({
        "user_id": str(current_user["_id"]),
        "date": today,
        "punch_in": {"$ne": None}
    })
    if not record:
        raise HTTPException(400, "No punch-in found for today")
    if record.get("punch_out"):
        raise HTTPException(400, "Already punched out today")

    # Anti-spoofing
    # if not anti_spoofing_check(req.face_image):
    #     raise HTTPException(400, "Liveness check failed.")

    # Face recognition
    result = compare_faces(current_user["face_encoding"], req.face_image)
    if not result["matched"]:
        raise HTTPException(401, f"Face not recognized.")

    geo = is_within_geofence(req.latitude, req.longitude)
    now = datetime.utcnow()
    hours, status = calc_status(record["punch_in"], now)

    await db.attendance.update_one(
        {"_id": record["_id"]},
        {"$set": {
            "punch_out": now,
            "hours_worked": hours,
            "status": status,
            "location_out": {"lat": req.latitude, "lng": req.longitude, **geo},
            "selfie_out": req.face_image,
            "face_confidence_out": result["confidence"]
        }}
    )

    return {
        "message": "Punch-out successful",
        "time": now.isoformat(),
        "hours_worked": hours,
        "status": status,
        "geofence": geo
    }

@router.get("/today")
async def today_status(current_user=Depends(get_current_user)):
    db = get_db()
    today = date.today().isoformat()
    record = await db.attendance.find_one({
        "user_id": str(current_user["_id"]),
        "date": today
    })
    if not record:
        return {"status": "not_punched", "date": today}
    record["id"] = str(record.pop("_id"))
    # Remove large base64 fields from response
    record.pop("selfie_in", None)
    record.pop("selfie_out", None)
    record.pop("face_encoding", None)
    return record

@router.get("/history")
async def attendance_history(
    start_date: str = None,
    end_date: str = None,
    current_user=Depends(get_current_user)
):
    db = get_db()
    query = {"user_id": str(current_user["_id"])}
    if start_date:
        query["date"] = {"$gte": start_date}
    if end_date:
        query.setdefault("date", {})["$lte"] = end_date

    records = await db.attendance.find(query, {"selfie_in": 0, "selfie_out": 0}).sort("date", -1).to_list(100)
    for r in records:
        r["id"] = str(r.pop("_id"))
    return records
