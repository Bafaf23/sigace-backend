from flask import Flask


def create_app():
    app = Flask(__name__)

    from .router.info import info_bp

    app.register_blueprint(info_bp, url_prefix="/")
    return app
