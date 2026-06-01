import { Router } from "express";
import {
  createSection,
  getSections,
} from "../controllers/section.controller.js";

const router = Router();

router.post("/create", createSection);
router.get("/get/:SIG", getSections);

export default router;
