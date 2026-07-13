import { pool } from "../db.js";
export class Enrollments {
  constructor(id_student, id_period, id_section, status) {
    this.id_student = id_student;
    this.id_period = id_period;
    this.id_section = id_section;
    this.status = status;
  }
  /**
   * Crea la inscripsion del estudiante en el sistema
   */
  static async createEnrollment(enrollment) {
    try {
      const [result] = await pool.query(
        "INSERT INTO enrollments (id_student, id_period, id_section, status, id_year) VALUES (?, ?, ?, ?, ?)",
        [
          enrollment.id_student,
          enrollment.id_period,
          enrollment.id_section,
          enrollment.status,
          enrollment.id_year,
        ],
      );
      return result.insertId;
    } catch (error) {
      console.error("Error al crear el registro de matrícula:", error);
      throw error;
    }
  }

  /**
   ** obtiene a todo  las students que cumplen las condiciones para ser promovios.
   * @param {number} id_period
   * @returns {Array<object>} - students con estado aprovados
   */
  static async getApprovedForPromotion(id_period) {
    try {
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

      const [rows] = await pool.query(sql, [id_period]);
      return rows;
    } catch (error) {
      console.log(error);
    }
  }

  /**
   **Procesa el estado final de los students y actualiza su estado de 'Activo' a
   **'Aprobado', 'Materia Pendiente' o 'Reprobado' según su rendimiento acumulado.
   * @param {number} id_period
   * @returns {Promise<boolean>} Devuelve true si se procesó y actualizó al menos un estudiante
   */
  static async processFinalStates(id_period) {
    try {
      await pool.query("START TRANSACTION");

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
    WHERE la.id_period = ?
    GROUP BY lapso_calc.id_student, la.id_subject
) AS rendimiento_real ON rendimiento_real.id_student = e.id_student AND rendimiento_real.id_subject = la_total.id_subject

WHERE e.id_period = ? AND e.status = 'Activo'
GROUP BY e.id_student`;

      const [result] = await pool.query(sql, [id_period, id_period]);

      let totalActualizados = 0;

      for (const student of result) {
        let nuevoEstatus = "Aprobado";
        const reprobadas = student.materias_reprobadas;

        if (reprobadas >= 1 && reprobadas <= 2) {
          nuevoEstatus = "Materia Pendiente";
          const [materiasReprobadasDetalle] = await pool.query(
            `   SELECT la_total.id_subject 
  FROM load_academic la_total
  INNER JOIN enrollments e ON e.id_period = la_total.id_period
  LEFT JOIN (
      -- Agrupamos las notas obteniendo el promedio o nota acumulada final de la materia por estudiante
      SELECT 
          g.id_student, 
          la_sub.id_subject, 
          -- Sumamos las notas multiplicadas por su porcentaje del plan si guardas cortes acumulativos,
          -- o simplemente usamos AVG/MAX según calcules la nota final en tu sistema (ej: AVG(g.grade))
          AVG(g.grade) AS nota_final_materia
      FROM grades g
      INNER JOIN evaluation_plan_details epd ON g.id_evaluation = epd.id
      INNER JOIN evaluation_plans ep ON epd.id_evaluation_plan = ep.id
      INNER JOIN load_academic la_sub ON ep.id_load_academic = la_sub.id
      GROUP BY g.id_student, la_sub.id_subject
  ) rendimiento_real ON la_total.id_subject = rendimiento_real.id_subject 
                     AND e.id_student = rendimiento_real.id_student
  WHERE la_total.id_period = ? 
    AND e.id_student = ? 
    AND IFNULL(rendimiento_real.nota_final_materia, 0) <= 10`,
            [id_period, student.id_student],
          );
          for (const materia of materiasReprobadasDetalle) {
            await pool.query(
              `INSERT INTO pending_subjects (id_student, id_subject, id_period_origin, status) 
               VALUES (?, ?, ?, 'Pendiente')`,
              [student.id_student, materia.id_subject, id_period],
            );
          }
        } else if (reprobadas >= 3) {
          nuevoEstatus = "Reprobado";
        }

        const [updateResult] = await pool.query(
          `UPDATE enrollments 
         SET status = ? 
         WHERE id_student = ? AND id_period = ? AND status = 'Activo'`,
          [nuevoEstatus, student.id_student, id_period],
        );

        if (updateResult && updateResult.affectedRows > 0) {
          totalActualizados++;
        }
      }

      await pool.query("COMMIT");

      return totalActualizados > 0;
    } catch (error) {
      console.error(
        "Error al procesar cierre de año y materias pendientes:",
        error,
      );
      throw error;
    }
  }

  /**
   * Finaliza el período actual. Calcula el año siguiente de cada student,
   * limpia su sección y lo deja listo (Pre-inscrito) para el futuro período.
   */
  static async processStartStates(id_period_actual) {
    try {
      const queryBuscarMateriasReprobadas = `
        SELECT la_total.id_subject 
        FROM load_academic la_total
        INNER JOIN (
            SELECT 
                lapso_calc.id_student,
                la.id_subject,
                SUM(lapso_calc.nota_lapso) / (SELECT COUNT(*) FROM lapses WHERE id_period = la.id_period) AS nota_final_materia
            FROM load_academic la
            INNER JOIN evaluation_plans ep ON ep.id_load_academic = la.id
            INNER JOIN (
                SELECT 
                    epd.id_evaluation_plan,
                    g.id_student,
                    CASE 
                        WHEN SUM(epd.porcentage) > 0 THEN 
                            ROUND(SUM((g.grade * epd.porcentage) / 100))
                        ELSE 0 
                    END AS nota_lapso
                FROM evaluation_plan_details epd
                INNER JOIN grades g ON g.id_evaluation = epd.id
                GROUP BY epd.id_evaluation_plan, g.id_student
            ) AS lapso_calc ON lapso_calc.id_evaluation_plan = ep.id
            WHERE la.id_period = ?
            GROUP BY lapso_calc.id_student, la.id_subject
        ) AS rendimiento_real ON rendimiento_real.id_subject = la_total.id_subject
        WHERE la_total.id_period = ? 
          AND rendimiento_real.id_student = ? 
          AND IFNULL(rendimiento_real.nota_final_materia, 0) <= 10;
      `;

      const queryRendimientoDefinitivo = `
        SELECT 
            e.id_student,
            sec.id_year AS id_year_actual,
            COUNT(DISTINCT CASE WHEN IFNULL(rendimiento_real.nota_final_materia, 0) <= 10 THEN la_total.id_subject END) AS materias_reprobadas
        FROM enrollments e
        INNER JOIN sections sec ON sec.id = e.id_section
        INNER JOIN load_academic la_total ON la_total.id_section = e.id_section AND la_total.id_period = e.id_period
        LEFT JOIN (
            SELECT 
                lapso_calc.id_student,
                la.id_subject,
                ye.id,
                SUM(lapso_calc.nota_lapso) / (SELECT COUNT(*) FROM lapses WHERE id_period = la.id_period) AS nota_final_materia
            FROM load_academic la
            INNER JOIN evaluation_plans ep ON ep.id_load_academic = la.id
            LEFT JOIN sections sec ON sec.id = la.id_section
            LEFT JOIN years ye ON ye.id = sec.id_year
            INNER JOIN (
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
            WHERE la.id_period = ?
            GROUP BY lapso_calc.id_student, la.id_subject
        ) AS rendimiento_real ON rendimiento_real.id_student = e.id_student AND rendimiento_real.id_subject = la_total.id_subject
        WHERE e.id_period = ?
        GROUP BY e.id_student, sec.id_year`;

      const [students] = await pool.query(queryRendimientoDefinitivo, [
        id_period_actual,
        id_period_actual,
      ]);

      if (students.length === 0) return false;

      for (const student of students) {
        const reprobadas = student.materias_reprobadas;
        let id_year_destino = student.id_year_actual;
        let condicionEstudiante = "Regular";

        if (reprobadas <= 2) {
          if (reprobadas > 0) {
            condicionEstudiante = "Materia Pendiente";
          }

          // Calculamos el año siguiente basándonos en el orden
          const [nextYear] = await pool.query(
            `SELECT id FROM years WHERE CAST(order_year AS UNSIGNED) = (SELECT CAST(order_year AS UNSIGNED) + 1 FROM years WHERE id = ?)`,
            [student.id_year_actual],
          );

          // CORRECCIÓN: Acceso correcto al índice [0] del resultado
          if (nextYear.length > 0) {
            id_year_destino = nextYear[0].id;
          }

          // Guardamos las materias pendientes en su historial si aplica
          if (reprobadas >= 1) {
            const [materiasAArrastrar] = await pool.query(
              queryBuscarMateriasReprobadas,
              [id_period_actual, id_period_actual, student.id_student],
            );

            for (const materia of materiasAArrastrar) {
              await pool.query(
                `INSERT INTO pending_subjects (id_student, id_subject, id_period_origin, status) 
                 VALUES (?, ?, ?, 'Pendiente')`,
                [student.id_student, materia.id_subject, id_period_actual],
              );
            }
          }
        } else {
          condicionEstudiante = "Repitiente";
        }

        // 1. Actualizamos SOLO la condición en la tabla students (ya que no tiene id_year)
        await pool.query(`UPDATE students SET \`condition\` = ? WHERE id = ?`, [
          condicionEstudiante,
          student.id_student,
        ]);

        // 2. [CIERRE] Congelamos la inscripción del período que termina como 'Activo'
        await pool.query(
          `UPDATE enrollments 
           SET status = 'Activo'
           WHERE id_student = ? AND id_period = ?`,
          [student.id_student, id_period_actual],
        );

        // 3. [PROMOCIÓN FUTURA] Creamos su fila de inscripción para el futuro
        // Ponemos id_period = NULL e id_section = NULL porque aún no inició el nuevo ciclo,
        // pero guardamos su id_year destino para saber a qué año va.
        await pool.query(
          `INSERT INTO enrollments (id_student, id_year, id_period, id_section, status) 
           VALUES (?, ?, NULL, NULL, 'Pre-inscrito')`,
          [student.id_student, id_year_destino],
        );
      }

      return true;
    } catch (error) {
      console.error("Error en processStartStates:", error);
      throw error;
    }
  }

  /**
   * Toma a todos los estudiantes pre-inscritos en el limbo, activa solo
   * una inscripción por alumno en el nuevo período y limpia duplicados.
   * @param {number} id_period_nuevo - El ID del período que está comenzando
   */
  static async activateNewPeriod(id_period_nuevo) {
    try {
      // 1. Obtenemos la lista de estudiantes únicos que están pre-inscritos
      const [preInscritos] = await pool.query(
        `SELECT DISTINCT id_student FROM enrollments WHERE id_period IS NULL AND status = 'Pre-inscrito'`,
      );

      let contadorActivados = 0;

      // 2. Procesamos a cada estudiante uno por uno de forma segura
      for (const alumno of preInscritos) {
        // Verificamos si por si acaso ya tiene una matrícula real en el periodo nuevo
        const [existe] = await pool.query(
          `SELECT id FROM enrollments WHERE id_student = ? AND id_period = ? LIMIT 1`,
          [alumno.id_student, id_period_nuevo],
        );

        if (existe.length === 0) {
          // Tomamos solo UNA de sus filas del limbo (la más nueva) y le asignamos el período nuevo
          await pool.query(
            `UPDATE enrollments 
             SET id_period = ?, status = 'Activo' 
             WHERE id_period IS NULL AND status = 'Pre-inscrito' AND id_student = ?
             LIMIT 1`,
            [id_period_nuevo, alumno.id_student],
          );
          contadorActivados++;
        }
      }

      console.log(
        `Se han activado ${contadorActivados} estudiantes únicos para el período ${id_period_nuevo}.`,
      );

      // 3. ¡LIMPIEZA CRÍTICA!: Borramos cualquier otra fila vieja o duplicada que haya quedado en el limbo
      await pool.query(
        `DELETE FROM enrollments WHERE id_period IS NULL AND status = 'Pre-inscrito'`,
      );

      return contadorActivados;
    } catch (error) {
      console.error(
        "❌ Error al activar el nuevo período para los estudiantes:",
        error,
      );
      throw error;
    }
  }

  /**
   * Actualiza la inscripción del estudiante dándole una sección definitiva.
   * @param {Number} id_student - id del estudiante
   * @param {Number} id_section - id de la sección
   * @param {Number} id_period - id del período activo
   */
  static async UpdatePreInscrip(id_student, id_section, id_period) {
    try {
      const sql = `UPDATE enrollments SET id_section = ? WHERE id_student = ? AND id_period = ?`;

      const [result] = await pool.query(sql, [
        id_section,
        id_student,
        id_period,
      ]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error("❌ Error en UpdatePreInscrip:", error);
      throw error;
    }
  }
}
