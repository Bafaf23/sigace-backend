import { Users } from "../models/Users.model.js";
import { Academic_periods } from "../models/Academin_period.model.js";
import bcrypt from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";

const { sign } = jsonwebtoken;

export const login = async (req, res) => {
  try {
    console.log("⚠️ Iniciando proceso de login...");
    const { email, password } = req.body;

    // 1. Validaciones básicas de entrada
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "El email y la contraseña son obligatorios" });
    }

    // 2. Buscar usuario
    const user = await Users.getUserByEmail(email);

    if (!user) {
      console.log(`usuario no encontrado`);
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    // 3. Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // 4. Circuito de seguridad: Restricción por Período Académico Inactivo
    if (user.role !== "Administrador" && user.role !== "SuperAdmin") {
      const isSystemOpen = await Academic_periods.hasActivePeriod(user.SIG);

      if (!isSystemOpen) {
        console.log(
          `⚠️ Intento de acceso bloqueado para ${user.email}. Sistema cerrado sin período activo.`,
        );
        return res.status(403).json({
          success: false,
          message:
            "El sistema se encuentra temporalmente cerrado. No hay un período académico activo en este momento. Por favor, contacte al administrador.",
        });
      }
    }

    // 🌟 5. CORREGIDO: Carga del período dinámico (Tratamiento como Array)
    const periodsList = await Academic_periods.getAcademicPeriods(user.SIG);

    // Buscamos el que verdaderamente está corriendo en la institución
    const activePeriod = Array.isArray(periodsList)
      ? periodsList.find((p) => p.is_active === 1)
      : null;

    const currentPeriodId = activePeriod ? activePeriod.id : null;
    const currentPeriodName = activePeriod
      ? activePeriod.name
      : "Sin Periodo Activo";

    const mustChangePassword = user.is_first_login === 1;

    // 6. Generación del JWT Token
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

    // 7. Preparación de la sesión en memoria
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
      id_period: currentPeriodId, // Ahora sí guardará el ID correcto (Ej: 9)
      period: currentPeriodName, // Ahora sí guardará el String correcto (Ej: "2026-2027")
    };

    // 8. Persistencia de la sesión de Express
    return new Promise((resolve) => {
      req.session.save((err) => {
        if (err) {
          console.error("Error al guardar la sesión:", err);
          return resolve(
            res.status(500).json({ error: "Error al establecer la sesión" }),
          );
        }

        if (mustChangePassword) {
          console.log(
            `⚠️ Primer login detectado. Redireccionando cambio de clave: ${user.email}`,
          );
          return resolve(
            res.status(200).json({
              mustChangePassword: true,
              user: {
                token: token,
                id: user.id,
                id_user: user.id_user,
                email: user.email,
                role: user.role,
                mustChangePassword: true,
              },
            }),
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
      .json({ error: "Error interno al iniciar sesión: " + error.message });
  }
};

export const logout = async (req, res) => {
  try {
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
        console.log(
          `🔒 Sesión cerrada correctamente para: ${emailUsuario || "Usuario no identificado"}`,
        );

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
