import { connectToDatabase, closeDatabaseConnection } from "../db.js";

export class Subject {
  constructor(code_subject, name, year_academic, SIG) {
    this.code_subject = code_subject;
    this.name = name;
    this.year_academic = year_academic;
    this.SIG = SIG;
  }
  static async createSubject(subject) {
    let db;
    try {
      db = await connectToDatabase();
      const [result] = await db.query(
        "INSERT INTO subjects (code_subject, name, year_academic, SIG) VALUES (?, ?, ?, ?)",
        [
          subject.code_subject,
          subject.name,
          subject.year_academic,
          subject.SIG,
        ],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error al crear la materia:", error);
      return null;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }
  static async getSubjects(SIG) {
    let db;
    try {
      db = await connectToDatabase();
      const [result] = await db.query("SELECT * FROM subjects WHERE SIG = ?", [
        SIG,
      ]);
      return result;
    } catch (error) {
      console.error("Error al obtener las materias:", error);
      return null;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }
}
