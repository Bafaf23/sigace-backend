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

router.put(
  "/",
  /* verificarAutenticacion,
  permitirRoles("profesor"), */
  createGrade,
);

router.get(
  "/:id_load_academic",
  /* verificarAutenticacion,
  permitirRoles(
    "profesor",
    "administrador",
    "estudiante",
    "director",
    "gestion",
  ), */
  getGradeStudents,
);
export default router;
