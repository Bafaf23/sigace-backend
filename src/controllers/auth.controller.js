import { Users } from "../models/Users.model.js";
import bcrypt from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";

const { sign } = jsonwebtoken;

export const login = async (req, res) => {
  try {
    console.log("⚠️ Iniciando proceso de login...");
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "El email y la contraseña son obligatorios" });
    }

    const user = await Users.getUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    const mustChangePassword = user.is_first_login === 1;

    const token = sign(
      {
        email: user.email,
        id: user.id,
        id_user: user.id_user,
        role: user.role,
        mustChangePassword,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: mustChangePassword ? "15m" : "1h",
      },
    );

    req.session.user = {
      token: token,
      id: user.id,
      id_user: user.id_user,
      dni: user.document,
      email: user.email,
      name: user.name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
      SIG: user.SIG,
      period: user.period,
    };

    if (mustChangePassword) {
      const userSession = {
        token: token,
        id: user.id,
        id_user: user.id_user,
        email: user.email,
        role: user.role,
        mustChangePassword: true,
      };

      return new Promise((resolve) => {
        req.session.save((err) => {
          if (err) {
            console.error("Error al guardar la sesión:", err);
            return resolve(
              res.status(500).json({ error: "Error al establecer la sesión" }),
            );
          }

          console.log(
            `⚠️ Primer login detectado. Redireccionando cambio de clave: ${user.email}`,
          );
          return resolve(
            res.status(200).json({
              mustChangePassword: true,
              user: userSession,
            }),
          );
        });
      });
    }

    return new Promise((resolve) => {
      req.session.save((err) => {
        if (err) {
          console.error("Error al guardar la sesión:", err);
          return resolve(
            res.status(500).json({ error: "Error al establecer la sesión" }),
          );
        }

        console.log(`✅ Sesión iniciada correctamente para: ${user.email}`);
        return resolve(
          res.status(200).json({
            mustChangePassword: false,
            user: req.session.user,
          }),
        );
      });
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return res
      .status(500)
      .json({ error: "Error al iniciar sesión : " + error });
  }
};
export const logout = async (req, res) => {
  try {
    /* if (!req.session || !req.session.user) {
      console.error("No hay ninguna sesión activa");
      return res.status(400).json({ error: "No hay ninguna sesión activa" });
    } */
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
