# SIGACE Backend

API REST del sistema **SIGACE**, construida con [FastAPI](https://fastapi.tiangolo.com/). Expone autenticación y gestión de datos sobre **MySQL** mediante **PyMySQL**.

## Requisitos

- Python 3.11+ (recomendado; el proyecto se ha usado con 3.14)
- MySQL con una base de datos creada para la aplicación (por defecto el código asume `sigace_db` si no defines otra)

## Instalación

```bash
python -m venv .venv
```

En Windows (PowerShell):

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

En Linux o macOS:

```bash
source .venv/bin/activate
pip install -r requirements.txt
```

## Variables de entorno

Crea un archivo `.env` en la raíz del repositorio. Puedes usar **una URL** o **variables sueltas**.

**Opción A — `DATABASE_URL`**

```env
DATABASE_URL=mysql://usuario:contraseña@localhost:3306/nombre_base
```

**Opción B — variables individuales**

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=sigace_db
```

Al arrancar, la aplicación abre una conexión para comprobar que la base de datos es accesible.

## Ejecutar en desarrollo

Desde la raíz del proyecto (donde está `main.py`):

```bash
uvicorn main:app --reload
```

Por defecto la documentación interactiva está en:

- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

## CORS

El middleware permite orígenes `http://localhost:3000` (por ejemplo un frontend en Next.js o React en ese puerto). Si usas otro origen, ajusta `allow_origins` en `main.py`.

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/` | Estado de la API y metadatos básicos |
| `POST` | `/auth/login` | Inicio de sesión |
| `POST` | `/auth/register` | Registro de usuario |

Los errores de validación de Pydantic se devuelven como JSON con código `400` y un cuerpo `{"detail": [...]}`.

> **Nota:** Existe un router de matrícula en `app/views/enrollment.py` (`POST /enrollment/`). Para activarlo hay que registrarlo en `main.py` con `app.include_router(...)`, igual que el router de autenticación.

## Estructura del proyecto

```
sigace-backend/
├── main.py              # FastAPI, CORS, lifespan, routers
├── requirements.txt
├── app/
│   ├── db.py            # Conexión MySQL y contexto de cursor
│   ├── controllers/     # Lógica de negocio
│   ├── repositories/    # Acceso a datos
│   ├── schemas/         # Modelos Pydantic (request/response)
│   ├── views/           # Routers FastAPI
│   └── utils/
```

## Dependencias destacadas

- **fastapi**, **uvicorn** — servidor y framework
- **PyMySQL** — cliente MySQL
- **pydantic** — validación de esquemas
- **python-dotenv** — carga de `.env`
- **bcrypt** — hash de contraseñas en autenticación

## Licencia y autor

Definir licencia en el repositorio si aplica. API desarrollada en el contexto del proyecto SIGACE.
