import express from "express";
const router = express.Router();
router.get("/", (_req, res) => {
    res.status(200).json({ message: "Endpoint de usuarios" });
});
router.post("/", (_req, res) => {
    res.status(200).json({ message: "Endpoint para crear un usuario" });
});
export default router;
//# sourceMappingURL=user.router.js.map