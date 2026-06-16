import { connectToDatabase, closeDatabaseConnection } from "../db.js";

export class Representative {
  constructor(
    document,
    name,
    last_name,
    phone,
    relationship,
    repEmail,
    birthCertificate,
  ) {
    this.document = document;
    this.name = name;
    this.last_name = last_name;
    this.phone = phone;
    this.relationship = relationship;
    this.repEmail = repEmail;
    this.birthCertificate = birthCertificate;
  }

  static async createRepresentative(representative) {
    let db;
    try {
      db = await connectToDatabase();
      const [resultExists] = await db.query(
        "SELECT * FROM representatives WHERE document = ?",
        [representative.document],
      );
      if (resultExists.length > 0) {
        return resultExists[0].id;
      } else {
        const [result] = await db.query(
          "INSERT INTO representatives (document, name, last_name, phone, relationship, repEmail, birthCertificate) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            representative.document,
            representative.name,
            representative.last_name,
            representative.phone,
            representative.relationship,
            representative.repEmail,
            representative.birthCertificate,
          ],
        );
        return result.insertId;
      }
    } catch (error) {
      console.error("Error al conectar a la base de datos:", error);
      throw error;
    } finally {
      await closeDatabaseConnection(db);
    }
  }

  static async getRepresentativeByID(id_representative) {
    let db;
    try {
      db = await connectToDatabase();

      const sql = `SELECT * FROM representatives WHERE id = ?`;

      const [result] = await db.query(sql, [id_representative]);

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error en getRepresentativeByID:", error);
      throw error;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }
}
