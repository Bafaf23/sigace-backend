import { Router } from "express";
import {
  getStudents,
  createStudent,
  updateStudent,
  getStudentNotEnrolled,
  getStudentsBySection,
} from "../controllers/student.controller.js";

const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    message: "API de estudiantes",
    description: "API para la gestión de estudiantes",
    version: "1.0.0",
    links: {
      getStudents: `getStudents/:SIG`,
      createStudent: `createStudent`,
    },
  });
});
router.get("/getStudents/:SIG", getStudents);
router.post("/createStudent", createStudent);
router.put("/updateStudent", updateStudent);
router.get("/getStudentNotEnrolled/:id_period/:SIG", getStudentNotEnrolled);
router.get("/getStudentsBySection/:id_section/:SIG", getStudentsBySection);
export default router;
