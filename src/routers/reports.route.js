import {
  sectionList,
  reportCard,
  enrollmetP,
  sheetNote,
  resumenFinalE,
} from "../controllers/reports.controller.js";
import {
  verificarAutenticacion,
  permitirRoles,
} from "../middlewares/auth.middleware.js";
import { Router } from "express";

const router = Router();

router.get(
  "/:id_section/list-section",
  verificarAutenticacion,
  permitirRoles("administrador", "profesor"),
  sectionList,
);

router.get(
  "/:id_student/boleta",
  verificarAutenticacion,
  permitirRoles("administrador", "gestion", "estudiante"),
  reportCard,
);

router.get(
  "/:tuition_number/enrollment",
  verificarAutenticacion,
  permitirRoles("administrador", "gestion"),
  enrollmetP,
);

router.get(
  "/:id_section/noteSheet",
  verificarAutenticacion,
  permitirRoles("administrador", "gestion"),
  sheetNote,
);

router.get(
  "/:id_section/rfre",
  verificarAutenticacion,
  permitirRoles("administrador", "gestion", "director"),
  resumenFinalE,
);
export default router;
