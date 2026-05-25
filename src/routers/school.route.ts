import { Router } from "express";
import {
  getAllSchools,
  getSchoolBySIG,
  createSchool,
  deleteSchool,
} from "../controllers/school.controller.js";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({ message: "API de escuelas" });
});
router.get("/getAllSchools", getAllSchools);
router.get("/getSchoolBySIG/:SIG", getSchoolBySIG);
router.post("/createSchool", createSchool);
router.delete("/deleteSchool/:SIG", deleteSchool);
export default router;
