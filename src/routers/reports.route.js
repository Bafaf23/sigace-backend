import { Router } from "express";
import { sectionList } from "../controllers/reports.controller.js";

const router = Router();

router.get("/sectionList/:SIG/:id_section", sectionList);

export default router;
