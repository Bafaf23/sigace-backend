import { Router } from "express";
import {
  sectionList,
  boleta,
  enrollmetP,
} from "../controllers/reports.controller.js";
import {
  verificarAutenticacion,
  permitirRoles,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.get(
  "/sectionList/:id_section",
  verificarAutenticacion,
  permitirRoles("Administrador", "Profesor"),
  sectionList,
);
router.get(
  "/boleta/:SIG/:id_student/:id_section",
  verificarAutenticacion,
  permitirRoles("Administrador", "Profesor", "Estudiante"),
  boleta,
);
router.get(
  "/planillaIns/:id_student/:id_representative",
  verificarAutenticacion,
  permitirRoles("Administrador"),
  enrollmetP,
);

export default router;
