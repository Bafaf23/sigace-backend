import { Sections } from "../models/Section.model.js";
import { getCurrentPeriod } from "../utils/periodAc.js";

export const createSection = async (req, res) => {
  try {
    console.log("⚠️ [SIGACE API]: Validando datos para la nueva sección...");
    const SIG = req.user.SIG;
    const id_year = req.body.yearId;
    const name = req.body.name;
    const guide_id = req.body.teacherId;
    const capacity = req.body.capacity;
    const id_period = req.body.id_period;

    // 🔥 Agregado id_period a la validación estricta para evitar inconsistencias
    if (!name || !SIG || !id_year || !guide_id || !capacity || !id_period) {
      console.log("❌ Parámetros obligatorios incompletos.");
      return res.status(400).json({
        success: false,
        code: "INCOMPLETE_SECTION_DATA",
        message:
          "No se pudo procesar: Todos los campos del formulario (Año, Letra/Nombre, Docente Guía y Capacidad) son estrictamente requeridos.",
      });
    }

    console.log("🔄 [SIGACE API]: Registrando sección en la base de datos...");
    const section = await Sections.createSection({
      name,
      SIG,
      id_period,
      id_year,
      guide_id,
      capacity,
    });

    if (!section) {
      return res.status(400).json({
        success: false,
        code: "SECTION_PERSISTENCE_FAILED",
        message:
          "La estructura de los datos no es válida para inicializar la sección en el plantel.",
      });
    }

    console.log("✅ Sección creada exitosamente");
    return res.status(201).json({
      success: true,
      message: `¡Sección configurada con éxito! El aula de "${name.toUpperCase()}" ha sido habilitada para el período lectivo actual.`,
    });
  } catch (error) {
    console.error("❌ Error en createSection:", error);

    // 💡 Captura inteligente de duplicados (Ej: Intentar registrar dos veces 5to Año Sección "A")
    if (
      error.code === "ER_DUP_ENTRY" ||
      error.sqlMessage?.includes("Duplicate entry")
    ) {
      return res.status(409).json({
        success: false,
        code: "DUPLICATE_SECTION",
        message: `Operación cancelada: Ya existe una sección registrada con ese nombre/letra para el año escolar seleccionado.`,
      });
    }

    return res.status(500).json({
      success: false,
      code: "CREATE_SECTION_INTERNAL_ERROR",
      message:
        "Ocurrió un contratiempo interno en el servidor al intentar abrir la nueva sección.",
      error: error.message,
    });
  }
};

export const getSections = async (req, res) => {
  try {
    console.log("⚠️ [SIGACE API]: Consultando secciones asignadas...");
    const SIG = req.user.SIG;
    const id_period = req.params.id_period;

    if (!SIG || !id_period) {
      console.log("❌ Código institucional o ID de período ausente");
      return res.status(400).json({
        success: false,
        code: "MISSING_QUERY_PARAMETERS",
        message:
          "Es necesario indicar el código SIG de la institución y el período escolar activo para consultar las secciones.",
      });
    }

    console.log(
      `🔄 [SIGACE API]: Extrayendo aulas para SIG: ${SIG} en Periodo: ${id_period}`,
    );
    const sections = await Sections.getSections(SIG, id_period);

    console.log(
      `✅ Secciones localizadas con éxito. Cantidad: ${sections?.length || 0}`,
    );
    return res.status(200).json({
      success: true,
      message: "Distribución de secciones académicas recuperada con éxito.",
      data: sections || [],
    });
  } catch (error) {
    console.error("❌ Error en getSections:", error);
    return res.status(500).json({
      success: false,
      code: "FETCH_SECTIONS_INTERNAL_ERROR",
      message:
        "No se pudo sincronizar el listado de secciones en este momento debido a un fallo de red interno.",
      error: error.message,
    });
  }
};
