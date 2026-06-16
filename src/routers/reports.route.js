import { Router } from "express";
import {
  sectionList,
  boleta,
  enrollmetP,
} from "../controllers/reports.controller.js";

const router = Router();

router.get("/sectionList/:SIG/:id_section", sectionList);
router.get("/boleta/:SIG/:id_student/:id_section", boleta);
router.get("/planillaIns/:SIG/:id_student/:id_representative", enrollmetP);

export default router;
