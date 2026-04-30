from fastapi import APIRouter

from app.schemas.enrollment import EnrollmentRequest, EnrollmentResponse
from app.controllers.enrollment import create_enrollment

router = APIRouter(prefix="/enrollment", tags=["enrollment"])


@router.post("/", response_model=EnrollmentResponse)
async def create_enrollment(enrollment: EnrollmentRequest):
    return create_enrollment(enrollment)
