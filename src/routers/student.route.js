import { Router } from "express";
import {
  getStudents,
  createStudent,
  updateStudent,
  getStudentNotEnrolled,
  getStudentsBySection,
  getStudentByID,
  getRecordStudent,
  getPreinscription,
} from "../controllers/student.controller.js";
import {
  verificarAutenticacion,
  permitirRoles,
} from "../middlewares/auth.middleware.js";

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
router.get(
  "/getStudents",
  verificarAutenticacion,
  permitirRoles("Administrador"),
  getStudents,
);
router.post(
  "/createStudent",
  verificarAutenticacion,
  permitirRoles("Administrador"),
  createStudent,
);
router.put(
  "/updateStudent",
  verificarAutenticacion,
  permitirRoles("Administrador"),
  updateStudent,
);
router.get(
  "/getStudentNotEnrolled/:id_period",
  verificarAutenticacion,
  permitirRoles("Administrador"),
  getStudentNotEnrolled,
);

router.get(
  "/getStudentsBySection/:id_section",
  verificarAutenticacion,
  permitirRoles("Administrador", "Profesor"),
  getStudentsBySection,
);

router.get(
  "/getStudentByID/:id_student",
  verificarAutenticacion,
  permitirRoles("Administrador"),
  getStudentByID,
);

router.get(
  "/getRecordStudent/:id_student/:id_period",
  verificarAutenticacion,
  permitirRoles("Administrador", "Estudiante"),
  getRecordStudent,
);

router.get(
  "/getPreinscription/:id_period",
  verificarAutenticacion,
  permitirRoles("Administrador"),
  getPreinscription,
);

export default router;
