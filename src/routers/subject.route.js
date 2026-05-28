import { Router } from "express";
import {
  createSubject,
  getSubjects,
} from "../controllers/subject.controller.js";

const router = Router();

router.post("/create", createSubject);
router.get("/get/:SIG", getSubjects);

export default router;
