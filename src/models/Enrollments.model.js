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
          s.tuition_number
      FROM enrollments e
      INNER JOIN students s ON e.id_student = s.id
      INNER JOIN users u ON s.id_user = u.id
      INNER JOIN sections sec ON e.id_section = sec.id
      INNER JOIN years ye ON sec.id_year = ye.id
      INNER JOIN academic_periods ap ON ap.id = e.id_period
      WHERE e.id_period = ? 
      AND e.status IN ('Aprobado', 'Materia Pendiente')
      ORDER BY sec.name ASC, u.last_name ASC`;

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
   * Procesa el estado final de los estudiantes y actualiza su estado de 'Activo' a
   * 'Aprobado', 'Materia Pendiente' o 'Reprobado' según su rendimiento acumulado.
   * @param {number} id_period
   * @returns {Promise<boolean>} Devuelve true si se procesó y actualizó al menos un estudiante
   */
  static async processFinalStates(id_period) {
    let db;
    try {
      db = await connectToDatabase();
      await db.query("START TRANSACTION");

      const sql = `SELECT 
    e.id_student,
    -- Contamos las materias donde la nota final calculada (o 0 si no tiene nada) sea <= 10
    COUNT(DISTINCT CASE WHEN IFNULL(rendimiento_real.nota_final_materia, 0) <= 10 THEN la_total.id_subject END) AS materias_reprobadas
FROM enrollments e
-- 1. Traemos la carga académica obligatoria de la sección
INNER JOIN load_academic la_total ON la_total.id_section = e.id_section AND la_total.id_period = e.id_period
-- 2. Calculamos la nota final real asegurando la división por la cantidad de lapsos
LEFT JOIN (
    SELECT 
        lapso_calc.id_student,
        la.id_subject,
        -- 🔥 CORRECCIÓN: Sumamos las notas de los lapsos existentes y dividimos estrictamente entre 
        -- el total de lapsos que tiene el período, así los lapsos vacíos castigan el promedio.
        SUM(lapso_calc.nota_lapso) / (SELECT COUNT(*) FROM lapses WHERE id_period = la.id_period) AS nota_final_materia
    FROM load_academic la
    INNER JOIN evaluation_plans ep ON ep.id_load_academic = la.id
    INNER JOIN (
        -- Nota ponderada de cada lapso por estudiante
        SELECT 
            epd.id_evaluation_plan,
            g.id_student,
            CASE 
                WHEN SUM(epd.porcentage) > 0 THEN 
                    ROUND((SUM((g.grade * epd.porcentage) / 100) / SUM(epd.porcentage)) * 100)
                ELSE 0 
            END AS nota_lapso
        FROM evaluation_plan_details epd
        INNER JOIN grades g ON g.id_evaluation = epd.id
        GROUP BY epd.id_evaluation_plan, g.id_student
    ) AS lapso_calc ON lapso_calc.id_evaluation_plan = ep.id
    WHERE la.id_period = 10
    GROUP BY lapso_calc.id_student, la.id_subject
) AS rendimiento_real ON rendimiento_real.id_student = e.id_student AND rendimiento_real.id_subject = la_total.id_subject

WHERE e.id_period = 10 AND e.status = 'Activo'
GROUP BY e.id_student`;

      const [result] = await db.query(sql, [id_period, id_period]);

      let totalActualizados = 0;

      for (const alumno of result) {
        let nuevoEstatus = "Aprobado";
        const reprobadas = alumno.materias_reprobadas;

        if (reprobadas >= 1 && reprobadas <= 2) {
          nuevoEstatus = "Materia Pendiente";
          const [materiasReprobadasDetalle] = await db.query(
            `SELECT la_total.id_subject 
             FROM load_academic la_total
             LEFT JOIN (...) -- (Tu misma subconsulta de rendimiento filtrada por este alumno)
             WHERE la_total.id_period = ? AND e.id_student = ? AND IFNULL(rendimiento_real.nota_final_materia, 0) <= 10`,
            [id_period, alumno.id_student],
          );
          for (const materia of materiasReprobadasDetalle) {
            await db.query(
              `INSERT INTO pending_subjects (id_student, id_subject, id_period_origin, status) 
               VALUES (?, ?, ?, 'Pendiente')`,
              [alumno.id_student, materia.id_subject, id_period],
            );
          }
        } else if (reprobadas >= 3) {
          nuevoEstatus = "Reprobado";
        }

        const [updateResult] = await db.query(
          `UPDATE enrollments 
         SET status = ? 
         WHERE id_student = ? AND id_period = ? AND status = 'Activo'`,
          [nuevoEstatus, alumno.id_student, id_period],
        );

        if (updateResult && updateResult.affectedRows > 0) {
          totalActualizados++;
        }
      }

      await db.query("COMMIT");

      return totalActualizados > 0;
    } catch (error) {
      if (db) {
        await db.query("ROLLBACK");
      }
      console.error(
        "Error al procesar cierre de año y materias pendientes:",
        error,
      );
      throw error;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }
}
