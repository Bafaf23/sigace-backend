import { Subject } from "../models/Subject.model.js";
import { LapseModel } from "../models/Lapse.model.js";
import { Sections } from "../models/Section.model.js";

/**
 * ==========================================================================
 * 1. REGISTRAR UNA NUEVA MATERIA
 * ==========================================================================
 */
export const createSubject = async (req, res) => {
  try {
    console.log("⚠️ [SIGACE API]: Validando creación de asignatura...");
    const { name, year_id } = req.body ?? {};
    const SIG = req.user?.SIG;

    if (!name || !year_id) {
      return res.status(400).json({
        success: false,
        code: "INCOMPLETE_SUBJECT_DATA",
        message:
          "No se pudo procesar: El nombre de la asignatura y el año escolar son obligatorios.",
      });
    }

    const years = await Subject.getYears(SIG);
    const yearSelect = years.find((year) => year.id == year_id);

    if (!yearSelect) {
      console.log(
        `❌ Año escolar con ID [${year_id}] inválido para el SIG: ${SIG}`,
      );
      return res.status(400).json({
        success: false,
        code: "INVALID_YEAR_LEVEL",
        message:
          "El año escolar seleccionado no corresponde a la configuración de esta institución.",
      });
    }

    // Extraer el prefijo (ej: de "1er Año" extrae "1")
    const suffix = String(yearSelect.name).substring(0, 1).toUpperCase();
    const code_suffix = suffix.padStart(2, "0");
    const code_subject = `${name.substring(0, 3).toUpperCase()}-${code_suffix}-${SIG}`;
    const abbreviation = `${name.substring(0, 3).toUpperCase()}`;

    console.log(
      `[SIGACE API]: Código autogenerado consecutivo: ${code_subject}`,
    );

    const subject = new Subject(code_subject, name, abbreviation, year_id, SIG);
    const subjectCreated = await Subject.createSubject(subject);

    if (!subjectCreated) {
      return res.status(400).json({
        success: false,
        code: "SUBJECT_CREATION_FAILED",
        message:
          "No se pudieron guardar los parámetros de la asignatura en el sistema.",
      });
    }

    return res.status(201).json({
      success: true,
      message: `¡Asignatura registrada! "${name}" ha sido dada de alta bajo el código institucional [${code_subject}].`,
    });
  } catch (error) {
    console.error("❌ Error en createSubject:", error);

    if (
      error.code === "ER_DUP_ENTRY" ||
      error.sqlMessage?.includes("Duplicate entry")
    ) {
      return res.status(409).json({
        success: false,
        code: "DUPLICATE_SUBJECT",
        message:
          "Operación cancelada: Ya existe una asignatura con este nombre o código para el año escolar seleccionado.",
      });
    }

    return res.status(500).json({
      success: false,
      code: "CREATE_SUBJECT_INTERNAL_ERROR",
      message:
        "Fallo de infraestructura al procesar el registro de la nueva materia.",
      error: error.message,
    });
  }
};

/**
 * ==========================================================================
 * 2. OBTENER TODAS LAS MATERIAS (CATÁLOGO GENERAL)
 * ==========================================================================
 */
export const getSubjects = async (req, res) => {
  try {
    console.log("⚠️ [SIGACE API]: Extrayendo catálogo de materias...");
    const SIG = req.user?.SIG;

    if (!SIG) {
      return res.status(400).json({
        success: false,
        code: "MISSING_SCHOOL_SIG",
        message:
          "Autenticación ambigua: El identificador SIG de la escuela es requerido.",
      });
    }

    const subjects = await Subject.getSubjects(SIG);

    if (!subjects || subjects.length === 0) {
      return res.status(404).json({
        success: false,
        code: "SUBJECTS_NOT_FOUND",
        message:
          "No se registran asignaturas académicas configuradas en el pensum del plantel.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Plan de estudios y materias recuperados con éxito.",
      data: subjects,
    });
  } catch (error) {
    console.error("❌ Error en getSubjects:", error);
    return res.status(500).json({
      success: false,
      code: "GET_SUBJECTS_INTERNAL_ERROR",
      message:
        "Error de red al intentar sincronizar el catálogo de asignaturas.",
      error: error.message,
    });
  }
};

/**
 * ==========================================================================
 * 3. OBTENER AÑOS ACADÉMICOS CONFIGURADOS
 * ==========================================================================
 */
export const getYears = async (req, res) => {
  try {
    console.log(
      "⚠️ [SIGACE API]: Buscando niveles/años académicos habilitados...",
    );
    const SIG = req.user?.SIG;

    if (!SIG) {
      return res.status(400).json({
        success: false,
        code: "MISSING_SCHOOL_SIG",
        message:
          "Código SIG ausente al solicitar la configuración institucional.",
      });
    }

    const years = await Subject.getYears(SIG);

    if (!years || years.length === 0) {
      return res.status(404).json({
        success: false,
        code: "YEARS_NOT_FOUND",
        message:
          "No se encontraron años o niveles académicos inicializados para este plantel.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Niveles educativos institucionales obtenidos con éxito.",
      data: years,
    });
  } catch (error) {
    console.error("❌ Error en getYears:", error);
    return res.status(500).json({
      success: false,
      code: "GET_YEARS_INTERNAL_ERROR",
      message:
        "Inconveniente del servidor al consultar la estructura de años escolares.",
      error: error.message,
    });
  }
};

/**
 * ==========================================================================
 * 4. OBTENER CARGA ACADÉMICA / NOTAS DE SECCIÓN POR ESTUDIANTE
 * ==========================================================================
 */
export const getSubjectBySection = async (req, res) => {
  try {
    console.log(
      `⚠️ [SIGACE API]: Consolidando carga y plan evaluativo del estudiante...`,
    );
    const { id } = req.params;
    const SIG = req.user?.SIG;
    const id_period = req.user?.id_period;

    if (!id || !SIG) {
      return res.status(400).json({
        success: false,
        code: "MISSING_ACADEMIC_PARAMS",
        message:
          "Es requerido suministrar el identificador del estudiante y las credenciales del plantel.",
      });
    }

    const lapses = await LapseModel.getLapses(SIG, id_period);
    const lapseActive = lapses.find((lapse) => lapse.is_active == 1);

    if (!lapseActive) {
      return res.status(404).json({
        success: false,
        code: "ACTIVE_LAPSE_NOT_FOUND",
        message:
          "Calendario escolar inactivo: No existe ningún lapso académico abierto para procesar notas.",
      });
    }

    const getSection = await Sections.getSectionByStudent(SIG, id, id_period);


    if (!getSection) {
      return res.status(404).json({
        success: false,
        code: "STUDENT_WITHOUT_SECTION",
        message:
          "El estudiante seleccionado no se encuentra asignado a ninguna sección en este período.",
      });
    }

    const subjectSections = await Subject.getSubjectBySection({
      id_lapse: lapseActive.id,
      id_section: getSection.id_section,
      SIG: SIG,
      id_student: getSection.student_id,
    });

    if (!subjectSections || subjectSections.length === 0) {
      return res.status(404).json({
        success: false,
        code: "EMPTY_ACADEMIC_LOAD",
        message:
          "Aulas vacías: No hay materias ni planes de evaluación asignados a la sección del estudiante.",
      });
    }

    const year = subjectSections[0].year_name;
    const section = subjectSections[0].section_name;

    // Cálculo dinámico impecable de promedios
    const cleanSubjects = subjectSections.map((subj) => {
      let finalGradeAccumulator = 0;

      if (subj.evaluations && Array.isArray(subj.evaluations)) {
        subj.evaluations.forEach((evalItem) => {
          if (evalItem.grade !== null && evalItem.grade !== undefined) {
            const grade = parseFloat(evalItem.grade);
            const percentage = parseFloat(evalItem.porcentage);
            finalGradeAccumulator += (grade * percentage) / 100;
          }
        });
      }

      return {
        id: subj.code, // Ideal para Next.js / React keys
        subject_name: subj.subject_name,
        evaluations: subj.evaluations || [],
        final_grade: Math.round(finalGradeAccumulator), // Redondeo legal aproximado para boletines oficiales
      };
    });

    return res.status(200).json({
      success: true,
      message: "Carga académica e historial de corte de notas estructurado.",
      data: {
        year,
        section_id: id_section,
        section,
        subjects: cleanSubjects,
      },
    });
  } catch (error) {
    console.error("❌ Error crítico en getSubjectBySection:", error);
    return res.status(500).json({
      success: false,
      code: "ACADEMIC_LOAD_INTERNAL_ERROR",
      message:
        "Inconsistencia interna al calcular el rendimiento de las asignaturas.",
      error: error.message,
    });
  }
};

/**
 * ==========================================================================
 * 5. ELIMINAR UNA ASIGNATURA
 * ==========================================================================
 */
export const deleteSubjects = async (req, res) => {
  try {
    console.log(`⚠️ [SIGACE API]: Ejecutando baja de asignatura...`);
    const { code_subject } = req.params;
    const SIG = req.user?.SIG;

    if (!code_subject) {
      return res.status(400).json({
        success: false,
        code: "MISSING_DELETE_SUBJECT_CODE",
        message:
          "No se especificó el código de la asignatura que se desea purgar.",
      });
    }

    const del = await Subject.deleteSubjects(code_subject, SIG);

    if (del === false) {
      return res.status(404).json({
        success: false,
        code: "SUBJECT_ALREADY_DELETED",
        message:
          "La asignatura solicitada no existe o ya fue removida previamente del sistema.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "La asignatura fue retirada del pensum de estudios de la institución con éxito.",
    });
  } catch (error) {
    console.error("❌ Error en deleteSubjects:", error);
    return res.status(500).json({
      success: false,
      code: "DELETE_SUBJECT_INTERNAL_ERROR",
      message:
        "Seguridad del sistema: No se puede eliminar la materia debido a que posee calificaciones de estudiantes vinculadas.",
      error: error.message,
    });
  }
};

/**
 * ==========================================================================
 * 6. Obtiene las materias pendietes de un estudiante
 * ==========================================================================
 */
export const getSubjectPending = async (req, res) => {
  try {
    console.log(
      `⚠️ [SIGACE API]: Ejecutando obtiencion de asignatura pendientes...`,
    );
    const { id_student } = req.params;

    if (!id_student) {
      return res.status(400).json({
        success: false,
        code: "MISSING_DELETE_SUBJECT_CODE",
        message: "No se especificó el ID del estudiante.",
      });
    }

    const pending = await Subject.getPendingSubject(id_student);

    if (!pending) {
      return res.status(404).json({
        success: false,
        code: "SUBJECT_ALREADY_DELETED",
        message: "Este estudante no tiene materia pendientes.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        pending,
      },
    });
  } catch (error) {
    console.error("❌ Error en getSubejctPending:", error);
    return res.status(500).json({
      success: false,
      code: "DELETE_SUBJECT_INTERNAL_ERROR",
      message:
        "Error en el servidor, no se pudo estraer la informacion, intenta nuevamente.",
      error: error.message,
    });
  }
};
