import { pool } from "../db.js";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import logger from "../utils/logger.js";
import { tuitionNumber } from "../utils/tuitionNumber.js";

/**
 * Constructor de la clase Users
 * @param {string} document - Documento del usuario
 * @param {string} name - Nombre del usuario
 * @param {string} last_name - Apellido del usuario
 * @param {string} email - Email del usuario
 * @param {string} phone - Teléfono del usuario
 * @param {number} role_id - ID del rol del usuario
 * @param {string} password - Contraseña del usuario
 * @param {boolean} is_first_login - Indica si el usuario es el primero en iniciar sesión
 * @param {boolean} is_active - Indica si el usuario está activo
 * @param {string} SIG - SIG de la escuela del usuario
 * @param {string} created_at - Fecha de creación del usuario
 * @param {string} updated_at - Fecha de actualización del usuario
 */
export class Users {
  constructor(document, name, last_name, email, phone, role_id, password, SIG) {
    this.document = document;
    this.name = name;
    this.last_name = last_name;
    this.email = email;
    this.phone = phone;
    this.role_id = role_id;
    this.password = password;
    this.SIG = SIG;
  }
  /**
   * Obtiene el token vejente para el cambio de pass
   * TODO: remplazar sql por prisma
   * @param {string} token
   * @returns {object}
   */
  static async getUserToken(token) {
    try {
      const sql = `SELECT id_user FROM auth_tokens
       WHERE token = ? AND expires_at > NOW() 
       LIMIT 1`;
      const value = [token];

      const [rows] = await pool.query(sql, value);

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   ** Perserva el token de cambio de contrasena solicitado por el usuario
   * TODO: remplazar el sql por prisma
   * @param {number} id_user - id del solicitante
   * @param {string} token
   * @param {Date} expires_at - fecha de expiracion del token
   */
  static async saveToken(id_user, token, expires_at) {
    try {
      const [result] = await pool.query(
        "INSERT INTO auth_tokens (id_user, token, expires_at) VALUES (?, ?, ?)",
        [id_user, token, expires_at],
      );
      return result.insertId;
    } catch (error) {
      console.error(
        "Error al guardar el token de cambio de contraseña:",
        error,
      );
      return null;
    }
  }

  /**
   * Obtiene todos los usuarios de la base de datos o un usuario por su email
   * @param {string} email - El email del usuario a buscar
   * @returns {Array<object>} Los usuarios encontrados
   * @returns {null} Null si no se encuentra el usuario
   * @returns {boolean} False si ocurre un error al obtener los usuarios
   */
  static async getUsers(email = null) {
    try {
      let whereClause = {};

      if (email) {
        whereClause.email = email;
      }

      const rows = await prisma.users.findMany({
        where: whereClause,
        include: {
          role: true,
          student_profile: {
            include: { school: true },
          },
          teacher_profile: {
            include: { school: true },
          },
          administrator_profile: {
            include: { school: true },
          },
          user_schools: {
            include: { school: true },
          },
        },
      });

      return rows.map((row) => this.#formatUser(row));
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      return [];
    }
  }

  /**
   * Helper privado para mapear la estructura de datos de Prisma a la respuesta deseada.
   */
  static #formatUser(row) {
    const user = {
      id: row.id,
      id_card: row.id_card,
      name: row.name,
      last_name: row.last_name,
      email: row.email,
      phone: row.phone,
      role_id: row.role_id,
      role: row.role?.name,
      is_first_login: row.is_first_login,
      is_active: row.is_active,
    };

    // Validar de forma segura cada perfil
    if (row.student_profile) {
      user.students = {
        id_student: row.student_profile.id,
        representative_id: row.student_profile.representative_id,
        tuition_number: row.student_profile.tuition_number,
        allergies: row.student_profile.allergies,
        medical_condition: row.student_profile.medical_condition,
        weight: row.student_profile.weight,
        height: row.student_profile.height,
        shirt_size: row.student_profile.shirt_size,
        pants_size: row.student_profile.pants_size,
        shoe_size: row.student_profile.shoe_size,
        gender: row.student_profile.gender,
        birth_date: row.student_profile.birth_date,
        condition: row.student_profile.condition,
      };
    }

    if (row.teacher_profile) {
      user.teachers = {
        id_teacher: row.teacher_profile.id,
        SIG: row.teacher_profile.SIG,
        is_active: row.teacher_profile.is_active,
      };
    }

    if (row.administrator_profile) {
      user.administrators = {
        id_administrator: row.administrator_profile.id,
        SIG: row.administrator_profile.SIG,
      };
    }

    const gestorRelation = Array.isArray(row.user_schools)
      ? row.user_schools[0]
      : null;

    if (gestorRelation) {
      user.gestion = {
        id_gestor: gestorRelation.id,
        SIG: gestorRelation.SIG,
      };
    }
    // Extraer la escuela de forma segura, evaluando todos los posibles roles
    const schoolData =
      row.student_profile?.school ||
      row.teacher_profile?.school ||
      row.administrator_profile?.school ||
      row.supervised_school ||
      gestorRelation?.school;

    // Solo asignar si schoolData realmente es un objeto válido
    if (schoolData && typeof schoolData === "object") {
      user.school = {
        SIG: schoolData?.SIG,
        name: schoolData?.school_name,
      };
    } else {
      user.school = null;
    }

    return user;
  }

  /**
   * Crea un nuevo usuario en la base de datos y relaciona el usuario con la tabla correspondiente
   * @param {Users} user - Objeto de la clase Users
   * @returns {object} El ID del usuario creado o False si ocurre un error
   */
  static async create(user) {
    try {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      const newUser = await prisma.$transaction(async (tx) => {
        const createUser = await tx.users.create({
          data: {
            id_card: user.document,
            name: user.name,
            last_name: user.last_name,
            email: user.email,
            phone: user.phone,
            role_id: Number(user.role_id),
            is_active: true,
            is_first_login: true,
            pass: hashedPassword,
          },
        });

        const idUser = createUser.id;
        const roleUser = Number(user.role_id);

        switch (roleUser) {
          case 3:
            await tx.user_schools.create({
              data: { user_id: idUser, SIG: user.SIG },
            });
            break;
          case 4:
            const tuition_number = await generateTuitionNumber(user.SIG);
            await tx.student.create({
              data: {
                id_user: idUser,
                SIG: user.SIG,
                representative_id: user.representative_id,
                tuition_number: tuition_number,
                allergies: user.allergies,
                medical_condition: user.medical_condition,
                weight: user.weight ? parseInt(user.weight, 10) : null,
                height: user.height ? parseInt(user.height) : null,
                shirt_size: user.shirt_size,
                pants_size: user.pants_size,
                shoe_size: user.shoe_size,
                gender: user.gender,
                birth_date: user.birth_date ? new Date(user.birth_date) : null,
                condition: "nuevo_ingreso",
              },
            });
            break;
          case 5:
            await tx.teacher.create({
              data: {
                id_user: idUser,
                SIG: user.SIG,
                is_active: true,
              },
            });
            break;
          case 6:
            await tx.administrator.create({
              data: {
                id_user: idUser,
                SIG: user.SIG,
              },
            });
            break;
          case 7:
          case 8:
            await tx.user_schools.create({
              data: {
                user_id: idUser,
                SIG: user.SIG,
              },
            });
            break;
          default:
            logger.warn(`Este usuario no requiere un registro especial`);
            break;
        }
        return createUser;
      });
      return newUser;
    } catch (error) {
      console.error("Error al crear usuario (Transacción revertida):", error);
      throw error;
    }
  }

  /**
   * Obtiene un usuario por su email (metodo para el login)
   * @param {string} email
   * @returns {object} El usuario encontrado
   * @returns {null} Null si no se encuentra el usuario
   */
  static async getUserByEmail(email) {
    try {
      const row = await prisma.users.findFirst({
        where: { email },
        select: {
          id: true,
          email: true,
          pass: true,
          role_id: true,
          name: true,
          last_name: true,
          is_first_login: true,
          role: {
            select: {
              name: true,
            },
          },
        },
      });

      let sigRecord = null;
      const role = row.role?.name?.toLowerCase();

      switch (role) {
        case "estudiante":
          sigRecord = await prisma.student.findFirst({
            where: { id_user: row.id },
            select: { SIG: true },
          });
          break;
        case "profesor":
          sigRecord = await prisma.teacher.findFirst({
            where: { id_user: row.id },
            select: { SIG: true },
          });
          break;
        case "administrador":
          sigRecord = await prisma.administrator.findFirst({
            where: { id_user: row.id },
            select: {
              SIG: true,
            },
          });
          break;
        case "director":
        case "subdirector":
        case "gestion":
          sigRecord = await prisma.user_schools.findFirst({
            where: { user_id: row.id },
            select: { SIG: true },
          });
          break;

        default:
          sigRecord = null;
      }

      return {
        id: row.id,
        name: row.name,
        last_name: row.last_name,
        pass: row.pass,
        email: row.email,
        is_first_login: row.is_first_login,
        role: row.role.name,
        SIG: sigRecord.SIG || null,
      };
    } catch (error) {
      console.error("Error al obtener usuario por email:", error);
      return null;
    }
  }

  /**
   * Cambia la contraseña de un usuario
   * TODO: remplazar sql por prisma
   * @param {number} id - ID del usuario
   * @param {string} newPassword - Nueva contraseña del usuario
   * @returns {boolean} True si la contraseña se cambió correctamente, false si no se pudo cambiar
   */
  static async changePassword(id, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const [result] = await pool.query(
        "UPDATE users SET pass = ?, is_first_login = ? WHERE id = ?",
        [hashedPassword, 0, id],
      );

      if (result.affectedRows === 0) {
        return false;
      }

      const [users] = await pool.query("SELECT pass FROM users WHERE id = ?", [
        id,
      ]);

      return users[0]
        ? await bcrypt.compare(newPassword, users[0].pass)
        : false;
    } catch (error) {
      console.error("Error al cambiar la contraseña:", error);
      return false;
    }
  }

  /**
   * Elimina un usuario de la base de datos
   * @param {number} id - ID del usuario
   * @param {number} role_id - ID del rol del usuario
   * @returns {boolean} True si el usuario se eliminó correctamente, false si no se pudo eliminar
   */
  static async deleteUser(id) {
    try {
      return await prisma.users.delete({
        where: {
          id: Number(id),
        },
      });
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      return false;
    }
  }

  /**
   * Actualiza un usuario en la base de datos
   * TODO: remplazar sql por prisma
   * @param {Users} user - Objeto de la clase Users
   * @returns {boolean} True si el usuario se actualizó correctamente, false si no se pudo actualizar
   */
  static async updateUser(user) {
    try {
      const [result] = await pool.query(
        "UPDATE users SET document = ?, name = ?, last_name = ?, email = ?, phone = ?, role_id = ? WHERE id = ?",
        [
          user.document,
          user.name,
          user.last_name,
          user.email,
          user.phone,
          user.role_id,
          user.id_user,
        ],
      );

      if (result.affectedRows === 0) {
        return false;
      }

      if (user.SIG && user.role_id) {
        const roleId = Number(user.role_id);
        const sigQueries = {
          2: "UPDATE students SET SIG = ? WHERE id_user = ?",
          3: "UPDATE teachers SET SIG = ? WHERE id_user = ?",
          4: "UPDATE administrators SET SIG = ? WHERE id_user = ?",
        };

        const sigQuery = sigQueries[roleId];
        if (sigQuery) {
          await pool.query(sigQuery, [user.SIG, user.id]);
        }
      }

      return true;
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      return false;
    }
  }

  /**
   ** Busca a todo el personal de una escuela, excluyendo a los estudiantes de la misma
   * @param {string} SIG
   * @returns {Array<object>}
   */
  static async usersSchool(SIG) {
    const rows = await prisma.users.findMany({
      where: {
        OR: [
          {
            teacher_profile: {
              SIG: SIG,
            },
          },
          {
            administrator_profile: {
              SIG: SIG,
            },
          },
          {
            user_schools: {
              some: {
                SIG: SIG,
              },
            },
          },
        ],
      },
      select: {
        name: true,
        last_name: true,
        id: true,
        id_card: true,
        role: true,
        phone: true,
        email: true,
        is_active: true,
      },
    });
    return rows;
  }
}
