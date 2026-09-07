import { prisma } from "../lib/prisma.js";

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
      return await prisma.academic_periods.create({
        data: {
          name: academicPeriodModel.name,
          start_date: academicPeriodModel.start_date,
          end_date: academicPeriodModel.end_date,
          is_active: academicPeriodModel.is_active,
          SIG: academicPeriodModel.SIG,
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * Obtiene TODOS los periodos académicos de una institución (tanto activos como históricos)
   * Ordenados por ID descendente para tener los más recientes al principio.
   * @param {string} SIG
   * @returns {Promise<Array<object>>} Array con todos los periodos
   */
  static async getAcademicPeriods(SIG) {
    try {
      return await prisma.academic_periods.findMany({
        where: {
          SIG: SIG,
        },
      });
    } catch (error) {
      console.error("Error en getAcademicPeriods:", error);
      throw error;
    }
  }

  /**
   * finaliza un periodo académico
   * @param {string} SIG
   * @returns {object}
   */
  static async endAcademicPeriod(SIG) {
    try {
      return await prisma.academic_periods.update({
        where: {
          SIG: SIG,
        },
        data: {
          is_active: false,
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   ** Verifica si existe al menos un período académico activo en el sistema.
   * @param {string} SIG - codigo inico del colegio
   * @returns {Promise<boolean>} True si hay un período activo, False de lo contrario.
   */
  static async hasActivePeriod(SIG) {
    try {
      const count = await prisma.academic_periods.count({
        where: {
          is_active: true,
          SIG: SIG,
        },
      });
      return count > 0;
    } catch (error) {
      console.error("Error en Academic_periods.hasActivePeriod:", error);
      throw error;
    }
  }

  /**
   * TODO: verificar si este metodo hace algo relativo en el sistema
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
}
