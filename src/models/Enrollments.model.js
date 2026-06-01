import { connectToDatabase, closeDatabaseConnection } from "../db.js";
export class Enrollments {
  constructor(id_student, id_period, id_section, status) {
    this.id_student = id_student;
    this.id_period = id_period;
    this.id_section = id_section;
    this.status = status;
  }
  static async createEnrollment(enrollment) {
    let db;
    try {
      db = await connectToDatabase();
      const [result] = await db.query(
        "INSERT INTO enrollments (id_student, id_period, id_section, status) VALUES (?, ?, ?, ?)",
        [
          enrollment.id_student,
          enrollment.id_period,
          enrollment.id_section,
          enrollment.status,
        ],
      );
      return result.insertId;
    } catch (error) {
      console.error("Error al crear el registro de matrícula:", error);
      throw error;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }
}
