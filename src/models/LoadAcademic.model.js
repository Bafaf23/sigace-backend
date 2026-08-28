import { prisma } from "../lib/prisma.js";

export class LoadAcademic {
  constructor(
    id,
    id_teacher,
    SIG,
    id_section,
    id_period,
    id_subject,
    created_at,
  ) {
    this.id = id;
    this.id_teacher = id_teacher;
    this.SIG = SIG;
    this.id_section = id_section;
    this.id_period = id_period;
    this.id_subject = id_subject;
    this.created_at = created_at;
  }
  /**
   ** Crea una nueva carga academica para un colegio espesifico
   * @param {object} loadAcademic - objeto con la informacion de la carga academica
   * @returns {object} - la carga academica creada
   */
  static async create(loadAcademic) {
    try {
      const result = await prisma.load_academic.create({
        data: {
          id_teacher: loadAcademic.id_teacher,
          SIG: loadAcademic.SIG,
          id_section: loadAcademic.id_section,
          id_period: loadAcademic.id_period,
          id_subject: loadAcademic.id_subject,
          created_at: loadAcademic.created_at,
        },
      });
      return result;
    } catch (error) {
      console.error("Error al crear el registro de carga académica:", error);
      return false;
    }
  }

  /**
   ** Obtiene una lista de toda la acarga academica de colegio segun el perido activo de un colegio espesifico
   * @param {string} SIG - codigo unico del cada escuela
   * @returns {Array<object>} - Lista de la carga academica del period activo del colegio
   */
  static async get(SIG) {
    try {
      const rows = await prisma.load_academic.findMany({
        where: {
          SIG: SIG,
          period: {
            is_active: true,
          },
        },
        select: {
          id: true,
          id_section: true,
          id_period: true,
          id_subject: true,
          id_teacher: true,
          SIG: true,
          subject: {
            select: {
              code_subject: true,
              name: true,
              abbreviation: true,
            },
          },
          section: {
            select: {
              name: true,
              year: {
                select: {
                  name: true,
                },
              },
            },
          },
          period: {
            select: {
              name: true,
            },
          },

          teacher: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  last_name: true,
                  id_card: true,
                  id: true,
                },
              },
            },
          },
        },
      });

      return rows.map((row) => ({
        id_load_academic: row.id,
        section: {
          name: row.section.year.name,
          nomenclature: row.section.name,
          period: row.period.name,
        },
        subject: {
          abbreviation: row.subject.abbreviation,
          code_subject: row.id_subject,
          name: row.subject.name,
        },
        teacher: {
          id: row.teacher.id,
          id_user: row.teacher.user.id,
          document: row.teacher.user.id_card,
          name: row.teacher.user.name,
          last_name: row.teacher.user.last_name,
        },
      }));
    } catch (error) {
      console.error("Error al obtener el registro de carga académica:", error);
      throw error;
    }
  }
}
