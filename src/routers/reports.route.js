import { Router } from "express";
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

const router = Router();

router.get(
  "/:id_section/list-section",
  /* verificarAutenticacion,
  permitirRoles("administrador", "profesor"), */
  sectionList,
);

router.get(
  "/:id_student/:id_section/:id_period/boleta",
  /* verificarAutenticacion,
  permitirRoles("administrador", "estudiante"), */
  reportCard,
);

router.get(
  "/planillaIns/:id_student/:id_representative",
  verificarAutenticacion,
  permitirRoles("Administrador"),
  enrollmetP,
);

router.get(
  "/noteSheet/:id_section",
  verificarAutenticacion,
  permitirRoles("Administrador"),
  sheetNote,
);

router.get("/rfre", resumenFinalE);
export default router;
