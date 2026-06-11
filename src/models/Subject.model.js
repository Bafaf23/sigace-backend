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
  /**
   * Obtiene todas las materias de una sección con evaluaciones y notas del estudiante
   * @param {number} id_lapse
   * @param {number} id_section
   * @param {number} id_student
   * @returns {Promise<Array<object>>}
   */
  static async getSubjectBySection(id_lapse, id_section, id_student) {
    let db;
    try {
      db = await connectToDatabase();
      const [subjects] = await db.query(
        `
     SELECT 
          s.code_subject AS id,
          s.name AS subject_name,  
          s.code_subject AS code,
          sec.name AS section_name,
          y.name AS year_name,
          epd.id AS evaluation_id,
          epd.activity AS activity_name,
          epd.referent_teorical,
          epd.porcentage AS evaluation_porcentage,
          epd.date AS evaluation_date,
          g.grade AS evaluation_grade
      FROM sections sec
      INNER JOIN years y ON sec.id_year = y.id
      INNER JOIN load_academic la ON la.id_section = sec.id
      INNER JOIN subjects s ON la.id_subject = s.code_subject
      LEFT JOIN evaluation_plans ep ON ep.id_load_academic = la.id AND ep.id_lapse = ?
      LEFT JOIN evaluation_plan_details epd ON epd.id_evaluation_plan = ep.id
      LEFT JOIN grades g ON g.id_evaluation = epd.id AND g.id_student = ?
      WHERE sec.id = ?
      ORDER BY s.name ASC, epd.date ASC;
        `,
        [id_lapse, id_student, id_section],
      );

      return subjects;
    } catch (error) {
      console.error("Error al obtener las materias por sección:", error);
      throw error;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }
}
