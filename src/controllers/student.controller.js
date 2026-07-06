import { Students } from "../models/Students.model.js";
import { Representative } from "../models/Representative.model.js";
import { Users } from "../models/Users.model.js";
import { generateTuitionNumber } from "../utils/tuitoinNumber.js";
import { welcomeEmail } from "../services/resend.service.js";
import { Academic_periods } from "../models/Academin_period.model.js";

function formatText(text) {
  if (typeof text !== "string") return text;
  const cleanText = text.replace(/\s+/g, "").toLowerCase();
  if (cleanText.length === 0) return "";

  const regexPermitido = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/;
  if (!regexPermitido.test(cleanText)) {
    console.warn("⚠️ El texto contiene caracteres no permitidos.");
    return null;
  }
  return cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
}

/* ==========================================================================
   1. OBTENER TODOS LOS ESTUDIANTES
   ========================================================================== */
export const getStudents = async (req, res) => {
  try {
    console.log(
      "⚠️ [SIGACE API]: Solicitando catálogo general de estudiantes...",
    );
    const SIG = req.user.SIG;
    const id_period = req.user.id_period;

    if (!SIG) {
      return res.status(400).json({
        success: false,
        code: "MISSING_SCHOOL_SIG",
        message:
          "Identificador institucional ausente. Es obligatorio indicar el SIG del plantel.",
      });
    }

    let targetPeriodId = id_period;

    if (!targetPeriodId) {
      const periods = await Academic_periods.getAcademicPeriods(SIG);
      const activePeriod = periods.find((item) => item.is_active === 1);

      if (!activePeriod) {
        return res.status(404).json({
          success: false,
          code: "ACTIVE_PERIOD_NOT_FOUND",
          message:
            "No se localizó ningún período académico activo para esta institución educativa.",
        });
      }
      targetPeriodId = activePeriod.id;
    }

    const students = await Students.getAllStudents({
      SIG: SIG,
      id_period: Number(targetPeriodId),
    });

    if (!students || students.length === 0) {
      return res.status(404).json({
        success: false,
        code: "STUDENTS_NOT_FOUND",
        message:
          "No se encontraron estudiantes matriculados en esta institución para el período consultado.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Matrícula general de estudiantes recuperada con éxito.",
      data: students,
    });
  } catch (error) {
    console.error("❌ Error en getStudents:", error);
    return res.status(500).json({
      success: false,
      code: "GET_STUDENTS_INTERNAL_ERROR",
      message:
        "Contratiempo técnico al intentar procesar la lista de estudiantes.",
      error: error.message,
    });
  }
};

/* ==========================================================================
   2. INSCRIBIR / CREAR ESTUDIANTE
   ========================================================================== */
export const createStudent = async (req, res) => {
  try {
    console.log("🟢 [SIGACE API]: Evaluando planilla de inscripción...");

    // Evitar caídas por llamadas a .trim() en valores undefined/null
    const safeTrim = (val) => (typeof val === "string" ? val.trim() : "");

    const studentObject = {
      SIG: req.user?.SIG,
      document: `${req.body.documentType || ""}${req.body.document || ""}`,
      name: formatText(req.body.name),
      last_name: formatText(req.body.lastName),
      phone: req.body.phone,
      representative_id: req.body.representative_id,
      gender: safeTrim(req.body.gender),
      role_id: req.body.role_id || 2,
      email: safeTrim(req.body.email),
      birth_date: safeTrim(req.body.birthDate),
      isNewEntry: req.body.isNewEntry,
      previousSchool: safeTrim(req.body.previousSchool),
      previousSchoolCode: safeTrim(req.body.previousSchoolCode),
      previousYear: safeTrim(req.body.previousYear),
      previousSection: safeTrim(req.body.previousSection),
      allergies: safeTrim(req.body.allergies),
      medical_condition: safeTrim(req.body.medicalCondition),
      weight: req.body.weight,
      height: req.body.height,
      shirt_size: req.body.shirtSize,
      pants_size: req.body.pantSize,
      shoe_size: req.body.shoeSize,
      year_id: req.body.year,
      id_section: req.body.section,
      id_period: req.user?.id_period,
    };

    const representativeObject = {
      document: `${req.body.repdniType || ""}${req.body.repdni || ""}`,
      name: formatText(req.body.repName),
      last_name: formatText(req.body.repLastName),
      phone: req.body.repPhone,
      relationship: safeTrim(req.body.relationship),
      repEmail: safeTrim(req.body.repEmail),
    };

    if (!req.body.repdni || !req.body.repName || !req.body.repLastName) {
      return res.status(400).json({
        success: false,
        code: "INCOMPLETE_REPRESENTATIVE_DATA",
        message:
          "Faltan datos obligatorios: Es necesario registrar la cédula, nombre y apellido del representante legal.",
      });
    }

    const representativeId =
      await Representative.createRepresentative(representativeObject);

    if (!representativeId) {
      return res.status(400).json({
        success: false,
        code: "REPRESENTATIVE_CREATION_FAILED",
        message:
          "No se pudo consolidar el registro del representante legal en el sistema.",
      });
    }

    const passgeneric = studentObject.document.substring(0, 4) + "@2026";
    const tuitionNumber = await generateTuitionNumber(studentObject.SIG);

    if (!tuitionNumber) {
      return res.status(400).json({
        success: false,
        code: "TUITION_GENERATION_FAILED",
        message:
          "Fallo crítico de secuencia: No se pudo generar un número de matrícula único para el estudiante.",
      });
    }

    const userId = await Users.createUser({
      ...studentObject,
      password: passgeneric,
      representative_id: representativeId,
      tuition_number: tuitionNumber,
      status: "Nuevo Ingreso",
    });

    if (!userId) {
      return res.status(400).json({
        success: false,
        code: "USER_CREATION_FAILED",
        message:
          "Error de credenciales: No se pudo instanciar la cuenta de acceso del estudiante.",
      });
    }
    //cambia el correo por el del usuario en producion
    await welcomeEmail(studentObject.name, "bryantffacen@gmail.com").catch(
      (error) => {
        console.error(error);
      },
    );

    return res.status(201).json({
      success: true,
      message: `¡Inscripción formalizada exitosamente! Matrícula asignada: ${tuitionNumber}.`,
    });
  } catch (error) {
    console.error("❌ Error en createStudent:", error);
    return res.status(500).json({
      success: false,
      code: "CREATE_STUDENT_INTERNAL_ERROR",
      message: "Fallo interno al procesar el expediente de matrícula.",
      error: error.message,
    });
  }
};

/* ==========================================================================
   3. ACTUALIZAR ESTUDIANTE
   ========================================================================== */
export const updateStudent = async (req, res) => {
  try {
    console.log(
      "⚠️ [SIGACE API]: Sincronizando modificaciones de estudiante...",
    );

    const userUpdateObject = {
      document: req.body.document,
      name: formatText(req.body.name),
      last_name: formatText(req.body.lastName),
      email:
        typeof req.body.email === "string"
          ? req.body.email.trim()
          : req.body.email,
      phone: req.body.phone,
      role_id: req.body.role_id,
      id_user: req.body.id_user,
    };

    const studentUpdateObject = {
      gender:
        typeof req.body.gender === "string"
          ? req.body.gender.trim()
          : req.body.gender,
      SIG: req.user?.SIG,
      allergies:
        typeof req.body.allergies === "string"
          ? req.body.allergies.trim()
          : req.body.allergies,
      medical_condition:
        typeof req.body.medicalCondition === "string"
          ? req.body.medicalCondition.trim()
          : req.body.medicalCondition,
      weight: req.body.weight,
      height: req.body.height,
      shirt_size: req.body.shirtSize,
      pants_size: req.body.pantSize,
      shoe_size: req.body.shoeSize,
      birth_date: req.body.birthDate,
      id: req.body.id_student,
    };

    const userUpdated = await Users.updateUser(userUpdateObject);

    if (userUpdated === false) {
      return res.status(404).json({
        success: false,
        code: "USER_UPDATE_FAILED",
        message:
          "No se pudieron actualizar las credenciales básicas de usuario del estudiante.",
      });
    }

    const studentUpdated = await Students.updateStudent(
      studentUpdateObject.id,
      studentUpdateObject,
    );

    if (studentUpdated === false) {
      return res.status(404).json({
        success: false,
        code: "STUDENT_RECORD_UPDATE_FAILED",
        message:
          "Las credenciales base se actualizaron, pero los datos de ficha médica/escolar no sufrieron cambios.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "El expediente y ficha escolar del estudiante han sido actualizados con éxito.",
    });
  } catch (error) {
    console.error("❌ Error en updateStudent:", error);
    return res.status(500).json({
      success: false,
      code: "UPDATE_STUDENT_INTERNAL_ERROR",
      message:
        "Fallo del servidor al intentar actualizar el perfil del alumno.",
      error: error.message,
    });
  }
};

/* ==========================================================================
   4. OBTENER ESTUDIANTES NO MATRICULADOS
   ========================================================================== */
export const getStudentNotEnrolled = async (req, res) => {
  try {
    console.log(
      "⚠️ [SIGACE API]: Buscando estudiantes pendientes por asignación de aula...",
    );
    const SIG = req.user?.SIG;
    const id_period = req.params.id_period || req.query.id_period;

    if (!SIG) {
      return res.status(400).json({
        success: false,
        code: "MISSING_SIG",
        message:
          "El código SIG institucional es requerido para filtrar los estudiantes.",
      });
    }

    if (!id_period || isNaN(parseInt(id_period))) {
      return res.status(400).json({
        success: false,
        code: "INVALID_PERIOD_ID",
        message:
          "Debe proporcionar un identificador de período escolar válido.",
      });
    }

    const students = await Students.getStudentNotEnrolled({
      id_period: parseInt(id_period),
      SIG,
    });

    if (!students || students.length === 0) {
      return res.status(404).json({
        success: false,
        code: "ALL_STUDENTS_ENROLLED",
        message:
          "Organización completa: Todos los estudiantes registrados ya cuentan con un aula asignada en este lapso.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Listado de estudiantes flotantes (sin sección asignada) recuperado.",
      data: students,
    });
  } catch (error) {
    console.error("❌ Error en getStudentNotEnrolled:", error);
    return res.status(500).json({
      success: false,
      code: "NOT_ENROLLED_INTERNAL_ERROR",
      message: "Error de base de datos al buscar estudiantes desvinculados.",
      error: error.message,
    });
  }
};

/* ==========================================================================
   5. OBTENER ESTUDIANTES POR SECCIÓN
   ========================================================================== */
export const getStudentsBySection = async (req, res) => {
  try {
    const { id_section } = req.params;
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

    const students = await Students.getStudentsBySection({ id_section, SIG });

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

/* ==========================================================================
   6. OBTENER DETALLE DE UN ESTUDIANTE POR ID
   ========================================================================== */
export const getStudentByID = async (req, res) => {
  try {
    const { id_student } = req.params;
    const id_period = req.user.id_period;

    if (!id_student) {
      return res.status(400).json({
        success: false,
        code: "MISSING_STUDENT_ID",
        message: "Es requerido especificar el código ID único del estudiante.",
      });
    }

    const student = await Students.getStudentByID(id_student, id_period);

    if (!student) {
      return res.status(404).json({
        success: false,
        code: "STUDENT_NOT_FOUND",
        message:
          "No se halló información asociada a este perfil. Recarga el navegador o contacta al administrador.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ficha descriptiva del alumno localizada correctamente.",
      data: student,
    });
  } catch (error) {
    console.error("❌ Error en getStudentByID:", error);
    return res.status(500).json({
      success: false,
      code: "GET_STUDENT_BY_ID_INTERNAL_ERROR",
      message: "Fallo técnico interno al extraer la ficha descriptiva.",
      error: error.message,
    });
  }
};

/* ==========================================================================
   7. EXPEDIENTE / RÉCORD ACADÉMICO INTEGRAL
   ========================================================================== */
export const getRecordStudent = async (req, res) => {
  const id_student = req.params.id_student;
  const id_period = req.params.id_period;

  if (!id_student || !id_period) {
    return res.status(400).json({
      success: false,
      code: "RECORD_STUDENT_ID_REQUIRED",
      message:
        "El identificador del estudiante es crucial para estructurar el historial académico.",
    });
  }

  try {
    console.log(
      `🔄 [SIGACE API]: Estructurando historial para estudiante ID: ${id_student} en el period: ${id_period}`,
    );
    const record = await Students.getRecordStudent(id_student, id_period);

    if (!record || record.length === 0) {
      return res.status(404).json({
        success: false,
        code: "ACADEMIC_RECORD_EMPTY",
        message:
          "Historial en blanco: El alumno seleccionado no cuenta con calificaciones o evaluaciones cargadas.",
      });
    }

    /*   const periodsMap = {};

    record.forEach((row) => {
      const pKey = row.school_year;

      if (!periodsMap[pKey]) {
        periodsMap[pKey] = {
          school_year: row.school_year,
          year_level: row.year_level,
          section: row.section,
          _subjectsMap: {},
        };
      }

      const period = periodsMap[pKey];
      const sKey = row.subject_name;

      if (!period._subjectsMap[sKey]) {
        period._subjectsMap[sKey] = {
          subject_name: row.subject_name,
          _lapsesMap: {
            "Lapso 1": { number: 1, grade: 0, evaluations: [], _acumulado: 0 },
            "Lapso 2": { number: 2, grade: 0, evaluations: [], _acumulado: 0 },
            "Lapso 3": { number: 3, grade: 0, evaluations: [], _acumulado: 0 },
          },
        };
      }

      const subject = period._subjectsMap[sKey];

      if (row.lapse_name && subject._lapsesMap[row.lapse_name]) {
        const lapso = subject._lapsesMap[row.lapse_name];
        const nota = parseFloat(row.grade) || 0;
        const porc = parseFloat(row.porcentage) || 0;

        lapso.evaluations.push({
          name: `Evaluación de ${porc}%`,
          grade: Math.round(nota),
          percentage: porc,
        });

        lapso._acumulado += nota * (porc / 100);
        lapso.grade = Math.round(lapso._acumulado);
      }
    });

    const finalResult = Object.values(periodsMap).map((period) => {
      const subjects = Object.values(period._subjectsMap).map((sub) => {
        const lapses = Object.values(sub._lapsesMap).map((lap) => {
          delete lap._acumulado;
          return lap;
        });

        const sumaLapsos = lapses.reduce((acc, curr) => acc + curr.grade, 0);
        const final_grade = Math.round(sumaLapsos / 3);

        return {
          subject_name: sub.subject_name,
          final_grade: final_grade || 0,
          lapses: lapses,
        };
      });

      return {
        school_year: period.school_year,
        year_level: period.year_level,
        section: period.section,
        subjects: subjects,
      };
    }); */

    return res.status(200).json({
      success: true,
      message:
        "Expediente de calificaciones consolidado e indexado correctamente.",
      data: record,
    });
  } catch (error) {
    console.error("❌ Error en getRecordStudent:", error);
    return res.status(500).json({
      success: false,
      code: "ACADEMIC_RECORD_INTERNAL_ERROR",
      message:
        "Imposible armar el historial de notas debido a una inconsistencia técnica.",
      error: error.message,
    });
  }
};

/* ==========================================================================
   8. OBTENER ESTUDIANTES PREINSCRITOS 
   ========================================================================== */
export const getPreinscription = async (req, res) => {
  try {
    console.log(
      "⚠️ [SIGACE API]: Buscando estudiantes pre-inscritos pendientes por asignación de aula...",
    );
    const SIG = req.user?.SIG;
    const id_period = req.params.id_period || req.query.id_period;

    if (!SIG) {
      return res.status(400).json({
        success: false,
        code: "MISSING_SIG",
        message:
          "El código SIG institucional es requerido para filtrar los estudiantes.",
      });
    }

    if (!id_period || isNaN(parseInt(id_period))) {
      return res.status(400).json({
        success: false,
        code: "INVALID_PERIOD_ID",
        message:
          "Debe proporcionar un identificador de período escolar válido.",
      });
    }

    const students = await Students.getPreinscription(SIG, parseInt(id_period));

    if (!students || students.length === 0) {
      return res.status(404).json({
        success: false,
        code: "ALL_STUDENTS_ENROLLED",
        message:
          "Organización completa: Todos los estudiantes registrados ya cuentan con un aula asignada en este lapso.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Listado de estudiantes pre-inscritos (sin sección asignada) recuperado.",
      data: students,
    });
  } catch (error) {
    console.error("❌ Error en getStudentNotEnrolled:", error);
    return res.status(500).json({
      success: false,
      code: "NOT_ENROLLED_INTERNAL_ERROR",
      message: "Error de base de datos al buscar estudiantes desvinculados.",
      error: error.message,
    });
  }
};
