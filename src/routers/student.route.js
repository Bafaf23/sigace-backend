import {
  getStudents,
  createStudent,
  updateStudent,
  getStudentNotEnrolled,
  getStudentByID,
  getRecordStudent,
  getSubjectPending,
  getPreinscription,
  getGrade,
  consultStudent,
  getTuitionNumber,
} from "../controllers/student.controller.js";
import {
  verificarAutenticacion,
  permitirRoles,
} from "../middlewares/auth.middleware.js";
import { Router } from "express";

const router = Router();

router.get(
  "/",
  verificarAutenticacion,
  permitirRoles("administrador", "director", "gestion"),
  getStudents,
);
router.post("/", createStudent);
router.put(
  "/updateStudent",
  verificarAutenticacion,
  permitirRoles("administrador"),
  updateStudent,
);
router.get(
  "/not-enrolled/:id_period",
  verificarAutenticacion,
  permitirRoles("administrador", "director"),
  getStudentNotEnrolled,
);

router.get(
  "/:id",
  verificarAutenticacion,
  permitirRoles("administrador", "director", "gestion"),
  getStudentByID,
);

router.get(
  "/:id/record",
  verificarAutenticacion,
  permitirRoles("administrador", "estudiante"),
  getRecordStudent,
);

router.get(
  "/:id_period/pre-inscription",
  verificarAutenticacion,
  permitirRoles("administrador", "director"),
  getPreinscription,
);

router.get(
  "/:id_student/subject-pending",
  verificarAutenticacion,
  permitirRoles("administrador", "director", "estudiante", "gestion"),
  getSubjectPending,
);

router.get(
  "/:id_student/grade",
  verificarAutenticacion,
  permitirRoles("administrador", "director", "estudiante", "gestion"),
  getGrade,
);

router.get(
  "/:tuitionNumber/tuitionNumber",
  verificarAutenticacion,
  getTuitionNumber,
);

router.post("/consult", consultStudent);

export default router;
