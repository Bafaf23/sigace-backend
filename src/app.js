import express from "express";
import dotenv from "dotenv";
import userRouter from "./routers/user.route.js";
import cors from "cors";
import session from "express-session";
import authRouter from "./routers/auth.route.js";
import schoolRouter from "./routers/school.route.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret", // Clave para firmar la cookie de sesión
    resave: false, // Evita guardar la sesión si no hubo cambios
    saveUninitialized: false, // No crea una sesión vacía para usuarios no logueados
    cookie: {
      secure: false, // Ponlo en 'true' solo si usas HTTPS (producción)
      httpOnly: true, // Impide que el frontend acceda a la cookie vía JS (Seguridad)
      maxAge: 1000 * 60 * 60 * 2, // Duración de la sesión: 2 horas
    },
  }),
);

// Routes
app.use("/users", userRouter);
app.use("/auth", authRouter);
app.use("/schools", schoolRouter);

app.get("/", (req, res) => {
  res.status(200).json({
    name: "SIGACE API",
    description:
      "Sistema Inteligente de Control de Estudios. Backend para la gestión de matrículas, notas y reportes académicos.",
    version: "1.0.0",
    environment: "production",
    status: "operational",
    timestamp: "2026-05-24T13:00:00Z",
    documentation: "https://api.sigace.com/docs",
    links: {
      users: `${process.env.API_URL}/users`,
      auth: `${process.env.API_URL}/auth`,
      schools: `${process.env.API_URL}/schools`,
    },
  });
});

const port = process.env.PORT || 3004;

app.listen(port, () => {
  console.log(`Escuchando en el puerto http://localhost:${port}`);
});
