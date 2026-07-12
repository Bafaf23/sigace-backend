import { pool } from "../db.js";
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
  /**
   * @function getAllSchools
   * @description Obtiene todas las escuelas
   * @param {object} - SIG de la escuela
   * @returns
   */
  static async getAllSchools() {
    try {
      const [rows] = await pool.query("SELECT * FROM schools");
      return rows;
    } catch (error) {
      console.error("Error al obtener las escuelas:", error);
      throw error;
    }
  }

  static async getSchoolBySIG(SIG) {
    try {
      const [rows] = await pool.query("SELECT * FROM schools WHERE SIG = ?", [
        SIG,
      ]);
      return rows[0] || null;
    } catch (error) {
      console.error("Error al obtener la escuela:", error);
      throw error;
    }
  }

  static async createSchool(school) {
    try {
      const SIG = createSIG();
      const rif = emptyToNull(school.RIF);
      const DEA_CODE = emptyToNull(school.DEA_CODE);
      const company_name = emptyToNull(school.company_name);
      const [result] = await pool.query(
        "INSERT INTO schools (SIG, name, company_name, address, phone, email, type, RIF, DEA_CODE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
    }
  }

  static async deleteSchool(SIG) {
    try {
      const [result] = await pool.query("DELETE FROM schools WHERE SIG = ?", [
        SIG,
      ]);
      if (result.affectedRows === 0) {
        return false;
      }

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error al eliminar la escuela:", error);
      throw error;
    }
  }

  static async updateSchool(school) {
    try {
      const RIF = emptyToNull(school.RIF);
      const DEA_CODE = emptyToNull(school.DEA_CODE);
      const company_name = emptyToNull(school.company_name);

      const [result] = await pool.query(
        "UPDATE schools SET name = ?, company_name = ?, address = ?, phone = ?, email = ?, type = ?, RIF = ?, DEA_CODE = ? WHERE SIG = ?",
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
    }
  }

  static async getRole() {
    try {
      const [result] = await pool.query("SELECT id, name FROM roles");
      return result;
    } catch (error) {
      console.error("Error al obtener roles:", error);
      throw error;
    }
  }
}
