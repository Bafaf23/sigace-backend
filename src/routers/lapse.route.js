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
  "/",
  verificarAutenticacion,
  permitirRoles("administrador", "director"),
  createLapse,
);

router.put(
  "/start/:id",
  verificarAutenticacion,
  permitirRoles("administrador", "director"),
  startLapse,
);
router.put(
  "/end/:id",
  verificarAutenticacion,
  permitirRoles("Administrador"),
  endLapse,
);
router.get(
  "/",
  verificarAutenticacion,
  permitirRoles(
    "administrador",
    "profesor",
    "estudiante",
    "director",
    "gestion",
  ),
  getLapses,
);
router.get(
  "/lapse-a",
  verificarAutenticacion,
  permitirRoles(
    "administrador",
    "profesor",
    "estudiante",
    "director",
    "gestion",
  ),
  getLapseActive,
);

export default router;
