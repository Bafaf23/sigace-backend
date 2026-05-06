from flask import Blueprint, jsonify, request
from db import get_db_cursor, mysql

# Blueprint para las asignaturas
subject_bp = Blueprint("subject", __name__)


@subject_bp.route("/subject/get/", methods=["GET"])
def get_subject() -> tuple[dict, int]:
    """Obtener todas las asignaturas"""
    try:
        cursor = get_db_cursor()
        cursor.execute("SELECT * FROM subjects")
        subjects = cursor.fetchall()

        if not subjects:
            return jsonify({"error": "No se encontraron asignaturas"}), 404

        return jsonify({"subjects": subjects}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@subject_bp.route("/subject/create/", methods=["POST"])
def create_subject() -> tuple[dict, int]:
    """
    Crear una asignatura con los datos de la solicitud

    Args:
        name: str
        code_subject: str
    """
    try:
        data = request.json
        name = data.get("name")
        code_subject = data.get("code")
        year_subject = data.get("grade")
        training_area = data.get("area")

        print(name, code_subject, year_subject, training_area)

        if not name or not code_subject or not year_subject or not training_area:
            return jsonify({"error": "Faltan campos requeridos"}), 400

        conn = mysql.get_db()
        cursor = get_db_cursor()

        cursor.execute(
            "INSERT INTO subjects (name, code_subject, year_subject, training_area) VALUES (%s, %s, %s, %s)",
            (name, code_subject, year_subject, training_area),
        )
        conn.commit()
        cursor.close()
        return jsonify({"message": "Asignatura creada correctamente"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
