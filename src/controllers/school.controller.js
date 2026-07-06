import { School } from "../models/School.model.js";

export const getAllSchools = async (_req, res) => {
  try {
    console.log("⚠️ [SIGACE API]: Leyendo catálogo global de planteles...");
    const schools = await School.getAllSchools();

    return res.status(200).json({
      success: true,
      message:
        "El catálogo de instituciones educativas ha sido sincronizado de forma exitosa.",
      data: schools || [],
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

export const getSchoolBySIG = async (req, res) => {
  try {
    const { SIG } = req.params;

    if (!SIG) {
      return res.status(400).json({
        success: false,
        code: "MISSING_SIG_PARAMETER",
        message:
          "Solicitud ambigua: Es obligatorio proporcionar el código SIG de la institución para realizar la consulta.",
      });
    }

    const school = await School.getSchoolBySIG(SIG);

    if (!school) {
      return res.status(404).json({
        success: false,
        code: "SCHOOL_NOT_FOUND",
        message: `La institución con el código SIG "${SIG}" no se encuentra registrada o fue dada de baja.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ficha institucional localizada y cargada correctamente.",
      school,
    });
  } catch (error) {
    console.error("❌ Error en getSchoolBySIG:", error);
    return res.status(500).json({
      success: false,
      code: "GET_SCHOOL_INTERNAL_ERROR",
      message:
        "Ocurrió un contratiempo técnico al consultar los datos del plantel. Intente de nuevo.",
      error: error.message,
    });
  }
};

export const createSchool = async (req, res) => {
  try {
    console.log("🟢 [SIGACE API]: Evaluando datos para nuevo plantel...");
    const school = req.body;

    if (!school || Object.keys(school).length === 0) {
      return res.status(400).json({
        success: false,
        code: "EMPTY_PAYLOAD",
        message:
          "Imposible procesar: El formulario de registro se encuentra vacío.",
      });
    }

    const newSchool = await School.createSchool(school);

    if (!newSchool) {
      return res.status(400).json({
        success: false,
        code: "PERSISTENCE_FAILED",
        message:
          "Los datos enviados no poseen el formato requerido para dar de alta la institución.",
      });
    }

    return res.status(201).json({
      success: true,
      message: `¡Configuración inicial exitosa! El plantel "${school.name || "Nueva Institución"}" ha sido integrado al ecosistema SIGACE.`,
    });
  } catch (error) {
    console.error("❌ Error en createSchool:", error);
    return res.status(500).json({
      success: false,
      code: "CREATE_SCHOOL_INTERNAL_ERROR",
      message:
        "El servidor experimentó un error al intentar guardar la escuela. Verifique su conexión.",
      error: error.message,
    });
  }
};

export const deleteSchool = async (req, res) => {
  try {
    const { SIG } = req.params;

    if (!SIG) {
      return res.status(400).json({
        success: false,
        code: "MISSING_DELETE_TARGET",
        message:
          "No se especificó qué institución se desea remover del sistema.",
      });
    }

    const deletedSchool = await School.deleteSchool(SIG);

    if (!deletedSchool) {
      return res.status(404).json({
        success: false,
        code: "DELETE_TARGET_NOT_FOUND",
        message:
          "La institución que intenta remover ya no existe en el sistema.",
      });
    }

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

export const updateSchool = async (req, res) => {
  try {
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

    const updatedSchool = await School.updateSchool(school);

    if (!updatedSchool) {
      return res.status(404).json({
        success: false,
        code: "UPDATE_TARGET_NOT_FOUND",
        message:
          "No se efectuaron cambios: El plantel no existe o los datos ingresados coinciden exactamente con los actuales.",
      });
    }

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
