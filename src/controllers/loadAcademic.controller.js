import { LoadAcademic } from "../models/LoadAcademic.model.js";
import logger from "../utils/logger.js";

/**
 ** Crea una nueva carga academica de un colegio
 *
 * @async
 * @function createLoadAcademic
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const createLoadAcademic = async (req, res) => {
  const { teacherId, sectionId, id_period, subjectId } = req.body ?? {};
  const SIG = req.user?.SIG;

  if (!teacherId || !sectionId || !id_period || !subjectId || !SIG) {
    logger.info("Faltan parámetros obligatorios para la carga académica.");
    return res.status(400).json({
      success: false,
      code: "INCOMPLETE_ACADEMIC_LOAD_DATA",
      message:
        "Todos los campos (Profesor, Sección, Período y Materia) son estrictamente requeridos.",
    });
  }
  try {
    const loadAcademicData = {
      id_teacher: teacherId,
      SIG: SIG,
      id_section: sectionId,
      id_period: id_period,
      id_subject: subjectId,
      created_at: new Date(),
    };

    logger.info("Registrando carga académica en la base de datos...");
    const result = await LoadAcademic.create(loadAcademicData);

    if (result) {
      logger.info("Carga académica creada correctamente.", { SIG: SIG });
      return res.status(201).json({
        success: true,
        code: "ACADEMIC_LOAD_CREATED",
        message:
          "Asignación de carga académica registrada correctamente en el sistema.",
        data: result,
      });
    }

    return res.status(400).json({
      success: false,
      code: "ACADEMIC_LOAD_FAILED",
      message:
        "No se pudo consolidar la asignación académica. Verifique los datos de origen.",
    });
  } catch (error) {
    logger.error("Error en createLoadAcademic:", { error: error });

    if (
      error.code === "ER_DUP_ENTRY" ||
      error.sqlMessage?.includes("Duplicate entry")
    ) {
      return res.status(409).json({
        success: false,
        code: "DUPLICATE_ACADEMIC_LOAD",
        message:
          "Operación rechazada: La asignatura seleccionada ya se encuentra asignada a un docente en esa sección para el período actual.",
      });
    }

    return res.status(500).json({
      success: false,
      code: "CREATE_LOAD_INTERNAL_ERROR",
      message:
        "Ocurrió un problema interno en el servidor al intentar registrar la carga académica.",
      error: error.message,
    });
  }
};

/**
 * Obtiene toda la cargas academica de una escuela espesificando su codigo SIG
 *
 * @async
 * @function getLoadAcademic
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const getLoadAcademic = async (req, res) => {
  const SIG = /* req.user?.SIG */ "SIG3728";

  if (!SIG) {
    return res.status(400).json({
      success: false,
      code: "MISSING_SCHOOL_SIG",
      message:
        "El identificador SIG de la institución es requerido para consultar la carga académica.",
    });
  }

  try {
    logger.info("Buscando datos, por favor espere...");
    const result = await LoadAcademic.get(SIG);

    if (result.length == 0) {
      logger.info("NO se encontro carga academica para", { SIG: SIG });
      return res.status(404).json({
        success: false,
        code: "ACADEMIC_LOAD_FETCHED",
        message: "Actualmente no tienes carga academica.",
      });
    }

    logger.info("Exito, los datos cargados");
    return res.status(200).json({
      success: true,
      code: "ACADEMIC_LOAD_FETCHED",
      message: "Listado de carga académica obtenido con éxito.",
      data: result,
    });
  } catch (error) {
    console.error("❌ Error en getLoadAcademic:", error);
    return res.status(500).json({
      success: false,
      code: "GET_LOAD_INTERNAL_ERROR",
      message:
        "Error interno en el servidor al intentar recuperar los registros de carga académica.",
      error: error.message,
    });
  }
};
