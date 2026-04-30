from datetime import datetime
from typing import Annotated

import bcrypt
from fastapi import HTTPException, status, Cookie

from app.repositories.user_repository import (
    create_teacher_profile,
    create_user,
    get_or_create_default_teacher_dependencies,
    get_school_by_sig,
    get_user_by_email,
)
from app.schemas.auth import LoginRequest, RegisterRequest


def login_user(data: LoginRequest, session: Annotated[str | None, Cookie()] = None):
    """Inicia sesión de un usuario existente."""
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

    session = {
        "id": str(user["id"]),
        "name": f"{user['name']} {user['lastName']}",
        "role": user["role"],
    }
    return {
        "status": "success",
        "userSession": session,
        "user": session,
    }


def register_user(form_data: RegisterRequest):
    """Registra un nuevo usuario en la base de datos y vincula el profesor con el liceo si es necesario."""
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

    if form_data.role == "teacher" and not form_data.sig:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El codigo SIG es obligatorio para registrar profesores",
        )

    school = None
    dependencies = None

    if form_data.role == "teacher":
        school = get_school_by_sig(form_data.sig)
        if not school:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El codigo SIG no corresponde a ningun liceo",
            )

        dependencies = get_or_create_default_teacher_dependencies()

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

    if form_data.role == "teacher":
        try:
            create_teacher_profile(
                user_id=new_user_id,
                school_id=school["id"],
                section_id=dependencies["id_section"],
                load_id=dependencies["id_load"],
                subject_id=dependencies["id_subject"],
                evaluation_plan_id=dependencies["id_evaluation_plan"],
            )
        except Exception as exc:
            print("ERROR EN PERFIL DE PROFESOR:", exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno al vincular profesor con liceo",
            ) from exc

    session = {
        "id": str(new_user_id),
        "name": f"{form_data.name} {form_data.lastName}",
        "role": form_data.role,
    }
    return {
        "status": "success",
        "userSession": session,
        "user": session,
    }
