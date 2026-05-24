import { User } from "../models/User.model.js";
import bcrypt from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
const { sign } = jsonwebtoken;
export const login = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({ error: "No se proporcionaron datos" });
        }
        const user = await User.getUserByEmail(req.body.email);
        if (!user) {
            return res.status(401).json({ error: "Usuario no encontrado" });
        }
        const passwordMatch = await bcrypt.compare(req.body.password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: "Contraseña incorrecta" });
        }
        const token = sign({ email: user.email }, process.env.JWT_SECRET || "secret", {
            expiresIn: "1h",
        });
        console.log(`Se inicio sesión correctamente para el usuario: ${user.email}`);
        return res.status(200).json({ token: token });
    }
    catch (error) {
        console.error("Error al iniciar sesión:", error);
        return res
            .status(500)
            .json({ error: "Error al iniciar sesión : " + error });
    }
};
//# sourceMappingURL=auth.controller.js.map