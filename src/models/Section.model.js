import { pool } from "../db.js";

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
   * Obtiene el ID del período académico por su nombre
   */
  static async getPeriodIdByName(periodName) {
    try {
      const [rows] = await pool.query(
        "SELECT id FROM academic_periods WHERE name = ? LIMIT 1",
        [periodName],
      );
      return rows[0]?.id ?? null;
    } catch (error) {
      console.error("Error al obtener el período académico:", error);
      throw error;
    }
  }

  /**
   * Crea una sección en la base de datos
   */
  static async createSection(section) {
    try {
      const [result] = await pool.query(
        "INSERT INTO sections (name, SIG, id_period, id_year, guide_id, capacity) VALUES (?, ?, ?, ?, ?, ?)",
        [
          section.name,
          section.SIG,
          section.id_period,
          section.id_year,
          section.guide_id,
          section.capacity,
        ],
      );
      return result.affectedRows > 0;
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
      const [rows] = await pool.query(
        `SELECT 
          sections.id, 
          sections.name, 
          sections.id_period, 
          sections.id_year, 
          sections.guide_id, 
          sections.capacity,
          years.name AS year_name, 
          teachers.id AS teacher_id,
          users.name AS teacher_name, 
          users.last_name AS teacher_last_name,
          (
            SELECT COUNT(e.id) 
            FROM enrollments e 
            WHERE e.id_section = sections.id 
              AND e.id_period = sections.id_period 
              AND e.status IN ('Activo','Aprobado','Retirado','Materia Pendiente','Reprobado')
          ) AS total_students
        FROM sections
        INNER JOIN years ON sections.id_year = years.id
        INNER JOIN academic_periods ap ON sections.id_period = ap.id
        LEFT JOIN teachers ON sections.guide_id = teachers.id
        LEFT JOIN users ON teachers.id_user = users.id
        WHERE sections.SIG = ? 
          AND sections.id_period = ?;`,
        [SIG, id_period],
      );
      return rows;
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
      const query = `
   SELECT
          -- Datos del Usuario
          u.id AS user_id,
          u.name AS user_name,
          
          -- Datos del Estudiante
          s.id AS student_id,
          
          -- Datos de Inscripción
          e.id AS enrollment_id,
          e.status AS enrollment_status,
          
          -- Datos de la Sección
          sec.id AS id_section,
          sec.id_period AS section_period_id,
          
          -- Parámetro enviado para comparar
          ? AS period_param_enviado
        FROM users u
        LEFT JOIN students s ON u.id = s.id_user
        LEFT JOIN enrollments e ON s.id = e.id_student
        LEFT JOIN sections sec ON e.id_section = sec.id
        WHERE u.id = ?
        ORDER BY e.id DESC
        LIMIT 1;
      `;

      const [rows] = await pool.execute(query, [id_period, id]);
      return rows.length > 0 ? rows[0] : null;
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
      s.id AS student_id,
      sec.id AS id_section,
      sec.name AS section_name,
      y.name AS year_name
    FROM students s
    INNER JOIN users u ON s.id_user = u.id
    INNER JOIN enrollments e ON s.id = e.id_student
    INNER JOIN sections sec ON e.id_section = sec.id
    INNER JOIN years y ON sec.id_year = y.id
    WHERE sec.SIG = ?          -- 1er ? -> SIG
      -- 🌟 Cambiamos s.id por s.id_user por si el parámetro es el ID de usuario
      AND s.id_user = ?        -- 2do ? -> id_student (ID de usuario de la cuenta)
      AND sec.id_period = ?    -- 3er ? -> id_period
      AND e.status IN ('Activo', 'Repitiente')
    ORDER BY e.id DESC
    LIMIT 1;
      `;

      const [rows] = await pool.execute(query, [SIG, id_section]);

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error("❌ Error en el modelo al ejecutar getSectionByID:", error);
      throw error;
    }
  }
}
