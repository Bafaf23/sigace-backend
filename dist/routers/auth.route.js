import { Router } from "express";
import { login } from "../controllers/auth.controller.js";
const router = Router();
router.get("/", (_req, res) => {
    res.status(200).json({ message: "API de autenticación" });
});
router.post("/login", login);
export default router;
//# sourceMappingURL=auth.route.js.map