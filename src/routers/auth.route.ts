import { Router } from "express";
import { login, logout } from "../controllers/auth.controller.js";
import type { Request, Response } from "express";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    name: "SIGACE API - Auth",
    description: "API para la autenticación del sistema SIGACE.",
    version: "1.0.0",
    environment: "production",
    status: "operational",
    links: {
      login: `/login`,
      logout: `/logout`,
    },
  });
});

router.post("/login", login);

router.post("/logout", logout);
export default router;
