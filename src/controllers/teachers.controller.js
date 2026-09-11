import { Teachers } from "../models/Teachers.model.js";
import { Academic_periods } from "../models/Academin_period.model.js";
import logger from "../utils/logger.js";

/**
 ** Obtiene a todo los profesores de una escuela
 *
 * @async
 * @function getTeachers
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const getTeachers = async (req, res) => {
  try {
    const SIG = req.user.SIG;
    const id_period = req.user.id_period;

    if (!SIG) {
      logger.error("Si codigo SIG");
      return res.status(400).json({
        success: false,
        code: "MISSING_SCHOOL_SIG",
        message:
          "Identificador institucional ausente. Es obligatorio indicar el código SIG del plantel.",
      });
    }

    let targetPeriodId = id_period;

    if (!targetPeriodId) {
      const periods = await Academic_periods.getAcademicPeriods(SIG);

      if (!periods || periods.length === 0) {
        logger.error("No pudo aceder al perido activo");
        return res.status(404).json({
          success: false,
          code: "ACADEMIC_PERIODS_EMPTY",
          message:
            "No se encontró ningún período académico configurado en el sistema para esta institución.",
        });
      }

      const activePeriod = periods.find((item) => item.is_active === 1);

      if (!activePeriod) {
        logger.error("No hay perido activo");
        return res.status(404).json({
          success: false,
          code: "ACTIVE_PERIOD_NOT_FOUND",
          message:
            "No se localizó ningún período académico activo en este momento.",
        });
      }
      targetPeriodId = activePeriod.id;
    }

    logger.info("Lista de profesores cargada...");
    const teachers = await Teachers.getAllTeachersWithLoad({ SIG });

    if (!teachers || teachers.length === 0) {
      logger.error("Sin profesores");
      return res.status(404).json({
        success: false,
        code: "TEACHERS_NOT_FOUND",
        message:
          "Nómina vacía: El plantel no cuenta con profesores registrados para el ciclo escolar.",
      });
    }

    const formattedTeachers = teachers.map((teacher) => ({
      id_teacher: teacher.id,
      id_user: teacher.id_user,
      SIG: teacher.SIG,
      is_active: teacher.is_active,
      document: teacher.user?.id_card || "",
      name: teacher.user?.name || "",
      last_name: teacher.user?.last_name || "",
      email: teacher.user?.email || "",
      phone: teacher.user?.phone || "",
      academic_load: teachers.load_academics?.map((ld) => ({
        id_load_academic: ld.id,
        id_section: ld.section?.id || null,
        section_name: ld.section?.name || "",
        year_name: ld.section?.year?.name || "",
        subject_name: ld.subject?.name || "",
        code_subject: ld.subject?.code_subject || "",
      })),
    }));

    if (process.env.NODE_ENV !== "production") {
      console.table(
        teachers.map(
          (item) => ({
            id: item.id,
            id_user: item.user.id,
            full_name: `${item.user.name} ${item.user.last_name}`,
          }),
          { depth: null, colors: true },
        ),
      );
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
 ** Obtiene la cargarca a academica de un profesor junto con su informacion.
 *
 * @async
 * @function getLoadAcademicTeacher
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const getLoadAcademicTeacher = async (req, res) => {
  const SIG = req.user.SIG;
  const id = req.user.id;

  if (!id || !SIG) {
    return res.status(400).json({
      success: false,
      code: "MISSING_TEACHER_PARAMS",
      message:
        "Faltan parámetros obligatorios de sesión (ID de usuario o código SIG) para validar el acceso.",
    });
  }

  try {
    logger.info("Sincorniznado carga academia");
    const id_teacher = await Teachers.id(id);

    console.log(SIG, id_teacher);
    const teacherData = await Teachers.getTeacherWithLoadByID({
      SIG,
      id_teacher,
    });

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
      data: teacherData,
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
