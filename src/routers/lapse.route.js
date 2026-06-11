import { Router } from "express";
import {
  createLapse,
  endLapse,
  endAcademicPeriod,
  startLapse,
  getAcademicPeriods,
  createAcademicPeriod,
  getLapseActive,
  getLapses,
} from "../controllers/lapse.controller.js";

const router = Router();
// Lapses
router.post("/create/:SIG", createLapse);
router.put("/start/:id", startLapse);
router.put("/end/:id", endLapse);
router.get("/getLapses/:SIG", getLapses);
router.get("/getLapseActive/:SIG", getLapseActive);

// Academic Periods
router.put("/endAcademicPeriod/:SIG", endAcademicPeriod);
router.get("/createAcademicPeriod/:SIG", createAcademicPeriod);
router.get("/getAcademicPeriods/:SIG", getAcademicPeriods);

export default router;
