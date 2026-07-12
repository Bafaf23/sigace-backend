import { pool } from "../db.js";

export class LapseModel {
  constructor(id, name, start_date, end_date, is_active, createdAt, updatedAt) {
    this.id = id;
    this.name = name;
    this.start_date = start_date;
    this.end_date = end_date;
    this.is_active = is_active;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   ** Obtiene los lapsos de una institución
   * @param {string} SIG
   * @param {number} id_period id del period activo
   * @returns {Promise<Array<object>>}
   */
  static async getLapses(SIG, id_period) {
    try {
      const [rows] = await pool.query(
        `SELECT l.id, l.name, l.start_date, l.end_date, l.is_active FROM lapses l
          JOIN academic_periods ap ON l.id_period = ap.id
          WHERE ap.SIG = ? AND ap.is_active = 1 AND l.id_period = ?`,
        [SIG, id_period],
      );
      return rows;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * Crea un nuevo lapso en la base de datos
   * @param {{ id_period: number, name: string, start_date: string, end_date: string, is_active?: boolean }} lapse
   */
  static async createLapses(lapse) {
    try {
      const [result] = await pool.query(
        "INSERT INTO lapses (id_period, name, start_date, end_date, is_active) VALUES (?, ?, ?, ?, ?)",
        [
          lapse.id_period,
          lapse.name,
          lapse.start_date,
          lapse.end_date,
          lapse.is_active ?? false,
        ],
      );
      return {
        id: result.insertId,
        id_period: lapse.id_period,
        name: lapse.name,
        start_date: lapse.start_date,
        end_date: lapse.end_date,
        is_active: lapse.is_active ?? false,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * Desactiva un lapso (lo finaliza)
   */
  static async endLapse(id) {
    try {
      const [result] = await pool.query(
        "UPDATE lapses SET is_active = 0 WHERE id = ?",
        [id],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * inicia un lapso
   * @param {string} idLapse
   * @returns {Promise<boolean>} success
   */
  static async startLapse(idLapse, id_period) {
    try {
      const [lapseActive] = await pool.query(
        "SELECT * FROM lapses WHERE is_active = 1 AND id_period = ?",
        [id_period],
      );
      if (lapseActive.length > 0) {
        return false;
      }
      const [result] = await pool.query(
        "UPDATE lapses SET is_active = 1 WHERE id = ?",
        [idLapse],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
