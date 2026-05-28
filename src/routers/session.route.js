import { Router } from "express";
import { createSession } from "../controllers/sessions.controller.js";

const router = Router();

router.post("/create", createSession);

export default router;
