import express from "express";
import { sudoMetrics } from "../controllers/metrics.controller.js";
import {
  permitirRoles,
  verificarAutenticacion,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/sudo", verificarAutenticacion, permitirRoles("sudo"), sudoMetrics);

export default router;
