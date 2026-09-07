import { Enrollments } from "../models/Enrollments.model.js";
import { Sections } from "../models/Section.model.js";
import { Students } from "../models/Students.model.js";
import logger from "../utils/logger.js";
import { getCurrentPeriod } from "../utils/periodAc.js";

export const createSection = async (req, res) => {
  const SIG = /* req.user.SIG */ "SIG3728";
  const id_year = req.body.yearId;
  const name = req.body.name;
  const guide_id = req.body.teacherId;
  const capacity = req.body.capacity;
  const id_period = req.body.id_period;

  if (!name || !SIG || !id_year || !guide_id || !capacity || !id_period) {
    logger.error("Parámetros obligatorios incompletos.");
    return res.status(400).json({
      success: false,
      code: "INCOMPLETE_SECTION_DATA",
      message:
        "No se pudo procesar: Todos los campos del formulario (Año, Letra/Nombre, Docente Guía y Capacidad) son estrictamente requeridos.",
    });
  }

  try {
    logger.info("Registrando sección en la base de datos...");
    const section = await Sections.create({
      name,
      SIG,
      id_period,
      id_year,
      guide_id,
      capacity,
    });

    if (!section) {
      logger.info("No se puedo registar la seccion", { section: section });
      return res.status(400).json({
        success: false,
        code: "SECTION_PERSISTENCE_FAILED",
        message:
          "La estructura de los datos no es válida para inicializar la sección en el plantel.",
      });
    }

    logger.info("Exito, las secion fue registrada");
    return res.status(201).json({
      success: true,
      message: `¡Sección configurada con éxito! El aula de "${name.toUpperCase()}" ha sido habilitada para el período lectivo actual.`,
    });
  } catch (error) {
    console.error("❌ Error en createSection:", error);

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

/**
 ** Obtiene todas las secciones de un colegio
 *
 * @async
 * @function getSections
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const getSections = async (req, res) => {
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
  try {
    logger.info("Sincronizando las secciones para", { SIG: SIG });
    const sectionsList = await Sections.get(SIG, id_period);

    if (sectionsList.length === 0) {
      logger.debug("No hay secciones en este perido academico");
      return res.status(200).json({
        success: false,
        message: "No hay secciones academicas en este perido.",
      });
    }

    logger.info(
      `Secciones localizadas con éxito. Cantidad: ${sectionsList?.length}`,
    );

    if (process.env.NODE_DEV !== "production") {
      console.table(sectionsList);
    }

    return res.status(200).json({
      success: true,
      message: "Distribución de secciones académicas recuperada con éxito.",
      data: sectionsList,
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
 * Obtiene a todos los estudiantes de una seccion
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
    logger.info("El id de la seccion es requerido", { id_section });
    return res.status(400).json({
      success: false,
      code: "MISSING_SECTION_ID",
      message: "El ID identificador de la sección es mandatorio.",
    });
  }

  if (!SIG) {
    logger.info("El SIG es requerido", { SIG });
    return res.status(400).json({
      success: false,
      code: "MISSING_SIG",
      message: "Código institucional no suministrado.",
    });
  }

  try {
    logger.info("Sincronizando la informcaion de la seccion...");
    const section = await Sections.getStudent({ id_section, SIG });

    if (!section || section.length === 0) {
      logger.info("No hay estudiantes en esta seccion o la seccion no exite");
      return res.status(404).json({
        success: false,
        code: "SECTION_EMPTY",
        message:
          "Aula disponible: Esta sección no cuenta con estudiantes inscritos actualmente.",
      });
    }

    logger.info("Exito, se cargo la informacion de la seccion.", {
      section: `${section.name} ${section.nomenclature}`,
      students: section.students.length,
    });

    return res.status(200).json({
      success: true,
      message:
        "Estudiantes asignados a la sección recuperada de forma exitosa.",
      data: section,
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
