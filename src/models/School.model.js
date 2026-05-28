import { connectToDatabase, closeDatabaseConnection } from "../db.js";
import { createSIG } from "../utils/createSIG.js";

const emptyToNull = (value) => {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : null;
};

export class School {
  constructor(name, company_name, address, phone, email, type, RIF, DEA_CODE) {
    this.name = name;
    this.company_name = company_name;
    this.address = address;
    this.phone = phone;
    this.email = email;
    this.type = type;
    this.RIF = RIF;
    this.DEA_CODE = DEA_CODE;
  }
  static async createTableSchools() {
    let db;
    try {
      db = await connectToDatabase();
      const [result] = await db.query(
        `CREATE TABLE IF NOT EXISTS schools (
  SIG VARCHAR(10) PRIMARY KEY,
  company_name VARCHAR(50) NULL,
  name VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(50) NOT NULL UNIQUE,
  type ENUM('Pública', 'Privada','Municipal') NOT NULL,
  DEA_CODE VARCHAR(10) UNIQUE,
  RIF VARCHAR(20) UNIQUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_only_one CHECK (
    (type = 'Pública' AND DEA_CODE IS NOT NULL AND RIF IS NULL AND company_name IS NULL) OR
    (type IN ('Privada', 'Municipal') AND RIF IS NOT NULL AND DEA_CODE IS NULL AND company_name IS NOT NULL)
  )
);`,
      );
      console.log("✅ Table Schools created successfully");
      return true;
    } catch (error) {
      console.error("Error al crear la tabla de escuelas:", error);
      return false;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }
  /**
   * @function getAllSchools
   * @description Obtiene todas las escuelas
   * @param {object} - SIG de la escuela
   * @returns
   */
  static async getAllSchools() {
    let db;
    try {
      db = await connectToDatabase();
      const [rows] = await db.query("SELECT * FROM schools");
      return rows;
    } catch (error) {
      console.error("Error al obtener las escuelas:", error);
      throw error;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }

  static async getSchoolBySIG(SIG) {
    let db;
    try {
      db = await connectToDatabase();
      const [rows] = await db.query("SELECT * FROM schools WHERE SIG = ?", [
        SIG,
      ]);
      return rows[0] || null;
    } catch (error) {
      console.error("Error al obtener la escuela:", error);
      throw error;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }

  static async createSchool(school) {
    let db;
    try {
      db = await connectToDatabase();
      const SIG = await createSIG();
      const rif = emptyToNull(school.RIF);
      const DEA_CODE = emptyToNull(school.DEA_CODE);
      const company_name = emptyToNull(school.company_name);
      const [result] = await db.query(
        "INSERT INTO schools (SIG, name, company_name, address, phone, email, type, RIF, DEA_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          SIG,
          school.name,
          company_name,
          school.address,
          school.phone,
          school.email,
          school.type,
          rif,
          DEA_CODE,
        ],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error al crear la escuela:", error);
      throw error;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }

  static async deleteSchool(SIG) {
    let db;
    try {
      db = await connectToDatabase();
      const [result] = await db.query("DELETE FROM schools WHERE SIG = ?", [
        SIG,
      ]);
      if (result.affectedRows === 0) {
        await closeDatabaseConnection(db);
        return false;
      }
      await closeDatabaseConnection(db);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error al eliminar la escuela:", error);
      await closeDatabaseConnection(db);
      throw error;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }

  static async updateSchool(school) {
    let db;
    try {
      db = await connectToDatabase();
      const RIF = emptyToNull(school.RIF);
      const DEA_CODE = emptyToNull(school.DEA_CODE);
      const company_name = emptyToNull(school.company_name);

      const [result] = await db.query(
        "UPDATE schools SET name = ?, company_name = ?, address = ?, phone = ?, email = ?, type = ?, RIF = ?, DEA_code = ? WHERE SIG = ?",
        [
          school.name,
          company_name,
          school.address,
          school.phone,
          school.email,
          school.type,
          RIF,
          DEA_CODE,
          school.SIG,
        ],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error al actualizar la escuela:", error);
      throw error;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }

  static async getRole() {
    let db;
    try {
      db = await connectToDatabase();
      const [result] = await db.query("SELECT id, name FROM roles");
      return result;
    } catch (error) {
      console.error("Error al obtener roles:", error);
      throw error;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }
}
