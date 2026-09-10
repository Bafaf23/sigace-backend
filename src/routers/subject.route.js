import { Router } from "express";
import {
  createSubject,
  getSubjects,
  /*   getSubjectBySection, */
  getYears,
  deleteSubjects,
} from "../controllers/subject.controller.js";
import {
  verificarAutenticacion,
  permitirRoles,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/",
  verificarAutenticacion,
  permitirRoles("administrador", "director"),
  createSubject,
);
router.get(
  "/",
  verificarAutenticacion,
  permitirRoles("administrador", "profesor", "director", "gestion"),
  getSubjects,
);
router.get(
  "/years",
  verificarAutenticacion,
  permitirRoles("administrador", "profesor", "director"),
  getYears,
);

/* router.get(
  "/getSubjectSecction/student/:id",
  verificarAutenticacion,
  permitirRoles("Administrador", "Profesor", "Estudiante"),
  getSubjectBySection,
); */

router.delete(
  "/deleteSub/:code_subject",
  verificarAutenticacion,
  permitirRoles("administrador"),
  deleteSubjects,
);

export default router;
