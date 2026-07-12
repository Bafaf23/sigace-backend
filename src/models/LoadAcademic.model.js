import { pool } from "../db.js";
export class LoadAcademic {
  constructor(
    id,
    id_teacher,
    SIG,
    id_section,
    id_period,
    id_subject,
    created_at,
  ) {
    this.id = id;
    this.id_teacher = id_teacher;
    this.SIG = SIG;
    this.id_section = id_section;
    this.id_period = id_period;
    this.id_subject = id_subject;
    this.created_at = created_at;
  }

  static async createLoadAcademic(loadAcademic) {
    try {
      const query = `INSERT INTO load_academic (id_teacher, SIG, id_section, id_period, id_subject, created_at) VALUES (?, ?, ?, ?, ?, ?)`;
      const values = [
        loadAcademic.id_teacher,
        loadAcademic.SIG,
        loadAcademic.id_section,
        loadAcademic.id_period,
        loadAcademic.id_subject,
        loadAcademic.created_at,
      ];
      const result = await pool.query(query, values);
      return true;
    } catch (error) {
      console.error("Error al crear el registro de carga académica:", error);
      return false;
    }
  }

  static async getLoadAcademic(SIG) {
    try {
      const query = `SELECT 
    la.*, 
    se.name AS name_section, 
    y.name AS name_year, 
    p.name AS name_period, 
    su.name AS name_subject, 
    u.name AS name_teacher, 
    u.last_name AS last_name_teacher
FROM load_academic la
-- Cambiados a INNER JOIN porque la carga académica depende obligatoriamente de ellos
INNER JOIN sections se ON la.id_section = se.id
INNER JOIN academic_periods p ON la.id_period = p.id
INNER JOIN subjects su ON la.id_subject = su.code_subject
-- Mantenemos LEFT JOIN por si un año o profesor fue eliminado en cascada/desactivado
LEFT JOIN years y ON se.id_year = y.id
LEFT JOIN teachers t ON la.id_teacher = t.id
LEFT JOIN users u ON t.id_user = u.id

WHERE la.SIG = ? 
  AND p.is_active = 1;`;
      const [rows] = await pool.query(query, [SIG]);
      return rows;
    } catch (error) {
      console.error("Error al obtener el registro de carga académica:", error);
      throw error;
    }
  }
}
