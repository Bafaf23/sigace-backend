import { Router } from "express";
import {
  createEnrollment,
  getApprovedStudents,
  processStartStates,
} from "../controllers/enrollments.controller.js";
import {
  verificarAutenticacion,
  permitirRoles,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/create",
  verificarAutenticacion,
  permitirRoles("Administrador"),
  createEnrollment,
);
router.get(
  "/approved",
  verificarAutenticacion,
  permitirRoles("Administrador"),
  getApprovedStudents,
);

router.post(
  "/processStart",
  verificarAutenticacion,
  permitirRoles("Administrador"),
  processStartStates,
);

export default router;
