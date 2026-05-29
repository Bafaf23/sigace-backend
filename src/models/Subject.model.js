import { connectToDatabase, closeDatabaseConnection } from "../db.js";

export class Subject {
  constructor(code_subject, name, year_id, SIG) {
    this.code_subject = code_subject;
    this.name = name;
    this.year_id = year_id;
    this.SIG = SIG;
  }
  static async createSubject(subject) {
    let db;
    try {
      db = await connectToDatabase();
      const [result] = await db.query(
        "INSERT INTO subjects (code_subject, name, year_id, SIG) VALUES (?, ?, ?, ?)",
        [subject.code_subject, subject.name, subject.year_id, subject.SIG],
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
      const [result] = await db.query(
        "SELECT s.code_subject, s.name, y.name AS year_name FROM subjects s INNER JOIN years y ON s.year_id = y.id WHERE s.SIG = ?",
        [SIG],
      );
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

  static async getYears(SIG) {
    let db;
    try {
      db = await connectToDatabase();
      const [result] = await db.query(
        "SELECT id, name FROM years WHERE SIG = ?",
        [SIG],
      );
      return result;
    } catch (error) {
      console.error("Error al obtener los años:", error);
      return null;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }
}
