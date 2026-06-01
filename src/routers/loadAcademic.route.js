import { Router } from "express";
import {
  createLoadAcademic,
  getLoadAcademic,
} from "../controllers/loadAcademic.controller.js";

const router = Router();

router.post("/create", createLoadAcademic);
router.get("/get/:SIG", getLoadAcademic);
export default router;
