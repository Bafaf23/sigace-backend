import { pool } from "../db.js";
export class Roles {
  constructor(id, name, updated_at, created_at) {
    this.id = id;
    this.name = name;
    this.updated_at = updated_at;
    this.created_at = created_at;
  }
  static async createTableRoles() {
    try {
      const [result] = await pool.query(
        "CREATE TABLE IF NOT EXISTS roles (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
      );
      console.log("✅ Table Roles created successfully");
      return true;
    } catch (error) {
      console.error("Error al crear la tabla de roles:", error);
      return false;
    }
  }
}
