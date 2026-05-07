from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class Role(str, Enum):
    admin = "admin"
    manager = "manager"
    employee = "employee"

class AttendanceStatus(str, Enum):
    present = "present"
    incomplete = "incomplete"
    absent = "absent"
    fake = "fake"

class OTStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

# ─── Auth ───────────────────────────────────────────────
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Role = Role.employee
    manager_id: Optional[str] = None
    face_image: str  # base64 from camera

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    name: str

class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    is_active: bool
    manager_id: Optional[str] = None

# ─── Attendance ──────────────────────────────────────────
class PunchRequest(BaseModel):
    face_image: str   # base64 live selfie
    latitude: float
    longitude: float

class AttendanceRecord(BaseModel):
    id: str
    user_id: str
    user_name: str
    date: str
    punch_in: Optional[datetime]
    punch_out: Optional[datetime]
    hours_worked: Optional[float]
    status: str
    location_in: Optional[dict]
    location_out: Optional[dict]
    selfie_in: Optional[str]
    selfie_out: Optional[str]
    is_fake: bool = False

# ─── Overtime ────────────────────────────────────────────
class OTRequest(BaseModel):
    date: str
    reason: str
    expected_hours: float

class OTAction(BaseModel):
    status: str   # approved / rejected
    remarks: Optional[str] = ""

class OTRecord(BaseModel):
    id: str
    employee_id: str
    employee_name: str
    date: str
    reason: str
    expected_hours: float
    status: str
    manager_remarks: Optional[str]

# ─── AI ──────────────────────────────────────────────────
class AIQuery(BaseModel):
    query: str

class AIResponse(BaseModel):
    query: str
    response: str
    data: Optional[dict] = None
