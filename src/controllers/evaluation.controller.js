import { EvaluationModel } from "../models/Evaluation.model.js";

/**
 * Normaliza la entrada para que siempre operemos sobre un Array estructurado
 */
function normalizeDetails(body) {
  if (Array.isArray(body.details)) {
    return body.details;
  }
  // Si mandan un objeto plano, extraemos solo los campos que componen la evaluación
  return [
    {
      description: body.description,
      porcentage: body.porcentage,
      date: body.date,
    },
  ];
}

/**
 * ==========================================================================
 * 1. REGISTRAR EVALUACIONES (LOTE O INDIVIDUAL) CON CONTROL DE TOPE (100%)
 * ==========================================================================
 */
export const createEvaluation = async (req, res) => {
  try {
    console.log("⚠️ [SIGACE API]: Validando y cubicando plan de evaluación...");

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        code: "EMPTY_PAYLOAD",
        message: "No se proporcionaron datos en el cuerpo de la solicitud.",
      });
    }

    const { id_load_academic, id_lapse } = req.body;

    if (!id_load_academic || !id_lapse) {
      return res.status(400).json({
        success: false,
        code: "MISSING_REQUIRED_PARAMS",
        message:
          "El identificador de la carga académica y el lapso son estrictamente requeridos.",
      });
    }

    const details = normalizeDetails(req.body);

    // 1. Validar rangos individuales y sumar las nuevas actividades del lote
    let nuevoPorcentajeAcumulado = 0;
    for (const detail of details) {
      const porc = parseFloat(detail.porcentage);

      if (isNaN(porc) || porc <= 0 || porc > 100) {
        return res.status(400).json({
          success: false,
          code: "INVALID_PERCENTAGE_RANGE",
          message:
            "Cada evaluación individual debe poseer un porcentaje válido mayor a 0% y menor o igual a 100%.",
        });
      }
      nuevoPorcentajeAcumulado += porc;
    }

    // 2. Buscar lo que ya está guardado en la BD para ese lapso específico
    const evaluacionesExistentes = await EvaluationModel.getEvaluations(
      id_load_academic,
      id_lapse,
    );
    const porcentajeYaGuardado = evaluacionesExistentes.reduce(
      (acc, curr) => acc + (parseFloat(curr.porcentage) || 0),
      0,
    );

    const porcentajeTotalFuturo =
      porcentajeYaGuardado + nuevoPorcentajeAcumulado;

    if (porcentajeTotalFuturo > 100) {
      console.log(
        `❌ [SIGACE API]: Plan excedido. Acumulado: ${porcentajeYaGuardado}%, Intento: ${nuevoPorcentajeAcumulado}%`,
      );
      return res.status(400).json({
        success: false,
        code: "PERCENTAGE_LIMIT_EXCEEDED",
        message: `Plan de evaluación excedido. Este lapso ya tiene acumulado un ${porcentajeYaGuardado}%. Las nuevas actividades suman ${nuevoPorcentajeAcumulado}%, lo que daría un total de ${porcentajeTotalFuturo}%. El límite estricto institucional es 100%.`,
      });
    }

    // 3. Guardar si la suma es matemáticamente válida
    const result = await EvaluationModel.createEvaluation(req.body);

    return res.status(201).json({
      success: true,
      code: "EVALUATION_PLAN_UPDATED",
      message: "Plan de evaluación guardado y actualizado con éxito.",
      data: result,
    });
  } catch (error) {
    console.error("❌ Error en createEvaluation:", error);
    return res.status(500).json({
      success: false,
      code: "CREATE_EVALUATION_INTERNAL_ERROR",
      message:
        "Error de consistencia al intentar registrar el plan de evaluaciones.",
      error: error.message,
    });
  }
};

/**
 * ==========================================================================
 * 2. OBTENER LAS EVALUACIONES DE UNA CARGA ACADÉMICA / LAPSO
 * ==========================================================================
 */
export const getEvaluations = async (req, res) => {
  try {
    const { id_load_academic } = req.params;
    const { id_lapse } = req.query;

    console.log(
      `🔍 [SIGACE API]: Solicitando evaluaciones para Carga: ${id_load_academic} | Lapso: ${id_lapse || "Todos"}`,
    );

    if (!id_load_academic || id_load_academic === "undefined") {
      return res.status(400).json({
        success: false,
        code: "MISSING_ACADEMIC_LOAD_ID",
        message:
          "El identificador de la carga académica es totalmente requerido para filtrar los planes.",
      });
    }

    const evaluations = await EvaluationModel.getEvaluations(
      id_load_academic,
      id_lapse,
    );

    return res.status(200).json({
      success: true,
      code: "EVALUATIONS_FETCHED",
      message: "Plan de evaluaciones recuperado de forma exitosa.",
      data: evaluations,
    });
  } catch (error) {
    console.error("❌ Error en getEvaluations:", error);
    return res.status(500).json({
      success: false,
      code: "GET_EVALUATIONS_INTERNAL_ERROR",
      message:
        "Error de infraestructura al consultar la planificación de evaluaciones.",
      error: error.message,
    });
  }
};

/**
 * ==========================================================================
 * 3. ELIMINAR UNA EVALUACIÓN ESPECÍFICA
 * ==========================================================================
 */
export const deleteEvaluation = async (req, res) => {
  try {
    console.log("⚠️ [SIGACE API]: Solicitando remoción de evaluación...");
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        code: "MISSING_EVALUATION_ID",
        message:
          "El ID de la evaluación específica es requerido para proceder con la baja.",
      });
    }

    const result = await EvaluationModel.deleteEvaluation(id);

    if (result) {
      return res.status(200).json({
        success: true,
        code: "EVALUATION_DELETED",
        message: "La evaluación ha sido removida del plan de manera exitosa.",
      });
    } else {
      return res.status(404).json({
        success: false,
        code: "EVALUATION_NOT_FOUND",
        message:
          "La evaluación que intenta eliminar no existe o ya fue removida previamente del sistema.",
      });
    }
  } catch (error) {
    console.error("❌ Error en deleteEvaluation:", error);
    return res.status(500).json({
      success: false,
      code: "DELETE_EVALUATION_INTERNAL_ERROR",
      message:
        "Restricción de integridad: No se puede eliminar una evaluación que ya posee notas cargadas.",
      error: error.message,
    });
  }
};
