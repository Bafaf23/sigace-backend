import { Router } from "express";
import {
  createEvaluation,
  getEvaluations,
  deleteEvaluation,
} from "../controllers/evaluation.controller.js";

const router = Router();

router.post("/create", createEvaluation);
router.get("/get/:id_load_academic", getEvaluations);
router.get("/get", getEvaluations);
router.delete("/delete/:id", deleteEvaluation);
export default router;
