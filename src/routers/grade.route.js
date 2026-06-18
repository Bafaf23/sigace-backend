import { Router } from "express";
import {
  createGrade,
  getGradeStudent,
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
  permitirRoles("Profesores"),
  createGrade,
);
router.get(
  "/getGrade/:idLoadAcademic",
  verificarAutenticacion,
  permitirRoles("Profesores", "Adminstradores", "Estudiante"),
  getGradeStudent,
);
export default router;
