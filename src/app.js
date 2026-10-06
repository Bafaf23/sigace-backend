import { pool } from "./db.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import { subdomainHandler } from "./middlewares/subdomainHandler.js";
import academic_periodRouter from "./routers/academic_period.route.js";
import authRouter from "./routers/auth.route.js";
import enrollmentRouter from "./routers/enrollment.route.js";
import evaluationRouter from "./routers/evaluation.route.js";
import gredeRouter from "./routers/grade.route.js";
import lapseRouter from "./routers/lapse.route.js";
import loadAcademicRouter from "./routers/loadAcademic.route.js";
import metricsRouter from "./routers/metrics.route.js";
import reportsRouter from "./routers/reports.route.js";
import schoolRouter from "./routers/school.route.js";
import sectionRouter from "./routers/section.route.js";
import serviceRouter from "./routers/service.route.js";
import studentRouter from "./routers/student.route.js";
import subjectRouter from "./routers/subject.route.js";
import teachersRouter from "./routers/teachers.route.js";
import userRouter from "./routers/user.route.js";
import verifyRouter from "./routers/verify.route.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import MySQLStoreFactory from "express-mysql-session";
import session from "express-session";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

const isProduction = process.env.NODE_ENV === "production";

const MySQLStore = MySQLStoreFactory(session);
const sessionStore = new MySQLStore({}, pool);

if (isProduction) {
  app.set("trust proxy", 1);
}

const subdomainRegex =
  /^https?:\/\/([a-z0-9-]+)\.(localhost:\d+|sigace\.xyz)$/i;
const localOriginRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

const allowedOrigins = [
  "http://localhost:3000",
  "http://sigace.xyz",
  "https://sigace.xyz",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        subdomainRegex.test(origin) ||
        (!isProduction && localOriginRegex.test(origin))
      ) {
        return callback(null, true);
      }

      return callback(
        new Error(`Bloqueado por CORS: Origen ${origin} no permitido`),
      );
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-origin-host"],
  }),
);

app.use(
  session({
    key: "sigace_session_cookie",
    secret: process.env.SESSION_SECRET,
    resave: false,
    store: sessionStore,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      domain: isProduction ? ".sigace.xyz" : undefined,
      maxAge: 7200 * 1000,
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
app.use("/service", serviceRouter);
app.use("/metrics", metricsRouter);
app.use("/grades", gredeRouter);
app.use("/api", verifyRouter);
app.get("/", (_req, res) => {
  res.status(200).json({
    name: "SIGACE API",
    description:
      "Sistema Inteligente de Control de Estudios. Backend para la gestión de matrículas, notas y reportes académicos.",
    version: "1.0.0",
    environment: isProduction ? "Producion" : "desarrollo",
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
