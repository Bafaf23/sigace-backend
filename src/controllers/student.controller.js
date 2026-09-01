import { Students } from "../models/Students.model.js";
import { Representative } from "../models/Representative.model.js";
import { Users } from "../models/Users.model.js";
import { generateTuitionNumber } from "../utils/tuitoinNumber.js";
import { welcomeEmail } from "../services/resend.service.js";
import { Academic_periods } from "../models/Academin_period.model.js";
import { Subject } from "../models/Subject.model.js";
import logger from "../utils/logger.js";

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

/**
 * Normaliza fechas tipo "2003/9/23", "2003-9-23" o "2003-09-23"
 * a un objeto Date en UTC apto para Prisma @db.Date.
 */
const normalizeToDate = (rawDate) => {
  if (!rawDate) return null;

  // Reemplazar / por - y separar año, mes, día
  const parts = rawDate.toString().trim().replace(/\//g, "-").split("-");

  if (parts.length === 3) {
    const [year, month, day] = parts;
    const paddedMonth = month.padStart(2, "0");
    const paddedDay = day.padStart(2, "0");

    const isoString = `${year}-${paddedMonth}-${paddedDay}T00:00:00.000Z`;
    const dateObj = new Date(isoString);

    return isNaN(dateObj.getTime()) ? null : dateObj;
  }

  const fallbackDate = new Date(rawDate);
  return isNaN(fallbackDate.getTime()) ? null : fallbackDate;
};

const safeTrim = (val) => (typeof val === "string" ? val.trim() : "");

/**
 * Obtiene a todos los estudiantes de una escuela por su codigo SIG
 *
 * @async
 * @function getStudents
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const getStudents = async (req, res) => {
  const SIG = /* req.user.SIG */ "SIG8587";
  const id_period = /* req.user.id_period */ 1;

  if (!SIG) {
    return res.status(400).json({
      success: false,
      code: "MISSING_SCHOOL_SIG",
      message:
        "Identificador institucional ausente. Es obligatorio indicar el SIG del plantel.",
    });
  }

  try {
    let targetPeriodId = id_period;

    if (!targetPeriodId) {
      const periods = await Academic_periods.getAcademicPeriods(SIG);
      const activePeriod = periods.find((item) => item.is_active === 1);

      if (!activePeriod) {
        logger.warn("No se encontraron periodos academicos activos.", {
          SIG,
          periodId: targetPeriodId,
        });
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
      logger.warn("No se encontraron estudiantes matriculados", {
        SIG,
        periodId: targetPeriodId,
      });
      return res.status(404).json({
        success: false,
        code: "STUDENTS_NOT_FOUND",
        message:
          "No se encontraron estudiantes matriculados en esta institución para el período consultado.",
      });
    }

    logger.debug("Estudiantes matriculados recuperados exitosamente", {
      total: students.length,
      SIG,
      periodId: targetPeriodId,
    });

    if (process.env.NODE_ENV !== "production") {
      console.dir(students, { depth: null, colors: true });
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

/**
 * Inserta un registrito de estudante a la DB
 *
 * @async
 * @function createStudent
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const createStudent = async (req, res) => {
  try {
    const {
      documentType = "",
      document,
      name,
      lastName,
      repdniType = "",
      repdni,
      repName,
      repLastName,
      repPhone,
      phone,
      gender,
      relationship,
      email,
      ...medicalAndSizes
    } = req.body;

    if (
      !document ||
      !name ||
      !lastName ||
      !repdni ||
      !repName ||
      !repLastName
    ) {
      logger.warn(
        "Falta informacion relevante sobre el estudiate para procesar el registro.",
        {
          SIG,
        },
      );
      return res.status(400).json({
        success: false,
        code: "INCOMPLETE_DATA",
        message:
          "Faltan datos obligatorios del estudiante o del representante legal.",
      });
    }

    const studentDoc = `${documentType}${document}`.trim();
    const repDoc = `${repdniType}${repdni}`.trim();
    const SIG = req.user?.SIG;

    const tuitionNumber = await generateTuitionNumber(SIG);

    if (!tuitionNumber) {
      logger.warn("Ocurrio un problema generando la matricula", {
        tuitionNumber,
        SIG,
      });
      return res.status(400).json({
        success: false,
        code: "TUITION_GENERATION_FAILED",
        message: "No se pudo generar el número de matrícula.",
      });
    }
    const passgeneric = `${studentDoc.substring(0, 4)}@2026`;

    const birthDate = normalizeToDate(req.body.birth_date);
    if (!birthDate) {
      logger.error(
        "La fecha de nacimiento es inválida. Usa un formato válido como YYYY-MM-DD o YYYY/MM/DD.",
        {
          birthDate,
        },
      );
      return res.status(400).json({
        success: false,
        message:
          "La fecha de nacimiento es inválida. Usa un formato válido como YYYY-MM-DD o YYYY/MM/DD.",
      });
    }

    // insercion el la DB
    const newStudent = await Students.createStudent({
      student: {
        tuition_number: tuitionNumber,
        allergies: req.body.allergies || null,
        medical_condition: req.body.medicalCondition || null,
        weight: req.body.weight || null,
        height: req.body.height || null,
        shirt_size: req.body.shirtSize || null,
        pants_size: req.body.pantSize || null,
        shoe_size: req.body.shoeSize || null,
        condition: req.body.condition || null,
        SIG: SIG,
        tuition_number: tuitionNumber,
        gender: gender?.trim(),
        birth_date: birthDate,
      },
      representative: {
        document: repDoc,
        name: formatText(repName),
        last_name: formatText(repLastName),
        phone: repPhone,
        relationship: relationship?.trim(),
        repEmail: req.body.repEmail.trim(),
      },
      user: {
        document: studentDoc,
        name: formatText(name),
        last_name: formatText(lastName),
        email: email?.trim(),
        password: passgeneric,
        phone: phone,
        role_id: req.body.role_id || 4,
        pass: passgeneric,
      },
    });

    if (!newStudent) {
      logger.error(
        "Ocurrio un error al procesar el registro del estudiante, intenta de nuevo.",
        {
          newStudent,
        },
      );
      return res.status(400).json({
        success: false,
        code: "NEW_REGISTER_ERROR",
        message:
          "Ocurrio un error al procesar el registro del estudiante, intenta de nuevo.",
      });
    }

    // contacto con el usario
    if (email) {
      await welcomeEmail(name, email).catch((err) =>
        console.error("⚠️ Error enviando email de bienvenida:", err),
      );
    }

    logger.debug("¡Inscripción formalizada exitosamente!.", {
      tuitionNumber,
    });

    return res.status(201).json({
      success: true,
      message: `¡Inscripción formalizada exitosamente! Matrícula asignada: ${tuitionNumber}.`,
    });
  } catch (error) {
    console.error("❌ Error en createStudent:", error);
    return res.status(500).json({
      success: false,
      code: "CREATE_STUDENT_INTERNAL_ERROR",
      message: "Fallo interno al procesar la inscripción.",
      error: error.message,
    });
  }
};

/**
 * Actualiza la informacion exixtente en la BD de un estudiante con su respectiva informormacion editable del usuario
 * TODO: Actualizar este controlador con el estandar de los demas.
 * @async
 * @function updateStudent
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const updateStudent = async (req, res) => {
  try {
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

/**
 * Obtine a todos los estudnates que no tienen una inscripcion en el sistema.
 *
 * @async
 * @function getStudentNotEnrolled
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const getStudentNotEnrolled = async (req, res) => {
  const SIG = req.user?.SIG;
  const { id_period } = req.user.id_period;

  if (!SIG) {
    logger.error(`No se encontro el codigo SIG. ${SIG}`);
    return res.status(400).json({
      success: false,
      code: "MISSING_SIG",
      message:
        "El código SIG institucional es requerido para filtrar los estudiantes.",
    });
  }

  if (!id_period || isNaN(parseInt(id_period))) {
    logger.error(`No se encontro el perido academico. ${id_period}`);
    return res.status(400).json({
      success: false,
      code: "INVALID_PERIOD_ID",
      message: "Debe proporcionar un identificador de período escolar válido.",
    });
  }
  try {
    const students = await Students.notEnrolled({
      id_period: id_period,
      SIG,
    });

    if (!students || students.length === 0) {
      logger.warn(`No hay estudiantes sin matricula en este perido academcio.`);
      return res.status(404).json({
        success: false,
        code: "ALL_STUDENTS_ENROLLED",
        message:
          "Organización completa: Todos los estudiantes registrados ya cuentan con un aula asignada en este lapso.",
      });
    }

    console.log("📤 Resultado de Prisma:", {
      type: typeof students,
      isArray: Array.isArray(students),
    });

    console.table(
      students.map((student) => ({
        id: student.id,
        cedula: student.user.id_card,
        nombre_apellido: `${student.user.name} ${student.user.last_name}`,
      })),
    );

    return res.status(200).json({
      success: true,
      message:
        "Listado de estudiantes flotantes (sin sección asignada) recuperado.",
      data: students,
    });
  } catch (error) {
    logger.error("❌ Error en getStudentNotEnrolled:", error);
    return res.status(500).json({
      success: false,
      code: "NOT_ENROLLED_INTERNAL_ERROR",
      message: "Error de base de datos al buscar estudiantes desvinculados.",
      error: error.message,
    });
  }
};

/**
 * Busca a un studiante por si numero de cedula
 *
 * @async
 * @function getStudentByID
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const getStudentByID = async (req, res) => {
  const id_card = req.params.id_card;

  if (!id_card) {
    console.error(
      `⚠️ [NOT FOUND] El documento es necesario para realizar la consulta`,
    );
    return res.status(400).json({
      success: false,
      code: "MISSING_STUDENT_ID",
      message: "Es requerido especificar el código ID único del estudiante.",
    });
  }
  try {
    const student = await Students.byID(id_card);

    if (!student) {
      console.error(
        `⚠️ [NOT FOUND] No se encontro informacion relacionada con esta id_card: ${id_card}`,
      );
      return res.status(404).json({
        success: false,
        code: "STUDENT_NOT_FOUND",
        message:
          "No se halló información asociada a este perfil. Recarga el navegador o contacta al administrador.",
      });
    }

    console.log("📤 Resultado de Prisma:", {
      type: typeof student,
      isArray: Array.isArray(student),
    });

    const currentEnrollment = student.enrollments?.[0] || null;

    const formattedStudent = {
      id: student.id,
      tuitionNumber: student.tuition_number,
      condition: student.condition,

      studentInfo: {
        idCard: student.user?.id_card,
        firstName: student.user?.name,
        lastName: student.user?.last_name,
        fullName: `${student.user?.name} ${student.user?.last_name}`,
        email: student.user?.email,
        phone: student.user?.phone,
        gender: student.gender,
        birthDate: student.birth_date,
      },

      school: {
        SIG: student.school?.SIG,
        name: student.school?.school_name,
      },

      representative: {
        id: student.representative?.id,
        document: student.representative?.document,
        fullName: `${student.representative?.name} ${student.representative?.last_name}`,
        relationship: student.representative?.relationship,
        phone: student.representative?.phone,
        email: student.representative?.repEmail,
      },

      physicalProfile: {
        sizes: {
          shirt: student.shirt_size,
          pants: student.pants_size,
          shoes: student.shoe_size,
        },
        weight: student.weight,
        height: student.height,
        allergies: student.allergies,
        medicalCondition: student.medical_condition,
      },

      enrollment: currentEnrollment
        ? {
            id: currentEnrollment.id,
            section: currentEnrollment.section?.name,
            year: currentEnrollment.year?.name,
          }
        : null,
    };

    console.dir(formattedStudent);

    return res.status(200).json({
      success: true,
      message: "Ficha descriptiva del alumno localizada correctamente.",
      data: formattedStudent,
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

/**
 * Obtiene el record del estudiante basandose en el tiempo, si el id_perid viene el la url.
 *
 * @async
 * @function getRecordStudent
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const getRecordStudent = async (req, res) => {
  const { id_student } = req.params;
  const id_period = req.query || req.user.id_period;

  if (!id_student) {
    console.error(`⚠️ [NOT FOUND] No se proporciono el id del estudiante.`);
    return res.status(400).json({
      success: false,
      code: "RECORD_STUDENT_ID_REQUIRED",
      message:
        "El identificador del estudiante es crucial para estructurar el historial académico.",
    });
  }

  try {
    console.error(`🔃 [LOANDIG...] Buscando el record...`);
    const record = await Students.record(Number(id_student), Number(id_period));

    if (!record || record.length === 0) {
      console.error(
        `⚠️ [NOT FOUND] No se encontro el record academico del estudiante ${id_student}`,
      );
      return res.status(404).json({
        success: false,
        code: "ACADEMIC_RECORD_EMPTY",
        message:
          "Historial en blanco: El alumno seleccionado no cuenta con calificaciones o evaluaciones cargadas.",
      });
    }

    console.log("📤 Resultado de Prisma:", {
      type: typeof record,
      isArray: Array.isArray(record),
    });

    // Reestructuración de notas agrupadas por lapso
    const gradesByLapse = record.grades.reduce((acc, currentGrade) => {
      const evalData = currentGrade.evaluation;
      const evalPlan = evalData?.evaluation_plan;
      const lapse = evalPlan?.lapse;
      const subjectData = evalPlan?.load_academic?.subject;

      const lapseKey = lapse?.name || "Sin Lapso";

      // Si la clave del lapso no existe aún en el objeto acumulador, se crea
      if (!acc[lapseKey]) {
        acc[lapseKey] = [];
      }
      const percentage = Number(evalData?.porcentage ?? 0);
      const rawGrade = Number(currentGrade?.grade ?? 0);

      const weightedGrade = Math.ceil(rawGrade * (percentage / 100));

      // Insertar la nota formateada en el lapso correspondiente
      acc[lapseKey].push({
        id: currentGrade.id,
        grade: rawGrade,
        referent_teorical: evalData?.referent_teorical ?? null,
        activity: evalData?.activity ?? null,
        subject: subjectData?.name ?? null,
        code_subject: subjectData?.code_subject ?? null,
        porcentage: evalData.porcentage ?? null,
      });

      acc[lapseKey].push({ weighted_grade: weightedGrade });

      return acc;
    }, {});

    const enrollment = record.enrollments[0];

    // restructuracion del objeto record
    const studentRecord = {
      id: record.id,
      tuition_number: record.tuition_number,
      user: {
        id_card: record.user.id_card,
        name: record.user.name,
        last_name: record.user.last_name,
      },
      school: {
        SIG: record.school.SIG,
        school_name: record.school.school_name,
      },
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        period: enrollment.period.name,
        year: enrollment.year.name,
        section: enrollment.section.name,
      },
      grades: gradesByLapse,
    };

    console.dir(studentRecord, { depth: null, colors: true });

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
      data: studentRecord,
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

/**
 * Porcesa a los estudiantes que no tengan una incripcion activa en el sistema.
 *
 * @async
 * @function getPreinscription
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const getPreinscription = async (req, res) => {
  const SIG = req.user?.SIG;
  const id_period = req.params.id_period || req.query.id_period;
  try {
    if (!SIG) {
      logger.error(`SIG no encontrado`);
      return res.status(400).json({
        success: false,
        code: "MISSING_SIG",
        message:
          "El código SIG institucional es requerido para filtrar los estudiantes.",
      });
    }

    if (!id_period || isNaN(parseInt(id_period))) {
      logger.error(`Periodo no enviado en la peticion`);
      return res.status(400).json({
        success: false,
        code: "INVALID_PERIOD_ID",
        message:
          "Debe proporcionar un identificador de período escolar válido.",
      });
    }

    logger.info(`Consultandos las pre-inscripciones en el sistema.`);
    const preInscription = await Students.preInscription(
      SIG,
      Number(id_period),
    );

    if (!preInscription || preInscription.length === 0) {
      logger.error(`Sin estudiante preInscriptos en el sistema.`);
      return res.status(404).json({
        success: false,
        code: "ALL_STUDENTS_ENROLLED",
        message:
          "Organización completa: Todos los estudiantes registrados ya cuentan con un aula asignada en este lapso.",
      });
    }

    console.log("📤 Resultado de Prisma:", {
      type: typeof preInscription,
      isArray: Array.isArray(preInscription),
    });

    console.table(
      preInscription.map((student) => ({
        id: student.id,
        tuition_number: student.tuition_number,
        id_card: student.user.id_card,
        full_name: `${student.user.name} ${student.user.last_name}`,
      })),
    );

    return res.status(200).json({
      success: true,
      message:
        "Listado de estudiantes pre-inscritos (sin sección asignada) recuperado.",
      data: preInscription,
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

/**
 * Obtiene las asignaturas pendiente por cursar de un estudiante, si las tiene.
 *
 * @async
 * @function getSubjectPending
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const getSubjectPending = async (req, res) => {
  const { id_student } = req.params;

  if (!id_student) {
    return res.status(400).json({
      success: false,
      code: "MISSING_DELETE_SUBJECT_CODE",
      message: "No se especificó el ID del estudiante.",
    });
  }

  try {
    logger.info("Buscando asiganturas pendientes...");
    const pending = await Students.pendingSubject(id_student);

    if (!pending) {
      logger.info(
        "El estudiante no tiene compromiso academico de años anteriores.",
      );
      return res.status(404).json({
        success: false,
        code: "SUBJECT_ALREADY_DELETED",
        message: "Este estudante no tiene materia pendientes.",
      });
    }

    logger.info("Asignaturas sincronizadas con exito.", {
      subject_pending: pending.length,
    });
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

/**
 * Obtiene las notas de un estudiante por perido academico dividido en momentos pedagojicos.
 *
 * @async
 * @function getGrade
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const getGrade = async (req, res) => {
  const { id_student } = req.params;
  const SIG = /* req.user.SIG; */ "SIG3728";
  const { idPeriod } = req.query || req.user.id_period;

  if (!id_student) {
    return res.status(400).json({
      success: false,
      code: "MISSING_DELETE_SUBJECT_CODE",
      message: "No se especificó el ID del estudiante.",
    });
  }
  console.log(`Controller ${id_student}`);

  if (!idPeriod) {
    return res.status(400).json({
      success: false,
      message: "El parámetro de consulta 'idPeriod' es obligatorio.",
    });
  }

  try {
    logger.info("Cargando las notas, por favor espere...");
    const grades = await Students.grade({
      SIG: SIG,
      idStudent: Number(id_student),
      idPeriod: idPeriod,
    });

    if (!grades || grades.length == 0) {
      logger.info(
        "El estudiante no tiene notas registradas en este periodpo academico.",
      );
      return res.status(404).json({
        success: false,
        code: "SUBJECT_ALREADY_DELETED",
        message: "Este estudante no tiene notas registradas, en este perido.",
      });
    }

    logger.info("Exito, las notas sincronizadas.", {
      garde: grades.length,
    });

    return res.status(200).json({
      success: true,
      data: grades,
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
