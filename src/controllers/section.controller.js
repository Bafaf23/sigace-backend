import { Enrollments } from "../models/Enrollments.model.js";
import { Sections } from "../models/Section.model.js";
import { Students } from "../models/Students.model.js";
import logger from "../utils/logger.js";
import { getCurrentPeriod } from "../utils/periodAc.js";

export const createSection = async (req, res) => {
  try {
    const SIG = req.user.SIG;
    const id_year = req.body.yearId;
    const name = req.body.name;
    const guide_id = req.body.teacherId;
    const capacity = req.body.capacity;
    const id_period = req.body.id_period;

    if (!name || !SIG || !id_year || !guide_id || !capacity || !id_period) {
      logger.error("❌ Parámetros obligatorios incompletos.");
      return res.status(400).json({
        success: false,
        code: "INCOMPLETE_SECTION_DATA",
        message:
          "No se pudo procesar: Todos los campos del formulario (Año, Letra/Nombre, Docente Guía y Capacidad) son estrictamente requeridos.",
      });
    }

    logger.info("🔄 Registrando sección en la base de datos...");
    const section = await Sections.createSection({
      name,
      SIG,
      id_period,
      id_year,
      guide_id,
      capacity,
    });

    if (!section) {
      return res.status(400).json({
        success: false,
        code: "SECTION_PERSISTENCE_FAILED",
        message:
          "La estructura de los datos no es válida para inicializar la sección en el plantel.",
      });
    }

    console.log("✅ Sección creada exitosamente");
    return res.status(201).json({
      success: true,
      message: `¡Sección configurada con éxito! El aula de "${name.toUpperCase()}" ha sido habilitada para el período lectivo actual.`,
    });
  } catch (error) {
    console.error("❌ Error en createSection:", error);

    // 💡 Captura inteligente de duplicados (Ej: Intentar registrar dos veces 5to Año Sección "A")
    if (
      error.code === "ER_DUP_ENTRY" ||
      error.sqlMessage?.includes("Duplicate entry")
    ) {
      return res.status(409).json({
        success: false,
        code: "DUPLICATE_SECTION",
        message: `Operación cancelada: Ya existe una sección registrada con ese nombre/letra para el año escolar seleccionado.`,
      });
    }

    return res.status(500).json({
      success: false,
      code: "CREATE_SECTION_INTERNAL_ERROR",
      message:
        "Ocurrió un contratiempo interno en el servidor al intentar abrir la nueva sección.",
      error: error.message,
    });
  }
};

export const getSections = async (req, res) => {
  try {
    const SIG = req.user.SIG;
    const id_period = req.user.id_period;

    if (!SIG || !id_period) {
      logger.error("Código institucional o ID de período ausente");
      return res.status(400).json({
        success: false,
        code: "MISSING_QUERY_PARAMETERS",
        message:
          "Es necesario indicar el código SIG de la institución y el período escolar activo para consultar las secciones.",
      });
    }

    const sections = await Sections.getSections(SIG, id_period);

    if (sections.length === 0) {
      logger.debug("No hay secciones en este perido academico");
      return res.status(200).json({
        success: false,
        message: "No hay secciones academicas en este perido.",
      });
    }
    logger.info(
      `✅ Secciones localizadas con éxito. Cantidad: ${sections?.length}`,
    );
    return res.status(200).json({
      success: true,
      message: "Distribución de secciones académicas recuperada con éxito.",
      data: sections,
    });
  } catch (error) {
    console.error("❌ Error en getSections:", error);
    return res.status(500).json({
      success: false,
      code: "FETCH_SECTIONS_INTERNAL_ERROR",
      message:
        "No se pudo sincronizar el listado de secciones en este momento debido a un fallo de red interno.",
      error: error.message,
    });
  }
};

/**
 * Obtiene a los estudiantes de una seccion
 * @async
 * @function getStudentsBySection
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const getStudentsBySection = async (req, res) => {
  const id_section = req.params.id_section;
  const SIG = req.user.SIG;

  if (!id_section) {
    return res.status(400).json({
      success: false,
      code: "MISSING_SECTION_ID",
      message: "El ID identificador de la sección es mandatorio.",
    });
  }

  if (!SIG) {
    return res.status(400).json({
      success: false,
      code: "MISSING_SIG",
      message: "Código institucional no suministrado.",
    });
  }

  try {
    const students = await Students.bySection({ id_section, SIG });

    if (!students || students.length === 0) {
      return res.status(404).json({
        success: false,
        code: "SECTION_EMPTY",
        message:
          "Aula disponible: Esta sección no cuenta con estudiantes inscritos actualmente.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Nómina de estudiantes asignados a la sección recuperada de forma exitosa.",
      data: students,
    });
  } catch (error) {
    console.error("❌ Error en getStudentsBySection:", error);
    return res.status(500).json({
      success: false,
      code: "GET_STUDENTS_SECTION_INTERNAL_ERROR",
      message:
        "Inconveniente en el servidor al intentar leer la nómina de la sección.",
      error: error.message,
    });
  }
};
