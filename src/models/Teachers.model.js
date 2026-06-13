import { connectToDatabase, closeDatabaseConnection } from "../db.js";
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
   * Formateo manual ultra-compatible y libre de errores de sintaxis.
   */
  static async getAllTeachersWithLoad({ SIG }) {
    let db;
    try {
      db = await connectToDatabase();
      const [rows] = await db.query(
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
          -- 🌟 Armamos el JSON string de forma milimétrica
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
              ),
              ']'
            )
          END AS academic_load
       FROM teachers t 
       INNER JOIN users u ON t.id_user = u.id 
       
       -- 🌟 LEFT JOINs vinculados al periodo activo de la institución
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
          console.log("String corrupto obtenido:", teacher.academic_load); // Por si necesitas debuguear
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
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }
}