import express from "express";
import dotenv from "dotenv";
import userRouter from "./routers/user.route.js";
import cors from "cors";
import authRouter from "./routers/auth.route.js";
dotenv.config();
const app = express();
app.use(express.json());
app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use("/usuarios", userRouter);
app.use("/auth", authRouter);
const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Escuchando en el puerto http://localhost:${port}`);
});
//# sourceMappingURL=app.js.map