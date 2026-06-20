import express from "express";
import {
  createUser,
  getUsers,
  changePassword,
  deleteUser,
  updateUser,
  getProfile,
} from "../controllers/user.controller.js";
import {
  verificarAutenticacion,
  permitirRoles,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    name: "SIGACE API - Users",
    description: "API para la gestión de usuarios del sistema SIGACE.",
    version: "1.0.0",
    environment: "production",
    status: "operational",
    links: {
      getUsers: `/getUser`,
      createUser: `/createUser`,
      changePassword: `/changePassword`,
      deleteUser: `/deleteUser/:id`,
      updateUser: `/updateUser`,
    },
  });
});
router.get(
  "/getUser",
  verificarAutenticacion,
  permitirRoles("SuperAdmin"),
  getUsers,
);
router.post(
  "/createUser",
  verificarAutenticacion,
  permitirRoles("SuperAdmin"),
  createUser,
);
router.post(
  "/changePassword",
  verificarAutenticacion,
  permitirRoles("SuperAdmin", "Administrador", "Profesor", "Estudiante"),
  changePassword,
);
router.delete(
  "/deleteUser/:id",
  verificarAutenticacion,
  permitirRoles("SuperAdmin"),
  deleteUser,
);
router.put(
  "/updateUser",
  verificarAutenticacion,
  permitirRoles("SuperAdmin"),
  updateUser,
);

router.get("/profile", verificarAutenticacion, getProfile)

export default router;
