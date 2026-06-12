import { Router } from "express";
import {
  endAcademicPeriod,
  createAcademicPeriod,
  getAcademicPeriods,
} from "../controllers/academinc_period.controller.js";

const router = Router();

router.put("/endAcademicPeriod/:SIG", endAcademicPeriod);
router.get("/createAcademicPeriod/:SIG", createAcademicPeriod);
router.get("/getAcademicPeriods/:SIG", getAcademicPeriods);

export default router;
