from pydantic import BaseModel

from pydantic import BaseModel, model_validator


class EnrollmentRequest(BaseModel):
    id: str
    dni: str
    sig: str
    student_dni: str
    student_name: str
    student_lastName: str
    student_birthdate: str
    student_email: str
    student_phone: str
    student_role: str
    student_pass: str
    allergies: str
    medical_conditions: str
    medical_medications: str
    height: str
    weight: str
    blood_type: str
    shirt_size: str
    pants_size: str
    shoes_size: str
    state: str
    municipality: str
    parish: str
    address: str
    condition_house: str
    father_name: str
    father_lastName: str
    father_dni: str
    father_phone: str
    father_email: str
    mother_name: str
    mother_lastName: str
    mother_dni: str
    mother_phone: str
    mother_email: str
    school_name: str
    school_code: str
    school_year: str
    school_grade: str
    canaima_sea: str
    legal_representative_name: str
    legal_representative_lastName: str
    legal_representative_dni: str
    legal_representative_phone: str
    legal_representative_email: str
    legal_representative_relationship: str

    # infomacion basica del estudiante
    dni: str
    sig: str
    student_dni: str
    student_name: str
    student_lastName: str
    student_birthdate: str
    student_email: str
    student_phone: str
    student_role: str
    student_pass: str

    # Informacion medica del estudiante
    allergies: str
    medical_conditions: str
    medical_medications: str
    height: str
    weight: str
    blood_type: str
    shirt_size: str
    pants_size: str
    shoes_size: str

    # Informacion direccion del estudiante

    state: str
    municipality: str
    parish: str
    address: str
    condition_house: str

    # informacion familiar del estudiante
    father_name: str
    father_lastName: str
    father_dni: str
    father_phone: str
    father_email: str

    mother_name: str
    mother_lastName: str
    mother_dni: str
    mother_phone: str
    mother_email: str

    # informacion academicas del estudiante
    school_name: str
    school_code: str
    school_year: str
    school_grade: str
    canaima_sea: str

    # Informacion representante legal del estudiante
    legal_representative_name: str
    legal_representative_lastName: str
    legal_representative_dni: str
    legal_representative_phone: str
    legal_representative_email: str
    legal_representative_relationship: str
