from typing import Optional

from pydantic import BaseModel, model_validator


class UserSession(BaseModel):
    id: str
    name: str
    role: str


class AuthResponse(BaseModel):
    status: str
    userSession: UserSession
    user: Optional[UserSession] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    dni: str
    name: str
    lastName: str
    birthdate: str
    email: str
    phone: str
    password: str
    sig: Optional[str] = None
    role: str

    @model_validator(mode="before")
    @classmethod
    def normalize_register_payload(cls, data):
        if not isinstance(data, dict):
            return data

        normalized_data = dict(data)

        # Frontend sometimes sends "document" instead of "dni".
        if not normalized_data.get("dni") and normalized_data.get("document"):
            document = str(normalized_data.get("document", "")).strip()
            type_document = str(normalized_data.get("tyeDocuement", "")).strip()
            normalized_data["dni"] = f"{type_document}{document}" if type_document else document

        if normalized_data.get("role"):
            normalized_data["role"] = str(normalized_data["role"]).lower().strip()

        return normalized_data


class EnrollmentRequest(BaseModel):
    dni: str
    name: str
    lastName: str
    birthdate: str
    email: str
    phone: str
    password: str
    sig: str
    role: str
    