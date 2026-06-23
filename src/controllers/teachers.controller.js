import { Teachers } from "../models/Teachers.model.js";
import { Academic_periods } from "../models/Academin_period.model.js";

/**
 * ==========================================================================
 * 1. OBTENER CATÁLOGO GENERAL DE PROFESORES
 * ==========================================================================
 */
export const getTeachers = async (req, res) => {
  try {
    console.log("🔍 [SIGACE API]: Solicitando nómina de personal docente...");

    const SIG = req.user.SIG;
    const id_period = req.user.id_period;

    if (!SIG) {
      return res.status(400).json({
        success: false,
        code: "MISSING_SCHOOL_SIG",
        message:
          "Identificador institucional ausente. Es obligatorio indicar el código SIG del plantel.",
      });
    }

    let targetPeriodId = id_period;

    if (!targetPeriodId) {
      console.log(
        "📅 [SIGACE API]: Buscando período lectivo activo por defecto...",
      );
      const periods = await Academic_periods.getAcademicPeriods(SIG);

      if (!periods || periods.length === 0) {
        return res.status(404).json({
          success: false,
          code: "ACADEMIC_PERIODS_EMPTY",
          message:
            "No se encontró ningún período académico configurado en el sistema para esta institución.",
        });
      }

      const activePeriod = periods.find((item) => item.is_active === 1);

      if (!activePeriod) {
        return res.status(404).json({
          success: false,
          code: "ACTIVE_PERIOD_NOT_FOUND",
          message:
            "No se localizó ningún período académico activo en este momento.",
        });
      }
      targetPeriodId = activePeriod.id;
    }

    console.log(
      `🔄 [SIGACE API]: Consultando docentes para SIG: ${SIG} | Período: ${targetPeriodId}`,
    );
    const teachers = await Teachers.getAllTeachersWithLoad({ SIG });

    if (!teachers || teachers.length === 0) {
      return res.status(404).json({
        success: false,
        code: "TEACHERS_NOT_FOUND",
        message:
          "Nómina vacía: El plantel no cuenta con profesores registrados para el ciclo escolar.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Nómina del personal docente recuperada con éxito.",
      data: teachers,
    });
  } catch (error) {
    console.error("❌ Error en getTeachers:", error);
    return res.status(500).json({
      success: false,
      code: "GET_TEACHERS_INTERNAL_ERROR",
      message:
        "Ocurrió un contratiempo interno al intentar compilar la lista de docentes.",
      error: error.message,
    });
  }
};

/**
 * ==========================================================================
 * 2. OBTENER CARGA ACADÉMICA / ASIGNATURAS DE UN DOCENTE
 * ==========================================================================
 */
export const getLoadAcademicTeacher = async (req, res) => {
  try {
    console.log("🔍 [SIGACE API]: Extrayendo carga horaria del docente...");

    const SIG = req.user.SIG;
    const id = req.user.id; // ID del docente autenticado en la sesión

    if (!id || !SIG) {
      return res.status(400).json({
        success: false,
        code: "MISSING_TEACHER_PARAMS",
        message:
          "Faltan parámetros obligatorios de sesión (ID de usuario o código SIG) para validar el acceso.",
      });
    }

    const teacherData = await Teachers.getTeacherWithLoadByID(SIG, id);
    console.log("✅ [SIGACE API]: Carga recuperada del modelo.");

    if (!teacherData) {
      return res.status(404).json({
        success: false,
        code: "TEACHER_LOAD_NOT_FOUND",
        message:
          "No se encontró el perfil docente solicitado o carece de asignaciones en el período lectivo actual.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Planificación de carga académica y secciones consolidada.",
      data: teacherData.academic_load || [],
    });
  } catch (error) {
    console.error("❌ Error en getLoadAcademicTeacher:", error);
    return res.status(500).json({
      success: false,
      code: "GET_TEACHER_LOAD_INTERNAL_ERROR",
      message:
        "Fallo del servidor al intentar estructurar el horario y materias asignadas.",
      error: error.message,
    });
  }
};
