import express from "express";
import {
  createUser,
  getUsers,
  changePassword,
  deleteUser,
  updateUser,
  getProfile,
  userSchool,
} from "../controllers/user.controller.js";
import {
  verificarAutenticacion,
  permitirRoles,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", verificarAutenticacion, permitirRoles("sudo"), getUsers);

router.post(
  "/",
  verificarAutenticacion,
  permitirRoles("sudo", "administrador", "director", "gestion"),
  createUser,
);
router.post(
  "/changePassword",
  verificarAutenticacion,
  permitirRoles("sudo", "administrador", "profesor", "estudiante", "director"),
  changePassword,
);
router.delete(
  "/:id/:role_id",
  verificarAutenticacion,
  permitirRoles("sudo"),
  deleteUser,
);
router.put("/", verificarAutenticacion, permitirRoles("sudo"), updateUser);

router.get("/profile", verificarAutenticacion, getProfile);

router.get("/userSchool", /* verificarAutenticacion, */ userSchool);

export default router;
