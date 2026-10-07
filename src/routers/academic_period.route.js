import { Router } from "express";
import {
  endAcademicPeriod,
  createAcademicPeriod,
  getAcademicPeriods,
  activateEnrollmentPeriod,
} from "../controllers/academinc_period.controller.js";
import {
  verificarAutenticacion,
  permitirRoles,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.put(
  "/end",
  verificarAutenticacion,
  permitirRoles("administrador"),
  endAcademicPeriod,
);
router.post(
  "/",
  verificarAutenticacion,
  permitirRoles("administrador", "director"),
  createAcademicPeriod,
);
router.get(
  "/",
  verificarAutenticacion,
  permitirRoles(
    "administrador",
    "profesor",
    "estudiante",
    "director",
    "gestion",
  ),
  getAcademicPeriods,
);

router.patch(
  "/enrollment",
  verificarAutenticacion,
  permitirRoles("administrador"),
  activateEnrollmentPeriod,
);

export default router;
