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
  permitirRoles("Adminstrador"),
  createLoadAcademic,
);
router.get(
  "/get/:SIG",
  verificarAutenticacion,
  permitirRoles("Administrador", "Profesor"),
  getLoadAcademic,
);

export default router;
