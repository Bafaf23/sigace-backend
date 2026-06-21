import { connectToDatabase, closeDatabaseConnection } from "../db.js";

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
   * @param {string} periodName - Nombre del período académico
   * @returns {Promise<number>} - ID del período académico
   */
  static async getPeriodIdByName(periodName) {
    let db;
    try {
      db = await connectToDatabase();
      const [rows] = await db.query(
        "SELECT id FROM academic_periods WHERE name = ? LIMIT 1",
        [periodName],
      );
      return rows[0]?.id ?? null;
    } catch (error) {
      console.error("Error al obtener el período académico:", error);
      throw error;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }

  /**
   * Crea una sección en la base de datos
   * @param {object} section - Objecto con los datos de la sección
   * @param {string} section.name - Nombre de la sección
   * @param {string} section.SIG - SIG de la escuela
   * @param {number} section.id_period - ID del período académico
   * @param {number} section.id_year - ID del año académico
   * @param {number} section.guide_id - ID del guía de la sección
   * @param {number} section.capacity - Capacidad de la sección
   * @returns {Promise<boolean>} - True si la sección se creó correctamente, false en caso contrario
   */
  static async createSection(section) {
    let db;
    try {
      db = await connectToDatabase();
      const [result] = await db.query(
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
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }

  /**
   ** Obtiene las secciones de la escuela
   * @param {string} SIG - SIG de la escuela
   * @param {number} id_period id del periodo academico
   * @returns {Promise<Array<object>>} - Array de secciones
   */
  static async getSections(SIG, id_period) {
    let db;
    try {
      db = await connectToDatabase();
      const [rows] = await db.query(
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
    
    -- Contamos los alumnos activos inscritos en esta sección y período
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
-- LEFT JOIN clave: si la sección no tiene profesor, igual se muestra
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
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }

  /**
   * Busca la sección actual de un estudiante junto a los datos del año escolar.
   * @param {string} SIG - Código de la institución
   * @param {number} id_student - ID del estudiante (s.id)
   * @returns {object|null} - Datos de la sección y año, o null si no se encuentra
   */
  static async getSectionByStudent(SIG, id_student) {
    let db = null; // Inicializamos en null para el bloque finally
    try {
      db = await connectToDatabase();

      const query = `
      SELECT
        s.id AS student_id,          -- Cambiado para evitar confusiones de ID
        sec.id AS id_section,
        sec.name AS section_name,
        y.name AS year_name
      FROM students s
      INNER JOIN enrollments e ON s.id = e.id_student
      INNER JOIN sections sec ON e.id_section = sec.id
      INNER JOIN years y ON sec.id_year = y.id
      WHERE s.id = ? 
        AND sec.SIG = ?              -- Validamos que la sección pertenezca al colegio consultado
        AND e.status IN ('Activo', 'Repitiente')
      ORDER BY e.id DESC
      LIMIT 1;
    `;

      // Se usa db.execute para aprovechar sentencias preparadas nativas de MariaDB
      const [rows] = await db.execute(query, [Number(id_student), SIG]);

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(
        "❌ Error en el modelo al ejecutar getSectionByStudent:",
        error,
      );
      throw error; // Re-lanzamos para que el controlador pueda manejar el HTTP status 500
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }

  /**
   ** Obtiene una seccion por su id de un colegio
   * @param {string} SIG - codigo unico del colegio
   * @param {number} id_section - ID de la seccion
   * @returns {<object>} La seccion
   */
  static async getSectionByID(SIG, id_section) {
    let db;
    try {
      db = await connectToDatabase();
      const query = `SELECT 
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
  WHERE s.SIG = ? AND s.id = ?;`;

      const section = await db.query(query, [SIG, id_section]);
      return section[0];
    } catch (error) {
      console.log(error);
    }
  }
}
