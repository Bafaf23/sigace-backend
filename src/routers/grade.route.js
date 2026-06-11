import { Router } from "express";
import {
  createGrade,
  getGradeStudent,
} from "../controllers/grade.controller.js";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({
    name: "API Notas SIG",
  });
});

router.put("/uploadNote", createGrade);
router.get("/getGrade/:idLoadAcademic", getGradeStudent);
export default router;
