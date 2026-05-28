import { Router } from "express";
import { getStudents } from "../controllers/student.controller.js";

const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    message: "API de estudiantes",
    description: "API para la gestión de estudiantes",
    version: "1.0.0",
    links: {
      getStudents: `getStudents/:SIG`,
    },
  });
});
router.get("/getStudents/:SIG", getStudents);

export default router;
