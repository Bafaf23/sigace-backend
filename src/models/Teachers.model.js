import { pool } from "../db.js";
export class Teachers {
  constructor(id, id_user, SIG, is_active) {
    this.id = id;
    this.id_user = id_user;
    this.SIG = SIG;
    this.is_active = is_active;
  }

  /**
   * Obtiene todos los profesores registrados con su respectiva carga académica
   * del periodo activo inyectada en un array.
   */
  static async getAllTeachersWithLoad({ SIG }) {
   
    try {
     
      await pool.query("SET SESSION group_concat_max_len = 1000000;");


      const [rows] = await pool.query(
        `SELECT 
          t.id AS id_teacher, 
          t.id_user, 
          t.SIG, 
          t.is_active, 
          u.name, 
          u.last_name, 
          u.email, 
          u.phone, 
          u.document,
          CASE 
            WHEN ld.id IS NULL THEN '[]'
            ELSE CONCAT(
              '[',
              GROUP_CONCAT(
                CONCAT(
                  '{"id_load_academic":', ld.id,
                  ',"id_section":', sec.id,
                  ',"section_name":"', sec.name, '"',
                  ',"year_name":"', y.name, '"',
                  ',"subject_name":"', s.name, '"',
                  ',"code_subject":"', s.code_subject, '"}'
                )
                SEPARATOR ',' -- 🌟 ¡Crucial! Separa correctamente cada objeto con una coma
              ),
              ']'
            )
          END AS academic_load
        FROM teachers t 
        INNER JOIN users u ON t.id_user = u.id 
        
        LEFT JOIN load_academic ld ON t.id = ld.id_teacher 
          AND ld.id_period = (SELECT id FROM academic_periods WHERE is_active = 1 AND SIG = t.SIG LIMIT 1)
        LEFT JOIN subjects s ON ld.id_subject = s.code_subject
        LEFT JOIN sections sec ON ld.id_section = sec.id
        LEFT JOIN years y ON sec.id_year = y.id
        
        WHERE t.SIG = ?
        
        GROUP BY t.id, u.id
        ORDER BY u.last_name ASC, u.name ASC;`,
        [SIG],
      );

      // Parseamos de forma segura la cadena a array de JavaScript
      return rows.map((teacher) => {
        let parsedLoad = [];
        try {
          parsedLoad =
            typeof teacher.academic_load === "string"
              ? JSON.parse(teacher.academic_load)
              : teacher.academic_load || [];
        } catch (parseError) {
          console.error(
            `⚠️ Error al parsear carga del profesor ${teacher.id_teacher}:`,
            parseError,
          );
          console.log("String corrupto obtenido:", teacher.academic_load);
          parsedLoad = [];
        }

        return {
          ...teacher,
          academic_load: parsedLoad,
        };
      });
    } catch (error) {
      console.error(
        "❌ Error al obtener profesores con carga académica masiva:",
        error,
      );
      throw error;
    }
  }

  /**
   * Obtiene un profesor específico con su respectiva carga académica
   * del periodo activo inyectada en un array.
   * @param {string} SIG - Código de la institución
   * @param {number} id_teacher - ID de usuario del profesor (u.id / id_user)
   * @returns {Promise<object|null>} - Datos del profesor con su carga o null
   */
  static async getTeacherWithLoadByID(SIG, id_teacher) {
    
    try {

      const sql = `
        SELECT 
          t.id AS id_teacher, 
          t.id_user, 
          t.SIG, 
          t.is_active, 
          u.name, 
          u.last_name, 
          u.email, 
          u.phone, 
          u.document,
          ld.id AS id_load_academic,
          sec.id AS id_section,
          sec.name AS section_name,
          y.name AS year_name,
          s.name AS subject_name,
          s.code_subject
        FROM teachers t 
        INNER JOIN users u ON t.id_user = u.id 
        
        -- LEFT JOINs vinculados al periodo activo de la institución
        LEFT JOIN load_academic ld ON t.id = ld.id_teacher 
          AND ld.id_period = (SELECT id FROM academic_periods WHERE is_active = 1 AND SIG = t.SIG LIMIT 1)
        LEFT JOIN subjects s ON ld.id_subject = s.code_subject
        LEFT JOIN sections sec ON ld.id_section = sec.id
        LEFT JOIN years y ON sec.id_year = y.id
        
        WHERE t.SIG = ? AND t.id_user = ?;
      `;

      const [rows] = await pool.execute(sql, [SIG, Number(id_teacher)]);

      // Si no devolvió filas, es porque el profesor no existe en ese colegio
      if (rows.length === 0) return null;

      // 🧠 Agrupamos las filas manteniendo la referencia del objeto 'acc' intacta
      const teacherData = rows.reduce((acc, row) => {
        // En la primera vuelta, inyectamos las propiedades en el objeto existente
        if (!acc.id_teacher) {
          acc.id_teacher = row.id_teacher;
          acc.id_user = row.id_user;
          acc.SIG = row.SIG;
          acc.is_active = row.is_active;
          acc.name = row.name;
          acc.last_name = row.last_name;
          acc.email = row.email;
          acc.phone = row.phone;
          acc.document = row.document;
          acc.academic_load = []; // Array limpio para acumular
        }

        // Si la fila tiene una carga académica válida, la pusheamos
        if (row.id_load_academic) {
          acc.academic_load.push({
            id_load_academic: row.id_load_academic,
            id_section: row.id_section,
            section_name: row.section_name,
            year_name: row.year_name,
            subject_name: row.subject_name,
            code_subject: row.code_subject,
          });
        }

        return acc;
      }, {});

      return teacherData;
    } catch (error) {
      console.error(
        `❌ Error al obtener la carga académica del profesor ${id_teacher}:`,
        error,
      );
      throw error;
    } 
  }
}
