import { LoadAcademic } from "../models/LoadAcademic.model.js";

/**
 * ==========================================================================
 * 1. REGISTRAR UNA NUEVA CARGA ACADÉMICA (CON CONTROL DE DUPLICADOS)
 * ==========================================================================
 */
export const createLoadAcademic = async (req, res) => {
  try {
    console.log(
      "⚠️ [SIGACE API]: Validando datos para nueva asignación académica...",
    );
    const { teacherId, sectionId, id_period, subjectId } = req.body ?? {};
    const SIG = req.user?.SIG;

    // 1. Validación defensiva unificada
    if (!teacherId || !sectionId || !id_period || !subjectId || !SIG) {
      console.log(
        "❌ [SIGACE API]: Faltan parámetros obligatorios para la carga académica.",
      );
      return res.status(400).json({
        success: false,
        code: "INCOMPLETE_ACADEMIC_LOAD_DATA",
        message:
          "Todos los campos (Profesor, Sección, Período y Materia) son estrictamente requeridos.",
      });
    }

    // 2. Estructuración limpia del objeto para el modelo
    const loadAcademicData = {
      id_teacher: teacherId,
      SIG: SIG,
      id_section: sectionId,
      id_period: id_period,
      id_subject: subjectId,
      created_at: new Date(),
    };

    console.log(
      "🔄 [SIGACE API]: Registrando carga académica en la base de datos...",
    );
    const result = await LoadAcademic.createLoadAcademic(loadAcademicData);

    if (result) {
      console.log("✅ [SIGACE API]: Carga académica creada correctamente.");
      return res.status(201).json({
        success: true,
        code: "ACADEMIC_LOAD_CREATED",
        message:
          "Asignación de carga académica registrada correctamente en el sistema.",
        data: result,
      });
    }

    return res.status(400).json({
      success: false,
      code: "ACADEMIC_LOAD_FAILED",
      message:
        "No se pudo consolidar la asignación académica. Verifique los datos de origen.",
    });
  } catch (error) {
    console.error("❌ Error en createLoadAcademic:", error);

    // UX Pro: Capturar si la materia ya fue asignada en esa sección (Clave única en BD)
    if (
      error.code === "ER_DUP_ENTRY" ||
      error.sqlMessage?.includes("Duplicate entry")
    ) {
      return res.status(409).json({
        success: false,
        code: "DUPLICATE_ACADEMIC_LOAD",
        message:
          "Operación rechazada: La asignatura seleccionada ya se encuentra asignada a un docente en esa sección para el período actual.",
      });
    }

    return res.status(500).json({
      success: false,
      code: "CREATE_LOAD_INTERNAL_ERROR",
      message:
        "Ocurrió un problema interno en el servidor al intentar registrar la carga académica.",
      error: error.message,
    });
  }
};

/**
 * ==========================================================================
 * 2. OBTENER TODAS LAS ASIGNACIONES ACADÉMICAS DE LA INSTITUCIÓN
 * ==========================================================================
 */
export const getLoadAcademic = async (req, res) => {
  try {
    console.log(
      "🔍 [SIGACE API]: Solicitando registros de asignación académica...",
    );
    const SIG = req.user?.SIG;

    if (!SIG) {
      return res.status(400).json({
        success: false,
        code: "MISSING_SCHOOL_SIG",
        message:
          "El identificador SIG de la institución es requerido para consultar la carga académica.",
      });
    }

    console.log(
      `🔄 [SIGACE API]: Extrayendo asignaciones para la institución SIG: ${SIG}...`,
    );
    const result = await LoadAcademic.getLoadAcademic(SIG);

    return res.status(200).json({
      success: true,
      code: "ACADEMIC_LOAD_FETCHED",
      message: "Listado de carga académica obtenido con éxito.",
      data: result || [],
    });
  } catch (error) {
    console.error("❌ Error en getLoadAcademic:", error);
    return res.status(500).json({
      success: false,
      code: "GET_LOAD_INTERNAL_ERROR",
      message:
        "Error interno en el servidor al intentar recuperar los registros de carga académica.",
      error: error.message,
    });
  }
};
