import { Router } from "express";
import {
  createSubject,
  getSubjects,
  getSubjectBySection,
  getYears,
} from "../controllers/subject.controller.js";
import {
  verificarAutenticacion,
  permitirRoles,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/create",
  verificarAutenticacion,
  permitirRoles("Administrador"),
  createSubject,
);
router.get(
  "/get",
  verificarAutenticacion,
  permitirRoles("Administrador", "Profesor"),
  getSubjects,
);
router.get(
  "/getYears",
  verificarAutenticacion,
  permitirRoles("Administrador", "Profesor"),
  getYears,
);
router.get(
  "/getSubjectSecction/student/:id_student/:SIG",
  verificarAutenticacion,
  permitirRoles("Administrador", "Profesor"),
  getSubjectBySection,
);

router.get(
  "/deleteSub/:code_subject",
  verificarAutenticacion,
  permitirRoles("Administrador", "Profesor"),
  getSubjectBySection,
);

export default router;
