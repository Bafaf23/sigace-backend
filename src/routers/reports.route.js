import { Router } from "express";
import { sectionList, boleta } from "../controllers/reports.controller.js";

const router = Router();

router.get("/sectionList/:SIG/:id_section", sectionList);
router.get("/boleta/:SIG/:id_student/:id_section", boleta);

export default router;
