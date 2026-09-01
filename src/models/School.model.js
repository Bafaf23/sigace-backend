import { prisma } from "../lib/prisma.js";
import { createSIG } from "../utils/createSIG.js";
import logger from "../utils/logger.js";

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
   * @returns {Promise<array[]>}
   */
  static async getAllSchools() {
    try {
      return await prisma.school.findMany({
        include: {
          user_schools: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  last_name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
          cdcee: true,
        },
      });
    } catch (error) {
      console.error("Error al obtener las escuelas:", error);
      throw error;
    }
  }
  /**
   ** Filtra escuelas por SIG
   * @param {string} SIG
   * @returns {Promise<object>}
   */
  static async getSchoolBySIG(SIG) {
    try {
      const rows = await prisma.school.findUnique({
        where: {
          SIG,
        },
        include: {
          user_schools: {
            select: {
              user: {
                select: {
                  id: true,
                  id_card: true,
                  name: true,
                  last_name: true,
                  role: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          cdcee: true,
        },
      });

      const usersByRole = rows.user_schools.reduce((acc, item) => {
        const roleUser = item.user.role.name || "Sin Rol";

        if (!acc[roleUser]) {
          acc[roleUser] = [];
        }

        acc[roleUser].push(item.user);
        return acc;
      }, {});

      return {
        SIG: rows.SIG,
        code_DEA: rows.DEA_CODE,
        name: rows.school_name,
        type: rows.type,
        company_name: rows.company_name,
        address: rows.address,
        city: rows.city,
        municipality: rows.municipality,
        state: rows.state,
        phone: rows.phone,
        email: rows.email,
        rif: rows.RIF,
        is_active: rows.is_active,
        subdomain: rows.subdomain,
        cdcee: {
          id: rows.cdcee.id,
          name: rows.cdcee.name,
        },
        usersByRole,
      };
    } catch (error) {
      console.error("Error al obtener la escuela:", error);
      throw error;
    }
  }

  /**
   ** Metodo para insertar una escuala en la BD
   * @param {object} school - Objeto con toda la indormacion de la escuela
   * @param {string} subdomain - subdominio de la escuela
   * @returns {Promise<object>}
   */
  static async createSchool(school, subdomain) {
    try {
      const SIG = createSIG();
      const rif = emptyToNull(school.RIF);
      const DEA_CODE = emptyToNull(school.DEA_CODE);
      const company_name = emptyToNull(school.company_name);

      const result = await prisma.school.create({
        data: {
          SIG: SIG,
          school_name: school.name,
          type: school.type,
          company_name: company_name,
          address: school.address,
          city: school.city,
          municipality: school.municipality,
          state: school.state,
          phone: school.phone,
          email: school.email,
          DEA_CODE: DEA_CODE,
          RIF: rif,
          cdceId: school.cdceId || 1,
          subdomain: subdomain,
        },
      });

      return result;
    } catch (error) {
      console.error("Error al crear la escuela:", error);
      throw error;
    }
  }

  /**
   ** Método para eliminar una escuela de la base de datos por su SIG
   * @param {string} SIG - Código único del sistema
   * @returns {Promise<object|null>} Retorna la escuela eliminada o null si no se encontró
   */
  static async deleteSchool(SIG) {
    try {
      return await prisma.school.delete({
        where: {
          SIG: SIG,
        },
      });
    } catch (error) {
      if (error.code === "P2025") {
        console.warn(
          `⚠️ [NOT FOUND] No se encontró la escuela con SIG: ${SIG} para eliminar.`,
        );
        return null;
      }
      console.error("Error al eliminar la escuela:", error);
      throw error;
    }
  }

  /**
   ** Método para actualizar los datos de una escuala
   * @param {object} school - informacion de la escuela
   * @returns {Promise<object|null>} Retorna la escuela actualizada o null si no se encontró
   */
  static async updateSchool(school) {
    try {
      const RIF = emptyToNull(school.RIF);
      const DEA_CODE = emptyToNull(school.DEA_CODE);
      const company_name = emptyToNull(school.company_name);

      const disabledSchool = await prisma.school.update({
        where: {
          SIG: school.SIG,
        },
        data: { school },
      });
      return disabledSchool;
    } catch (error) {
      console.error("Error al actualizar la escuela:", error);
      throw error;
    }
  }

  static async getRole() {
    try {
      return await prisma.role.findMany({});
    } catch (error) {
      console.error("Error al obtener roles:", error);
      throw error;
    }
  }

  /**
   ** Método para verificar el sudDominio de una escuela
   * @param {string} subdomain - sudDominio del colegio a verificar
   * @returns {Promise<object>} Retorna un obejto de la escuela con el subdomino
   */
  static async checkSubdomain(subdomain) {
    try {
      const count = await prisma.school.findUnique({
        where: {
          subdomain: subdomain,
        },
      });

      return count;
    } catch (e) {
      logger.error("Ocurrio en error verificando el dominio del colegio");
      throw e;
    }
  }
}
