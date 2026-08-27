import { Router } from "express";
import {
  getStudents,
  createStudent,
  updateStudent,
  getStudentNotEnrolled,
  getStudentByID,
  getRecordStudent,
  getPreinscription,
} from "../controllers/student.controller.js";
import {
  verificarAutenticacion,
  permitirRoles,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.get(
  "/",
  verificarAutenticacion,
  permitirRoles("administrador", "director", "gestion"),
  getStudents,
);
router.post(
  "/",
  verificarAutenticacion,
  permitirRoles("administrador"),
  createStudent,
);
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
  "/:id_card",
  verificarAutenticacion,
  permitirRoles("administrador", "director", "gestion"),
  getStudentByID,
);

router.get(
  "/:id_student/record",
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

export default router;
