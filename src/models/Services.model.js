import { prisma } from "../lib/prisma.js";

export class Services {
  constructor(
    id,
    name,
    price,
    description,
    created_at = new Date(),
    updated_at = new Date(),
  ) {
    this.name = name;
    this.price = Number(price);
    this.description = description;
    this.expirupdated_ates_at = updated_at;
    this.created_at = created_at;
  }

  /**
   ** Guarda un nuevo servico en la BD
   * @returns {object} - objeto de prisma
   */
  async save() {
    return await prisma.services.create({
      data: {
        name: this.name,
        price: this.price,
        description: this.description,
        created_at: this.created_at,
        updated_at: this.updated_at,
      },
    });
  }

  /**
   * Obtiene todos los servicios
   * @returns {Array} - servicios ofrecidos
   */
  static async getAll() {
    const rows = await prisma.services.findMany();
    return rows.map((row) => {
      return {
        id: row.id,
        name: row.name,
        type: row.type,
        price: row.price,
        description: row.description,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    });
  }

  /**
   * Actualiza el precio de un servicio
   */
  static async updatePrice({ id, price }) {
    return await prisma.services.update({
      where: {
        id: Number(id),
      },
      data: {
        price: Number(price),
      },
    });
  }

  /**
   * Cuenta el total de servicios
   * @returns {number}
   */
  static async count() {
    return await prisma.services.count();
  }
}
