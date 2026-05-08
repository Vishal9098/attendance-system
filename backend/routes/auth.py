from fastapi import APIRouter, HTTPException, Depends
from datetime import timedelta
from bson import ObjectId
from database import get_db
from models import UserRegister, UserLogin, Token
from auth_utils import hash_password, verify_password, create_access_token, get_current_user
from face_service import encode_face
from config import settings

router = APIRouter()

@router.post("/register", response_model=dict)
async def register(user: UserRegister):
    db = get_db()
    if await db.users.find_one({"email": user.email}):
        raise HTTPException(400, "Email already registered")

    # Encode face from camera selfie
    try:
        face_encoding = encode_face(user.face_image)
    except ValueError as e:
        raise HTTPException(400, str(e))

    user_doc = {
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "role": user.role,
        "manager_id": user.manager_id,
        "face_encoding": face_encoding,
        "face_image": user.face_image,  # store thumbnail
        "is_active": True,
        "created_at": __import__("datetime").datetime.utcnow()
    }
    result = await db.users.insert_one(user_doc)
    return {"message": "User registered successfully", "user_id": str(result.inserted_id)}

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    db = get_db()
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(401, "Invalid email or password")
    if not user.get("is_active", True):
        raise HTTPException(403, "Account is disabled")

    token = create_access_token(
        {"sub": str(user["_id"]), "role": user["role"]},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return Token(
        access_token=token,
        role=user["role"],
        user_id=str(user["_id"]),
        name=user["name"]
    )

@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "name": current_user["name"],
        "email": current_user["email"],
        "role": current_user["role"],
        "is_active": current_user["is_active"]
    }