import { Router } from "express";
import {
  getAllSchools,
  getSchoolBySIG,
  createSchool,
  deleteSchool,
  updateSchool,
  getRoles,
} from "../controllers/school.controller.js";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({
    name: "SIGACE API - Schools",
    description: "API para la gestión de escuelas del sistema SIGACE.",
    version: "1.0.0",
    environment: "production",
    status: "operational",
    links: {
      getAllSchools: `/getAllSchools`,
      getSchoolBySIG: `/getSchoolBySIG/:SIG`,
      createSchool: `/createSchool`,
      deleteSchool: `/deleteSchool/:SIG`,
      updateSchool: `/updateSchool/:SIG`,
    },
  });
});
router.get("/getAllSchools", getAllSchools);
router.get("/getSchoolBySIG/:SIG", getSchoolBySIG);
router.post("/createSchool", createSchool);
router.delete("/deleteSchool/:SIG", deleteSchool);
router.post("/updateSchool", updateSchool);
router.get("/getRoles", getRoles);
export default router;
