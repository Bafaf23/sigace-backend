import { Router } from "express";
import {
  getTeachers,
  getLoadAcademicTeacher,
} from "../controllers/teachers.controller.js";
import {
  verificarAutenticacion,
  permitirRoles,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.get(
  "/get",
  verificarAutenticacion,
  permitirRoles("Administrador"),
  getTeachers,
);

router.get(
  "/getLoadAcademicTeacher",
  verificarAutenticacion,
  permitirRoles("Administrador", "Profesor"),
  getLoadAcademicTeacher,
);

export default router;
