import { Router } from "express";
import {
  createSubject,
  getSubjects,
  getSubjectBySection,
  getYears,
  deleteSubjects,
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

router.delete(
  "/deleteSub/:code_subject",
  verificarAutenticacion,
  permitirRoles("Administrador"),
  deleteSubjects
);

export default router;
