import { admiMetrics, sudoMetrics } from "../controllers/metrics.controller.js";
import {
  permitirRoles,
  verificarAutenticacion,
} from "../middlewares/auth.middleware.js";
import express from "express";

const router = express.Router();

router.get("/sudo", verificarAutenticacion, permitirRoles("sudo"), sudoMetrics);
router.get(
  "/admin",
  verificarAutenticacion,
  permitirRoles("administrador"),
  admiMetrics,
);

export default router;
