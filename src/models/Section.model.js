import { pool } from "../db.js";
import { prisma } from "../lib/prisma.js";

export class Sections {
  constructor(name, SIG, id_period, id_year, guide_id, capacity) {
    this.name = name;
    this.SIG = SIG;
    this.id_period = id_period;
    this.id_year = id_year;
    this.guide_id = guide_id;
    this.capacity = capacity;
  }

  /**
   * Crea una sección en la base de datos
   * @param {object} section - Objeto con la imformacion de la section
   */
  static async create(section) {
    try {
      return await prisma.section.create({
        data: {
          name: section.name,
          SIG: section.SIG,
          id_period: section.id_period,
          id_year: Number(section.id_year),
          guide_id: Number(section.guide_id),
          capacity: section.capacity,
        },
      });
    } catch (error) {
      console.error("Error al crear la sección:", error);
      throw error;
    }
  }

  /**
   * Obtiene los estudiantes de una sección
   * @param {object} params - Objeto con los parámetros
   * @param {number} params.id_section - ID de la sección
   * @param {string} params.SIG - SIG de la escuela
   * @returns {Promise<Array<object>>} - Array de estudiantes
   */
  static async getStudent({ id_section, SIG }) {
    try {
      const enrollments = await prisma.enrollment.findMany({
        where: {
          id_section: Number(id_section),
          section: {
            SIG: SIG,
          },
        },
        select: {
          id: true,
          status: true,
          section: {
            select: {
              guide: {
                select: {
                  id: true,
                  user: {
                    select: {
                      name: true,
                      last_name: true,
                      id: true,
                      id_card: true,
                    },
                  },
                },
              },
              id: true,
              name: true,
              SIG: true,
              year: {
                select: {
                  name: true,
                },
              },
            },
          },
          student: {
            select: {
              id: true,
              SIG: true,
              tuition_number: true,
              condition: true,
              gender: true,
              birth_date: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  last_name: true,
                  id_card: true,
                },
              },
            },
          },
        },
      });

      // Informacion de la seccion
      const sectioonInfo = enrollments[0]?.section;

      // lista de estudiantes
      const studentsList = enrollments.map((e) => ({
        name: e.student?.user?.name,
        last_name: e.student?.user?.last_name,
        id_card: e.student?.user?.id_card,
        id_user: e.student?.user?.id,
        id_enrollment: e.id,
        status: e.status,
        condition: e.student.condition,
        id_student: e.student?.id,
        tuition_number: e.student?.tuition_number,
        gender: e.student?.gender,
        birth_date: e.student?.birth_date,
      }));

      return {
        id: sectioonInfo?.id,
        name: sectioonInfo?.year?.name,
        nomenclature: sectioonInfo?.name,
        guide: {
          id_user: sectioonInfo?.guide?.user?.id,
          document: sectioonInfo?.guide?.user?.id_card,
          name: sectioonInfo?.guide?.user?.name,
          last_name: sectioonInfo?.guide?.user?.last_name,
          id: sectioonInfo?.guide?.id,
        },
        students: studentsList,
      };
    } catch (error) {
      throw error;
    }
  }
  /**
   * Obtiene las secciones de la escuela
   */
  static async get(SIG, id_period) {
    try {
      const sectionsList = await prisma.section.findMany({
        where: { SIG: SIG, id_period: Number(id_period) },
        include: {
          year: {
            select: {
              name: true,
            },
          },
          load_academics: {
            select: {
              id: true,
              subject: {
                select: {
                  code_subject: true,
                  name: true,
                  abbreviation: true,
                },
              },
              teacher: {
                select: {
                  id: true,
                  user: {
                    id: true,
                    name: true,
                    last_name: true,
                    id_card: true,
                  },
                },
              },
            },
          },
          guide: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  last_name: true,
                  id_card: true,
                },
              },
            },
          },
        },
      });

      const sections = sectionsList.map((section) => {
        return {
          id: section.id,
          name: section.year.name,
          nomenclature: section.name,
          period: section.id_period,
          year_id: section.id_year,
          capacity: section.capacity,
          guide: {
            id: section.guide_id,
            id_user: section.guide.user.id,
            document: section.guide.user.id_card,
            name: section.guide.user.name,
            last_name: section.guide.user.last_name,
          },
        };
      });

      return sections;
    } catch (error) {
      console.error("Error al obtener las secciones:", error);
      throw error;
    }
  }

  /**
   * Busca la sección actual de un estudiante junto a los datos del año escolar.
   */
  static async getSectionByStudent(SIG, id, id_period) {
    try {
      return await prisma.users.findUnique({
        where: {
          id: id,
        },
        select: {
          id: true, // user_id
          name: true, // user_name
          student_profile: {
            select: {
              id: true, // student_id
              enrollments: {
                orderBy: {
                  id: "desc", // ORDER BY e.id DESC
                },
                take: 1, // LIMIT 1
                select: {
                  id: true,
                  status: true,
                  section: {
                    select: {
                      id: true,
                      id_period: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error(
        "❌ Error en el modelo al ejecutar getSectionByStudent:",
        error,
      );
      throw error;
    }
  }
}
