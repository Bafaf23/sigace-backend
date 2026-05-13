from flask import Flask, jsonify
from flask_cors import CORS
from app.controllers import section_controll
from db import mysql
import os
from dotenv import load_dotenv

# Blueprints
from app.routers.auth.auth_login import auth_login_bp
from app.routers.load_evaluations.load_avaluation import load_evaluations_bp
from app.controllers.subject_controll import subject_controller
from app.controllers.logut_controll import logout_controller
from app.controllers.user_controll import user_controller
from app.controllers.school_controll import school_controller
from app.controllers.section_controll import section_controll

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "https://sigace.vercel.app"}})

load_dotenv()

""" Configuracion de la base de datos """
app.config["MYSQL_DATABASE_HOST"] = os.getenv("MYSQL_DATABASE_HOST")
app.config["MYSQL_DATABASE_USER"] = os.getenv("MYSQL_DATABASE_USER")
app.config["MYSQL_DATABASE_PASSWORD"] = os.getenv("MYSQL_DATABASE_PASSWORD")
app.config["MYSQL_DATABASE_DB"] = os.getenv("MYSQL_DATABASE_DB")

app.secret_key = os.getenv("SECRET_KEY")

mysql.init_app(app)

# Registrar Blueprints
app.register_blueprint(auth_login_bp)
app.register_blueprint(user_controller)
app.register_blueprint(load_evaluations_bp)
app.register_blueprint(subject_controller)
app.register_blueprint(logout_controller)
app.register_blueprint(school_controller)
app.register_blueprint(section_controll)


@app.route("/")
def home():
    return jsonify(
        {
            "info": {
                "name": "SIGACE",
                "version": "1.0.0",
                "development": "Bryant Facenda",
            },
            "routes": {
                "register": "/register/",
                "subjects": "/subject/get/",
                "create_subject": "/subject/create/",
                "delete_subject": "/subject/delete/<int:id>/",
                "logout": "/logout/",
                "get_user_by_dni": "/user/get_user_by_dni/<dni>/",
                "get_schools": "/school/get/",
            },
        }
    )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
