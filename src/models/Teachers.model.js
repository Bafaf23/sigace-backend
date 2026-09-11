import { pool } from "../db.js";
import { prisma } from "../lib/prisma.js";
import logger from "../utils/logger.js";
export class Teachers {
  constructor(id, id_user, SIG, is_active) {
    this.id = id;
    this.id_user = id_user;
    this.SIG = SIG;
    this.is_active = is_active;
  }

  /**
   * Obtiene el id de un profesor pasando su id de usuario
   * @param {number} id - id del usuario
   * @returns {number} idTearches
   */
  static async id(id) {
    try {
      const teacherId = await prisma.teacher.findUnique({
        where: {
          id_user: Number(id),
        },
        select: {
          id: true,
        },
      });
      return teacherId.id;
    } catch (err) {
      logger.error(err);
    }
  }

  /**
   * Obtiene todos los profesores registrados con su respectiva carga académica
   * del periodo activo inyectada en un array.
   */
  static async getAllTeachersWithLoad({ SIG }) {
    try {
      return await prisma.teacher.findMany({
        where: {
          SIG: SIG,
        },
        select: {
          id: true,
          id_user: true,
          SIG: true,
          is_active: true,
          user: {
            select: {
              id: true,
              id_card: true,
              name: true,
              last_name: true,
              email: true,
              phone: true,
            },
          },
          load_academics: {
            where: {
              period: {
                is_active: true, // Filtra por el período académico activo
              },
            },
            select: {
              id: true,
              section: {
                select: {
                  id: true,
                  name: true,
                  year: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              subject: {
                select: {
                  name: true,
                  code_subject: true,
                },
              },
            },
          },
        },
        orderBy: [{ user: { last_name: "asc" } }, { user: { name: "asc" } }],
      });
    } catch (error) {
      console.error(
        "❌ Error al obtener profesores con carga académica masiva:",
        error,
      );
      throw error;
    }
  }

  /**
   * Obtiene un profesor específico con su respectiva carga académica
   * del periodo activo inyectada en un array.
   * @param {string} SIG - Código de la institución
   * @param {number} id_teacher - ID de usuario del profesor (u.id / id_user)
   * @returns {Promise<object|null>} - Datos del profesor con su carga o null
   */
  static async getTeacherWithLoadByID({ SIG, id_teacher }) {
    try {
      return await prisma.teacher.findFirst({
        where: {
          SIG: SIG,
          id: Number(id_teacher),
        },
        select: {
          id: true,
          id_user: true,
          SIG: true,
          is_active: true,
          user: {
            select: {
              name: true,
              last_name: true,
              email: true,
              phone: true,
              id_card: true,
            },
          },
          load_academics: {
            where: {
              period: {
                is_active: true,
                SIG: SIG,
              },
            },
            select: {
              id: true,
              section: {
                select: {
                  id: true,
                  name: true,
                  year: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              subject: {
                select: {
                  name: true,
                  code_subject: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error(
        `❌ Error al obtener la carga académica del profesor ${id_teacher}:`,
        error,
      );
      throw error;
    }
  }
}
