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
    today = date.today().isoformat()
    late_threshold_hour = 9

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

async def query_openrouter(prompt: str, context: dict) -> str:
    system_msg = f"You are an attendance management AI assistant. Answer based on this data: {json.dumps(context)}"

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "AttendAI"
            },
            json={
                "model": "mistralai/mistral-small-3.2-24b-instruct:free",
                "model": "nvidia/nemotron-3-nano-30b-a3b:free",
                "messages": [
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": prompt}
                ]
            }
        )

    data = resp.json()

    if "choices" in data and len(data["choices"]) > 0:
        return data["choices"][0]["message"]["content"]
    elif "error" in data:
        raise HTTPException(500, f"OpenRouter error: {data['error']}")
    else:
        raise HTTPException(500, f"Unexpected response: {str(data)[:200]}")

async def query_gemini(prompt: str, context: dict) -> str:
    system_prompt = f"""You are an AI assistant for an Attendance Management System.
Today's attendance data: {json.dumps(context, indent=2)}
Answer the manager/admin's query based on this data. Be concise and helpful."""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={settings.GEMINI_API_KEY}"
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

@router.post("/query", response_model=AIResponse)
async def ai_query(query: AIQuery, current_user=Depends(require_role("admin", "manager"))):
    db = get_db()
    context = await fetch_attendance_context(db)

    try:
        if settings.OPENROUTER_API_KEY:
            answer = await query_openrouter(query.query, context)
        elif settings.GEMINI_API_KEY:
            answer = await query_gemini(query.query, context)
        else:
            raise HTTPException(500, "No AI API key configured")
    except Exception as e:
        raise HTTPException(500, f"AI query failed: {str(e)}")

    return AIResponse(query=query.query, response=answer, data=context)

@router.get("/context")
async def get_context(current_user=Depends(require_role("admin", "manager"))):
    db = get_db()
    return await fetch_attendance_context(db)