import { Academic_periods } from "../models/Academin_period.model.js";
import { Enrollments } from "../models/Enrollments.model.js";
import logger from "../utils/logger.js";

/**
 * Obtiene los peridos de una escuela
 *
 * @async
 * @function getAcademicPeriods
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const createAcademicPeriod = async (req, res) => {
  try {
    const body = req.body || {};
    const namePeriod = body.namePeriod;
    const dateStart = body.dateStart || body.dateStard;
    const dateEnd = body.dateEnd;
    const SIG = req.user?.SIG;

    if (!namePeriod || !dateStart || !dateEnd) {
      logger.debug(
        "Sin infromarcion para realizar el proceso de inicio de periodo",
      );
      return res.status(400).json({
        success: false,
        code: "INCOMPLETE_PERIOD_DATA",
        message:
          "No se puede procesar: El nombre del período, la fecha de inicio y de cierre son obligatorios.",
      });
    }

    const periods = await Academic_periods.getAcademicPeriods(SIG);
    const periodActive = periods.find((item) => item.is_active === 1);

    if (periodActive) {
      logger.error("Ya existe un periodo activo en esta escuela");
      return res.status(400).json({
        success: false,
        code: "ACTIVE_PERIOD_EXISTS",
        message: `Restricción de calendario: Ya se encuentra en curso el período académico "${periodActive.name}".`,
      });
    }

    const academicPeriod = await Academic_periods.createAcademicPeriod({
      name: namePeriod,
      start_date: new Date(dateStart),
      end_date: new Date(dateEnd),
      SIG: SIG,
      is_active: true,
    });

    const migrateStudent = await Enrollments.activateNewPeriod(academicPeriod);

    return res.status(201).json({
      success: true,
      code: "ACADEMIC_PERIOD_CREATED",
      message: `¡Ciclo escolar inicializado! El período "${namePeriod}" ha sido dado de alta en el sistema.`,
      data: { academicPeriod, migrateStudent },
    });
  } catch (error) {
    console.error("❌ Error en createAcademicPeriod:", error);
    return res.status(500).json({
      success: false,
      code: "CREATE_PERIOD_INTERNAL_ERROR",
      message:
        "Fallo técnico al registrar el nuevo ciclo lectivo en la base de datos.",
      error: error.message,
    });
  }
};

/**
 * Finaliza un periodo academico
 *
 * @async
 * @function endAcademicPeriod
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const endAcademicPeriod = async (req, res) => {
  try {
    const SIG = req.user?.SIG;

    if (!SIG) {
      logger.error("No se sincornizo el SIG del colegio en el usuario");
      return res.status(400).json({
        success: false,
        code: "MISSING_SCHOOL_SIG",
        message: "Código SIG de la institución ausente en la sesión.",
      });
    }

    const currentPeriod = await Academic_periods.getAcademicPeriods(SIG);

    const currentPeriodActive = currentPeriod.find(
      (item) => item.is_active === 1,
    );

    if (!currentPeriodActive || !currentPeriodActive.id) {
      logger.error("Sin perido escolar activo, revirtiendo proceso");
      return res.status(404).json({
        success: false,
        code: "NO_ACTIVE_PERIOD_TO_CLOSE",
        message:
          "Operación cancelada: No se detectó ningún período académico activo susceptible a cierre.",
      });
    }

    // Consolida los estados de aprobación/reprobación antes de romper el ciclo
    Enrollments.processFinalStates(currentPeriodActive.id);

    const academicPeriod = await Academic_periods.endAcademicPeriod(SIG);

    logger.debug(`✅ Período finalizado y estados de estudiantes archivados.`);

    return res.status(200).json({
      success: true,
      code: "ACADEMIC_PERIOD_CLOSED",
      message: `El período académico "${currentPeriodActive.name}" ha sido clausurado correctamente. Rendimientos de matrícula archivados en el histórico.`,
      data: academicPeriod,
    });
  } catch (error) {
    console.error("❌ Error en endAcademicPeriod:", error);
    return res.status(500).json({
      success: false,
      code: "END_PERIOD_INTERNAL_ERROR",
      message:
        "Inconveniente crítico de persistencia al intentar compilar las actas y congelar el período.",
      error: error.message,
    });
  }
};

/**
 * Obtiene los peridos de una escuela
 *
 * @async
 * @function getAcademicPeriods
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const getAcademicPeriods = async (req, res) => {
  try {
    const SIG = req.user?.SIG;

    if (!SIG) {
      logger.debug("Codigo SIG aunsente");
      return res.status(400).json({
        success: false,
        code: "MISSING_SCHOOL_SIG",
        message: "No se puede procesar: Código de institución SIG inválido.",
      });
    }

    logger.debug("Buscando... en", { SIG: SIG });
    const academicPeriods = await Academic_periods.getAcademicPeriods(SIG);

    if (!academicPeriods || academicPeriods.length === 0) {
      logger.debug("No hay peridos en esta escuela");
      return res.status(404).json({
        success: false,
        code: "ACADEMIC_PERIODS_EMPTY",
        message:
          "La institución no registra ningún histórico de períodos académicos activos o pasados.",
      });
    }

    const periodActive = academicPeriods.find(
      (item) => item.is_active === true,
    );

    return res.status(200).json({
      success: true,
      code: "ACADEMIC_PERIODS_FETCHED",
      message: "Línea de tiempo de períodos escolares recuperada.",
      data: {
        active: periodActive || null,
        history: academicPeriods,
      },
    });
  } catch (error) {
    console.error("❌ Error en getAcademicPeriods:", error);
    return res.status(500).json({
      success: false,
      code: "GET_PERIODS_INTERNAL_ERROR",
      message: "Fallo de red al solicitar los ciclos del calendario escolar.",
      error: error.message,
    });
  }
};
