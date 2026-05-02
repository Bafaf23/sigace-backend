from flask import Flask, request, jsonify, Blueprint

info_bp = Blueprint("info", __name__)


@info_bp.route("/")
def info():
    info = {
        "name": "SIGACE",
        "version": "1.0.0",
        "development": "bafaf",
        "description": "Esta es una api para el sistema de gestion escolar SIGACE, de uso privado. El uso de esta api es exclusivo para el sistema de gestion escolar SIGACE. Cualquiera que no tenga autorizacion para usar esta api sera reportado y sancionado.",
        "author_email": "bafaf@gmail.com",
        "author_url": "https://flipchart-pied.vercel.app/",
        "author_instagram": "https://instagram.com/bafaf03",
        "author_linkedin": "https://linkedin.com/in/bafaf03",
    }
    return jsonify(info)
