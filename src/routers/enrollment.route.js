import { Router } from "express";
import {
  createEnrollment,
  getApprovedStudents,
  processStartStates,
  updatePreInscrip,
} from "../controllers/enrollments.controller.js";
import {
  verificarAutenticacion,
  permitirRoles,
} from "../middlewares/auth.middleware.js";

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
  permitirRoles("Administrador"),
  processStartStates,
);

router.post(
  "/updateInscrip",
  verificarAutenticacion,
  permitirRoles("administrador"),
  updatePreInscrip,
);

export default router;
