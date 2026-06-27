# 🎓 SIGACE Backend

API REST del sistema **SIGACE** (Sistema de Gestión Académica y Control de Estudios). Backend modular desarrollado con **Node.js** (ES Modules) y **Express 5**, conectado a **SQL Server**.

---

## 🚨 En construcción 🏗️👷🚧

El proyecto se encuentra en un proceso de **migración activa desde Python hacia JavaScript**. Algunos módulos, endpoints y la lógica de persistencia se están implementando de forma progresiva.

---

## 🛠️ Stack tecnológico

### Core y Base de Datos

- **Node.js**: Entorno de ejecución (Runtime) utilizando módulos nativos de ES (`import`/`export`).
- **Express 5**: Framework HTTP para la arquitectura de la API.
- **mssql**: Cliente oficial de conexión para SQL Server.

### Seguridad y Sesiones

- **jsonwebtoken (JWT)**: Generación y verificación de tokens para la protección de rutas.
- **bcryptjs**: Encriptación y hashing seguro de contraseñas.
- **express-session** & **cookie-parser**: Gestión de sesiones de usuario y manejo de cookies.

### Herramientas y Automatización

- **puppeteer**: Generación de reportes y PDFs.
- **axios**: Cliente HTTP para realizar peticiones externas.
- **dotenv**: Gestión de variables de entorno seguras.

---

## 📋 Requisitos previos

Antes de comenzar, asegúrate de tener instalado lo siguiente:

- [Node.js](https://nodejs.org/) (v18.11.0 o superior requerido para soporte nativo de `--watch`)
- [SQL Server](https://www.microsoft.com/sql-server) (instancia local o remota accesible)
- Gestor de paquetes `npm` (incluido con Node.js)

---

## ⚠️ Variables de Entorno

Este proyecto utiliza variables de entorno, consultalas en el archivo _.env.example_.

---

## 🦺 Estructura del proyecto

```bash
sigace-backend/
├── src/
│   ├── app.js            # Configuración de Express, middlewares, sesiones y rutas
│   ├── db.js             # Configuración del pool de conexión a SQL Server
│   ├── controllers/      # Controladores (lógica de negocio y queries SQL)
│   ├── middlewares/      # Valicadion de credenciales de inicio de session
│   ├── models/           # Modelos y logica sql
│   ├── sql/              # SQL esquema de la base de datos
│   ├── utils/            # Codigo util para el flujo, (crateSIG, tuitoinNumbre)
│   ├── templates/        # Plantilla de los reportes (boletas, lista de secciones, planilla de inscripcion)
│   └── routers/          # Definición de rutas y endpoints de la API
│       └── user.router.js
├── .env                  # Variables de entorno locales
├── package.json          # Dependencias, metadatos y scripts del proyecto
└── README.md
```

---

## 🚀 Instalación y ejecución

```bash
# 1. Clonar el repositorio
git clone [https://github.com/Bafaf23/sigace-backend.git](https://github.com/Bafaf23/sigace-backend.git)
cd sigace-backend

# 2. Instalar todas las dependencias
npm install

# 3. Configurar las variables de entorno
# Crea un archivo .env en la raíz del proyecto basado en la sección siguiente

# 4. Levantar el servidor en modo desarrollo (con recarga automática nativa)
npm run dev
```

---

## 📄 Licencia y autor
- **Autor:** Bryant Facenda — [bafaf23@gmail.com](mailto:bafaf23@gmail.com)

