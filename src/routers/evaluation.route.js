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
  "/",
  verificarAutenticacion,
  permitirRoles("profesor"),
  createEvaluation,
);

router.get(
  "/:id_load_academic",
  verificarAutenticacion,
  permitirRoles("profesor", "administrador"),
  getEvaluations,
);

router.delete(
  "/:id",
  verificarAutenticacion,
  permitirRoles("administrador", "profesor"),
  deleteEvaluation,
);
export default router;
