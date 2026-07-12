import { pool } from "../db.js";
export class Academic_periods {
  constructor(name, start_date, end_date, is_active, SIG) {
    this.id;
    this.name = name;
    this.start_date = start_date;
    this.end_date = end_date;
    this.is_active = is_active;
    this.SIG = SIG;
  }
  /**
   * crea un nuevo periodo académico
   * @param {{ name: string, start_date: string, end_date: string, is_active?: boolean }} academicPeriodModel
   * @returns id del nuevo perido
   */
  static async createAcademicPeriod(academicPeriodModel) {
    try {
      const [result] = await pool.query(
        "INSERT INTO academic_periods (name, start_date, end_date, is_active, SIG) VALUES (?, ?, ?, ?, ?)",
        [
          academicPeriodModel.name,
          academicPeriodModel.start_date,
          academicPeriodModel.end_date,
          academicPeriodModel.is_active ?? true,
          academicPeriodModel.SIG,
        ],
      );

      return result.insertId;
    } catch (error) {
      console.error(error);
      throw error;
    } 
  }

  /**
   * CORREGIDO: Obtiene TODOS los periodos académicos de una institución (tanto activos como históricos)
   * Ordenados por ID descendente para tener los más recientes al principio.
   * @param {string} SIG
   * @returns {Promise<Array<object>>} Array con todos los periodos
   */
  static async getAcademicPeriods(SIG) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM academic_periods WHERE SIG = ? ORDER BY id DESC`,
        [SIG],
      );
      // Retorna el array completo (vacío si no hay filas), permitiendo métodos de array en el controlador
      return rows;
    } catch (error) {
      console.error("Error en getAcademicPeriods:", error);
      throw error;
    } 
  }

  /**
   * finaliza un periodo académico
   * @param {string} SIG
   * @returns {boolean} success
   */
  static async endAcademicPeriod(SIG) {
    try {
      const [result] = await pool.query(
        "UPDATE academic_periods SET is_active = 0 WHERE SIG = ?",
        [SIG],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error(error);
      throw error;
    } 
  }

  /**
   ** Verifica si existe al menos un período académico activo en el sistema.
   * @param {string} SIG codigo inico del colegio
   * @returns {Promise<boolean>} True si hay un período activo, False de lo contrario.
   */
  static async hasActivePeriod(SIG) {
    try {
      const [rows] = await pool.query(
        `SELECT id FROM academic_periods WHERE is_active = 1 AND  SIG = ? LIMIT 1`,
        [SIG],
      );
      // Retorna true si encontró registros válidos
      return rows && rows.length > 0;
    } catch (error) {
      console.error("Error en Academic_periods.hasActivePeriod:", error);
      throw error; // Dejar que el controlador maneje el error general
    }
  }

  /**
   ** En lista todo los periodos academicos de un estudiante
   * @param {number} id_student - id del estudiante
   * @param {object}
   */
  static async getPeriodEnrollmentStudent(id_student) {
    try {
      const sql = `SELECT 
        ap.id AS id_period,
        ap.name AS school_year,        -- Ej: "Año Escolar 2025 - 2026"
        y.name AS year_level,          -- Ej: "4to Año"
        sc.name AS section_name,       -- Ej: "A"
        en.status AS enrollment_status -- Ej: "Inscrito"
  FROM enrollments en
  INNER JOIN academic_periods ap ON en.id_period = ap.id
  INNER JOIN sections sc ON en.id_section = sc.id
  INNER JOIN years y ON sc.id_year = y.id
  WHERE en.id_student = ?          -- El ID del alumno que consultas
  ORDER BY ap.start_date DESC;     -- Trae el más reciente primero`;

      const params = [id_student];

      const row = await pool.execute(sql, params);
      return row;
    } catch (error) {
      throw error;
    }
  }
}
