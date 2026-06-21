import { Router } from "express";
import {
  createGrade,
  getGradeStudents,
} from "../controllers/grade.controller.js";
import {
  verificarAutenticacion,
  permitirRoles,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({
    name: "API Notas SIG",
  });
});

router.put(
  "/uploadNote",
  verificarAutenticacion,
  permitirRoles("Profesor"),
  createGrade,
);

router.get(
  "/getGrade/:id_load_academic",
  verificarAutenticacion,
  permitirRoles("Profesor", "Administrador", "Estudiante"),
  getGradeStudents,
);
export default router;
