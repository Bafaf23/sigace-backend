import { Router } from "express";
import { getTeachers, getLoadAcademicTeacher } from "../controllers/teachers.controller.js";

const router = Router();

router.get("/get", getTeachers);
router.get("/getLoadAcademicTeacher/:id", getLoadAcademicTeacher);
export default router;
