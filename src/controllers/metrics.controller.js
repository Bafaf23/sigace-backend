import { Users } from "../models/Users.model.js";
import { School } from "../models/School.model.js";
import { Services } from "../models/Services.model.js";
import logger from "../utils/logger.js";

export const sudoMetrics = async (req, res) => {
  try {
    logger.info("Iniciando calculo de metricas...");
    const countUser = await Users.count();
    const countSchool = await School.count();
    const countServices = await Services.count();
    logger.info("Exito, metricas cargadas con exito.");
    return res.status(202).json({
      totalUser: countUser,
      totalSchool: countSchool,
      totalServices: countServices
    });
  } catch (error) {
    logger.error(error);
  }
};
