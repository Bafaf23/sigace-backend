import {
  createEnrollment,
  getApprovedStudents,
  processStartStates,
  updatePreInscrip,
  periodStudent,
} from "../controllers/enrollments.controller.js";
import {
  verificarAutenticacion,
  permitirRoles,
} from "../middlewares/auth.middleware.js";
import { Router } from "express";

const router = Router();

router.post(
  "/",
  verificarAutenticacion,
  permitirRoles("administrador"),
  createEnrollment,
);
router.get(
  "/",
  verificarAutenticacion,
  permitirRoles("administrador"),
  getApprovedStudents,
);

router.post(
  "/",
  verificarAutenticacion,
  permitirRoles("administrador"),
  processStartStates,
);

router.post(
  "/updateInscrip",
  verificarAutenticacion,
  permitirRoles("administrador"),
  updatePreInscrip,
);

router.get(
  "/:id_student/enrollments",
  verificarAutenticacion,
  permitirRoles("administrador", "estudiante"),
  periodStudent,
);

export default router;
