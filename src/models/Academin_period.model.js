import { connectToDatabase, closeDatabaseConnection } from "../db.js";
export class Academic_periods {
  constructor(name, start_date, end_date, is_active, SIG) {
    this.id;
    this.name = name;
    this.start_date = start_date;
    this.end_date = end_date;
    this.is_active = is_active;
    this.SIG = SIG;
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
        `SELECT * FROM academic_periods 
        WHERE SIG = ? 
        ORDER BY is_active DESC, id DESC 
        LIMIT 1;`,
        [SIG],
      );
      return rows.length > 0 ? rows[0] : null;
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
}
