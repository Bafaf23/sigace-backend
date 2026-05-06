from flask import Flask, jsonify
from flask_cors import CORS
from db import mysql
import os
from dotenv import load_dotenv

# Blueprints
from app.routers.auth.auth_register import auth_bp
from app.routers.auth.auth_login import auth_login_bp
from app.routers.logout.logout import logout_bp
from app.routers.load_evaluations.load_avaluation import load_evaluations_bp
from app.routers.subject.subject import subject_bp

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

load_dotenv()

""" Configuracion de la base de datos """
app.config["MYSQL_DATABASE_HOST"] = os.getenv("MYSQL_DATABASE_HOST")
app.config["MYSQL_DATABASE_USER"] = os.getenv("MYSQL_DATABASE_USER")
app.config["MYSQL_DATABASE_PASSWORD"] = os.getenv("MYSQL_DATABASE_PASSWORD")
app.config["MYSQL_DATABASE_DB"] = os.getenv("MYSQL_DATABASE_DB")

app.secret_key = os.getenv("SECRET_KEY")

mysql.init_app(app)

# Registrar Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(auth_login_bp)
app.register_blueprint(logout_bp)
app.register_blueprint(load_evaluations_bp)
app.register_blueprint(subject_bp)


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
            },
        }
    )


if __name__ == "__main__":
    app.run(debug=True)
