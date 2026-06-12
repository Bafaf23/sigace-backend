import { Router } from "express";
import {
  createEnrollment,
  getApprovedStudents,
} from "../controllers/enrollments.controller.js";

const router = Router();

router.post("/create", createEnrollment);
router.get("/approved", getApprovedStudents);

export default router;
