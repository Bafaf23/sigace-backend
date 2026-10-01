import express from "express";
import {
  verificarAutenticacion,
  permitirRoles,
} from "../middlewares/auth.middleware.js";
import { getServices, updatePrice } from "../controllers/service.controller.js";

const router = express.Router();

router.get("/", verificarAutenticacion, permitirRoles("sudo"), getServices);
router.post("/", verificarAutenticacion, permitirRoles("sudo"), updatePrice);

export default router;
