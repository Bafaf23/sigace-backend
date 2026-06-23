import { LapseModel } from "../models/Lapse.model.js";
import { Academic_periods } from "../models/Academin_period.model.js";

/**
 * ==========================================================================
 * 1. OBTENER TODOS LOS LAPSOS DEL PERÍODO LECTIVO
 * ==========================================================================
 */
export const getLapses = async (req, res) => {
  try {
    console.log(
      `🔍 [SIGACE API]: Solicitando el histórico de lapsos del período...`,
    );
    const { SIG, id_period } = req.user ?? {};

    const lapses = await LapseModel.getLapses(SIG, id_period);

    if (!lapses || lapses.length === 0) {
      return res.status(204).json({
        success: true,
        code: "LAPSES_EMPTY",
        message:
          "No se registran lapsos planificados o creados para este período.",
        data: [],
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
 * ==========================================================================
 * 2. OBTENER EL LAPSO ACTIVO ACTUAL
 * ==========================================================================
 */
export const getLapseActive = async (req, res) => {
  try {
    console.log(`🔍 [SIGACE API]: Consultando lapso en curso...`);
    const { SIG, id_period } = req.user ?? {};

    if (!SIG) {
      return res.status(400).json({
        success: false,
        code: "MISSING_SCHOOL_SIG",
        message: "El código SIG de la institución es requerido en la sesión.",
      });
    }

    const lapses = await LapseModel.getLapses(SIG, id_period);
    const lapseActive = lapses?.find((lapse) => lapse.is_active === 1);

    if (!lapseActive) {
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
 * ==========================================================================
 * 3. PLANIFICAR / CREAR UN NUEVO LAPSO
 * ==========================================================================
 */
export const createLapse = async (req, res) => {
  try {
    console.log(`⚠️ [SIGACE API]: Registrando nueva planificación de lapso...`);
    const SIG = req.user?.SIG;

    const body = req.body || {};
    const { nameLapse, dateStart, dateEnd } = body;

    if (!SIG) {
      return res.status(400).json({
        success: false,
        code: "MISSING_SCHOOL_SIG",
        message: "El código SIG es requerido en las credenciales de sesión.",
      });
    }

    if (!nameLapse || !dateStart || !dateEnd) {
      return res.status(400).json({
        success: false,
        code: "INCOMPLETE_LAPSE_DATA",
        message:
          "Todos los campos (nombre, fecha de inicio y de cierre) son requeridos.",
      });
    }

    const periods = await Academic_periods.getAcademicPeriods(SIG);
    const periodActive = periods?.find((item) => item.is_active === 1);

    if (!periodActive) {
      console.log(
        `⚠️ [SIGACE API]: Intento de creación de lapso sin año escolar activo.`,
      );
      return res.status(400).json({
        success: false,
        code: "NO_ACTIVE_PERIOD",
        message:
          "No es posible estructurar lapsos porque no existe un año escolar activo actualmente en el plantel.",
      });
    }

    const lapse = await LapseModel.createLapses({
      id_period: periodActive.id,
      name: nameLapse,
      start_date: dateStart,
      end_date: dateEnd,
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
 * ==========================================================================
 * 4. CLAUSURAR / FINALIZAR LAPSO DOCENTE
 * ==========================================================================
 */
export const endLapse = async (req, res) => {
  try {
    console.log(`⚠️ [SIGACE API]: Clausurando actividades del lapso...`);
    const idLapse = req.params.id;

    if (!idLapse) {
      return res.status(400).json({
        success: false,
        code: "MISSING_LAPSE_ID",
        message:
          "El identificador del lapso específico es requerido para efectuar el cierre.",
      });
    }

    await LapseModel.endLapse(idLapse);

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
 * ==========================================================================
 * 5. APERTURAR / APUNTAR LAPSO EN EJECUCIÓN (CON VALIDADOR DE CONCURRENCIA)
 * ==========================================================================
 */
export const startLapse = async (req, res) => {
  try {
    console.log(
      `⚠️ [SIGACE API]: Abriendo período de carga de actividades del lapso...`,
    );
    const { id } = req.params;
    const id_period = req.user?.id_period;

    if (!id) {
      return res.status(400).json({
        success: false,
        code: "MISSING_LAPSE_ID",
        message:
          "El identificador del lapso es requerido para iniciar actividades.",
      });
    }

    const success = await LapseModel.startLapse(id, id_period);

    if (success) {
      return res.status(200).json({
        success: true,
        code: "LAPSE_STARTED",
        message:
          "El lapso académico ha sido iniciado de forma exitosa. Sistema listo para la recepción de notas.",
      });
    } else {
      console.log(
        `⚠️ [SIGACE API]: Conflicto. Intento de inicio con un lapso paralelo activo.`,
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
