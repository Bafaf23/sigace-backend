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
   * Obtiene todas las materias de una sección con sus respectivas evaluaciones y notas de un estudiante
   * @param {number} id_lapse - ID del lapso/momento educativo
   * @param {number} id_section - ID de la sección
   * @param {number} id_student - ID del estudiante
   * @returns {Promise<Array<object>>} - Array de materias con sus evaluaciones agrupadas
   */
  static async getSubjectBySection(id_lapse, id_section, id_student) {
    let db = null;
    try {
      db = await connectToDatabase();

      const sql = `
        SELECT 
          sec.id AS section_id, 
          s.code_subject AS subject_code,
          s.name AS subject_name,  
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
      `;

      // execute es más rápido y seguro frente a SQL Injection en MariaDB
      const [rows] = await db.execute(sql, [id_lapse, id_student, id_section]);

      const subjectsMap = rows.reduce((acc, row) => {
        const {
          subject_code,
          subject_name,
          section_name,
          section_id,
          year_name,
          ...evaluationData
        } = row;

        // Si la materia aún no está en nuestro mapa, la inicializamos
        if (!acc[subject_code]) {
          acc[subject_code] = {
            code: subject_code,
            subject_name: subject_name,
            section_name: section_name,
            year_name: year_name,
            section_id: section_id,
            evaluations: [],
            final_lapse_grade: 0,
          };
        }

        // Si existe una evaluación real en la fila de la BD
        if (evaluationData.evaluation_id) {
          // 🌟 EVITA DUPLICADOS: Verificamos si esta actividad ya se agregó a esta materia
          const yaExisteActividad = acc[subject_code].evaluations.some(
            (evaluacion) => evaluacion.id === evaluationData.evaluation_id,
          );

          // Solo si NO existe la insertamos en el array
          if (!yaExisteActividad) {
            acc[subject_code].evaluations.push({
              id: evaluationData.evaluation_id,
              activity: evaluationData.activity_name,
              referent: evaluationData.referent_teorical,
              porcentage: evaluationData.evaluation_porcentage,
              date: evaluationData.evaluation_date,
              grade:
                evaluationData.evaluation_grade !== null
                  ? Number(evaluationData.evaluation_grade)
                  : null,
            });
          }
        }

        return acc;
      }, {});

      // Convertimos el mapa de vuelta a un Array limpio
      return Object.values(subjectsMap);
    } catch (error) {
      console.error("❌ Error al obtener las materias por sección:", error);
      throw error;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }
}
