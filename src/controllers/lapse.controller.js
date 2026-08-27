import { Lapse } from "../models/Lapse.model.js";
import { Academic_periods } from "../models/Academin_period.model.js";
import logger from "../utils/logger.js";

/**
 ** Obtiene todos los laspos o momentos de una escuela. Dichos momentos deben estar registrados por el personla en cargado
 * de la escuela
 *
 * @async
 * @function getLapses
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const getLapses = async (req, res) => {
  try {
    const SIG = req.user?.SIG;
    const id_period = req.user?.id_period;

    /* const SIG = "SIG3728";
    const id_period = 2; */

    logger.info("Bunscando lapso...", { SIG: SIG, id_period: id_period });
    const lapses = await Lapse.getLapses(SIG, id_period);

    if (!lapses || lapses.length === 0) {
      logger.error("No hay Momentos en este colegio");
      return res.status(400).json({
        success: false,
        code: "LAPSES_EMPTY",
        message:
          "No se registran lapsos planificados o creados para este período.",
      });
    }

    return res.status(200).json({
      success: true,
      code: "LAPSES_FETCHED",
      message: "Lapsos recuperados correctamente.",
      data: lapses,
    });
  } catch (error) {
    console.error("❌ Error en getLapses:", error);
    return res.status(500).json({
      success: false,
      code: "GET_LAPSES_INTERNAL_ERROR",
      message: "Error interno en el servidor al obtener el listado de lapsos.",
      error: error.message,
    });
  }
};

/**
 ** Obtiene el Momento academico de un colegio activo
 *
 * @async
 * @function getLapseActive
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const getLapseActive = async (req, res) => {
  try {
    const { SIG, id_period } = req.user ?? {};

    if (!SIG) {
      logger.error("Sin codigo SIG");
      return res.status(400).json({
        success: false,
        code: "MISSING_SCHOOL_SIG",
        message: "El código SIG de la institución es requerido en la sesión.",
      });
    }
    logger.info("🔃 Sincronizano los momentos academicos...");
    const lapses = await Lapse.getLapses(SIG, id_period);
    const lapseActive = lapses?.find((lapse) => lapse.is_active === 1);

    if (!lapseActive) {
      logger.error("Sin Momento activo.");
      return res.status(200).json({
        success: true,
        code: "NO_ACTIVE_LAPSE",
        message: "No hay ningún lapso activo en el período actual.",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      code: "ACTIVE_LAPSE_FETCHED",
      message: "Lapso activo recuperado con éxito.",
      data: lapseActive,
    });
  } catch (error) {
    console.error("❌ Error en getLapseActive:", error);
    return res.status(500).json({
      success: false,
      code: "GET_ACTIVE_LAPSE_INTERNAL_ERROR",
      message: "Error interno del servidor al recuperar el lapso activo.",
      error: error.message,
    });
  }
};

/**
 ** Crea un momento academico
 *
 * @async
 * @function createLapse
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const createLapse = async (req, res) => {
  try {
    const SIG = req.user?.SIG;
    const body = req.body || {};

    const { nameLapse, dateStart, dateEnd } = body;

    if (!SIG) {
      logger.debug("Falta informacion para procesar el lapso", { SIG: SIG });
      return res.status(400).json({
        success: false,
        code: "MISSING_SCHOOL_SIG",
        message: "El código SIG es requerido en las credenciales de sesión.",
      });
    }

    if (!nameLapse || !dateStart || !dateEnd) {
      logger.debug("Falta informacion para procesar el lapso");
      return res.status(400).json({
        success: false,
        code: "INCOMPLETE_LAPSE_DATA",
        message:
          "Todos los campos (nombre, fecha de inicio y de cierre) son requeridos.",
      });
    }

    logger.info("🔃 Creando el momento, espera...");
    const periods = await Academic_periods.getAcademicPeriods(SIG);
    const periodActive = periods?.find((item) => item.is_active === true);

    if (!periodActive) {
      logger.debug("Intento de creación de lapso sin año escolar activo.");
      return res.status(400).json({
        success: false,
        code: "NO_ACTIVE_PERIOD",
        message:
          "No es posible estructurar lapsos porque no existe un año escolar activo actualmente en el plantel.",
      });
    }

    const lapse = await Lapse.createLapses({
      id_period: periodActive.id,
      name: nameLapse,
      start_date: new Date(dateStart),
      end_date: new Date(dateEnd),
      is_active: false,
    });

    return res.status(201).json({
      success: true,
      code: "LAPSE_CREATED",
      message: `El lapso educativo "${nameLapse}" ha sido registrado con éxito de forma planificada.`,
      data: lapse,
    });
  } catch (error) {
    console.error("❌ Error en createLapse:", error);
    return res.status(500).json({
      success: false,
      code: "CREATE_LAPSE_INTERNAL_ERROR",
      message:
        "Error de consistencia en el servidor al intentar registrar el lapso.",
      error: error.message,
    });
  }
};

/**
 ** Culmina el un momento activo
 *
 * @async
 * @function endLapse
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const endLapse = async (req, res) => {
  try {
    const idLapse = req.params.id;

    if (!idLapse) {
      logger.error("Momento no espesificado");
      return res.status(400).json({
        success: false,
        code: "MISSING_LAPSE_ID",
        message:
          "El identificador del lapso específico es requerido para efectuar el cierre.",
      });
    }

    logger.info("🔃 Espere un momento...");
    await Lapse.endLapse(idLapse);

    return res.status(200).json({
      success: true,
      code: "LAPSE_CLOSED",
      message:
        "El lapso académico ha sido cerrado formalmente y las notas asociadas han sido consolidadas.",
    });
  } catch (error) {
    console.error("❌ Error en endLapse:", error);
    return res.status(500).json({
      success: false,
      code: "END_LAPSE_INTERNAL_ERROR",
      message:
        "Ocurrió un error técnico al intentar finalizar el lapso escolar.",
      error: error.message,
    });
  }
};

/**
 ** Inicia un momento academico
 *
 * @async
 * @function startLapse
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const startLapse = async (req, res) => {
  try {
    const { id } = req.params;
    const id_period = req.user.id_period;
    const SIG = req.user.SIG;

    if (!id) {
      logger.error("momento no espesificado");
      return res.status(400).json({
        success: false,
        code: "MISSING_LAPSE_ID",
        message:
          "El identificador del lapso es requerido para iniciar actividades.",
      });
    }

    const lapses = await Lapse.getLapses(SIG, id_period);
    const lapseActive = lapses.find((lapse) => {
      lapse.is_active === true;
    });

    if (!lapseActive) {
      logger.info("🔃 Iniciando el momento...");
      const success = await Lapse.startLapse(id);

      return res.status(200).json({
        success: true,
        code: "LAPSE_STARTED",
        message:
          "El lapso académico ha sido iniciado de forma exitosa. Sistema listo para la recepción de notas.",
      });
    } else {
      logger.error(
        "Conflicto. Intento de inicio con un lapso paralelo activo.",
      );
      return res.status(409).json({
        success: false,
        code: "ACTIVE_LAPSE_CONFLICT",
        message:
          "Conflicto de operaciones: Ya existe un lapso en ejecución. Es obligatorio finalizar el lapso previo para poder aperturar uno nuevo.",
      });
    }
  } catch (error) {
    console.error("❌ Error en startLapse:", error);
    return res.status(500).json({
      success: false,
      code: "START_LAPSE_INTERNAL_ERROR",
      message:
        "Error interno en el servidor al intentar dar inicio al lapso académico.",
      error: error.message,
    });
  }
};
