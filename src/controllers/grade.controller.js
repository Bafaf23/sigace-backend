import { Grade } from "../models/Grade.model.js";
import logger from "../utils/logger.js";

/**
 ** Carga una nota en la BD
 *
 * @async
 * @function createGrade
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const createGrade = async (req, res) => {
  const { id_evaluation, id_student, grade } = req.body ?? {};

  if (!id_evaluation || !id_student || grade == null) {
    return res.status(400).json({
      success: false,
      code: "INCOMPLETE_GRADE_DATA",
      message:
        "Toda la información (evaluación, estudiante y nota) es estrictamente requerida.",
    });
  }

  const notaNumerica = parseFloat(grade);

  if (isNaN(notaNumerica) || notaNumerica < 0) {
    logger.warn(`Calificacion no válida: ${grade}. No puede ser menor a 0.`);
    return res.status(400).json({
      success: false,
      code: "GRADE_BELOW_MINIMUM",
      message:
        "La calificación introducida no es válida. Debe ser mayor o igual a 0.",
    });
  }

  if (notaNumerica > 20) {
    logger.warn(
      `Calificacion no válida: ${grade}. Excede el límite de 20 puntos.`,
    );
    return res.status(400).json({
      success: false,
      code: "GRADE_EXCEEDS_MAXIMUM",
      message:
        "La calificación no puede ser superior a la escala máxima institucional de 20 puntos.",
    });
  }

  try {
    logger.info(`Cargando la calificacion en el sistema...`);
    const newGrade = await Grade.create({
      id_evaluation,
      id_student,
      grade: notaNumerica,
    });

    if (!newGrade) {
      return res.status(400).json({
        success: false,
        code: "GRADE_PROCESSING_FAILED",
        message:
          "No se pudo procesar el registro de la nota. Verifique que la evaluación y el alumno existan.",
      });
    }

    logger.info("Exito, la calificacion guardada");

    return res.status(201).json({
      success: true,
      code: "GRADE_RECORDED",
      message:
        "La calificación fue asentada exitosamente en el expediente del alumno.",
      data: newGrade,
    });
  } catch (error) {
    console.error("❌ Error en createGrade:", error);
    return res.status(500).json({
      success: false,
      code: "CREATE_GRADE_INTERNAL_ERROR",
      message:
        "Error de infraestructura en el servidor al procesar el registro de la nota.",
      error: error.message,
    });
  }
};

/**
 * Obtiene la sábana de calificaciones registradas para una carga académica específica.
 *
 * @async
 * @function getGradeStudents
 * @param {import("express").Request} req - Objeto de solicitud de Express (recibe id_load_academic en params).
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de calificaciones.
 */
export const getGradeStudents = async (req, res) => {
  const { id_load_academic } = req.params;
  const { id_lapse } = req.query;

  // Validar presencia y formato válido del ID de la carga académica
  if (
    !id_load_academic ||
    id_load_academic === "undefined" ||
    isNaN(Number(id_load_academic))
  ) {
    logger.warn(
      "Petición rechazada: ID de carga académica inválido o ausente.",
    );
    return res.status(400).json({
      success: false,
      code: "MISSING_ACADEMIC_LOAD_ID",
      message:
        "El identificador de la carga académica debe ser un número válido.",
    });
  }

  try {
    const academicLoadId = Number(id_load_academic);

    logger.info(
      `Solicitando sábana de notas para la Carga Académica ID: ${academicLoadId}...`,
    );

    const gradeStudents = await Grade.getBySection(academicLoadId);

    if (!gradeStudents || gradeStudents.length === 0) {
      logger.info(
        `Sin notas registradas para la carga académica ID: ${academicLoadId}`,
      );
      return res.status(200).json({
        success: true,
        code: "NO_GRADES_RECORDED",
        message:
          "No se encontraron calificaciones registradas para esta asignación académica.",
      });
    }

    return res.status(200).json({
      success: true,
      code: "GRADES_FETCHED",
      message: "Listado de calificaciones recuperado con éxito.",
      data: gradeStudents,
    });
  } catch (error) {
    logger.error(`❌ Error en getGradeStudents: ${error.message}`, {
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      code: "GET_GRADES_INTERNAL_ERROR",
      message:
        "Error interno en el servidor al intentar recuperar la sábana de calificaciones.",
      error: error.message,
    });
  }
};
