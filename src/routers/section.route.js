import { Router } from "express";
import {
  createSection,
  getSections,
  getStudentsBySection,
} from "../controllers/section.controller.js";
import {
  verificarAutenticacion,
  permitirRoles,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/",
  verificarAutenticacion,
  permitirRoles("administrador", "gestion", "director"),
  createSection,
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
  getSections,
);

router.get(
  "/:id_section/students",
  verificarAutenticacion,
  permitirRoles("administrador", "profesor", "director"),
  getStudentsBySection,
);

export default router;
