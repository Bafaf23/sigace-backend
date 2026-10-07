import { Router } from "express";
import {
  getAllSchools,
  getSchoolBySIG,
  createSchool,
  deleteSchool,
  updateSchool,
  getRoles,
  checkSchool,
  cdde,
} from "../controllers/school.controller.js";
import {
  verificarAutenticacion,
  permitirRoles,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", verificarAutenticacion, permitirRoles("sudo"), getAllSchools);

router.get(
  "/:SIG",
  verificarAutenticacion,
  permitirRoles("sudo"),
  getSchoolBySIG,
);
router.post("/", verificarAutenticacion, permitirRoles("sudo"), createSchool);

router.delete(
  "/:SIG",
  verificarAutenticacion,
  permitirRoles("sudo"),
  deleteSchool,
);
router.put("/", verificarAutenticacion, permitirRoles("sudo"), updateSchool);

router.get(
  "/roles/roles",
  verificarAutenticacion,
  permitirRoles("sudo"),
  getRoles,
);

router.put("/", verificarAutenticacion, permitirRoles("sudo"), updateSchool);

router.get("/check/:subdomain", checkSchool);

router.get("/cdde/cdde", verificarAutenticacion, permitirRoles("sudo"), cdde);

export default router;
