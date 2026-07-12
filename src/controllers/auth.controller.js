import { Users } from "../models/Users.model.js";
import { Academic_periods } from "../models/Academin_period.model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jsonwebtoken from "jsonwebtoken";
import { sendResetPasswordEmail } from "../services/resend.service.js";
const { sign } = jsonwebtoken;

/**
 ** Porcesa el login de un usuario
 */
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

    req.session.userId = user.id_user;
    req.session.role = user.role;
    req.session.SIG = user.SIG;
    req.session.id_period = currentPeriodId;

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
      { expiresIn: mustChangePassword ? "15m" : "1h" },
    );

    const cookieOptionsBase = {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // 'none' en producción con HTTPS, 'lax' en local
    };

    res.cookie("auth_token", token, {
      ...cookieOptionsBase,
      httpOnly: true,
      maxAge: mustChangePassword ? 15 * 60 * 1000 : 60 * 60 * 1000,
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

    // 🌟 FORZAR EL GUARDADO en la BD antes de responder al cliente
    req.session.save((err) => {
      if (err) {
        console.error("Error al guardar la sesión en MySQL:", err);
        return res
          .status(500)
          .json({ error: "Error al registrar la sesión en la base de datos" });
      }

      console.log(`✅ Sesión iniciada y guardada en MySQL para: ${user.email}`);
      return res.status(200).json({
        mustChangePassword: false,
        user: {
          id: user.id_user, // Corregido: usabas user.id y arriba tienes user.id_user
          role: user.role,
          id_period: currentPeriodId,
          period: currentPeriodName,
          name: user.name,
          last_name: user.last_name,
        },
      });
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return res
      .status(500)
      .json({ error: "Error interno al iniciar sesión: " + error.message });
  }
};

/**
 ** cierra la sesion del usuario
 */
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

/**
 ** Solicitud de cambio de contraseña por parte del usuario
 */
export const forgotPassword = async (req, res) => {
  console.log("⚠️ Iniciando proceso de restablecimiento de contraseña...");
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "El email es obligatorio" });
    }

    const user = await Users.getUserByEmail(email);

    if (!user) {
      return res.status(400).json({
        success: false,
        code: "USER_NOT_FOUND",
        message:
          "Si el correo electrónico proporcionado está asociado a una cuenta de usuario, se enviará un correo electrónico con instrucciones para restablecer la contraseña.",
      });
    }
    const code = crypto.randomBytes(32).toString("hex");
    const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

    const tokenId = await Users.saveToken(
      user.id_user,
      hashedCode,
      new Date(Date.now() + 15 * 60 * 1000),
    );

    const resetUrl = `${process.env.URL_FRONTEND}/resetpass?token=${code}`;

    if (!tokenId) {
      return res.status(500).json({
        success: false,
        code: "TOKEN_SAVE_ERROR",
        message: "Error al guardar el token de cambio de contraseña.",
      });
    }

    await sendResetPasswordEmail(user.name, user.email, resetUrl).catch(
      (error) => {
        console.error(
          "Error al enviar el correo de restablecimiento de contraseña:",
          error,
        );
      },
    );

    return res.status(200).json({
      success: true,
      code: "RESET_PASSWORD_CODE_SENT",
      message:
        "Si el correo electrónico proporcionado está asociado a una cuenta de usuario, se enviará un correo electrónico con instrucciones para restablecer la contraseña.",
    });
  } catch (error) {
    console.error(error);
  }
};

/**
 ** Cambio de contraseña via link de email
 */
export const resetPassword = async (req, res) => {
  console.log("⚠️ Iniciando proceso de restablecimiento de contraseña...");
  try {
    const { token, password } = req.body;
    console.log(token, password);

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        code: "TOKEN_AND_PASS_REQUERID",
        message: "El token y la contraseña son requeridos.",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await Users.getUserToken(hashedToken);
    console.log(user);

    if (!user) {
      return res.status(400).json({
        success: false,
        code: "USER_NOT_FOUND",
        message:
          "El enlace es inválido o ha expirado. Por favor, solicita uno nuevo.",
      });
    }
    const changePassword = await Users.changePassword(user.id_user, password);
    console.log(changePassword);

    if (changePassword === false) {
      return res.status(400).json({
        success: false,
        code: "PASSWORD_CHANGE_FAILED", // Cambiado para que tenga coherencia con el error
        message: "No pudimos cambiar la Contraseña, intenta nuevamente.",
      });
    }

    return res.status(200).json({
      success: true,
      code: "CHANGE_SUCCESS",
      message:
        "Contraseña restablecida correctamente. Ya puedes iniciar sesión.",
    });
  } catch (error) {
    console.error("Error en resetPassword:", error);
    // 3. Recomendación: Devolver un estado 500 si la base de datos se cae o algo crashea
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "Hubo un error interno en el servidor.",
    });
  }
};
