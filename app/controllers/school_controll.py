from app.models.School import School
from flask import jsonify, request, Blueprint

# Blueprint para las escuelas
school_controller = Blueprint("school_controller", __name__)


@school_controller.route("/school/get/", methods=["GET"])
def get_school() -> tuple[dict, int]:
    """Obtener todas las escuelas"""
    try:
        schools = School.get_all_schools()
        if not schools:
            return jsonify({"error": "No se encontraron escuelas"}), 404
        return jsonify({"schools": schools}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
