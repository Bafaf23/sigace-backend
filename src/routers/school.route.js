import { Router } from "express";
import {
  getAllSchools,
  getSchoolBySIG,
  createSchool,
  deleteSchool,
  updateSchool,
  getRoles,
} from "../controllers/school.controller.js";
import {
  verificarAutenticacion,
  permitirRoles,
} from "../middlewares/auth.middleware.js";

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
router.get(
  "/getAllSchools",
  verificarAutenticacion,
  permitirRoles("SuperAdmin"),
  getAllSchools,
);
router.get(
  "/getSchoolBySIG/:SIG",
  verificarAutenticacion,
  permitirRoles("SuperAdmin"),
  getSchoolBySIG,
);
router.post(
  "/createSchool",
  verificarAutenticacion,
  permitirRoles("SuperAdmin"),
  createSchool,
);
router.delete(
  "/deleteSchool/:SIG",
  verificarAutenticacion,
  permitirRoles("SuperAdmin"),
  deleteSchool,
);
router.post(
  "/updateSchool",
  verificarAutenticacion,
  permitirRoles("SuperAdmin"),
  updateSchool,
);
router.get(
  "/getRoles",
  verificarAutenticacion,
  permitirRoles("SuperAdmin"),
  getRoles,
);
export default router;
