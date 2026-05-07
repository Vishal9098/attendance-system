from fastapi import APIRouter, HTTPException, Depends
from database import get_db
from models import AIQuery, AIResponse
from auth_utils import require_role
from config import settings
from datetime import date
import httpx
import json

router = APIRouter()

async def fetch_attendance_context(db) -> dict:
    """Fetch current data to give AI context."""
    today = date.today().isoformat()

    late_threshold_hour = 9  # 9 AM considered on-time

    # Today's attendance
    today_records = await db.attendance.find({"date": today}).to_list(500)

    late_employees = []
    incomplete = []
    present = []

    for r in today_records:
        punch_in = r.get("punch_in")
        if punch_in and punch_in.hour >= late_threshold_hour:
            late_employees.append({"name": r["user_name"], "time": punch_in.strftime("%H:%M")})
        if r.get("status") == "incomplete":
            incomplete.append({"name": r["user_name"], "hours": r.get("hours_worked", 0)})
        if r.get("status") == "present":
            present.append(r["user_name"])

    # Pending OT
    pending_ot = await db.overtime.find({"status": "pending"}).to_list(100)
    ot_list = [{"name": r["employee_name"], "date": r["date"], "reason": r["reason"]} for r in pending_ot]

    total_employees = await db.users.count_documents({"role": "employee", "is_active": True})

    return {
        "date": today,
        "total_employees": total_employees,
        "present_count": len(present),
        "absent_count": total_employees - len(today_records),
        "late_employees": late_employees,
        "incomplete_hours_employees": incomplete,
        "present_employees": present,
        "pending_overtime_requests": ot_list
    }

async def query_gemini(prompt: str, context: dict) -> str:
    """Query Google Gemini API."""
    if not settings.GEMINI_API_KEY:
        raise HTTPException(500, "Gemini API key not configured")

    system_prompt = f"""You are an AI assistant for an Attendance Management System.
Today's attendance data: {json.dumps(context, indent=2)}

Answer the manager/admin's query based on this data. Be concise and helpful.
Format numbers clearly. If asked about specific employees, list them with relevant details."""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"

    payload = {
        "contents": [{
            "parts": [{"text": f"{system_prompt}\n\nQuery: {prompt}"}]
        }]
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(url, json=payload)
        if resp.status_code != 200:
            raise HTTPException(500, f"Gemini API error: {resp.text}")
        data = resp.json()

    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        raise HTTPException(500, "Invalid response from Gemini API")

async def query_openrouter(prompt: str, context: dict) -> str:
    """Fallback: Query OpenRouter API."""
    if not settings.OPENROUTER_API_KEY:
        raise HTTPException(500, "No AI API key configured")

    system_msg = f"You are an attendance management AI. Data: {json.dumps(context)}"

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "mistralai/mistral-7b-instruct:free",
                "messages": [
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": prompt}
                ]
            }
        )
    data = resp.json()
    return data["choices"][0]["message"]["content"]

@router.post("/query", response_model=AIResponse)
async def ai_query(query: AIQuery, current_user=Depends(require_role("admin", "manager"))):
    db = get_db()
    context = await fetch_attendance_context(db)

    # Try Gemini first, fall back to OpenRouter
    try:
        if settings.GEMINI_API_KEY:
            answer = await query_gemini(query.query, context)
        else:
            answer = await query_openrouter(query.query, context)
    except Exception as e:
        raise HTTPException(500, f"AI query failed: {str(e)}")

    return AIResponse(query=query.query, response=answer, data=context)

@router.get("/context")
async def get_context(current_user=Depends(require_role("admin", "manager"))):
    """Get current attendance context for debugging."""
    db = get_db()
    return await fetch_attendance_context(db)
