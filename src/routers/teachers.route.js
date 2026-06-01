import { Router } from "express";
import { getTeachers } from "../controllers/teachers.controller.js";

const router = Router();

router.get("/get", getTeachers);

export default router;
