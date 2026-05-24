import { Router } from "express";
import {
  getAllSchools,
  getSchoolBySIG,
  createSchool,
} from "../controllers/school.controller.js";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({ message: "API de escuelas" });
});
router.get("/getAllSchools", getAllSchools);
router.get("/getSchoolBySIG/:SIG", getSchoolBySIG);
router.post("/createSchool", createSchool);
export default router;
