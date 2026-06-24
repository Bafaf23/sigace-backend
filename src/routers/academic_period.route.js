import { Router } from "express";
import {
  endAcademicPeriod,
  createAcademicPeriod,
  getAcademicPeriods,
  periodStudent,
} from "../controllers/academinc_period.controller.js";
import {
  verificarAutenticacion,
  permitirRoles,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.put(
  "/endAcademicPeriod",
  verificarAutenticacion,
  permitirRoles("Administrador"),
  endAcademicPeriod,
);
router.post(
  "/createAcademicPeriod",
  verificarAutenticacion,
  permitirRoles("Administrador"),
  createAcademicPeriod,
);
router.get(
  "/getAcademicPeriods",
  verificarAutenticacion,
  permitirRoles("Administrador", "Profesor", "Estudiante"),
  getAcademicPeriods,
);

router.get(
  "/periodStudent/:id_student",
  verificarAutenticacion,
  permitirRoles("Administrador", "Estudiante"),
  periodStudent,
);

export default router;
