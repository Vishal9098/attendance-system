from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from bson import ObjectId
from database import get_db
from models import OTRequest, OTAction
from auth_utils import get_current_user, require_role

router = APIRouter()

@router.post("/request")
async def request_overtime(req: OTRequest, current_user=Depends(get_current_user)):
    db = get_db()
    existing = await db.overtime.find_one({
        "employee_id": str(current_user["_id"]),
        "date": req.date
    })
    if existing:
        raise HTTPException(400, "OT request already submitted for this date")

    doc = {
        "employee_id": str(current_user["_id"]),
        "employee_name": current_user["name"],
        "manager_id": current_user.get("manager_id"),
        "date": req.date,
        "reason": req.reason,
        "expected_hours": req.expected_hours,
        "status": "pending",
        "manager_remarks": None,
        "created_at": datetime.utcnow()
    }
    result = await db.overtime.insert_one(doc)
    return {"message": "OT request submitted", "id": str(result.inserted_id)}

@router.get("/my-requests")
async def my_ot_requests(current_user=Depends(get_current_user)):
    db = get_db()
    records = await db.overtime.find(
        {"employee_id": str(current_user["_id"])}
    ).sort("created_at", -1).to_list(50)
    for r in records:
        r["id"] = str(r.pop("_id"))
    return records

@router.get("/pending")
async def pending_ot(current_user=Depends(require_role("manager", "admin"))):
    db = get_db()
    query = {"status": "pending"}
    if current_user["role"] == "manager":
        query["manager_id"] = str(current_user["_id"])

    records = await db.overtime.find(query).sort("created_at", -1).to_list(100)
    for r in records:
        r["id"] = str(r.pop("_id"))
    return records

@router.put("/{ot_id}/action")
async def action_ot(
    ot_id: str,
    action: OTAction,
    current_user=Depends(require_role("manager", "admin"))
):
    db = get_db()
    if action.status not in ("approved", "rejected"):
        raise HTTPException(400, "Status must be approved or rejected")

    result = await db.overtime.update_one(
        {"_id": ObjectId(ot_id)},
        {"$set": {
            "status": action.status,
            "manager_remarks": action.remarks,
            "actioned_by": str(current_user["_id"]),
            "actioned_at": datetime.utcnow()
        }}
    )
    if result.modified_count == 0:
        raise HTTPException(404, "OT request not found")
    return {"message": f"OT request {action.status}"}