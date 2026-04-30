from fastapi import APIRouter

from app.controllers.auth import login_user, register_user
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login", response_model=AuthResponse)
async def login(data: LoginRequest):
    return login_user(data)


@router.post("/register", response_model=AuthResponse)
async def register(form_data: RegisterRequest):
    return register_user(form_data)
