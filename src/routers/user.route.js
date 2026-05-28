import express from "express";
import {
  createUser,
  getUsers,
  changePassword,
  deleteUser,
  updateUser,
} from "../controllers/user.controller.js";

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
router.get("/getUser", getUsers);
router.post("/createUser", createUser);
router.post("/changePassword", changePassword);
router.delete("/deleteUser/:id", deleteUser);
router.put("/updateUser", updateUser);

export default router;
