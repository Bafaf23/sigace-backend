import { connectToDatabase, closeDatabaseConnection } from "../db.js";

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

  static async resolveEvaluationPlanId(connection, evaluation) {
    const [existingPlans] = await connection.query(
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
      const [resultPlan] = await connection.query(
        "INSERT INTO evaluation_plans (id_load_academic, id_lapse) VALUES (?, ?)",
        [evaluation.id_load_academic, evaluation.id_lapse],
      );
      return resultPlan.insertId;
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        const [plans] = await connection.query(
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
    let db;
    let connection;
    try {
      db = await connectToDatabase();
      connection = await db.getConnection();
      await connection.beginTransaction();

      const details = Array.isArray(evaluation.details)
        ? evaluation.details
        : [evaluation];

      const idEvaluationPlan = await EvaluationModel.resolveEvaluationPlanId(
        connection,
        evaluation,
      );

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

        const [resultDetail] = await connection.query(query, [
          idEvaluationPlan,
          date,
          referent_teorical,
          activity,
          technical,
          instrument,
          porcentage,
        ]);
        ids.push(resultDetail.insertId);
      }

      await connection.commit();

      return {
        id_evaluation_plan: idEvaluationPlan,
        ids,
        id: ids[0],
      };
    } catch (error) {
      if (connection) await connection.rollback();
      console.error("Error en createEvaluation:", error);
      throw error;
    } finally {
      if (connection) connection.release();
      if (db) await closeDatabaseConnection(db);
    }
  }

  /**
   * Obtiene las evaluaciones de una carga académica
   * @param {number} id_load_academic
   * @param {number} [id_lapse]
   * @returns {Array<Object>}
   * @throws {Error} Si hay un error al obtener las evaluaciones
   */
  static async getEvaluations(id_load_academic, id_lapse) {
    let db;
    try {
      db = await connectToDatabase();

      let query =
        "SELECT epd.*, ep.id_load_academic, ep.id_lapse FROM evaluation_plan_details epd INNER JOIN evaluation_plans ep ON epd.id_evaluation_plan = ep.id WHERE ep.id_load_academic = ?";
      const values = [id_load_academic];

      if (id_lapse) {
        query += " AND ep.id_lapse = ?";
        values.push(id_lapse);
      }

      const [evaluations] = await db.query(query, values);
      return evaluations;
    } catch (error) {
      console.error("Error en getEvaluations:", error);
      throw error;
    } finally {
      if (db) await closeDatabaseConnection(db);
    }
  }

  /**
   * Elimina una evaluación de la base de datos
   * @param {number} id id de la evaluación
   * @returns {Promise<boolean>}
   * @throws {Error} Si hay un error al eliminar la evaluación
   */
  static async deleteEvaluation(id) {
    let db;
    try {
      db = await connectToDatabase();
      const [result] = await db.query("DELETE FROM evaluation_plan_details WHERE id = ?", [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error en deleteEvaluation:", error);
      throw error;
    } finally {
      if (db) await closeDatabaseConnection(db);
    }
  }
}
