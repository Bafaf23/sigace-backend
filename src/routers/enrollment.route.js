import { Router } from "express";
import { createEnrollment } from "../controllers/enrollments.controller.js";

const router = Router();

router.post("/create", createEnrollment);

export default router;
