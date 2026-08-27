import { pool } from "../db.js";
import { prisma } from "../lib/prisma.js";

export class Sections {
  constructor(name, SIG, id_period, id_year, guide_id, capacity) {
    this.name = name;
    this.SIG = SIG;
    this.id_period = id_period;
    this.id_year = id_year;
    this.guide_id = guide_id;
    this.capacity = capacity;
  }

  /**
   * Crea una sección en la base de datos
   * @param {object} section - Objeto con la imformacion de la section
   */
  static async createSection(section) {
    try {
      return await prisma.section.create({
        data: {
          name: section.name,
          SIG: section.SIG,
          id_period: section.id_period,
          id_year: Number(section.id_year),
          guide_id: Number(section.guide_id),
          capacity: section.capacity,
        },
      });
    } catch (error) {
      console.error("Error al crear la sección:", error);
      throw error;
    }
  }

  /**
   * Obtiene las secciones de la escuela
   */
  static async getSections(SIG, id_period) {
    try {
      return prisma.section.findMany({
        where: { SIG: SIG, id_period: Number(id_period) },
      });
    } catch (error) {
      console.error("Error al obtener las secciones:", error);
      throw error;
    }
  }

  /**
   * Busca la sección actual de un estudiante junto a los datos del año escolar.
   */
  static async getSectionByStudent(SIG, id, id_period) {
    try {
      return await prisma.users.findUnique({
        where: {
          id: id,
        },
        select: {
          id: true, // user_id
          name: true, // user_name
          student_profile: {
            select: {
              id: true, // student_id
              enrollments: {
                orderBy: {
                  id: "desc", // ORDER BY e.id DESC
                },
                take: 1, // LIMIT 1
                select: {
                  id: true,
                  status: true,
                  section: {
                    select: {
                      id: true,
                      id_period: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error(
        "❌ Error en el modelo al ejecutar getSectionByStudent:",
        error,
      );
      throw error;
    }
  }

  /**
   * Obtiene una sección por su id mapeando metadatos escolares para reportes
   */
  static async getSectionByID(SIG, id_section) {
    try {
      const query = `
      SELECT
    s.id AS id_section,
    s.name AS section_name,        
    y.name AS year_name,             
    u.name AS teacher_name,         
    u.last_name AS teacher_last_name,
    u.document AS teacher_document,
    sho.name AS school_name,
    sho.SIG AS SIG,
    sho.DEA_CODE AS school_code,
    sho.logo_school,
    acp.name AS period
  FROM sections s
  -- 1. Conectamos con el año escolar asignado a la sección
  INNER JOIN years y ON s.id_year = y.id
  -- 2. Conectamos con el profesor guía de la sección
  INNER JOIN teachers t ON s.guide_id = t.id
  INNER JOIN schools sho ON s.SIG = sho.SIG
  INNER JOIN academic_periods acp ON s.id_period = acp.id
  -- 3. Conectamos con los datos personales del profesor en la tabla de usuarios
  INNER JOIN users u ON t.id_user = u.id
  WHERE s.SIG = ? AND s.id = ?;
    `;

      // 🌟 ¡CORREGIDO!: Ahora pasamos los 3 argumentos que la query necesita en orden exacto
      const [rows] = await pool.execute(query, [SIG, id_section]);

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error("❌ Error en el modelo al ejecutar getSectionByID:", error);
      throw error;
    }
  }
}
