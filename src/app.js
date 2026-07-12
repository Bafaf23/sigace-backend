import express from "express";
import dotenv from "dotenv";
import userRouter from "./routers/user.route.js";
import cors from "cors";
import session from "express-session";
import authRouter from "./routers/auth.route.js";
import schoolRouter from "./routers/school.route.js";
import studentRouter from "./routers/student.route.js";
import academic_periodRouter from "./routers/academic_period.route.js";
import sectionRouter from "./routers/section.route.js";
import reportsRouter from "./routers/reports.route.js";
import subjectRouter from "./routers/subject.route.js";
import teachersRouter from "./routers/teachers.route.js";
import loadAcademicRouter from "./routers/loadAcademic.route.js";
import enrollmentRouter from "./routers/enrollment.route.js";
import evaluationRouter from "./routers/evaluation.route.js";
import lapseRouter from "./routers/lapse.route.js";
import gredeRouter from "./routers/grade.route.js";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());

const isProduction = process.env.NODE_ENV === "production";

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Clave para firmar la cookie de sesión
    resave: false, // Evita guardar la sesión si no hubo cambios
    saveUninitialized: false, // No crea una sesión vacía para usuarios no logueados
    cookie: {
      secure: isProduction,
      httpOnly: true, // Impide que el frontend acceda a la cookie vía JS (Seguridad)
      maxAge: 1000 * 60 * 60 * 2, // Duración de la sesión: 2 horas
    },
  }),
);

// Routes
app.use("/users", userRouter);
app.use("/students", studentRouter);
app.use("/auth", authRouter);
app.use("/schools", schoolRouter);
app.use("/sections", sectionRouter);
app.use("/subjects", subjectRouter);
app.use("/enrollments", enrollmentRouter);
app.use("/periods", academic_periodRouter);
app.use("/teachers", teachersRouter);
app.use("/loadAcademic", loadAcademicRouter);
app.use("/reports", reportsRouter);
app.use("/evaluations", evaluationRouter);
app.use("/lapses", lapseRouter);
app.use("/grades", gredeRouter);

app.get("/", (_req, res) => {
  res.status(200).json({
    name: "SIGACE API",
    description:
      "Sistema Inteligente de Control de Estudios. Backend para la gestión de matrículas, notas y reportes académicos.",
    version: "1.0.0",
    environment: "production",
    status: "operational",
    timestamp: "2026-05-24T13:00:00Z",
    links: {
      users: `${process.env.API_URL}/users`,
      auth: `${process.env.API_URL}/auth`,
      schools: `${process.env.API_URL}/schools`,
      students: `${process.env.API_URL}/students`,
    },
  });
});

const port = process.env.PORT || 3004;

app.listen(port, () => {
  console.log(`Escuchando en el puerto ${port}`);
});
