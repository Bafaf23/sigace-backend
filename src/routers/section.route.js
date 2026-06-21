import { Router } from "express";
import {
  createSection,
  getSections,
} from "../controllers/section.controller.js";
import {
  verificarAutenticacion,
  permitirRoles,
} from "../middlewares/auth.middleware.js";
const router = Router();

router.post(
  "/create",
  verificarAutenticacion,
  permitirRoles("Administrador"),
  createSection,
);
router.get(
  "/get/:id_period",
  verificarAutenticacion,
  permitirRoles("Administrador", "Profesor", "Estudiante"),
  getSections,
);

export default router;
