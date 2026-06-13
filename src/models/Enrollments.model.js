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

  /**
   ** obtiene a todo  las estudiantes que cumplen las condiciones para ser promovios.
   * @param {number} id_period
   * @returns {Array<object>} - Estudiantes con estado aprovados
   */
  static async getApprovedForPromotion(id_period) {
    let db;
    try {
      db = await connectToDatabase();
      const sql = `SELECT 
    e.id AS enrollment_id,
    e.id_student,
    u.name, 
    u.last_name,   
    u.document,
    ap.name AS period,
    sec.name AS current_section,
    ye.name AS year_name, 
    e.status,
    
    -- Subconsulta corregida: Vincula las actividades directamente al estudiante de la matrícula
    (
        SELECT ROUND(AVG(g.grade), 0)
        FROM grades g
        WHERE g.id_student = e.id_student
    ) AS general_average

FROM enrollments e
INNER JOIN students s ON e.id_student = s.id
INNER JOIN users u ON s.id_user = u.id
INNER JOIN sections sec ON e.id_section = sec.id
INNER JOIN years ye ON sec.id_year = ye.id
INNER JOIN academic_periods ap ON ap.id = e.id_period
WHERE e.id_period = ? 
AND e.status IN ('Aprobado', 'Materia Pendiente')
ORDER BY sec.name ASC, u.last_name ASC;`;

      const [rows] = await db.query(sql, [id_period]);
      return rows;
    } catch (error) {
      console.log(error);
    } finally {
      if (db) {
        closeDatabaseConnection(db);
      }
    }
  }

  /**
   ** Porcesa el estado final de estudiante y actualisa el estado del mismo de Activo a Aprovado, si cumple con lo minimo aprovatorio, Reprovado si no lo cumple.
   * @param {number} id_period
   * @returns {Boolean} si una o mas filas son afectadas
   */

  static async processFinalStates(id_period) {
    let db;
    try {
      db = await connectToDatabase();
      const sql = `UPDATE enrollments e
        LEFT JOIN (
            -- Precalculamos el conteo de materias reprobadas por cada estudiante de una sola vez
            SELECT id_student, COUNT(*) AS materias_reprobadas
            FROM (
                -- Subconsulta para calcular la nota final promediada por materia (id_subject)
                SELECT 
                    g.id_student, 
                    la.id_subject, 
                    AVG(g.grade) AS nota_final
                FROM grades g
                INNER JOIN evaluation_plan_details epd ON g.id_evaluation = epd.id
                INNER JOIN evaluation_plans ep ON epd.id_evaluation_plan = ep.id
                INNER JOIN load_academic la ON ep.id_load_academic = la.id
                INNER JOIN lapses l ON ep.id_lapse = l.id
                WHERE l.id_period = ?
                GROUP BY g.id_student, la.id_subject
            ) AS asignaturas
            WHERE asignaturas.nota_final < 10
            GROUP BY id_student
        ) AS rendimiento ON e.id_student = rendimiento.id_student
        
        SET e.status = CASE 
            -- Si no tiene materias reprobadas (o el registro es NULL) -> Aprobado
            WHEN rendimiento.materias_reprobadas IS NULL OR rendimiento.materias_reprobadas = 0 THEN 'Aprobado'
            -- Si reprobó 1 o 2 materias -> Materia Pendiente
            WHEN rendimiento.materias_reprobadas BETWEEN 1 AND 2 THEN 'Materia Pendiente'
            -- Si reprobó 3 o más materias -> Reprobado
            ELSE 'Reprobado'
        END
        WHERE e.id_period = ? AND e.status = 'Activo';
    `;
      const [result] = await db.query(sql, [id_period, id_period, id_period]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error(
        "Error al procesar cierre de año y materias pendientes:",
        error,
      );
      throw error;
    } finally {
      if (db) {
        closeDatabaseConnection(db);
      }
    }
  }
}
