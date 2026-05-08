from app.models.Subject import Subject
from flask import jsonify, request, Blueprint

# Blueprint para las asignaturas
subject_controller = Blueprint("subject_controller", __name__)


@subject_controller.route("/subject/get/", methods=["GET"])
def get_subject() -> tuple[dict, int]:
    """Obtener todas las asignaturas"""
    try:
        school_id = "SIG4465"
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
        name = data.get("name")
        school_id = data.get("schoolId")
        year_subject = data.get("grade")
        code_subject = data.get("code")
        training_area = data.get("area")
        subject = Subject(name, school_id, year_subject, code_subject, training_area)
        subject.create_subject()

        return jsonify({"message": "Asignatura creada correctamente"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@subject_controller.route("/subject/delete/<int:id>/", methods=["DELETE"])
def delete_subject(id: int) -> tuple[dict, int]:
    """Eliminar una asignatura"""
    try:
        subject = Subject(id)
        if subject.delete_subject():
            return jsonify({"message": "Asignatura eliminada correctamente"}), 200
        else:
            return jsonify({"error": "Error al eliminar la asignatura"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500
