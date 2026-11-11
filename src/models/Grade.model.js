import { pool } from "../db.js";
import { prisma } from "../lib/prisma.js";
import { Enrollments } from "./Enrollments.model.js";

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
   * @param {number} gred.id_evaluation  - Id de la evaluacion
   * @param {number} gred.tuition_number - id del estudiante
   * @param {number} gred.grade - la calificacion
   * @returns {Promise<boolean>}
   */
  static async create({ id_evaluation, tuition_number, grade }) {
    try {
      return await prisma.grade.create({
        data: {
          id_evaluation: Number(id_evaluation),
          tuition_number: tuition_number,
          grade: grade,
        },
      });
    } catch (error) {
      console.error(`Ha ocurrido un error inesperado: ${error}`);
    }
  }

  /**
   * Obtiene la nota definitiva por materia (promedio de los 3 lapsos) por alumno.
   *
   * @param {Array} id_load_academics - ID de la carga académica (asignación docente-materia-sección).
   * @returns {Promise<Object>} Objeto con las definitivas finales por estudiante y materia.
   */
  static async getBySection(id_load_academics) {
    try {
      const loadAcademicIds = Array.isArray(id_load_academics)
        ? id_load_academics.map(Number)
        : [Number(id_load_academics)];

      const grades = await prisma.grade.findMany({
        where: {
          evaluation: {
            evaluation_plan: {
              id_load_academic: {
                in: loadAcademicIds,
              },
            },
          },
        },
        select: {
          id: true,
          grade: true,
          id_student: true,
          id_evaluation: true,
          student: {
            select: {
              id: true,
              id_user: true,
              gender: true,
              tuition_number: true,
              birth_date: true,
              user: {
                select: {
                  id_card: true,
                  name: true,
                  last_name: true,
                },
              },
            },
          },
          evaluation: {
            select: {
              id: true,
              porcentage: true,
              activity: true,
              evaluation_plan: {
                select: {
                  id_lapse: true,
                  id_load_academic: true,
                  load_academic: {
                    select: {
                      id_subject: true,
                      subject: {
                        select: {
                          code_subject: true,
                          abbreviation: true,
                          name: true,
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

      // 1. Agrupar por: Alumno -> Materia -> Lapso
      const lapsesMap = grades.reduce((acc, curr) => {
        const studentTuitionNumber = curr.student?.tuition_number;
        const subject =
          curr.evaluation?.evaluation_plan?.load_academic?.subject
            ?.abbreviation;
        const lapseId = curr.evaluation?.evaluation_plan?.id_lapse;

        if (!studentTuitionNumber || !subject || !lapseId) return acc;

        const rawGrade = curr.grade;
        const grade =
          rawGrade !== null && rawGrade !== undefined
            ? typeof rawGrade.toNumber === "function"
              ? rawGrade.toNumber()
              : Number(rawGrade)
            : 0;

        const percentage = Number(curr.evaluation?.porcentage) || 0;
        const aporteEvaluacion = (grade * percentage) / 100;

        if (!acc[studentTuitionNumber]) {
          acc[studentTuitionNumber] = {};
        }

        if (!acc[studentTuitionNumber][subject]) {
          acc[studentTuitionNumber][subject] = {};
        }

        if (!acc[studentTuitionNumber][subject][lapseId]) {
          acc[studentTuitionNumber][subject][lapseId] = 0;
        }

        // Sumar el porcentaje de esta evaluación dentro de su lapso
        acc[studentTuitionNumber][subject][lapseId] += aporteEvaluacion;

        return acc;
      }, {});

      // 2. Promediar las notas acumuladas de los lapsos para obtener la definitiva final
      const finalGradesMap = {};

      Object.keys(lapsesMap).forEach((student) => {
        finalGradesMap[student] = {};

        Object.keys(lapsesMap[student]).forEach((subject) => {
          const lapses = lapsesMap[student][subject];
          const lapseKeys = Object.keys(lapses);

          // Suma de la nota final redondeada de cada lapso
          const sumLapseGrades = lapseKeys.reduce((sum, lapseId) => {
            return sum + Math.round(lapses[lapseId]);
          }, 0);

          // Promedio entre los 3 lapsos (o la cantidad de lapsos registrados)
          const totalLapses = lapseKeys.length || 1;
          const finalAverage = sumLapseGrades / totalLapses;

          // Nota definitiva final redondeada
          finalGradesMap[student][subject] = Math.round(finalAverage);
        });
      });

      return finalGradesMap;
    } catch (error) {
      console.error(`❌ Error en Grade.getBySection: ${error.message}`);
      throw error;
    }
  }

  /**
   * TODO: investigar si sirve para algo esto
   * Obtener el resumen de notas agrupado por asignaturas para la boleta
   * @param {string} SIG - Código de la institución
   * @param {number} idStudent - ID del estudiante
   * @param {number} idSection - ID de la sección actual
   * @returns {Array<object>} Rows con el consolidado por materia
   */
  static async getGradesForBoleta(SIG, idStudent, idSection) {
    try {
      const [periodResult] = await pool.query(
        "SELECT id FROM academic_periods WHERE SIG = ? AND is_active = 1 LIMIT 1",
        [SIG],
      );

      let periodId = periodResult[0]?.id;
      if (!periodId) {
        const [lastPeriod] = await pool.query(
          "SELECT id FROM academic_periods WHERE SIG = ? ORDER BY id DESC LIMIT 1",
          [SIG],
        );
        periodId = lastPeriod[0]?.id || 0;
      }

      const [lapsesResult] = await pool.query(
        "SELECT id FROM lapses WHERE id_period = ? ORDER BY id ASC",
        [periodId],
      );

      const lapse1_id = lapsesResult[0]?.id || 0;
      const lapse2_id = lapsesResult[1]?.id || 0;
      const lapse3_id = lapsesResult[2]?.id || 0;

      console.log(
        `📋 Lapsos del Periodo (ID: ${periodId}): M1=${lapse1_id}, M2=${lapse2_id}, M3=${lapse3_id}`,
      );

      const query = `
      SELECT 
        sub.code_subject AS subject_id,
        sub.name AS subject_name,
        
        -- Momento 1 (Inmune a NULLs gracias a IFNULL)
        ROUND(SUM(CASE WHEN plan.id_lapse = ? 
          THEN IFNULL(g.grade, 0) * (IFNULL(det.porcentage, 0) / 100) ELSE 0 END), 2) AS momento_1,
          
        -- Momento 2
        ROUND(SUM(CASE WHEN plan.id_lapse = ? 
          THEN IFNULL(g.grade, 0) * (IFNULL(det.porcentage, 0) / 100) ELSE 0 END), 2) AS momento_2,
          
        -- Momento 3
        ROUND(SUM(CASE WHEN plan.id_lapse = ? 
          THEN IFNULL(g.grade, 0) * (IFNULL(det.porcentage, 0) / 100) ELSE 0 END), 2) AS momento_3,
          
        -- Nota Definitiva del Año (Promedio exacto de los 3 momentos)
        ROUND(
          (
            SUM(CASE WHEN plan.id_lapse = ? THEN IFNULL(g.grade, 0) * (IFNULL(det.porcentage, 0) / 100) ELSE 0 END) +
            SUM(CASE WHEN plan.id_lapse = ? THEN IFNULL(g.grade, 0) * (IFNULL(det.porcentage, 0) / 100) ELSE 0 END) +
            SUM(CASE WHEN plan.id_lapse = ? THEN IFNULL(g.grade, 0) * (IFNULL(det.porcentage, 0) / 100) ELSE 0 END)
          ) / 3, 2
        ) AS definitiva_ano
      FROM load_academic ld
      INNER JOIN subjects sub ON ld.id_subject = sub.code_subject
      LEFT JOIN evaluation_plans plan ON plan.id_load_academic = ld.id
      LEFT JOIN evaluation_plan_details det ON det.id_evaluation_plan = plan.id
      LEFT JOIN grades g ON g.id_evaluation = det.id AND g.id_student = ?
      WHERE ld.id_section = ?
      GROUP BY sub.code_subject, sub.name
      ORDER BY sub.name ASC;
    `;

      const [rows] = await pool.query(query, [
        lapse1_id,
        lapse2_id,
        lapse3_id,
        lapse1_id,
        lapse2_id,
        lapse3_id,
        idStudent,
        idSection,
      ]);

      console.log(
        `📊 Materias devueltas con éxito para el PDF: ${rows.length}`,
      );
      return rows;
    } catch (error) {
      console.error(`❌ Error crítico en getGradesForBoleta: ${error}`);
      return [];
    }
  }

  /**
   ** Obtiene todas las calificaciones de una sección crudas para armar la sábana de notas en el controlador
   * @param {Object} param0
   * @param {string} param0.id_lapse
   * @param {number} param0.id_section
   * @param {string} param0.SIG
   */
  static async gradesSheetNote({ id_lapse, id_section, SIG }) {
    try {
      const rows = await prisma.enrollment.findMany({
        where: {
          id_section: id_section,
          status: {
            in: ["activo", "materia_pendiente"],
          },
          // Condición sobre la relación con la sección (sec.SIG = ?)
          section: {
            SIG: SIG,
          },
        },
        select: {
          status: true,
          // 1. Datos del Estudiante
          student: {
            select: {
              user: {
                select: {
                  id_card: true,
                  name: true,
                  last_name: true,
                },
              },
            },
          },
          // 2. Carga Académica de la Sección y Período
          section: {
            select: {
              load_academics: {
                // Filtramos la carga académica por el mismo período de la matrícula
                where: {
                  // Nota: Si relacionaste id_period en tu schema, Prisma lo resuelve dinámicamente
                },
                select: {
                  // Datos de la Asignatura (Subject)
                  subject: {
                    select: {
                      name: true,
                      code_subject: true,
                      abbreviation: true,
                    },
                  },

                  evaluation_plans: {
                    where: {
                      id_lapse: id_lapse,
                    },
                    select: {
                      details: {
                        select: {
                          porcentage: true,
                          date: true,
                          // Calificaciones filtradas por el estudiante de la matrícula (g.id_student = est.id)
                          grades: {
                            where: {
                              // El filtro por id_student se aplica dinámicamente o mediante inclusión
                            },
                            select: {
                              grade: true,
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
        orderBy: {
          student: {
            user: {
              last_name: "asc",
            },
          },
        },
      });

      console.dir(rows, { depth: null, color: true });

      const formatSheetNoteData = (rows) => {
        if (!rows || rows.length === 0) {
          return { subjects: [], students: [] };
        }

        // 1. Extraer materias únicas desde la carga académica de la primera matrícula
        const sampleLoad = rows[0]?.section?.load_academics || [];
        const subjects = sampleLoad.map((la) => ({
          code: la.subject.code_subject,
          name: la.subject.name,
          abbreviation: la.subject.abbreviation,
        }));

        // 2. Procesar y mapear la lista de estudiantes con sus calificaciones
        const students = prismaData.map((item) => {
          const studentUser = item.student?.user || {};
          const loadAcademics = item.section?.load_academics || [];

          // Mapeamos las notas por materia para este estudiante
          const gradesBySubject = {};

          loadAcademics.forEach((la) => {
            const subCode = la.subject.code_subject;
            const evalPlans = la.evaluation_plans || [];

            // Extraer evaluaciones y notas
            const evaluations = evalPlans.flatMap((plan) =>
              (plan.details || []).map((detail) => ({
                porcentage: detail.porcentage,
                date: detail.date,
                grade: detail.grades?.[0]?.grade ?? null,
              })),
            );

            // Calcular nota definitiva o promedio acumulado del lapso
            const totalGrade = evaluations.reduce(
              (acc, ev) => acc + (ev.grade || 0),
              0,
            );

            gradesBySubject[subCode] = {
              evaluations,
              finalGrade: evaluations.length > 0 ? totalGrade : null,
            };
          });

          return {
            id_card: studentUser.id_card,
            name: studentUser.name,
            last_name: studentUser.last_name,
            fullName:
              `${studentUser.last_name || ""}, ${studentUser.name || ""}`.trim(),
            grades: gradesBySubject,
          };
        });

        return {
          subjects,
          students,
        };
      };
      return formatSheetNoteData;
    } catch (error) {
      console.error("❌ Error en getGradesForSheetNote:", error);
      throw error;
    }
  }

  /**
   * Obtiene todas las calificaciones de un estudiante segun carga academica junto con las actividades
   * @param {number} idLoadAcademic
   * @param {number} idEvaluation
   */
  static async getGradeByLoadAcadsemic(idLoadAcademic) {
    try {
      const rows = await prisma.evaluation_plan_detail.findMany({
        where: {
          evaluation_plan: {
            id_load_academic: Number(idLoadAcademic),
          },
        },
        select: {
          id: true,
          date: true,
          referent_teorical: true,
          activity: true,
          porcentage: true,
          evaluation_plan: {
            select: {
              lapse: {
                select: {
                  id: true,
                  name: true,
                },
              },
              load_academic: {
                select: {
                  subject: {
                    select: {
                      name: true,
                      code_subject: true,
                    },
                  },
                },
              },
            },
          },
          grades: {
            select: {
              id: true,
              grade: true,
              student: {
                select: {
                  tuition_number: true,
                  id: true,
                },
              },
            },
          },
        },
      });

      const gardePorce = rows.flatMap((item) =>
        item.grades.map((g) => ({
          evaluation_id: item.id,
          tuition_number: g.student?.tuition_number,
          grade: Number(g.grade),
        })),
      );

      console.dir(gardePorce, { depth: null, color: true });

      return gardePorce;
    } catch (err) {}
  }
}
