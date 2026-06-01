import { Router } from "express";
import {
  createSubject,
  getSubjects,
  getYears,
} from "../controllers/subject.controller.js";

const router = Router();

router.post("/create", createSubject);
router.get("/get/:SIG", getSubjects);
router.get("/getYears/:SIG", getYears);
export default router;
