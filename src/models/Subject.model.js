import { connectToDatabase, closeDatabaseConnection } from "../db.js";

export class Subject {
  constructor(code_subject, name, abbreviation, year_id, SIG) {
    this.code_subject = code_subject;
    this.name = name;
    this.abbreviation = abbreviation;
    this.year_id = year_id;
    this.SIG = SIG;
  }
  static async createSubject(subject) {
    let db;
    try {
      db = await connectToDatabase();
      const [result] = await db.query(
        "INSERT INTO subjects (code_subject, name, year_id, SIG, abbreviation) VALUES (?, ?, ?, ?, ?)",
        [
          subject.code_subject,
          subject.name,
          subject.year_id,
          subject.SIG,
          subject.abbreviation,
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
      const [result] = await db.query(
        "SELECT s.code_subject, s.name, y.name AS year_name, s.abbreviation FROM subjects s INNER JOIN years y ON s.year_id = y.id WHERE s.SIG = ?",
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
  /**
   * Obtiene todas las materias de una sección con sus respectivas evaluaciones y notas de un estudiante
   * @param {number} id_lapse - ID del lapso/momento educativo
   * @param {number} id_section - ID de la sección
   * @param {number} id_student - ID del estudiante (Opcional)
   * @returns {Promise<Array<object>>} - Array de materias con sus evaluaciones agrupadas
   */
  static async getSubjectBySection({ id_lapse, id_section, id_student, SIG }) {
    let db = null;
    try {
      db = await connectToDatabase();

      // 1. Mapeo dinámico inicial de parámetros para el JOIN
      const joinParams = [];
      let studentJoinCondition = "";

      // Si viene id_student, lo filtramos directamente en la unión de la tabla 'grades'
      if (id_student) {
        studentJoinCondition = " AND g.id_student = ?";
        joinParams.push(id_student);
      }

      // 2. Base del Query (Filtro de estudiante inyectado de forma segura en el LEFT JOIN)
      let sql = `
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
      -- Aquí inyectamos la condición del estudiante de manera segura si existe
      LEFT JOIN grades g ON g.id_evaluation = epd.id ${studentJoinCondition}
      LEFT JOIN students est ON g.id_student = est.id
      LEFT JOIN users u ON est.id_user = u.id
      WHERE sec.id = ? AND sec.SIG = ?
    `;

      // 3. Consolidamos los parámetros respetando el estricto orden de los '?'
      // 1er '?' -> ep.id_lapse = ?
      // 2do '?' -> g.id_student = ? (Si aplica, controlado por joinParams)
      // 3er '?' -> sec.id = ?
      // 4to '?' -> sec.SIG = ?
      const params = [id_lapse, ...joinParams, id_section, SIG];

      // 4. Un solo ORDER BY al final de la consulta
      sql += ` ORDER BY s.name ASC, epd.date ASC;`;

      console.log("=== DEBBUGEANDO PARÁMETROS SQL ===");
      console.log("Valores en el array:", params);

      const [rows] = await db.execute(sql, params);

      // 5. Procesamiento y mapeo de la data
      const subjectsMap = rows.reduce((acc, row) => {
        const {
          subject_code,
          subject_name,
          section_name,
          section_id,
          year_name,
          ...evaluationData
        } = row;

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

        if (evaluationData.evaluation_id) {
          const yaExisteActividad = acc[subject_code].evaluations.some(
            (evaluacion) => evaluacion.id === evaluationData.evaluation_id,
          );

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

  /**
   * Elimina una materia
   * @param {number} code_subject - asignatura a eliminar
   * @returns {boolean} terdadero si elimina una asignatura
   */
  static async deleteSubjects(code_subject, SIG) {
    let db;
    try {
      db = await connectToDatabase();
      const query = `DELETE FROM subjects WHERE code_subject = ? AND SIG = ?`;
      const result = await db.query(query, [code_subject, SIG]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   ** Obtiene todas las calificaciones de una sección crudas para armar la sábana de notas en el controlador
   * @param {Object} param0
   * @param {string} param0.id_lapse
   * @param {number} param0.id_section
   * @param {string} param0.SIG
   */
  static async getGradesForSheetNote({ id_lapse, id_section, SIG }) {
    let db = null;
    try {
      db = await connectToDatabase();

      const query = `
     SELECT 
        u.document AS student_document,
        u.name AS student_name,
        u.last_name AS student_last_name,
        s.name AS subject_name,
        s.code_subject AS subject_code,
        s.abbreviation,
        epd.porcentage AS evaluation_porcentage,
        g.grade AS evaluation_grade
      FROM enrollments e
      INNER JOIN students est ON e.id_student = est.id
      INNER JOIN users u ON est.id_user = u.id
      -- Acoplamos la sección para poder validar el SIG institucional de forma estricta
      INNER JOIN sections sec ON e.id_section = sec.id
      INNER JOIN load_academic la ON la.id_section = e.id_section AND la.id_period = e.id_period
      INNER JOIN subjects s ON la.id_subject = s.code_subject
      LEFT JOIN evaluation_plans ep ON ep.id_load_academic = la.id AND ep.id_lapse = ?
      LEFT JOIN evaluation_plan_details epd ON epd.id_evaluation_plan = ep.id
      LEFT JOIN grades g ON g.id_evaluation = epd.id AND g.id_student = est.id
      WHERE e.id_section = ? 
        AND sec.SIG = ? -- 🔥 CORRECCIÓN: Filtramos usando la tabla de secciones (sec)
        AND e.status IN ('Activo', 'Materia Pendiente', 'Repitiente')
      ORDER BY u.last_name ASC, u.name ASC, s.name ASC, epd.date ASC;
    `;

      // Pasamos los parámetros de forma limpia y segura
      const [rows] = await db.execute(query, [id_lapse, id_section, SIG]);
      return rows;
    } catch (error) {
      console.error("❌ Error en getGradesForSheetNote:", error);
      throw error;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }
}
