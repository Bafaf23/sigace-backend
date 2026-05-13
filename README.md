# 🎓 SIGACE Backend

API REST del sistema **SIGACE**, construida con [**Flask**](https://flask.palletsprojects.org/) y conexión a **MySQL** mediante **Flask-MySQL** y cursores **PyMySQL** (resultados como diccionario).

---

## 📋 Requisitos

- **Python** 3.11 o superior (recomendado)
- **MySQL** con una base creada para la aplicación (el nombre lo defines en las variables de entorno)

---

## 🚀 Instalación

```bash
python -m venv .venv
```

**Windows (PowerShell)**

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**Linux o macOS**

```bash
source .venv/bin/activate
pip install -r requirements.txt
```

---

## 🔐 Variables de entorno

Crea un archivo `.env` en la raíz del repositorio con al menos:

```env
MYSQL_DATABASE_HOST=localhost
MYSQL_DATABASE_USER=root
MYSQL_DATABASE_PASSWORD=tu_contraseña
MYSQL_DATABASE_DB=nombre_de_tu_base
SECRET_KEY=una_clave_secreta_larga_y_aleatoria
```

Opcionalmente puedes fijar el puerto con `PORT` (por defecto **5000**).

---

## ▶️ Ejecutar en desarrollo

Desde la raíz del proyecto (donde está `main.py`):

```bash
python main.py
```

O con Flask:

```bash
flask --app main run --debug
```

La raíz `GET /` devuelve información de la API y un listado orientativo de rutas.

---

## 🌐 CORS

El middleware permite el origen del frontend en producción: `https://sigace.vercel.app`. Para otro dominio, ajusta `origins` en `main.py` dentro de `CORS(...)`.

---

## 🗺️ Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/` | Estado de la API y metadatos |
| `POST` | `/login/` | Inicio de sesión (auth) |
| `POST` | `/register/` | Registro de usuario |
| `POST` | `/logout/` | Cierre de sesión |
| `GET` | `/get_user_by_dni/` | Consulta de usuario por DNI (query) |
| `GET` | `/get_user_teachers/<sig>` | Docentes asociados a un colegio |
| `GET` | `/subject/get/<sig>` | Asignaturas |
| `POST` | `/subject/create/` | Crear asignatura |
| `DELETE` | `/subject/delete/<id>` | Eliminar asignatura |
| `GET` | `/school/get/` | Colegios |
| `GET` | `/section/get_section/<sig>` | Secciones |
| `POST` | `/section/create_section` | Crear sección |
| `GET` | `/load_evaluations/get/` | Cargas de evaluaciones |
| `POST` | `/load_evaluations/` | Registrar carga de evaluaciones |

> 💡 **Nota:** También existe lógica de login en `app/routers/auth/auth_login.py` (`POST /login/`). Revisa qué blueprint quieres exponer como canónico si hay solapamiento con `user_controll`.

---

## 📁 Estructura del proyecto

```
sigace-backend/
├── main.py                 # App Flask, CORS, blueprints
├── db.py                   # MySQL y helper de cursor
├── requirements.txt
└── app/
    ├── controllers/        # Controladores / rutas por dominio
    ├── routers/            # Blueprints adicionales (p. ej. auth, evaluaciones)
    ├── models/             # Modelos de dominio
    └── utils/              # Utilidades
```

---

## 📦 Dependencias destacadas

- **Flask**, **flask-cors**, **flask-mysql** — API y acceso a MySQL
- **PyMySQL** — driver y cursores tipo diccionario
- **python-dotenv** — carga de `.env`
- **Werkzeug** — hashes de contraseña (`check_password_hash`, etc.)
- **gunicorn** — despliegue en producción (junto a Flask)

El `requirements.txt` incluye también paquetes usados en otros contextos del entorno (por ejemplo **FastAPI** / **uvicorn**); la aplicación definida en `main.py` es **Flask**.

---

## 📄 Licencia y autor

Definir licencia en el repositorio si aplica. API desarrollada en el contexto del proyecto **SIGACE** (desarrollo: Bryant Facenda).
