from flask import Blueprint, jsonify, request
from db import get_db_cursor

# Blueprint para las evaluaciones
load_evaluations_bp = Blueprint("load_evaluations", __name__)


@load_evaluations_bp.route("/load_evaluations/get/", methods=["GET"])
def get_load_evaluations() -> tuple[dict, int]:
    """Obtener todas las evaluaciones"""
    try:
        cursor = get_db_cursor()
        cursor.execute("SELECT * FROM evaluations")
        evaluations = cursor.fetchall()

        if not evaluations:
            return jsonify({"error": "No se encontraron evaluaciones"}), 404

        return jsonify({"evaluations": evaluations}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@load_evaluations_bp.route("/load_evaluations/", methods=["POST"])
def create_load_evaluation() -> tuple[dict, int]:
    pass
