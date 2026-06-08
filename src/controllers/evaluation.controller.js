import { EvaluationModel } from "../models/Evaluation.model.js";

function normalizeDetails(body) {
  if (Array.isArray(body.details)) {
    return body.details;
  }
  return [body];
}

function validatePorcentages(details) {
  for (const detail of details) {
    const porcentage = detail.porcentage;
    if (porcentage == null || porcentage < 0 || porcentage > 100) {
      return "El porcentaje debe ser entre 0 y 100";
    }
  }
  return null;
}

export const createEvaluation = async (req, res) => {
  try {
    console.log("⚠️ Creando evaluación...");
    if (!req.body) {
      return res.status(400).json({ message: "Body is required" });
    }

    const { id_load_academic, id_lapse } = req.body;

    if (!id_load_academic || !id_lapse) {
      return res.status(400).json({
        message: "id_load_academic e id_lapse son requeridos",
      });
    }

    const details = normalizeDetails(req.body);
    const porcentageError = validatePorcentages(details);

    if (porcentageError) {
      return res.status(400).json({ message: porcentageError });
    }

    const result = await EvaluationModel.createEvaluation(req.body);

    console.log(
      `✅ Evaluation created successfully (${result.ids.length} detalle(s))`,
    );
    res.status(201).json({
      message: "Evaluación creada correctamente",
      id_load_academic,
      id_lapse,
      ...result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEvaluations = async (req, res) => {
  try {
    console.log(`⚠️ Get Evaluation`);
    const id_load_academic =
      req.params.id_load_academic ??
      req.params.id ??
      req.query.id_load_academic ??
      req.query.id;

    const id_lapse = req.query.id_lapse ?? req.params.id_lapse;

    console.log(
      `⚠️ Obteniendo evaluaciones para carga académica ${id_load_academic}${id_lapse ? `, lapso ${id_lapse}` : ""}...`,
    );

    if (!id_load_academic || id_load_academic === "undefined") {
      return res.status(400).json({
        message: "El id de la carga académica es requerido",
        hint: "Usa GET /evaluations/get/:id_load_academic o ?id_load_academic=4",
      });
    }

    const evaluations = await EvaluationModel.getEvaluations(
      id_load_academic,
      id_lapse,
    );
    console.log(`✅ Evaluaciones obtenidas: ${evaluations.length}`);
    res.status(200).json(evaluations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteEvaluation = async (req, res) => {
  try {
    console.log("⚠️ Eliminando evaluación...");
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ message: "El id de la evaluación es requerido" });
    }
    const result = await EvaluationModel.deleteEvaluation(id);
    if (result) {
      console.log(`✅ Evaluación eliminada correctamente`);
      res.status(200).json({ message: "Evaluación eliminada correctamente" });
    } else {
      res.status(404).json({ message: "Evaluación no encontrada" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
