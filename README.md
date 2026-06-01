# 🎓 SIGACE Backend

API REST del sistema **SIGACE** (Sistema de Gestión Académica). Backend desarrollado con **Node.js**, **Express** y **TypeScript**, conectado a **SQL Server**.

---

## 🚨 En construcción 🏗️👷🚧

El proyecto está en migración activa desde Python hacia TypeScript. Algunos endpoints y módulos aún están en desarrollo.

---

## 🛠️ Stack tecnológico

| Tecnología   | Uso                          |
| ------------ | ---------------------------- |
| Node.js      | Runtime                      |
| Express 5    | Framework HTTP               |
| TypeScript   | Lenguaje                     |
| mssql        | Cliente SQL Server           |
| dotenv       | Variables de entorno         |
| tsx          | Ejecución en desarrollo      |

---

## 📋 Requisitos previos

- [Node.js](https://nodejs.org/) (v18 o superior recomendado)
- [SQL Server](https://www.microsoft.com/sql-server) accesible desde la máquina local o red
- npm (incluido con Node.js)

---

## 🚀 Instalación y ejecución

```bash
# Clonar el repositorio
git clone https://github.com/Bafaf23/sigace-backend.git
cd sigace-backend

# Instalar dependencias
npm install

# Configurar variables de entorno (ver sección siguiente)
# Crear archivo .env en la raíz del proyecto

# Modo desarrollo (recarga automática)
npm run dev
```

El servidor arranca por defecto en `http://localhost:3001`.

---

## ⚙️ Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
PORT=3001
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_SERVER=localhost
DB_NAME=nombre_base_datos
```

| Variable      | Descripción                          | Requerida |
| ------------- | ------------------------------------ | --------- |
| `PORT`        | Puerto del servidor HTTP             | No (3001) |
| `DB_USER`     | Usuario de SQL Server                | Sí        |
| `DB_PASSWORD` | Contraseña de SQL Server             | Sí        |
| `DB_SERVER`   | Host del servidor SQL                | No        |
| `DB_NAME`     | Nombre de la base de datos           | Sí        |

---

## 📜 Scripts disponibles

| Comando      | Descripción                                      |
| ------------ | ------------------------------------------------ |
| `npm run dev`  | Inicia el servidor en modo desarrollo con tsx  |
| `npm run tsc`  | Compila TypeScript a JavaScript en `./dist`    |

---

## 📁 Estructura del proyecto

```
sigace-backend/
├── src/
│   ├── app.ts              # Punto de entrada de la aplicación
│   ├── db.ts               # Conexión a SQL Server
│   ├── models/
│   │   └── User.model.ts   # Modelo de usuario
│   └── routers/
│       └── user.router.ts  # Rutas de usuarios
├── dist/                   # Salida de compilación (generada)
├── .env                    # Variables de entorno (no versionado)
├── package.json
└── tsconfig.json
```

---

## 🔌 Endpoints

| Método | Ruta      | Descripción              |
| ------ | --------- | ------------------------ |
| GET    | `/users`  | Listado de usuarios      |
| POST   | `/users`  | Crear un nuevo usuario   |

> Los endpoints actuales son placeholders. La lógica de negocio y persistencia se implementará progresivamente.

---

## 📄 Licencia y autor

- **Licencia:** ISC
- **Autor:** Bryant Facenda — [bafaf23@gmail.com](mailto:bafaf23@gmail.com)
- **Repositorio:** [github.com/Bafaf23/sigace-backend](https://github.com/Bafaf23/sigace-backend)
