import { pool } from "../db.js";
import { prisma } from "../lib/prisma.js";

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
  static async create({ id_evaluation, id_student, grade }) {
    console.log("ID de evaluación a insertar:", id_evaluation);
    try {
      return await prisma.grade.create({
        data: {
          id_evaluation: Number(id_evaluation),
          id_student: Number(id_student),
          grade: grade,
        },
      });
    } catch (error) {
      console.error(`Ha ocurrido un error inesperado: ${error}`);
    }
  }

  /**
   ** Obtiene las notas de una seccion completa. La lista de 35 estudiantes con sus notas de un perido especifico
   * @param {object} getG
   * @param {number} getG.idStudent - Id Estudiante
   * @param {number} getG.idEvaluation Id Evaluacion
   * @param {number} getG.idLapse - Id Lapso
   * @returns {Array<object>}
   */
  static async getBySectionSubject({ idStudent, idPeriod, idSubjetc }) {
    try {
      const rows = await prisma.grade.findMany({
        where: {
          id_student: idStudent,
        },
      });
      return gradesStudent;
    } catch (error) {
      console.log(`Error en modelo grade: ${error}`);
    }
  }

  /**
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
}
