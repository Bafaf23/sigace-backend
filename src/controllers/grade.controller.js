import { Grade } from "../models/Grade.model.js";

/**
 * ==========================================================================
 * 1. REGISTRAR O ACTUALIZAR CALIFICACIÓN (ESCALA 0 - 20)
 * ==========================================================================
 */
export const createGrade = async (req, res) => {
  try {
    console.log(`⚠️ [SIGACE API]: Procesando carga de calificación...`);
    const { id_evaluation, id_student, grade } = req.body ?? {};

    // 1. Validar campos requeridos (permitiendo explícitamente que grade sea 0)
    if (!id_evaluation || !id_student || grade == null) {
      return res.status(400).json({
        success: false,
        code: "INCOMPLETE_GRADE_DATA",
        message:
          "Toda la información (evaluación, estudiante y nota) es estrictamente requerida.",
      });
    }

    const notaNumerica = parseFloat(grade);

    // 2. Validación de rangos oficiales en la escala de calificaciones (0 a 20)
    if (isNaN(notaNumerica) || notaNumerica < 0) {
      console.log(
        `❌ [SIGACE API]: Nota no válida: ${grade}. No puede ser menor a 0.`,
      );
      return res.status(400).json({
        success: false,
        code: "GRADE_BELOW_MINIMUM",
        message:
          "La calificación introducida no es válida. Debe ser mayor o igual a 0.",
      });
    }

    if (notaNumerica > 20) {
      console.log(
        `❌ [SIGACE API]: Nota no válida: ${grade}. Excede el límite de 20 puntos.`,
      );
      return res.status(400).json({
        success: false,
        code: "GRADE_EXCEEDS_MAXIMUM",
        message:
          "La calificación no puede ser superior a la escala máxima institucional de 20 puntos.",
      });
    }

    // Proceder a guardar en el modelo de forma segura
    const note = await Grade.createGrade({
      id_evaluation,
      id_student,
      grade: notaNumerica,
    });

    if (note) {
      return res.status(201).json({
        success: true,
        code: "GRADE_RECORDED",
        message:
          "La calificación fue asentada exitosamente en el expediente del alumno.",
        data: note,
      });
    }

    return res.status(400).json({
      success: false,
      code: "GRADE_PROCESSING_FAILED",
      message:
        "No se pudo procesar el registro de la nota. Verifique que la evaluación y el alumno existan.",
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
 * ==========================================================================
 * 2. OBTENER CALIFICACIONES CONSOLIDADAS POR CARGA ACADÉMICA
 * ==========================================================================
 */
export const getGradeStudents = async (req, res) => {
  try {
    const { id_load_academic } = req.params;

    console.log(
      `🔍 [SIGACE API]: Solicitando sábana de notas para la Carga Académica ID: ${id_load_academic}...`,
    );

    if (!id_load_academic || id_load_academic === "undefined") {
      return res.status(400).json({
        success: false,
        code: "MISSING_ACADEMIC_LOAD_ID",
        message:
          "El identificador de la carga académica es requerido para consultar las notas.",
      });
    }

    const gradeStudent = await Grade.getGradeStudent(id_load_academic);

    if (!gradeStudent || gradeStudent.length === 0) {
      console.log(`⚠️ [SIGACE API]: Carga académica sin notas registradas.`);
      return res.status(200).json({
        success: true,
        code: "NO_GRADES_RECORDED",
        message:
          "No se encontraron calificaciones registradas en el sistema para esta asignación académica.",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      code: "GRADES_FETCHED",
      message: "Listado de calificaciones recuperado con éxito.",
      data: gradeStudent,
    });
  } catch (error) {
    console.error(`❌ Error en getGradeStudents: ${error}`);
    return res.status(500).json({
      success: false,
      code: "GET_GRADES_INTERNAL_ERROR",
      message:
        "Error interno en el servidor al intentar recuperar la sábana de calificaciones.",
      error: error.message,
    });
  }
};
