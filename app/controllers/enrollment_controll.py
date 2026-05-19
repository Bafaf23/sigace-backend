from flask import jsonify, Blueprint, request
from app.models.Enrollment import Enrollment
from app.models.User import User

# Blueprint para la inscripcion de un estudiante
enrollment_controller = Blueprint("enrollment_controller", __name__)


@enrollment_controller.route("/create_enrollment/", methods=["POST"])
def create_enrollment() -> tuple[dict, int]:
    """Crear una inscripción de un estudiante en un colegio"""
    data = request.get_json()

    if not data:
        return {"error": "No se enviaron datos"}, 400

    type_document = data.get("documentType")
    document = data.get("document")

    if not type_document or not document:
        return {"error": "El tipo de documento y el número son obligatorios"}, 400

    dni = f"{type_document}{document}"

    first_name = data.get("name")
    last_name = data.get("lastName")
    email = data.get("email")
    phone = data.get("phone")
    birthdate = data.get("birthDate")
    school_id = data.get("sig")
    password = data.get("pass")

    user_instance = User(
        dni=dni,
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone=phone,
        birthdate=birthdate,
        school_id=school_id,
        password=password,
        confirm_password=password,
        role="student",
    )

    user = user_instance.register_user()

    if not user or not user[0]:
        error_msg = user[1] if user else "Error desconocido al registrar usuario"
        return {"error": error_msg}, 400

    user_id = user[2]

    enrollment_instance = Enrollment(
        id_user=user_id,
        id_school=data.get("sig"),
        id_section=data.get("section"),
        id_year=data.get("year"),
        gender=data.get("gender"),
        birth_country=data.get("birthCountry"),
        birth_state=data.get("state"),
        birth_municipality=data.get("municipality"),
        state=data.get("state"),
        municipality=data.get("municipality"),
        address=data.get("addressDetail"),
        blood_type=data.get("bloodType"),
        allergies=data.get("allergies"),
        weight=data.get("weight"),
        height=data.get("height"),
        shirt_size=data.get("shirtSize"),
        shoe_size=data.get("shoeSize"),
        pant_size=data.get("pantSize"),
        medical_condition=data.get("medicalCondition"),
        rep_dni=data.get("repdni"),
        rep_name=data.get("repName"),
        rep_last_name=data.get("repLastName"),
        rep_email=data.get("repEmail"),
        rep_phone=data.get("repPhone"),
        rep_relationship=data.get("relationship"),
        legal_representative_dni=data.get("legalRepresentativeDni"),
        legal_representative_name=data.get("legalRepresentativeName"),
        legal_representative_last_name=data.get("legalRepresentativeLastName"),
        legal_representative_phone=data.get("legalRepresentativePhone"),
        legal_representative_email=data.get("legalRepresentativeEmail"),
        legal_representative_relationship=data.get("legalRepresentativeRelationship"),
        condition=data.get("condition"),
        condition_description=data.get("conditionDescription"),
        code_certificate=data.get("codeCertificate"),
    )

    enrollment = enrollment_instance.create_enrollment()

    if not enrollment or not enrollment[0]:
        error_msg = enrollment[1] if enrollment else "Error al crear la inscripción"
        return jsonify({"error": error_msg, "student_id": enrollment[2]}), 400

    return (
        jsonify(
            {
                "success": True,
                "message": "Inscripción creada correctamente",
                "user_id": user_id,
                "student_id": enrollment[2],
            }
        ),
        200,
    )
