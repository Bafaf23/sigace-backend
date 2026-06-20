import { Router } from "express";
import {
  createLapse,
  endLapse,
  startLapse,
  getLapseActive,
  getLapses,
} from "../controllers/lapse.controller.js";
import {
  verificarAutenticacion,
  permitirRoles,
} from "../middlewares/auth.middleware.js";

const router = Router();
// Lapses
router.post(
  "/create",
  verificarAutenticacion,
  permitirRoles("Administrador"),
  createLapse,
);

router.put(
  "/start/:id",
  verificarAutenticacion,
  permitirRoles("Administrador"),
  startLapse,
);
router.put(
  "/end/:id",
  verificarAutenticacion,
  permitirRoles("Administrador"),
  endLapse,
);
router.get(
  "/getLapses",
  verificarAutenticacion,
  permitirRoles("Administrador", "Profesor", "Estudiante"),
  getLapses,
);
router.get(
  "/getLapseActive",
  verificarAutenticacion,
  permitirRoles("Administrador", "Profesor", "Estudiante"),
  getLapseActive,
);

export default router;
