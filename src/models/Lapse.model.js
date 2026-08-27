import { pool } from "../db.js";
import { prisma } from "../lib/prisma.js";

export class Lapse {
  constructor(id, name, start_date, end_date, is_active, createdAt, updatedAt) {
    this.id = id;
    this.name = name;
    this.start_date = start_date;
    this.end_date = end_date;
    this.is_active = is_active;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   ** Obtiene los lapsos de una institución
   * @param {string} SIG
   * @param {number} id_period id del period activo
   * @returns {Promise<Array<object>>}
   */
  static async getLapses(SIG, id_period) {
    try {
      return await prisma.lapse.findMany({
        where: {
          id_period: Number(id_period),
          period: {
            SIG: SIG,
          },
        },
        orderBy: {
          id: "asc",
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * Crea un nuevo lapso en la base de datos
   * @param {{ id_period: number, name: string, start_date: string, end_date: string, is_active?: boolean }} lapse
   */
  static async createLapses(lapse) {
    try {
      return await prisma.lapse.create({
        data: {
          id_period: lapse.id_period,
          name: lapse.name,
          start_date: lapse.start_date,
          end_date: lapse.end_date,
          is_active: lapse.is_active,
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * Actualiza el estado del lapso para desactivarlo
   * @param {number} id - Momento
   */
  static async endLapse(id) {
    try {
      return await prisma.lapse.update({
        where: { id: id },
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
   * inicia un lapso
   * @param {string} idLapse
   * @returns {Promise<object>}
   */
  static async startLapse(idLapse) {
    try {
      return await prisma.lapse.update({
        where: { id: Number(idLapse) },
        data: {
          is_active: true,
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
