import { connectToDatabase, closeDatabaseConnection } from "../db.js";

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
   * Obtiene los lapsos de una institución
   * @param {string} SIG
   * @returns {Promise<Array<object>>}
   */
  static async getLapses(SIG) {
    let db;
    try {
      db = await connectToDatabase();
      const [rows] = await db.query(
        `SELECT l.id, l.name, l.start_date, l.end_date, l.is_active FROM lapses l
          JOIN academic_periods ap ON l.id_period = ap.id
          WHERE ap.SIG = ?`,
        [SIG],
      );
      return rows;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      if (db) await closeDatabaseConnection(db);
    }
  }

  /**
   * Crea un nuevo lapso en la base de datos
   * @param {{ id_period: number, name: string, start_date: string, end_date: string, is_active?: boolean }} lapse
   */
  static async createLapses(lapse) {
    let db;
    try {
      db = await connectToDatabase();
      const [result] = await db.query(
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
    } finally {
      if (db) await closeDatabaseConnection(db);
    }
  }

  /**
   * Desactiva un lapso (lo finaliza)
   */
  static async endLapse(id) {
    let db;
    try {
      db = await connectToDatabase();
      const [result] = await db.query(
        "UPDATE lapses SET is_active = 0 WHERE id = ?",
        [id],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      if (db) await closeDatabaseConnection(db);
    }
  }

  /**
   * crea un nuevo periodo académico
   * @param {{ name: string, start_date: string, end_date: string, is_active?: boolean }} academicPeriodModel
   */
  static async createAcademicPeriod(academicPeriodModel) {
    let db;
    try {
      db = await connectToDatabase();
      const [result] = await db.query(
        "INSERT INTO academic_periods (name, start_date, end_date, is_active, SIG) VALUES (?, ?, ?, ?, ?)",
        [
          academicPeriodModel.name,
          academicPeriodModel.start_date,
          academicPeriodModel.end_date,
          academicPeriodModel.is_active ?? true,
          academicPeriodModel.SIG,
        ],
      );
      return result.insertId;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      if (db) await closeDatabaseConnection(db);
    }
  }
  /**
   * obtiene los periodos académicos activos
   * @param {string} SIG
   * @returns {Promise<Array<object>>}
   */
  static async getAcademicPeriods(SIG) {
    let db;
    try {
      db = await connectToDatabase();
      const [rows] = await db.query(
        "SELECT * FROM academic_periods WHERE is_active = 1 AND SIG = ?",
        [SIG],
      );
      return rows;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      if (db) await closeDatabaseConnection(db);
    }
  }

  /**
   * finaliza un periodo académico
   * @param {string} SIG
   * @returns {boolean} success
   */
  static async endAcademicPeriod(SIG) {
    let db;
    try {
      db = await connectToDatabase();
      const [result] = await db.query(
        "UPDATE academic_periods SET is_active = 0 WHERE SIG = ?",
        [SIG],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      if (db) await closeDatabaseConnection(db);
    }
  }

  /**
   * inicia un lapso
   * @param {string} idLapse
   * @returns {Promise<boolean>} success
   */
  static async startLapse(idLapse) {
    let db;
    try {
      db = await connectToDatabase();
      const [lapseActive] = await db.query(
        "SELECT * FROM lapses WHERE is_active = 1",
      );
      if (lapseActive.length > 0) {
        return false;
      }
      const [result] = await db.query(
        "UPDATE lapses SET is_active = 1 WHERE id = ?",
        [idLapse],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      if (db) await closeDatabaseConnection(db);
    }
  }
}
