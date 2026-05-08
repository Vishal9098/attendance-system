from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import connect_db, close_db
from routes import auth, attendance, overtime, admin, reports, ai_assistant

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()

app = FastAPI(
    title="AI-Powered Attendance System",
    description="Face recognition based attendance with AI assistant",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["Attendance"])
app.include_router(overtime.router, prefix="/api/overtime", tags=["Overtime"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(ai_assistant.router, prefix="/api/ai", tags=["AI Assistant"])

@app.get("/")
async def root():
    return {"message": "AI Attendance System API is running", "status": "healthy"}

@app.get("/health")
async def health():
    return {"status": "ok"}