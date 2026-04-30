from datetime import datetime

import bcrypt
from fastapi import HTTPException, status

from app.repositories.user_repository import create_user, get_user_by_email
from app.schemas.auth import LoginRequest, RegisterRequest


def login_user(data: LoginRequest):
    user = get_user_by_email(data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
        )

    password_ok = bcrypt.checkpw(
        data.password.encode("utf-8"),
        user["password"].encode("utf-8"),
    )
    if not password_ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
        )

    return {
        "status": "success",
        "userSession": {
            "id": str(user["id"]),
            "name": f"{user['name']} {user['lastName']}",
            "role": user["role"],
        },
    }


def register_user(form_data: RegisterRequest):
    try:
        birth_date_obj = datetime.strptime(form_data.birthdate, "%Y-%m-%d")
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de fecha inválido, usa YYYY-MM-DD",
        ) from exc

    if form_data.role not in {"admin", "teacher", "student"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rol inválido",
        )

    existing_user = get_user_by_email(form_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado",
        )

    hashed_password = bcrypt.hashpw(
        form_data.password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")

    try:
        new_user_id = create_user(
            dni=form_data.dni,
            name=form_data.name,
            last_name=form_data.lastName,
            birthdate=birth_date_obj.date(),
            email=form_data.email,
            phone=form_data.phone,
            password_hash=hashed_password,
            role=form_data.role,
        )
    except Exception as exc:
        print("ERROR EN BASE DE DATOS:", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al crear el usuario",
        ) from exc

    return {
        "status": "success",
        "userSession": {
            "id": str(new_user_id),
            "name": f"{form_data.name} {form_data.lastName}",
            "role": form_data.role,
        },
    }