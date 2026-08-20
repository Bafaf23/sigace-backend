import { prisma } from "../lib/prisma.js";

/**
 * @class Student
 * @description Modelo de estudiante
 * @param {number} id - ID del estudiante
 * @param {number} id_user - ID del usuario
 * @param {string} SIG - SIG del estudiante
 * @param {number} representative_id - ID del representante
 * @param {string} tuition_number - Número de matrícula
 * @param {number} year_id - ID del año
 * @param {number} session_id - ID de la sesión
 * @param {string} allergies - Alergias del estudiante
 * @param {string} medical_condition - Condición médica del estudiante
 * @param {number} weight - Peso del estudiante
 * @param {number} height - Altura del estudiante
 * @param {string} shirt_size - Talla de camisa del estudiante
 * @param {string} pants_size - Talla de pantalón del estudiante
 * @param {string} shoe_size - Talla de zapato del estudiante
 * @param {string} status - Estado del estudiante
 * @param {string} created_at - Fecha de creación del estudiante
 * @param {string} updated_at - Fecha de actualización del estudiante
 * @param {string} gender - Género del estudiante
 */
export class Students {
  constructor(
    id,
    id_user,
    gender,
    SIG,
    representative_id,
    tuition_number,
    year_id,
    id_section,
    id_period,
    allergies,
    medical_condition,
    weight,
    height,
    shirt_size,
    pants_size,
    shoe_size,
    condition,
    created_at,
    updated_at,
  ) {
    this.id = id;
    this.gender = gender;
    this.id_user = id_user;
    this.SIG = SIG;
    this.representative_id = representative_id;
    this.tuition_number = tuition_number;
    this.year_id = year_id;
    this.id_section = id_section;
    this.id_period = id_period;
    this.allergies = allergies;
    this.medical_condition = medical_condition;
    this.weight = weight;
    this.height = height;
    this.shirt_size = shirt_size;
    this.pants_size = pants_size;
    this.shoe_size = shoe_size;
    this.condition = condition;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  /**
   ** Obtiene a todos los estudiantes matriculados en un periodo específico, sin importar si ya tienen año o sección      *  asignados en su matrícula.
   *
   * @param {object} param
   * @param {string} param.SIG - código único del colegio
   * @param {number} param.id_period - id del período académico
   * @returns {Promise<Array<object>>}
   */
  static async getAllStudents({ SIG, id_period }) {
    try {
      return await prisma.student.findMany({
        where: {
          SIG: SIG, // Trae a TODOS los estudiantes de la institución
        },
        include: {
          user: {
            select: {
              id: true,
              id_card: true,
              name: true,
              last_name: true,
              email: true,
              phone: true,
              is_active: true,
            },
          },
          representative: {
            select: {
              id: true,
              document: true,
              name: true,
              last_name: true,
              relationship: true,
              phone: true,
            },
          },
          school: {
            select: {
              SIG: true,
              school_name: true,
            },
          },

          enrollments: {
            where: id_period ? { id_period: Number(id_period) } : undefined,
            select: {
              id: true,
              status: true,
              id_period: true,
              section: {
                select: {
                  id: true,
                  name: true,
                },
              },
              year: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          user: {
            last_name: "asc",
          },
        },
      });
    } catch (error) {
      console.error("❌ Error al obtener los estudiantes:", error);
      throw error;
    }
  }

  /**
   * Crea un nuevo registro de un estudiante junto con su usuario correspondiente
   * y lo conecta con su colegio y representante.
   *
   * @param {object} param
   * @param {object} param.student - Datos académicos y antropométricos del estudiante
   * @param {object} param.representative - Datos o ID del representante legal
   * @param {object} param.user - Datos de la cuenta del usuario
   */
  static async createStudent({
    student = {},
    representative = {},
    user = {},
  } = {}) {
    try {
      return await prisma.student.create({
        data: {
          gender: student.gender ?? null,
          tuition_number: student.tuition_number,
          allergies: student.allergies ?? null,
          medical_condition: student.medical_condition ?? null,
          weight: student.weight ? Number(student.weight) : null,
          height: student.height ? Number(student.height) : null,
          shirt_size: student.shirt_size ?? null,
          pants_size: student.pants_size ?? null,
          shoe_size: student.shoe_size ?? null,
          condition: student.condition,
          birth_date: student.birth_date,

          school: {
            connect: { SIG: student.SIG },
          },
          representative: {
            connectOrCreate: {
              where: { document: representative.document },
              create: {
                document: representative.document,
                name: representative.name,
                last_name: representative.last_name,
                phone: representative.phone ?? null,
                relationship: representative.relationship ?? null,
                repEmail: representative.repEmail ?? null,
              },
            },
          },
          user: {
            create: {
              id_card: user.document || user.id_card,
              name: user.name,
              last_name: user.last_name,
              email: user.email ?? null,
              pass: user.pass,
              phone: user.phone ?? null,
              role_id: Number(user.role_id || 4),
            },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              id_card: true,
              name: true,
              last_name: true,
              email: true,
            },
          },
          representative: true,
        },
      });
    } catch (error) {
      console.error("❌ Error al crear estudiante con Prisma:", error);
      throw error;
    }
  }

  /**
   * @description Actualiza un estudiante por su ID
   * @param {string} id
   * @param {Object} student
   * @returns {boolean}
   */
  static async updateStudent(id, student) {
    try {
      const [result] = await pool.query(
        "UPDATE students SET gender = ?, birth_date = ?, height = ?, allergies = ?, medical_condition = ?, weight = ?, shirt_size = ?, pants_size = ?, shoe_size = ? WHERE id = ?",
        [
          student.gender,
          student.birth_date,
          student.height,
          student.allergies,
          student.medical_condition,
          student.weight,
          student.shirt_size,
          student.pants_size,
          student.shoe_size,
          id,
        ],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error al actualizar el estudiante:", error);
      throw error;
    }
  }
  /**
   * Obtiene los estudiantes no matriculados
   * @param {object} params - Objecto con los parámetros
   * @param {number} params.id_period - ID del periodo
   * @param {string} params.SIG - SIG de la escuela
   * @returns {Array<object>} - Array de estudiantes no matriculados
   */
  static async notEnrolled({ id_period, SIG }) {
    try {
      return await prisma.student.findMany({
        where: {
          SIG: SIG,
          enrollments: {
            none: {
              id_period: Number(id_period),
            },
          },
        },
        select: {
          id: true,
          user: {
            select: {
              name: true,
              last_name: true,
              id_card: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error al obtener los estudiantes no matriculados:", error);
      throw error;
    }
  }

  /**
   * Obtiene a los estudiates de una sección
   * @param {object} params - Objecto con los parámetros
   * @param {number} params.id_section - ID de la sección
   * @param {string} params.SIG - SIG de la escuela
   * @returns {Array<object>} - Array de estudiantes
   */
  /*  static async bySection({ id_section, SIG }) {
    try {
      const [rows] = await pool.query(
        `SELECT 
    s.id, 
    s.id_user, 
    s.SIG, 
    s.tuition_number, 
    u.name, 
    u.last_name, 
    u.document 
FROM students s 
INNER JOIN users u ON s.id_user = u.id  
INNER JOIN enrollments e ON s.id = e.id_student
WHERE e.id_section = ? AND s.SIG = ?`,
        [id_section, SIG],
      );
      return rows;
    } catch (error) {
      console.error("Error al obtener los estudiantes de la sección:", error);
      throw error;
    }
  } */

  /**
   * Busca a un estudiante por su id_card
   * @param {string} id_card - id del estudiante
   * @return {object|null} - info del estudiante o null si no existe
   */
  static async byID(id_card) {
    try {
      return await prisma.student.findFirst({
        where: {
          user: {
            id_card: String(id_card).trim(),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              id_card: true,
              name: true,
              last_name: true,
              email: true,
              phone: true,
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
          representative: true,
          school: {
            select: {
              SIG: true,
              school_name: true,
            },
          },
          enrollments: {
            select: {
              id: true,
              section: {
                select: {
                  name: true,
                },
              },
              year: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.log(`Error en getStudentByID: ${error}`);
      return null;
    }
  }

  /**
   ** Recupera todo el récord académico del estudiante y lo agrupa por períodos lectivos, calculando la nota acumulativa   * por lapso en base al plan de evaluación real de su sección.
   * @param {number} id_student - ID del estudiante
   * @param {number} id_period - ID del periodo
   * @returns {object}
   */
  static async record(id_student, id_period) {
    try {
      const enrollmentQuery = {
        where: {
          id_period: id_period,
        },
        orderBy: {
          created_at: "desc",
        },
        select: {
          id: true,
          status: true,
          period: {
            select: {
              name: true,
            },
          },
          year: {
            select: {
              name: true,
            },
          },
          section: {
            select: {
              name: true,
            },
          },
        },
      };

      return await prisma.student.findFirst({
        where: { id: id_student },
        select: {
          id: true,
          tuition_number: true,
          user: {
            select: {
              id_card: true,
              name: true,
              last_name: true,
            },
          },
          school: {
            select: {
              school_name: true,
              SIG: true,
            },
          },
          enrollments: enrollmentQuery,

          grades: {
            select: {
              id: true,
              grade: true,
              evaluation: {
                select: {
                  referent_teorical: true,
                  activity: true,
                  porcentage: true,
                  evaluation_plan: {
                    select: {
                      lapse: true,
                      load_academic: {
                        select: {
                          subject: {
                            select: {
                              name: true,
                              code_subject: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error("❌ Error en modelo Students.getRecordStudent:", error);
      throw error;
    }
  }

  /**
   * Recupera a todos los estudiantes que están preinscritos en un período pero no tienen sección asignada.
   * @param {string} SIG - Código del colegio
   * @param {number} id_period - ID del período lectivo
   * @returns {Promise<Array<object>>} - Lista de estudiantes
   */
  static async preInscription(SIG, id_period) {
    try {
      return await prisma.student.findMany({
        where: {
          SIG: SIG,
          OR: [
            // Caso A: Tiene inscripción en este período pero id_section es null
            {
              enrollments: {
                some: {
                  id_period: id_period,
                  id_section: null,
                },
              },
            },
            // Caso B: Está registrado en el plantel pero NO tiene inscripción en este período
            {
              enrollments: {
                none: {
                  id_period: id_period,
                },
              },
            },
          ],
        },
        select: {
          id: true,
          tuition_number: true,
          user: {
            select: {
              id_card: true,
              name: true,
              last_name: true,
            },
          },
          enrollments: {
            where: {
              id_period: Number(id_period),
            },
            select: {
              id: true,
              status: true,
              year: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error("❌ Error en Students.getPreinscription:", error);
      throw error;
    }
  }
}
