from flask import jsonify, Blueprint, request
from app.models.Section import Section

# Blueprint
section_controll = Blueprint("section_controll", __name__)


@section_controll.route("/section/get_section", methods=["GET"])
def get_section_controll():
    try:
        school_id = "SIG4465"
        sections = Section.get_section_all(school_id)
        return jsonify({"section": sections}), 200
    except Exception as e:
        print(f"errro al traer las secciones {e}")
        return jsonify({"error": str(e)}), 400


@section_controll.route("/section/create_section", methods=["POST"])
def create_section():
    data = request.json
    
