import { Router } from "express";
import {
  endAcademicPeriod,
  createAcademicPeriod,
  getAcademicPeriods,
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

export default router;
