from flask import Flask, jsonify, request, Blueprint
from flask_cors import CORS
from flaskext.mysql import MySQL
import os
import pymysql
from db import get_db_cursor

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

mysql = MySQL()

""" Configuracion de la base de datos """
app.config["MYSQL_DATABASE_HOST"] = "localhost"
app.config["MYSQL_DATABASE_USER"] = "root"
app.config["MYSQL_DATABASE_PASSWORD"] = ""
app.config["MYSQL_DATABASE_DB"] = "sigace_db"

mysql.init_app(app)


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


@app.route("/register/", methods=["POST"])
def register():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No se enviaron datos"}), 400

    dni = f"{data['typeDocuement']}{data['document']}"

    conn = mysql.get_db()
    cursor = get_db_cursor()

    cursor.execute("SELECT * FROM users WHERE email = %s", (data.get("email"),))
    user = cursor.fetchone()

    cursor.execute("SELECT * FROM schools WHERE code_sig = %s", (data.get("sig"),))
    school = cursor.fetchone()

    if user:
        cursor.close()
        return jsonify({"error": "Usuario ya registrado"}), 400

    else:
        """Insertar el usuario en la tabla de users"""
        sql = "INSERT INTO users (dni, first_name, last_name, email, phone, birthdate, pass, role) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
        vale = (
            dni,
            data["name"],
            data["lastName"],
            data["email"],
            data["phone"],
            data["birthdate"],
            data["password"],
            data["role"],
        )
        cursor.execute(sql, vale)

        user_id = cursor.lastrowid

        if data["role"] == "teacher":
            """Insertar el profesor en la tabla de teachers"""
            sql_teacher = "INSERT INTO teachers (id_user, id_school, id_subject) VALUES (%s, %s, %s)"
            values_teacher = (user_id, data["sig"], 1)
            cursor.execute(sql_teacher, values_teacher)

        conn.commit()
        cursor.close()
        return jsonify({"success": True}), 200


if __name__ == "__main__":
    app.run(debug=True)
