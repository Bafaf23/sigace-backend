import { Router } from "express";
import {
  createEvaluation,
  getEvaluations,
  deleteEvaluation,
} from "../controllers/evaluation.controller.js";
import {
  verificarAutenticacion,
  permitirRoles,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/create",
  verificarAutenticacion,
  permitirRoles("Profesor"),
  createEvaluation,
);
router.get(
  "/get/:id_load_academic",
  verificarAutenticacion,
  permitirRoles("Profesor", "Administrador"),
  getEvaluations,
);
router.get(
  "/get",
  verificarAutenticacion,
  permitirRoles("Profesor", "Administrador"),
  getEvaluations,
);
router.delete(
  "/delete/:id",
  verificarAutenticacion,
  permitirRoles("Administrador", "Profesor"),
  deleteEvaluation,
);
export default router;
