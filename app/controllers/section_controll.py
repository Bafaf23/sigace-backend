from flask import jsonify, Blueprint, request
from app.models.Section import Section

# Blueprint
section_controll = Blueprint("section_controll", __name__)


@section_controll.route("/section/get_section/<sig>", methods=["GET"])
def get_section_controll(sig):
    try:
        if not sig:
            return jsonify({"erorr": "El codigo SIG es nrecesario"})

        sections = Section.get_section_all(sig)

        if not sections:
            return jsonify(
                {"error": f"El codigo {sig} no corresponde a una institucion"}
            )

        return jsonify({"Sections": sections}), 200
    except Exception as e:
        print(f"errro al traer las secciones {e}")
        return jsonify({"error": str(e)}), 400


@section_controll.route("/section/create_section", methods=["POST"])
def create_section():
    data = request.json
