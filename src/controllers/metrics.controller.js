import { School } from "../models/School.model.js";
import { Sections } from "../models/Section.model.js";
import { Services } from "../models/Services.model.js";
import { Students } from "../models/Students.model.js";
import { Subject } from "../models/Subject.model.js";
import { Teachers } from "../models/Teachers.model.js";
import { Users } from "../models/Users.model.js";
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
      totalServices: countServices,
    });
  } catch (error) {
    logger.error(error);
  }
};

export const admiMetrics = async (req, res) => {
  try {
    const SIG = req.user.SIG;
    const periodId = Number(req.user.id_period);
    logger.info("calcualando metricas...");
    const [studentsRes, teachersRes, subjectsRes, sectionRes] =
      await Promise.all([
        Students.count(SIG),
        Teachers.count(SIG),
        Subject.count(SIG),
        Sections.count(SIG, periodId),
      ]);

    logger.info("Ok, metics admin");
    return res.status(200).json({
      students: studentsRes,
      teachers: teachersRes,
      sections: sectionRes,
      subject: subjectsRes,
    });
  } catch (error) {
    console.error(error);
  }
};
