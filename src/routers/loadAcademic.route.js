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
  "/",
  verificarAutenticacion,
  permitirRoles("administrador"),
  createLoadAcademic,
);
router.get(
  "/",
  verificarAutenticacion,
  permitirRoles("administrador", "profesor", "director", "gestion"),
  getLoadAcademic,
);

export default router;
