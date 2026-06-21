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

    console.log(user);

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

    // 5. Carga del periodo académico (Orden descendente)
    const periodsList = await Academic_periods.getAcademicPeriods(user.SIG);

    let activePeriod = Array.isArray(periodsList)
      ? periodsList.find((p) => p.is_active === 1)
      : null;

    if (
      !activePeriod &&
      (user.role === "Administrador" || user.role === "SuperAdmin")
    ) {
      if (Array.isArray(periodsList) && periodsList.length > 0) {
        activePeriod = periodsList[0];
        console.log(
          `⚠️ Admin sin periodo activo. Asignando último periodo creado de la lista: ${activePeriod.name}`,
        );
      }
    }

    const currentPeriodId = activePeriod ? activePeriod.id : null;
    const currentPeriodName = activePeriod
      ? activePeriod.name
      : "Sin Periodo Activo";
    const mustChangePassword = user.is_first_login === 1;

    // 🌟 CORREGIDO: 6. Generación del JWT Token (Subido de posición en el flujo)
    const token = sign(
      {
        email: user.email,
        id: user.id_user,
        id_user: user.id_user,
        role: user.role,
        SIG: user.SIG,
        id_period: currentPeriodId,
        mustChangePassword,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: mustChangePassword ? "15m" : "1h",
      },
    );

    // 🌟 CORREGIDO: 7. Establecimiento de las Cookies (Ahora la variable 'token' ya existe)
    const cookieOptionsBase = {
      secure: process.env.NODE_ENV === "production", // true en producción (HTTPS)
      sameSite: "lax",
    };

    res.cookie("auth_token", token, {
      ...cookieOptionsBase,
      httpOnly: true,
      maxAge: mustChangePassword ? 15 * 60 * 1000 : 60 * 60 * 1000, // 15m o 1h
    });

    res.cookie("user_name", encodeURIComponent(user.name), {
      ...cookieOptionsBase,
      httpOnly: false,
      maxAge: mustChangePassword ? 15 * 60 * 1000 : 60 * 60 * 1000,
    });

    if (mustChangePassword) {
      console.log(
        `⚠️ Primer login detectado. Redireccionando cambio de clave: ${user.email}`,
      );
      return res.status(200).json({
        mustChangePassword: true,
        user: {
          id: user.id_user,
          email: user.email,
          role: user.role,
          mustChangePassword: true,
        },
      });
    }

    console.log(
      `✅ Sesión iniciada y cookies establecidas para: ${user.email}`,
    );
    return res.status(200).json({
      mustChangePassword: false,
      user: {
        id: user.id,
        role: user.role,
        id_period: currentPeriodId,
        period: currentPeriodName,
        name: user.name,
        last_name: user.last_name,
      },
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
    res.clearCookie("auth_token");
    res.clearCookie("user_name");
    res.clearCookie("connect.sid");

    console.log(`🔒 Cookies de sesión limpiadas correctamente.`);
    return res.status(200).json({ message: "Sesión cerrada correctamente" });
  } catch (error) {
    console.error("Error en el proceso de logout:", error);
    return res.status(500).json({ error: "Error interno al cerrar sesión" });
  }
};
