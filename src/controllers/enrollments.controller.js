import { Enrollments } from "../models/Enrollments.model.js";

/**
 * ==========================================================================
 * 1. REGISTRAR UNA NUEVA INSCRIPCIÓN / MATRÍCULA
 * ==========================================================================
 */
export const createEnrollment = async (req, res) => {
  try {
    console.log(
      "⚠️ [SIGACE API]: Iniciando proceso de matriculación estudiantil...",
    );
    const { id_student, id_period, id_section, status } = req.body ?? {};

    if (!id_student || !id_period || !id_section || !status) {
      console.log("❌ [SIGACE API]: Parámetros de inscripción incompletos.");
      return res.status(400).json({
        success: false,
        code: "INCOMPLETE_ENROLLMENT_DATA",
        message:
          "No se pudo procesar la matrícula: El alumno, período, sección y estado son obligatorios.",
      });
    }

    const enrollmentData = { id_student, id_period, id_section, status };
    console.log(
      `🔄 [SIGACE API]: Asignando estudiante [${id_student}] a la sección [${id_section}]...`,
    );

    const result = await Enrollments.createEnrollment(enrollmentData);

    if (result > 0) {
      console.log(
        "✅ [SIGACE API]: Matrícula formalizada en la base de datos.",
      );
      return res.status(201).json({
        success: true,
        code: "ENROLLMENT_CREATED",
        message:
          "El estudiante ha sido inscrito y asignado a su sección de forma exitosa.",
      });
    }

    return res.status(400).json({
      success: false,
      code: "ENROLLMENT_FAILED",
      message:
        "No se pudo procesar la inscripción. Verifique que el alumno no esté ya matriculado en este ciclo.",
    });
  } catch (error) {
    console.error("❌ Error crítico en createEnrollment:", error);
    return res.status(500).json({
      success: false,
      code: "CREATE_ENROLLMENT_INTERNAL_ERROR",
      message:
        "Fallo de infraestructura al asentar el registro de matrícula en el sistema.",
      error: error.message,
    });
  }
};

/**
 * ==========================================================================
 * 2. OBTENER ALUMNOS APROBADOS LISTOS PARA PROMOCIÓN
 * ==========================================================================
 */
export const getApprovedStudents = async (req, res) => {
  try {
    console.log(
      "🔍 [SIGACE API]: Consultando alumnos aptos para promoción de nivel...",
    );
    const { id_period } = req.query;

    if (!id_period) {
      return res.status(400).json({
        success: false,
        code: "MISSING_PERIOD_ID",
        message:
          "El identificador del período académico es requerido para filtrar los aprobados.",
      });
    }

    console.log(
      `🔄 [SIGACE API]: Analizando rendimiento acumulado para el Período ID: ${id_period}`,
    );
    const studentApproved =
      await Enrollments.getApprovedForPromotion(id_period);
    if (!studentApproved || studentApproved.length === 0) {
      return res.status(200).json({
        success: true,
        code: "NO_APPROVED_STUDENTS_FOUND",
        message:
          "No se registran estudiantes aprobados listos para promoción en el período seleccionado.",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      code: "APPROVED_STUDENTS_FETCHED",
      message:
        "Listado de alumnos aprobados consolidado para el proceso de promoción.",
      data: studentApproved,
    });
  } catch (error) {
    console.error("❌ Error en getApprovedStudents:", error);
    return res.status(500).json({
      success: false,
      code: "GET_APPROVED_INTERNAL_ERROR",
      message:
        "Contratiempo interno en el servidor al intentar auditar los alumnos promovidos.",
      error: error.message,
    });
  }
};

/**
 * ==========================================================================
 * 3. PROCESAR CIERRE ACADÉMICO Y PROMOCIÓN MASIVA
 * ==========================================================================
 * Recibe el período actual, calcula el rendimiento final de los alumnos,
 * registra materias pendientes y los deja pre-inscritos (id_next_year)
 * con estatus 'Culminado' en el año viejo.
 */
export const processStartStates = async (req, res) => {
  const id_period_actual = req.user.id_period || req.params;

  if (!id_period_actual) {
    return res.status(400).json({
      success: false,
      message:
        "El ID del período académico actual es obligatorio para procesar el cierre.",
    });
  }

  try {
    const proccessed = await Enrollments.processStartStates(id_period_actual);

    if (proccessed === false) {
      return res.status(200).json({
        success: false,
        message:
          "No se encontraron estudiantes en estatus 'Activo' para procesar en este período.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "¡Cierre académico completado con éxito! Los estudiantes elegibles han sido promovidos y las materias pendientes fueron registradas.",
    });
  } catch (error) {
    console.error("❌ Error en el controlador processStartStates:", error);

    return res.status(500).json({
      success: false,
      message:
        "Fallo crítico en el servidor al intentar procesar las promociones masivas.",
      error: error.message,
    });
  }
};
