import { Academic_periods } from "../models/Academin_period.model.js";
import { Enrollments } from "../models/Enrollments.model.js";

/**
 * ==========================================================================
 * 1. APERTURA DE UN NUEVO PERÍODO ACADÉMICO
 * ==========================================================================
 */
export const createAcademicPeriod = async (req, res) => {
  try {
    console.log(
      `⚠️ [SIGACE API]: Validando apertura de nuevo ciclo escolar...`,
    );

    const body = req.body || {};
    const namePeriod = body.namePeriod;
    const dateStart = body.dateStart || body.dateStard; // Tolerancia a typos del cliente
    const dateEnd = body.dateEnd;
    const SIG = req.user?.SIG;

    if (!namePeriod || !dateStart || !dateEnd) {
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
      console.log(
        `⚠️ Operación rechazada: Ya existe el ciclo activo [${periodActive.name}]`,
      );
      return res.status(400).json({
        success: false,
        code: "ACTIVE_PERIOD_EXISTS",
        message: `Restricción de calendario: Ya se encuentra en curso el período académico "${periodActive.name}".`,
      });
    }

    const academicPeriod = await Academic_periods.createAcademicPeriod({
      name: namePeriod,
      start_date: dateStart,
      end_date: dateEnd,
      SIG,
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
 * ==========================================================================
 * 2. CIERRE DE PERÍODO ACADÉMICO Y PROCESAMIENTO DE HISTÓRICOS
 * ==========================================================================
 */
export const endAcademicPeriod = async (req, res) => {
  try {
    console.log(
      `⚠️ [SIGACE API]: Iniciando protocolo de clausura de período lectivo...`,
    );
    const SIG = req.user?.SIG;

    if (!SIG) {
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
      return res.status(404).json({
        success: false,
        code: "NO_ACTIVE_PERIOD_TO_CLOSE",
        message:
          "Operación cancelada: No se detectó ningún período académico activo susceptible a cierre.",
      });
    }

    console.log(
      `📊 [SIGACE CORE]: Ejecutando proceso batch de rendimientos finales para el Período ID: ${currentPeriodActive.id}...`,
    );
    // Consolida los estados de aprobación/reprobación antes de romper el ciclo
    Enrollments.processFinalStates(currentPeriodActive.id);

    const academicPeriod = await Academic_periods.endAcademicPeriod(SIG);

    console.log(
      `✅ [SIGACE API]: Período finalizado y estados de estudiantes archivados.`,
    );
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
 * ==========================================================================
 * 3. OBTENER CATÁLOGO GENERAL DE PERÍODOS DE LA INSTITUCIÓN
 * ==========================================================================
 */
export const getAcademicPeriods = async (req, res) => {
  try {
    console.log(
      `⚠️ [SIGACE API]: Extrayendo histórico de períodos académicos...`,
    );
    const SIG = req.user?.SIG;

    if (!SIG) {
      return res.status(400).json({
        success: false,
        code: "MISSING_SCHOOL_SIG",
        message: "No se puede procesar: Código de institución SIG inválido.",
      });
    }

    const academicPeriods = await Academic_periods.getAcademicPeriods(SIG);

    if (!academicPeriods || academicPeriods.length === 0) {
      return res.status(404).json({
        success: false,
        code: "ACADEMIC_PERIODS_EMPTY",
        message:
          "La institución no registra ningún histórico de períodos académicos activos o pasados.",
      });
    }

    const periodActive = academicPeriods.find((item) => item.is_active === 1);

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

/**
 * ==========================================================================
 * 4. HISTORIAL DE INSCRIPCIÓN / PERÍODOS POR ESTUDIANTE
 * ==========================================================================
 */
export const periodStudent = async (req, res) => {
  try {
    const { id_student } = req.params;

    if (!id_student) {
      return res.status(400).json({
        success: false,
        code: "MISSING_STUDENT_ID",
        message:
          "El identificador único del estudiante es estrictamente requerido.",
      });
    }

    console.log(
      `🔄 [SIGACE API]: Extrayendo expediente de matrícula para el Estudiante ID: ${id_student}`,
    );
    const periods =
      await Academic_periods.getPeriodEnrollmentStudent(id_student);

    if (!periods || periods.length === 0) {
      return res.status(404).json({
        success: false,
        code: "STUDENT_MATRICULA_NOT_FOUND",
        message:
          "El estudiante seleccionado no posee trazas de inscripción en ningún año escolar registrado.",
      });
    }

    return res.status(200).json({
      success: true,
      code: "STUDENT_PERIODS_FETCHED",
      message: "Historial de inscripción escolar recuperado con éxito.",
      data: periods,
    });
  } catch (error) {
    console.error("❌ Error crítico en periodStudent:", error);
    return res.status(500).json({
      success: false,
      code: "STUDENT_PERIODS_INTERNAL_ERROR",
      message:
        "Inconsistencia interna al intentar estructurar el expediente cronológico del alumno.",
      error: error.message,
    });
  }
};
