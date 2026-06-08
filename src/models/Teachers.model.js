import { connectToDatabase, closeDatabaseConnection } from "../db.js";
export class Teachers {
  constructor(id, id_user, SIG, is_active) {
    this.id = id;
    this.id_user = id_user;
    this.SIG = SIG;
    this.is_active = is_active;
  }

  /**
   * Obtiene los profesores de la base de datos y a un profesor espesifico si se proporciona el SIG
   * @param {string} SIG
   * @returns {Promise<Array<Teachers>>}
   */
  static async getTeachers(SIG) {
    let db;
    try {
      db = await connectToDatabase();
      if (SIG) {
        const [teachers] = await db.query(
          "SELECT t.id, t.id_user, t.SIG, t.is_active, u.name, u.last_name, u.email, u.phone, u.document FROM teachers t INNER JOIN users u ON t.id_user = u.id WHERE t.SIG = ?",
          [SIG],
        );
        return teachers;
      } else {
        const [teachers] = await db.query(
          "SELECT t.id, t.id_user, t.SIG, t.is_active, u.name, u.last_name, u.email, u.phone FROM teachers t INNER JOIN users u ON t.id_user = u.id",
        );
        return teachers;
      }
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }

  /**
   * Obtiene un profesor por su ID
   * @param {string} id - Id usuario
   * @returns {Promise<Teachers>}
   */
  static async getLoadAcademicTeacher(id) {
    let db;
    try {
      db = await connectToDatabase();

      const [teacher] = await db.query(
        `SELECT id FROM teachers WHERE id_user = ?`,
        [id],
      );

      const [loadAcademic] = await db.query(
        `SELECT s.name, s.code_subject, sec.name as section_name, y.name as year_name, ld.id as id_load_academic, sec.id as id_section FROM subjects s 
        INNER JOIN load_academic ld ON s.code_subject = ld.id_subject
        INNER JOIN sections sec ON ld.id_section = sec.id
        INNER JOIN years y ON sec.id_year = y.id
        WHERE ld.id_teacher = ?`,
        [teacher[0].id],
      );
      return loadAcademic;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }
}
