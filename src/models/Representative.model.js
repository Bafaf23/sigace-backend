import { pool } from "../db.js";

export class Representative {
  constructor(document, name, last_name, phone, relationship, repEmail) {
    this.document = document;
    this.name = name;
    this.last_name = last_name;
    this.phone = phone;
    this.relationship = relationship;
    this.repEmail = repEmail;
  }

  static async createRepresentative(representative) {
    try {
      const [resultExists] = await pool.query(
        "SELECT * FROM representatives WHERE document = ?",
        [representative.document],
      );
      if (resultExists.length > 0) {
        return resultExists[0].id;
      } else {
        const [result] = await pool.query(
          "INSERT INTO representatives (document, name, last_name, phone, relationship, repEmail) VALUES (?, ?, ?, ?, ?, ?)",
          [
            representative.document,
            representative.name,
            representative.last_name,
            representative.phone,
            representative.relationship,
            representative.repEmail,
          ],
        );
        return result.insertId;
      }
    } catch (error) {
      console.error("Error al conectar a la base de datos:", error);
      throw error;
    }
  }

  static async getRepresentativeByID(id_representative) {
    try {
      const sql = `SELECT * FROM representatives WHERE id = ?`;

      const [result] = await pool.query(sql, [id_representative]);

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error en getRepresentativeByID:", error);
      throw error;
    }
  }
}
