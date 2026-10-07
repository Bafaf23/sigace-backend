import { Students } from "../models/Students.model.js";
import { Users } from "../models/Users.model.js";
import logger from "../utils/logger.js";
import { regex, patterns } from "../utils/regex.js";
import jwt from "jsonwebtoken";

const isProduction = process.env.NODE_ENV === "production";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const verifyOTP = async (req, res) => {
  const { OTP, tuitionNumber } = req.body;

  if (!OTP && !tuitionNumber) {
    logger.warn("El codigo OTP esta vacio.");
    return res.status(400).json({
      success: false,
      message: "El codigo OTP no puede estar vacío, verifica.",
    });
  }

  if (!regex(patterns.otp, OTP.trim())) {
    logger.error(
      "El codigo OTP ingresado no cumple con el estandar del sistema. Verificalo",
    );
    return res.status(400).json({
      success: false,
      message: "Verifica el codígo e intanta de nuevo",
    });
  }

  if (!regex(patterns.numberText, tuitionNumber.trim())) {
    logger.error("El formato de la matricula es incorrecto");
    return res.status(400).json({
      success: false,
      message: "Ocurrio un error con tu numero de matricula, verificala.",
    });
  }

  try {
    logger.info("Verificando OTP...");
    const OTPSave = await Users.getToken({ token: OTP });

    const user = await Students.byID({ tuitionNumber });
    if (!OTPSave) {
      logger.warn("No exite un codigo OTP registrado.");
      return res.status(400).json({
        success: false,
        message: "El codigo ingresado es incorrecto.",
      });
    }

    const hour = new Date();
    if (hour > OTPSave.expires_at) {
      logger.warn("El codigo ya expiro");
      return res.status(400).json({
        success: false,
        message: "El código OTP ha expirado. Solicita uno nuevo.",
      });
    }

    if (OTP !== OTPSave.token) {
      logger.error("El codigo OTP no coincide");
      return res.status(400).json({
        success: false,
        message: "El codigo ingresado es incorrecto.",
      });
    }

    
    const tokenAcceso = jwt.sign(
      {
        name: user.user.name,
        id_user: user.user.id,
        id: user.id,
        SIG: user.school.SIG,
        role: user.user.role?.name?.toLowerCase(),
        tuitionNumber: tuitionNumber,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8m" },
    );

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      domain: isProduction ? ".sigace.xyz" : undefined,
      maxAge: 7200 * 1000,
      path: "/",
    };

    res.cookie("consult_token", tokenAcceso, cookieOptions);

    return res.status(200).json({
      message: "Verificación exitosa",
    });
    
  } catch (error) {
    logger.error("Error al verificar OTP", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Ocurrio un error al verificar el codigo OTP.",
    });
  }
};
