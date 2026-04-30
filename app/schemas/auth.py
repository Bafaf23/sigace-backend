from pydantic import BaseModel


class UserSession(BaseModel):
    id: str
    name: str
    role: str


class AuthResponse(BaseModel):
    status: str
    userSession: UserSession


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
    sig: str
    role: str


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
    