import { pool } from "../db.js";
import { prisma } from "../lib/prisma.js";
import logger from "../utils/logger.js";

export class Enrollments {
  constructor(id_student, id_period, id_section, status) {
    this.id_student = id_student;
    this.id_period = id_period;
    this.id_section = id_section;
    this.status = status;
  }

  /**
   ** En lista todo los periodos academicos de un estudiante
   * @param {number} id_student - id del estudiante
   * @param {object}
   */
  static async periodEnrollmentStudent(id_student) {
    try {
      const row = await prisma.enrollment.findMany({
        where: {
          id_student: Number(id_student),
        },
        select: {
          status: true,
          period: {
            select: {
              id: true,
              name: true,
            },
          },
          section: {
            select: {
              id: true,
              name: true,
              year: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });
      return row;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea la inscripsion del estudiante en el sistema
   */
  static async createEnrollment(enrollment) {
    try {
      const result = await prisma.enrollment.create({
        data: {
          id_student: Number(enrollment.id_student),
          id_period: Number(enrollment.id_period),
          id_section: Number(enrollment.id_section),
          id_year: Number(enrollment.id_year),
          status: enrollment.status,
        },
      });
      return result;
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
      const students = await prisma.enrollment.findMany({
        where: {
          id_period: Number(id_period),
          status: {
            in: ["aprobado", "materia_pendiente"],
          },
        },
        include: {
          student: {
            select: {
              tuition_number: true,
              id_user: true,
              enrollments: {
                select: {
                  id_year: true,
                  year: true,
                },
              },
              user: {
                select: {
                  name: true,
                  last_name: true,
                  id_card: true,
                },
              },
            },
          },
        },
      });

      return students.map((student) => ({
        name: student.student.user.name,
        last_name: student.student.user.last_name,
        id_card: student.student.user.id_card,
        tuition_number: student.student.tuition_number,
        status: student.status,
        year: student.student.enrollments,
      }));
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * *Cambia el estatus de los estudiantes en su inscripcion de "activo":
   ** "aprobado": si cumple con el minimo aprobatorio para avanzar el siguiente año superior.
   ** "reprobado": si no cumple con el minimo para ser promovido.
   ** "materia pendiente": si tiene un maximo de tres materias reprobadas.
   * @param {object} params
   * @param {number} params.idStudent - ID del estudiante
   * @param {number} params.idPeriod - ID del período
   * @param {string} params.status - Nuevo estado
   * @returns {Promise<boolean>} Indica si la matrícula quedó con el estado solicitado
   */
  static async changeStatusEnrollment({ idStudent, idPeriod, status }) {
    try {
      const enrollment = await prisma.enrollment.update({
        where: {
          unique_student_period: {
            id_student: Number(idStudent),
            id_period: Number(idPeriod),
          },
        },
        data: {
          status,
        },
      });
      return enrollment.status === status;
    } catch (error) {
      console.error(
        "Error al procesar cierre de año y materias pendientes:",
        error,
      );
      throw error;
    }
  }

  static async calculationOfPromotedStudents(idPeriod) {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        id_period: idPeriod,
        status: "activo",
      },
      select: {
        id_section: true,
        id_student: true,
        student: {
          select: {
            tuition_number: true,
            user: {
              select: {
                name: true,
                last_name: true,
              },
            },
            grades: {
              where: {
                evaluation: {
                  evaluation_plan: {
                    load_academic: {
                      id_period: idPeriod,
                    },
                  },
                },
              },
              select: {
                grade: true,
                evaluation: {
                  select: {
                    porcentage: true,
                    evaluation_plan: {
                      select: {
                        id_lapse: true,
                        load_academic: {
                          select: {
                            id_subject: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const result = enrollments.reduce((students, enrollment) => {
      const studentId = enrollment.id_student;
      students[studentId] ??= {};

      for (const grade of enrollment.student.grades) {
        const evaluationPlan = grade.evaluation.evaluation_plan;
        const subjectId = evaluationPlan.load_academic.id_subject;
        const lapseId = evaluationPlan.id_lapse;

        students[studentId][subjectId] ??= {};
        students[studentId][subjectId][lapseId] ??= 0;
        students[studentId][subjectId][lapseId] +=
          (Number(grade.grade ?? 0) *
            Number(grade.evaluation.porcentage ?? 0)) /
          100;
      }

      return students;
    }, {});

    const finalGrades = Object.fromEntries(
      Object.entries(result).map(([studentId, subjects]) => [
        studentId,
        Object.fromEntries(
          Object.entries(subjects).map(([subjectId, lapses]) => {
            const lapseGrades = Object.values(lapses).map(Math.round);
            const average =
              lapseGrades.reduce((sum, grade) => sum + grade, 0) /
              lapseGrades.length;

            return [subjectId, Math.round(average)];
          }),
        ),
      ]),
    );

    for (const enrollment of enrollments) {
      const definitiveGrades = Object.values(
        finalGrades[enrollment.id_student] ?? {},
      );

      if (definitiveGrades.length === 0) continue;

      const failedSubjects = definitiveGrades.filter(
        (grade) => grade <= 10,
      ).length;
      const status =
        failedSubjects === 0
          ? "aprobado"
          : failedSubjects <= 2
            ? "materia_pendiente"
            : "reprobado";

      await Enrollments.changeStatusEnrollment({
        idStudent: enrollment.id_student,
        idPeriod,
        status,
      });
    }

    return finalGrades;
  }

  /**
   * Finaliza el período actual. Calcula el año siguiente de cada student,
   * limpia su sección y lo deja listo (Pre-inscrito) para el futuro período.
   */
  static async processStartStates(idPerido) {
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
