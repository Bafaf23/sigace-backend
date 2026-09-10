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
          id_teacher: Number(loadAcademic.id_teacher),
          SIG: loadAcademic.SIG,
          id_section: Number(loadAcademic.id_section),
          id_period: Number(loadAcademic.id_period),
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
   * @param {number} id_section - identificador de la seccion
   * @returns {Array<object>} - Lista de la carga academica del period activo del colegio
   */
  static async get({ SIG, id_section }) {
    const where = {
      period: {
        is_active: true,
      },
    };

    if (SIG) where.SIG = SIG;
    if (id_section) where.id_section = Number(id_section);

    try {
      const rows = await prisma.load_academic.findMany({
        where,
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
              id: true,
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

      const agroupBySection = rows.reduce((acc, row) => {
        // 1. Clave única de agrupación por sección
        const sectionKey = `${row.section.year.name}-${row.section.name}`;
        if (!sectionKey) return acc;

        // 2. Inicializar la estructura base de la sección si no existe
        if (!acc[sectionKey]) {
          acc[sectionKey] = {
            section: {
              id: row.section.id,
              name: row.section.year.name,
              nomenclature: row.section.name,
              period: row.period.name,
            },
            academicLoad: [], // Separa la lista de materias de la información de la sección
          };
        }

        // 3. Verificar si la materia ya existe dentro de esta sección
        const exists = acc[sectionKey].academicLoad.some(
          (item) => item.subject.code_subject === row.subject?.code_subject,
        );

        // 4. Agregar la materia junto a su docente
        if (!exists && row.subject) {
          const teacherUser = row.teacher?.user;

          acc[sectionKey].academicLoad.push({
            id_load_academic: row.id, // Se asigna correctamente a cada registro de la materia
            subject: {
              code_subject: row.subject.code_subject,
              name: row.subject.name,
              abbreviation: row.subject.abbreviation,
            },
            teacher: teacherUser
              ? {
                  id: row.teacher.id,
                  id_user: teacherUser.id,
                  name: teacherUser.name,
                  last_name: teacherUser.last_name,
                  document: teacherUser.id_card,
                }
              : null,
          });
        }

        return acc;
      }, {});

      return Object.values(agroupBySection);
    } catch (error) {
      console.error("Error al obtener el registro de carga académica:", error);
      throw error;
    }
  }
}
