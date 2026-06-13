import { Router } from "express";
import {
  createSection,
  getSections,
} from "../controllers/section.controller.js";

const router = Router();

router.post("/create", createSection);
router.get("/get/:SIG/:id_period", getSections);

export default router;
