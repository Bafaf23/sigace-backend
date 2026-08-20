import { School } from "../models/School.model.js";

/**
 * Obtiene el catálogo completo de instituciones educativas registradas.
 *
 * @async
 * @function getAllSchools
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const getAllSchools = async (req, res) => {
  try {
    const schools = await School.getAllSchools();

    if (schools.length === 0) {
      console.warn(`⚠️ [NOT FOUND] No se encontraron colegios registrados`);
      return res.status(200).json({
        success: true,
        message: "No hay intituciones registradas por el momento",
      });
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("📤 Resultado de Prisma:", {
        type: typeof schools,
        isArray: Array.isArray(schools),
        value: schools,
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "El catálogo de instituciones educativas ha sido sincronizado de forma exitosa.",
      data: schools,
    });
  } catch (error) {
    console.error("❌ Error en getAllSchools:", error);
    return res.status(500).json({
      success: false,
      code: "FETCH_SCHOOLS_FAILED",
      message:
        "No pudimos recuperar el listado de escuelas en este momento. Por favor, refresca la página.",
      error: error.message,
    });
  }
};

/**
 * Obtiene el catálogo de escuelas por su codigo SIG.
 *
 * @async
 * @function getSchoolBySIG
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const getSchoolBySIG = async (req, res) => {
  const { SIG } = req.params;

  if (!SIG) {
    return res.status(400).json({
      success: false,
      code: "MISSING_SIG_PARAMETER",
      message:
        "Solicitud ambigua: Es obligatorio proporcionar el código SIG de la institución para realizar la consulta.",
    });
  }

  try {
    console.log(`🔎 Buscando...  SIG: "${SIG}"...`);

    const school = await School.getSchoolBySIG(SIG);

    if (!school) {
      console.warn(`⚠️ [NOT FOUND] No se encontró colegio con SIG: ${SIG}`);
      return res.status(404).json({
        success: false,
        code: "SCHOOL_NOT_FOUND",
        message: `La institución con el código SIG "${SIG}" no se encuentra registrada o fue dada de baja.`,
      });
    }

    console.log("📤 Resultado de Prisma:", {
      type: typeof school,
      isArray: Array.isArray(school),
    });

    console.dir(school, { depth: null, colors: true });

    return res.status(200).json({
      success: true,
      message: "Ficha institucional localizada y cargada correctamente.",
      school,
    });
  } catch (error) {
    console.error("❌ [ERROR EN CONTROLADOR]:", error.message);
    console.error("📋 StackTrace:", error.stack);
    console.log("========================================\n");

    return res.status(500).json({
      success: false,
      code: "GET_SCHOOL_INTERNAL_ERROR",
      message:
        "Ocurrió un contratiempo técnico al consultar los datos del plantel. Intente de nuevo.",
      error: error.message,
    });
  }
};

/**
 * Realiza el registro de una institucion en el sistema
 *
 * @async
 * @function createSchool
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const createSchool = async (req, res) => {
  const school = req.body;

  if (!school || Object.keys(school).length === 0) {
    console.warn(
      `⚠️ [NOT FOUND] No se encontró informacion para realizar el registro`,
    );
    return res.status(400).json({
      success: false,
      code: "EMPTY_PAYLOAD",
      message:
        "Imposible procesar: El formulario de registro se encuentra vacío.",
    });
  }

  try {
    const newSchool = await School.createSchool(school);

    if (!newSchool) {
      logger.error("Hubo un problema en registar la institucion");
      return res.status(400).json({
        success: false,
        code: "PERSISTENCE_FAILED",
        message:
          "Los datos enviados no poseen el formato requerido para dar de alta la institución.",
      });
    }
    if (process.env.NODE_ENV !== "production") {
      console.dir(newSchool, { depth: null, colors: true });
    }

    return res.status(201).json({
      success: true,
      message: `¡Configuración inicial exitosa! El plantel "${school.name || "Nueva Institución"}" ha sido integrado al ecosistema SIGACE.`,
    });
  } catch (error) {
    console.error("❌ [ERROR EN CONTROLADOR]:", error.message);
    console.error("📋 StackTrace:", error.stack);
    return res.status(500).json({
      success: false,
      code: "CREATE_SCHOOL_INTERNAL_ERROR",
      message:
        "El servidor experimentó un error al intentar guardar la escuela. Verifique su conexión.",
      error: error.message,
    });
  }
};

/**
 * Realiza el registro de una institucion en el sistema
 *
 * @async
 * @function deleteSchool
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const deleteSchool = async (req, res) => {
  const { SIG } = req.params;

  if (!SIG) {
    return res.status(400).json({
      success: false,
      code: "MISSING_DELETE_TARGET",
      message: "No se especificó qué institución se desea remover del sistema.",
    });
  }

  try {
    console.log(`🔃 Iniciando metodo de eliminacion de escuela...`);
    const deletedSchool = await School.deleteSchool(SIG);

    if (!deletedSchool) {
      return res.status(404).json({
        success: false,
        code: "DELETE_TARGET_NOT_FOUND",
        message:
          "La institución que intenta remover ya no existe en el sistema.",
      });
    }

    console.log("📤 Resultado de Prisma:", {
      type: typeof deletedSchool,
      isArray: Array.isArray(deletedSchool),
    });

    console.dir(deletedSchool, { depth: null, colors: true });

    return res.status(200).json({
      success: true,
      message:
        "La institución educativa y sus credenciales de acceso fueron removidas formalmente.",
    });
  } catch (error) {
    console.error("❌ Error en deleteSchool:", error);
    return res.status(500).json({
      success: false,
      code: "DELETE_SCHOOL_INTERNAL_ERROR",
      message:
        "Restricción de seguridad: No se pudo eliminar la escuela debido a dependencias activas (estudiantes o profesores matriculados).",
      error: error.message,
    });
  }
};

/**
 * Realiza el registro de una institucion en el sistema
 *
 * @async
 * @function updateSchool
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const updateSchool = async (req, res) => {
  const school = {
    ...req.body,
    SIG: req.body.sig ?? req.body.SIG,
  };

  if (!school.SIG) {
    return res.status(400).json({
      success: false,
      code: "MISSING_UPDATE_IDENTIFIER",
      message:
        "Error de identidad: Es imposible actualizar los datos sin el código SIG de la institución.",
    });
  }

  try {
    console.log("🔃 Iniciando metodo de actualizacion de datos...");

    const updatedSchool = await School.updateSchool(school);

    if (!updatedSchool) {
      return res.status(404).json({
        success: false,
        code: "UPDATE_TARGET_NOT_FOUND",
        message:
          "No se efectuaron cambios: El plantel no existe o los datos ingresados coinciden exactamente con los actuales.",
      });
    }

    console.log("📤 Resultado de Prisma:", {
      type: typeof updatedSchool,
      isArray: Array.isArray(updatedSchool),
    });

    console.dir(updatedSchool, { depth: null, colors: true });

    return res.status(200).json({
      success: true,
      message:
        "Los cambios estructurales e informativos de la institución fueron consolidados con éxito.",
    });
  } catch (error) {
    console.error("❌ Error en updateSchool:", error);
    return res.status(500).json({
      success: false,
      code: "UPDATE_SCHOOL_INTERNAL_ERROR",
      message:
        "Error de sincronización: El servidor no pudo guardar las modificaciones de la escuela.",
      error: error.message,
    });
  }
};

export const getRoles = async (_req, res) => {
  try {
    const roles = await School.getRole();

    return res.status(200).json({
      success: true,
      message: "Niveles de acceso y roles del sistema validados.",
      data: roles,
    });
  } catch (error) {
    console.error("❌ Error en getRoles:", error);
    return res.status(500).json({
      success: false,
      code: "ROLES_FETCH_FAILED",
      message:
        "No se pudieron comprobar los roles de seguridad en la base de datos.",
      error: error.message,
    });
  }
};
