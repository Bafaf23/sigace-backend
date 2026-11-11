import {
  academicClosure,
  createAcademicPeriod,
  getAcademicPeriods,
  activateEnrollmentPeriod,
} from "../controllers/academinc_period.controller.js";
import {
  verificarAutenticacion,
  permitirRoles,
} from "../middlewares/auth.middleware.js";
import { Router } from "express";

const router = Router();

router.put(
  "/end",
  verificarAutenticacion,
  permitirRoles("administrador"),
  academicClosure,
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
