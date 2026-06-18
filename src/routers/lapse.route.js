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
  "/create/:SIG",
  verificarAutenticacion,
  permitirRoles("Adminstrador"),
  createLapse,
);
router.put(
  "/start/:id",
  verificarAutenticacion,
  permitirRoles("Adminstrador"),
  startLapse,
);
router.put(
  "/end/:id",
  verificarAutenticacion,
  permitirRoles("Adminstrador"),
  endLapse,
);
router.get(
  "/getLapses/:SIG/:id_period",
  verificarAutenticacion,
  permitirRoles("Adminstrador", "Profesor", "Estudiante"),
  getLapses,
);
router.get(
  "/getLapseActive/:SIG",
  verificarAutenticacion,
  permitirRoles("Adminstrador", "Profesor", "Estudiante"),
  getLapseActive,
);

export default router;
