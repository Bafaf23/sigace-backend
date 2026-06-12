import { Router } from "express";
import {
  createLapse,
  endLapse,
  startLapse,
  getLapseActive,
  getLapses,
} from "../controllers/lapse.controller.js";

const router = Router();
// Lapses
router.post("/create/:SIG", createLapse);
router.put("/start/:id", startLapse);
router.put("/end/:id", endLapse);
router.get("/getLapses/:SIG/:id_period", getLapses);
router.get("/getLapseActive/:SIG", getLapseActive);

export default router;
