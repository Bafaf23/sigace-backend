import { User } from "../models/User.model.js";
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import type { Session } from "express-session";
const { sign } = jsonwebtoken;

export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "El email y la contraseña son obligatorios" });
    }

    const user = await User.getUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const passwordMatch = await bcrypt.compare(password, user.contraseña);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    const token = sign(
      { email: user.email, id: user.id },
      process.env.JWT_SECRET || "secret",
      {
        expiresIn: "1h",
      },
    );

    req.session.user = {
      token: token,
      id: user.id,
      dni: user.cedula,
      email: user.email,
      name: user.nombre,
      lastName: user.apellido,
      phone: user.numeroDeTelefono,
      role: user.rol,
      SIG: user.SIG,
    };

    return new Promise((resolve) => {
      req.session.save((err) => {
        if (err) {
          console.error("Error al guardar la sesión:", err);
          return resolve(
            res.status(500).json({ error: "Error al establecer la sesión" }),
          );
        }

        console.log(`✅ Sesión iniciada correctamente para: ${user.email}`);
        return resolve(res.status(200).json({ user: req.session.user }));
      });
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return res
      .status(500)
      .json({ error: "Error al iniciar sesión : " + error });
  }
};

export const logout = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    /* if (!req.session || !req.session.user) {
      console.error("No hay ninguna sesión activa");
      return res.status(400).json({ error: "No hay ninguna sesión activa" });
    } */
    console.log("Session ID:", req.sessionID);
    console.log("Session user:", req.session.user);
    const emailUsuario = req.session?.user?.email;

    return new Promise((resolve) => {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error al destruir la sesión:", err);
          return resolve(
            res.status(500).json({ error: "No se pudo cerrar la sesión" }),
          );
        }

        res.clearCookie("connect.sid");

        console.log(`🔒 Sesión cerrada correctamente para: ${emailUsuario}`);
        return resolve(
          res.status(200).json({ message: "Sesión cerrada correctamente" }),
        );
      });
    });
  } catch (error) {
    console.error("Error en el proceso de logout:", error);
    return res.status(500).json({ error: "Error interno al cerrar sesión" });
  }
};
