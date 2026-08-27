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
  "/",
  verificarAutenticacion,
  permitirRoles("administrador", "director"),
  getTeachers,
);

router.get(
  "/load",
  verificarAutenticacion,
  permitirRoles("administrador", "profesor", "director"),
  getLoadAcademicTeacher,
);

export default router;
