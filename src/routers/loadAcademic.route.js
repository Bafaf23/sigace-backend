import { Router } from "express";
import {
  createLoadAcademic,
  getLoadAcademic,
} from "../controllers/loadAcademic.controller.js";
import {
  verificarAutenticacion,
  permitirRoles,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/create",
  verificarAutenticacion,
  permitirRoles("Administrador"),
  createLoadAcademic,
);
router.get(
  "/get",
  verificarAutenticacion,
  permitirRoles("Administrador", "Profesor"),
  getLoadAcademic,
);

export default router;
