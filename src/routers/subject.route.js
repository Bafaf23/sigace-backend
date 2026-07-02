import { Router } from "express";
import {
  createSubject,
  getSubjects,
  getSubjectBySection,
  getYears,
  deleteSubjects,
  getSubjectPending,
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
  "/getSubjectSecction/student/:id_student",
  verificarAutenticacion,
  permitirRoles("Administrador", "Profesor", "Estudiante"),
  getSubjectBySection,
);

router.delete(
  "/deleteSub/:code_subject",
  verificarAutenticacion,
  permitirRoles("Administrador"),
  deleteSubjects,
);

router.get(
  "/getSubjectPending/:id_student",
  verificarAutenticacion,
  permitirRoles("Administrador", "Profesor", "Estudiante"),
  getSubjectPending,
);

export default router;
