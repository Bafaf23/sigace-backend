import { Router } from "express";
import { login, logout } from "../controllers/auth.controller.js";
import type { Request, Response } from "express";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res
    .status(200)
    .json({
      version: "1.0.0",
      message: "API de autenticación de la aplicación SIG",
    });
});

router.post("/login", login);

router.post("/logout", logout);
export default router;
