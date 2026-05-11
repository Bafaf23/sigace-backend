from app.models.Subject import Subject
from flask import jsonify, request, Blueprint

# Blueprint para las asignaturas
subject_controller = Blueprint("subject_controller", __name__)


@subject_controller.route("/subject/get/<sig>", methods=["GET"])
def get_subject(sig) -> tuple[dict, int]:
    """Obtener todas las asignaturas"""
    try:
        school_id = sig

        if not school_id:
            return jsonify({"error": "school_id is required"}), 400

        subjects = Subject.get_all_subjects(school_id)

        if not subjects:
            return jsonify({"error": "No se encontraron asignaturas"}), 404

        return jsonify({"subjects": subjects}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@subject_controller.route("/subject/create/", methods=["POST"])
def create_subject() -> tuple[dict, int]:
    """Crear una asignatura"""
    try:
        data = request.json

        name: str = data.get("name")
        school_id: str = data.get("schoolId")
        year_subject: str = data.get("grade")
        code_subject: str = data.get("code")
        training_area: str = data.get("area")

        new_subject = Subject(
            name=name,
            school_id=school_id,
            year_subject=year_subject,
            code_subject=code_subject,
            training_area=training_area,
        )
        new_subject.create_subject()

        return jsonify({"message": "Asignatura creada correctamente"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@subject_controller.route("/subject/delete/<int:id>", methods=["DELETE"])
def delete_subject(id) -> tuple[dict, int]:
    """Eliminar una asignatura"""
    try:
        deleted = Subject.delete_subject(id)
        if deleted:
            return jsonify({"message": "Asignatura eliminada correctamente"}), 200
        return jsonify({"error": "No se encontró la asignatura"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500
