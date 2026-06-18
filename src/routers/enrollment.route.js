import { Router } from "express";
import {
  createEnrollment,
  getApprovedStudents,
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

export default router;
