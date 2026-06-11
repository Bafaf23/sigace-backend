import { connectToDatabase, closeDatabaseConnection } from "../db.js";

export class Grade {
  constructor(id, idEvaluation, idStudent, grade) {
    this.id = id;
    this.idEvaluation = idEvaluation;
    this.idStudent = idStudent;
    this.grade = grade;
  }

  /**
   * Carga una nota en la base de datos
   * @param {object} gred
   * @param {number} gred.idEvaluation  - Id de la evaluacion
   * @param {number} gred.idStudent - id del estudiante
   * @param {number} gred.grade - la calificacion
   * @returns {Promise<boolean>}
   */
  static async createGrade({ id_evaluation, id_student, grade }) {
    let db = null;
    try {
      db = await connectToDatabase();

      const [result] = await db.query(
        `INSERT INTO grades (id_evaluation, id_student, grade) VALUES (?, ?, ?)`,
        [id_evaluation, id_student, grade],
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Ha ocurrido un error inesperado: ${error}`);
      return false; // Retornamos false si falla para respetar el @returns {boolean}
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }

  /**
   * Obtener las notas del estudiante
   * @param {object} getG
   * @param {number} getG.idStudent - Id Estudiante
   * @param {number} getG.idEvaluation Id Evaluacion
   * @param {number} getG.idLapse - Id Lapso
   * @returns {Array<object>}
   */

  static async getGradeStudent({
    idStudent,
    idEvaluation,
    idLapse,
    idLoadAcademic,
  }) {
    let db = null;
    try {
      db = await connectToDatabase();

      // 1. Base del query con un "WHERE 1=1" para poder concatenar "AND" fácilmente
      let query = `
      SELECT
        g.id,
        g.grade,
        g.id_student,
        g.id_evaluation,
        det.activity AS evaluation_title,
        det.porcentage,
        lap.name AS lapse_name,
      ROUND(
    SUM(g.grade * (det.porcentage / 100)) 
    OVER(PARTITION BY g.id_student, plan.id_lapse), 2
  ) AS final_grade
      FROM grades g
      INNER JOIN evaluation_plan_details det ON g.id_evaluation = det.id
      INNER JOIN evaluation_plans plan ON det.id_evaluation_plan = plan.id
      INNER JOIN lapses lap ON plan.id_lapse = lap.id
      WHERE 1=1
      `;

      const queryParams = [];

      // 2. Filtros dinámicos: Se añaden al SQL y al array SOLO si vienen definidos
      if (idStudent) {
        query += ` AND g.id_student = ?`;
        queryParams.push(idStudent);
      }

      if (idEvaluation) {
        query += ` AND g.id_evaluation = ?`;
        queryParams.push(idEvaluation);
      }

      if (idLapse) {
        query += ` AND plan.id_lapse = ?`;
        queryParams.push(idLapse);
      }

      if (idLoadAcademic) {
        query += ` AND plan.id_load_academic = ?`;
        queryParams.push(idLoadAcademic);
      }

      // Ordenamos el resultado
      query += ` ORDER BY lap.id ASC, det.id ASC`;

      // 3. Ejecutamos pasándole exactamente el array de parámetros mapeado
      const [gradesStudent] = await db.query(query, queryParams);
      return gradesStudent;
    } catch (error) {
      console.log(`Error en modelo grade: ${error}`);
      return []; // Retorna array vacío en caso de error para evitar que el controlador rompa su lógica
    } finally {
      // 4. IMPRESCINDIBLE: Cerramos la conexión para proteger la salud de SIGACE
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }
}
