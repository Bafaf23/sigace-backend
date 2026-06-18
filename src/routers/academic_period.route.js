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
  "/endAcademicPeriod/:SIG",
  verificarAutenticacion,
  permitirRoles("Administrador"),
  endAcademicPeriod,
);
router.post(
  "/createAcademicPeriod/:SIG",
  verificarAutenticacion,
  permitirRoles("Administrador"),
  createAcademicPeriod,
);
router.get(
  "/getAcademicPeriods/:SIG",
  verificarAutenticacion,
  permitirRoles("Administrador", "Profesor", "Estudiante"),
  getAcademicPeriods,
);

export default router;
