import { Users } from "../models/Users.model.js";
import { Academic_periods } from "../models/Academin_period.model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jsonwebtoken from "jsonwebtoken";
import { sendResetPasswordEmail } from "../services/resend.service.js";
import logger from "../utils/logger.js";
import { School } from "../models/School.model.js";

const { sign } = jsonwebtoken;

/**
 * Inserta un registro de usuario al sisitema
 *
 * @async
 * @function login
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const login = async (req, res) => {
  const { email, password } = req.body;
  const subdomain = req.subdomain;
  const isProduction = process.env.NODE_ENV === "production";

  if (!email || !password) {
    logger.error("No se proporcionó el usuario ni la contraseña.");
    return res.status(400).json({
      success: false,
      code: "EMPTY_PAYLOAD",
      message: "Los datos de inicio de sesión son obligatorios.",
    });
  }

  try {
    const school = await School.checkSubdomain(String(subdomain));
    const user = await Users.getUserByEmail(email);

    if (!user) {
      logger.debug("No se encontró registro sobre la cuenta consultada", {
        email,
      });
      return res.status(401).json({
        success: false,
        code: "LOGIN_INVALID",
        message:
          "Las credenciales son inválidas, verifícalas e intenta de nuevo.",
      });
    }

    const userId = user.id_user || user.id;
    const roleName = user.role?.name || user.role || "usuario";

    const passwordMatch = await bcrypt.compare(
      password,
      user.pass || user.password,
    );

    if (!passwordMatch) {
      logger.error(
        "Intento de inicio de sesión fallido por contraseña incorrecta",
        {
          email,
          id: userId,
        },
      );
      return res.status(401).json({
        success: false,
        code: "LOGIN_INVALID",
        message:
          "Las credenciales son inválidas, verifícalas e intenta de nuevo.",
      });
    }

    // Extraer SIG con fallbacks seguros para evitar que Prisma reciba null/undefined
    const userSchools = Array.isArray(user.user_schools)
      ? user.user_schools
      : [];
    const SIG = userSchools[0]?.SIG || school?.SIG || "";

    const isAdmin = ["administrador", "sudo", "director"].includes(
      roleName.toLowerCase(),
    );

    // 4. Circuito de seguridad: Verificar si hay sistema abierto solo si existe SIG
    if (!isAdmin && SIG) {
      const isSystemOpen = await Academic_periods.hasActivePeriod(SIG);

      if (!isSystemOpen) {
        logger.warn(
          "Intento de acceso bloqueado: sistema cerrado sin período activo.",
          {
            email: user.email,
            role: roleName,
          },
        );
        return res.status(403).json({
          success: false,
          message:
            "El sistema se encuentra temporalmente cerrado. No hay un período académico activo en este momento. Por favor, contacte al administrador.",
        });
      }
    }

    // Consulta de períodos segura (evita invocar la base de datos si SIG está vacío)
    const periodsList = SIG
      ? await Academic_periods.getAcademicPeriods(SIG)
      : [];

    let activePeriod = Array.isArray(periodsList)
      ? periodsList.find((p) => p.is_active === 1 || p.is_active === true)
      : null;

    if (
      !activePeriod &&
      isAdmin &&
      Array.isArray(periodsList) &&
      periodsList.length > 0
    ) {
      activePeriod = periodsList[0];
      logger.debug(
        `Admin sin período activo. Asignando último período creado: ${activePeriod.name}`,
      );
    }

    const currentPeriodId = activePeriod ? activePeriod.id : null;
    const currentPeriodName = activePeriod
      ? activePeriod.name
      : "Sin Período Activo";
    const mustChangePassword = Boolean(user.is_first_login);

    req.session.userId = userId;
    req.session.role = roleName;
    req.session.SIG = SIG;
    req.session.id_period = currentPeriodId;

    // Generar Token JWT
    const token = sign(
      {
        email: user.email,
        id: userId,
        id_user: userId,
        role: roleName,
        SIG: SIG,
        id_period: currentPeriodId,
        mustChangePassword,
      },
      process.env.JWT_SECRET,
      { expiresIn: mustChangePassword ? "15m" : "1h" },
    );

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      domain: isProduction ? ".sigace.xyz" : undefined,
      maxAge: 7200 * 1000,
      path: "/",
    };

    res.cookie("auth_token", token, cookieOptions);

    if (mustChangePassword) {
      logger.warn(
        `Primer login detectado. Redireccionando a cambio de clave: ${user.email}`,
      );
      return res.status(200).json({
        mustChangePassword: true,
        user: {
          id: userId,
          email: user.email,
          role: roleName,
          mustChangePassword: true,
        },
      });
    }

    req.session.save((err) => {
      if (err) {
        console.error("Error al guardar la sesión en MySQL:", err);
        return res
          .status(500)
          .json({ error: "Error al registrar la sesión en la base de datos" });
      }

      logger.debug(
        `Sesión iniciada para: ${user.name} ${user.last_name}, ${user.email}`,
      );

      return res.status(200).json({
        mustChangePassword: false,
        user: {
          id: userId,
          role: roleName,
          id_period: currentPeriodId,
          period: currentPeriodName,
          name: user.name,
          last_name: user.last_name,
        },
      });
    });
  } catch (error) {
    console.error("❌ Error en controller login:", error);
    return res
      .status(500)
      .json({ error: "Error interno al iniciar sesión: " + error.message });
  }
};

/**
 * Cerrar sesión de usuario
 */
export const logout = async (req, res) => {
  try {
    res.clearCookie("auth_token");
    res.clearCookie("connect.sid");

    return res.status(200).json({ message: "Sesión cerrada correctamente" });
  } catch (error) {
    console.error("❌ Error en el proceso de logout:", error);
    return res.status(500).json({ error: "Error interno al cerrar sesión" });
  }
};

/**
 * Solicitud de cambio de contraseña por email
 */
export const forgotPassword = async (req, res) => {
  console.log("⚠️ Iniciando proceso de restablecimiento de contraseña...");
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "El email es obligatorio" });
    }

    const user = await Users.getUserByEmail(email);

    // Mensaje genérico de seguridad
    const successResponse = {
      success: true,
      code: "RESET_PASSWORD_CODE_SENT",
      message:
        "Si el correo electrónico proporcionado está asociado a una cuenta de usuario, se enviarán las instrucciones para restablecer la contraseña.",
    };

    if (!user) {
      return res.status(200).json(successResponse);
    }

    const userId = user.id_user || user.id;
    const code = crypto.randomBytes(32).toString("hex");
    const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

    const tokenId = await Users.saveToken(
      userId,
      hashedCode,
      new Date(Date.now() + 15 * 60 * 1000),
    );

    if (!tokenId) {
      return res.status(500).json({
        success: false,
        code: "TOKEN_SAVE_ERROR",
        message: "Error al guardar el token de cambio de contraseña.",
      });
    }

    const resetUrl = `${process.env.URL_FRONTEND}/resetpass?token=${code}`;

    await sendResetPasswordEmail(user.name, user.email, resetUrl).catch(
      (error) => {
        console.error(
          "❌ Error al enviar el correo de restablecimiento de contraseña:",
          error,
        );
      },
    );

    return res.status(200).json(successResponse);
  } catch (error) {
    console.error("❌ Error en forgotPassword:", error);
    // Corrección: responder 500 para evitar peticiones colgadas
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "Error interno en el servidor al procesar la solicitud.",
    });
  }
};

/**
 * Cambio de contraseña vía token de email
 */
export const resetPassword = async (req, res) => {
  console.log("⚠️ Iniciando proceso de restablecimiento de contraseña...");
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        code: "TOKEN_AND_PASS_REQUIRED",
        message: "El token y la contraseña son requeridos.",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await Users.getUserToken(hashedToken);

    if (!user) {
      return res.status(400).json({
        success: false,
        code: "INVALID_OR_EXPIRED_TOKEN",
        message:
          "El enlace es inválido o ha expirado. Por favor, solicita uno nuevo.",
      });
    }

    const userId = user.id_user || user.id;
    const changePassword = await Users.changePassword(userId, password);

    if (!changePassword) {
      return res.status(400).json({
        success: false,
        code: "PASSWORD_CHANGE_FAILED",
        message: "No pudimos cambiar la contraseña, intenta nuevamente.",
      });
    }

    return res.status(200).json({
      success: true,
      code: "CHANGE_SUCCESS",
      message:
        "Contraseña restablecida correctamente. Ya puedes iniciar sesión.",
    });
  } catch (error) {
    console.error("❌ Error en resetPassword:", error);
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "Hubo un error interno en el servidor.",
    });
  }
};
