import { Router } from "express";
import {
  createSubject,
  getSubjects,
  getSubjectBySection,
  getYears,
} from "../controllers/subject.controller.js";

const router = Router();

router.post("/create", createSubject);
router.get("/get/:SIG", getSubjects);
router.get("/getYears/:SIG", getYears);
router.get("/getSubjectSecction/student/:id_student/:SIG", getSubjectBySection);
export default router;
