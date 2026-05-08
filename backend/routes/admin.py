from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from database import get_db
from auth_utils import require_role

router = APIRouter()

@router.get("/users")
async def list_users(current_user=Depends(require_role("admin", "manager"))):
    db = get_db()
    query = {}
    if current_user["role"] == "manager":
        query["manager_id"] = str(current_user["_id"])

    users = await db.users.find(query, {"password": 0, "face_encoding": 0, "face_image": 0}).to_list(200)
    for u in users:
        u["id"] = str(u.pop("_id"))
    return users

@router.put("/users/{user_id}/toggle-active")
async def toggle_user(user_id: str, current_user=Depends(require_role("admin"))):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(404, "User not found")
    new_status = not user.get("is_active", True)
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"is_active": new_status}})
    return {"message": f"User {'enabled' if new_status else 'disabled'}"}

@router.get("/attendance")
async def all_attendance(
    date: str = None,
    user_id: str = None,
    current_user=Depends(require_role("admin", "manager"))
):
    db = get_db()
    query = {}
    if date:
        query["date"] = date
    if user_id:
        query["user_id"] = user_id
    if current_user["role"] == "manager":
        # Only see team members
        team = await db.users.find(
            {"manager_id": str(current_user["_id"])}, {"_id": 1}
        ).to_list(200)
        team_ids = [str(u["_id"]) for u in team]
        query["user_id"] = {"$in": team_ids}

    records = await db.attendance.find(
        query, {"selfie_in": 0, "selfie_out": 0}
    ).sort("date", -1).to_list(500)
    for r in records:
        r["id"] = str(r.pop("_id"))
    return records

@router.put("/attendance/{att_id}/mark-fake")
async def mark_fake(att_id: str, current_user=Depends(require_role("admin"))):
    db = get_db()
    result = await db.attendance.update_one(
        {"_id": ObjectId(att_id)},
        {"$set": {"is_fake": True, "status": "fake", "flagged_by": str(current_user["_id"])}}
    )
    if result.modified_count == 0:
        raise HTTPException(404, "Record not found")
    return {"message": "Record marked as fake/invalid"}

@router.get("/stats")
async def dashboard_stats(current_user=Depends(require_role("admin", "manager"))):
    db = get_db()
    from datetime import date
    today = date.today().isoformat()

    total_users = await db.users.count_documents({"role": "employee", "is_active": True})
    present_today = await db.attendance.count_documents({"date": today, "status": "present"})
    incomplete_today = await db.attendance.count_documents({"date": today, "status": "incomplete"})
    pending_ot = await db.overtime.count_documents({"status": "pending"})

    return {
        "total_employees": total_users,
        "present_today": present_today,
        "incomplete_today": incomplete_today,
        "absent_today": total_users - present_today - incomplete_today,
        "pending_ot_requests": pending_ot,
        "date": today
    }