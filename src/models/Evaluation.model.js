import { pool } from "../db.js";

export class EvaluationModel {
  constructor(
    id,
    id_evaluation_plan,
    id_load_academic,
    date,
    referent_teorical,
    activity,
    technical,
    instrument,
    porcentage,
    createdAt,
    updatedAt,
  ) {
    this.id = id;
    this.id_evaluation_plan = id_evaluation_plan;
    this.id_load_academic = id_load_academic;
    this.date = date;
    this.referent_teorical = referent_teorical;
    this.activity = activity;
    this.technical = technical;
    this.instrument = instrument;
    this.porcentage = porcentage;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static async resolveEvaluationPlanId(evaluation) {
    const [existingPlans] = await pool.query(
      "SELECT id FROM evaluation_plans WHERE id_load_academic = ? AND id_lapse = ?",
      [evaluation.id_load_academic, evaluation.id_lapse],
    );

    if (existingPlans.length > 0) {
      return existingPlans[0].id;
    }

    if (evaluation.id_evaluation_plan) {
      return evaluation.id_evaluation_plan;
    }

    try {
      const [resultPlan] = await pool.query(
        "INSERT INTO evaluation_plans (id_load_academic, id_lapse) VALUES (?, ?)",
        [evaluation.id_load_academic, evaluation.id_lapse],
      );
      return resultPlan.insertId;
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        const [plans] = await pool.query(
          "SELECT id FROM evaluation_plans WHERE id_load_academic = ? AND id_lapse = ?",
          [evaluation.id_load_academic, evaluation.id_lapse],
        );
        if (plans.length > 0) {
          return plans[0].id;
        }
      }
      throw error;
    }
  }

  /**
   * Crea una o varias evaluaciones en la base de datos
   * @param {object} evaluation
   * @returns {Promise<{ id_evaluation_plan: number, ids: number[] }>}
   */
  static async createEvaluation(evaluation) {
    try {
      const idEvaluationPlan = await this.resolveEvaluationPlanId(evaluation);

      const details = Array.isArray(evaluation.details)
        ? evaluation.details
        : [evaluation];

      const query = `INSERT INTO evaluation_plan_details (id_evaluation_plan, date, referent_teorical, activity, technical, instrument, porcentage) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const ids = [];

      for (const detail of details) {
        const {
          date,
          referent_teorical = "",
          activity,
          technical = "",
          instrument,
          porcentage,
        } = detail;

        const [resultDetail] = await pool.query(query, [
          idEvaluationPlan, // 🌟 Ahora sí está perfectamente definido
          date,
          referent_teorical,
          activity,
          technical,
          instrument,
          porcentage,
        ]);
        ids.push(resultDetail.insertId);
      }

      return {
        id_evaluation_plan: idEvaluationPlan,
        ids,
        id: ids[0],
      };
    } catch (error) {
      console.error("❌ Error en createEvaluation:", error);
      throw error;
    }
  }

  /**
   * Obtiene las evaluaciones de una carga académica
   */
  static async getEvaluations(id_load_academic, id_lapse) {
    try {
      let query =
        "SELECT epd.*, ep.id_load_academic, ep.id_lapse FROM evaluation_plan_details epd INNER JOIN evaluation_plans ep ON epd.id_evaluation_plan = ep.id WHERE ep.id_load_academic = ?";
      const values = [id_load_academic];

      if (id_lapse) {
        query += " AND ep.id_lapse = ?";
        values.push(id_lapse);
      }

      const [evaluations] = await pool.query(query, values);
      return evaluations;
    } catch (error) {
      console.error("❌ Error en getEvaluations:", error);
      throw error;
    }
  }

  /**
   * Elimina una evaluación de la base de datos
   */
  static async deleteEvaluation(id) {
    try {
      const [result] = await pool.query(
        "DELETE FROM evaluation_plan_details WHERE id = ?",
        [id],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("❌ Error en deleteEvaluation:", error);
      throw error;
    }
  }
}
