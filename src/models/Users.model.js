import { pool } from "../db.js";
import bcrypt from "bcryptjs";
import { getCurrentPeriod } from "../utils/periodAc.js";

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
  static async getUsers(email) {
    try {
      let queryEmail = `SELECT 
        u.id, u.document, u.name, u.last_name, u.email, u.phone, u.role_id,
        u.is_first_login, u.is_active,
        r.name AS role,
        s.SIG AS student_sig, s.representative_id, s.tuition_number, 
        s.allergies, s.medical_condition, s.weight, s.height, 
        s.shirt_size, s.pants_size, s.shoe_size,
        t.SIG AS teacher_sig,
        a.SIG AS admin_sig,
        sc.SIG AS school_sig, sc.name AS school_name, sc.address AS school_address,
        sc.phone AS school_phone, sc.email AS school_email, sc.type AS school_type,
        sc.DEA_CODE AS school_DEA_CODE, sc.RIF AS school_RIF, sc.company_name AS school_company_name
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      LEFT JOIN students s ON u.id = s.id_user
      LEFT JOIN teachers t ON u.id = t.id_user
      LEFT JOIN administrators a ON u.id = a.id_user
      LEFT JOIN schools sc ON sc.SIG = COALESCE(s.SIG, t.SIG, a.SIG) WHERE u.email = ?`;

      let queryAll = `SELECT 
        u.id, u.document, u.name, u.last_name, u.email, u.phone, u.role_id,
        u.is_first_login, u.is_active,
        r.name AS role,
        s.id AS id_student,
        s.SIG AS student_sig, s.representative_id, s.tuition_number, 
        s.allergies, s.medical_condition, s.weight, s.height, 
        s.shirt_size, s.pants_size, s.shoe_size,
        t.SIG AS teacher_sig,
        a.SIG AS admin_sig,
        sc.SIG AS school_sig, sc.name AS school_name, sc.address AS school_address,
        sc.phone AS school_phone, sc.email AS school_email, sc.type AS school_type,
        sc.DEA_CODE AS school_DEA_CODE, sc.RIF AS school_RIF, sc.company_name AS school_company_name

      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      LEFT JOIN students s ON u.id = s.id_user
      LEFT JOIN teachers t ON u.id = t.id_user
      LEFT JOIN administrators a ON u.id = a.id_user
      LEFT JOIN schools sc ON sc.SIG = COALESCE(s.SIG, t.SIG, a.SIG)`;

      let query = email ? queryEmail : queryAll;

      const [rows] = await pool.query(query, email ? [email] : []);

      return rows.map((row) => {
        const user = {
          id: row.id,
          document: row.document,
          name: row.name,
          last_name: row.last_name,
          email: row.email,
          phone: row.phone,
          role_id: row.role_id,
          role: row.role,
          is_first_login: row.is_first_login,
          is_active: row.is_active,
        };

        if (row.student_sig) {
          user.students = {
            id_student: row.id_student,
            SIG: row.student_sig,
            representative_id: row.representative_id,
            tuition_number: row.tuition_number,
            year_id: row.year_id,
            id_section: row.id_section,
            id_period: row.id_period,
          };
        }

        if (row.teacher_sig) {
          user.teachers = {
            SIG: row.teacher_sig,
          };
        }
        if (row.admin_sig) {
          user.administrators = {
            SIG: row.admin_sig,
            id_administrators: row.id,
          };
        }

        if (row.school_sig) {
          user.school = {
            SIG: row.school_sig,
            name: row.school_name,
            address: row.school_address,
            phone: row.school_phone,
            email: row.school_email,
            type: row.school_type,
            DEA_CODE: row.school_DEA_CODE,
            RIF: row.school_RIF,
            company_name: row.school_company_name,
          };
        }

        return user;
      });
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      return [];
    }
  }

  /**
   * Crea un nuevo usuario en la base de datos y relaciona el usuario con la tabla correspondiente
   * @param {Users} user - Objeto de la clase Users
   * @returns {number|boolean} El ID del usuario creado o False si ocurre un error
   */
  static async createUser(user) {
    const connection = await pool.getConnection();

    try {
      // 2. Iniciamos la transacción sobre esta conexión exclusiva
      await connection.beginTransaction();

      const hashedPassword = await bcrypt.hash(user.password, 10);

      // NOTA: Usamos 'connection.query', NO 'pool.query'
      const [result] = await connection.query(
        "INSERT INTO users (document, name, last_name, email, phone, role_id, pass) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          user.document,
          user.name,
          user.last_name,
          user.email,
          user.phone,
          user.role_id,
          hashedPassword,
        ],
      );

      const idUser = result.insertId;
      const roleUser = Number(user.role_id);

      switch (roleUser) {
        case 2:
          await connection.query(
            "INSERT INTO students (id_user, gender, SIG, representative_id, tuition_number, allergies, medical_condition, weight, birth_date, height, shirt_size, pants_size, shoe_size, `condition`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              idUser,
              user.gender,
              user.SIG,
              user.representative_id,
              user.tuition_number,
              user.allergies,
              user.medical_condition,
              user.weight,
              user.birth_date,
              user.height,
              user.shirt_size,
              user.pants_size,
              user.shoe_size,
              user.status,
            ],
          );
          break;
        case 3:
          await connection.query(
            "INSERT INTO teachers (id_user, SIG) VALUES (?, ?)",
            [idUser, user.SIG],
          );
          break;
        case 4:
          await connection.query(
            "INSERT INTO directors (id_user, SIG) VALUES (?, ?)",
            [idUser, user.SIG],
          );
          break;
        case 5:
          await connection.query(
            "INSERT INTO administrators (id_user, SIG) VALUES (?, ?)",
            [idUser, user.SIG],
          );
          break;
        default:
          console.error(
            `El role ${roleUser} no requiere registro en una tabla secundaria`,
          );
          break;
      }

      // 3. Si todas las consultas funcionaron sin errores, guardamos los cambios de forma definitiva
      await connection.commit();
      return idUser;
    } catch (error) {
      // 4. Si algo falla en cualquier punto del proceso, revertimos TODO (no se creará el usuario ni el rol)
      await connection.rollback();

      console.error("Error al crear usuario (Transacción revertida):", error);
      return false;
    } finally {
      // 5. CRÍTICO: Devolvemos la conexión al pool pase lo que pase
      connection.release();
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
      const [result] = await pool.query(
        `SELECT 
    u.id AS id_user,                       
    COALESCE(s.id, t.id, a.id) AS id,     
    u.document, 
    u.name, 
    u.last_name, 
    u.email, 
    u.phone, 
    u.pass AS password, 
    r.name AS role, 
    u.is_first_login, 
    u.is_active,
    COALESCE(t.SIG, a.SIG, s.SIG) AS SIG
FROM users u 
INNER JOIN roles r ON u.role_id = r.id 
LEFT JOIN students s ON u.id = s.id_user
LEFT JOIN schools sch_est ON s.SIG = sch_est.SIG
LEFT JOIN teachers t ON u.id = t.id_user
LEFT JOIN schools sch_prof ON t.SIG = sch_prof.SIG
LEFT JOIN administrators a ON u.id = a.id_user
LEFT JOIN schools sch_adm ON a.SIG = sch_adm.SIG
WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(?))`,
        [email],
      );
      if (!result[0]) {
        return null;
      }
      return { ...result[0] };
    } catch (error) {
      console.error("Error al obtener usuario por email:", error);
      return null;
    }
  }

  /**
   * Cambia la contraseña de un usuario
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
  static async deleteUser(id, role_id) {
    try {
      switch (role_id) {
        case 2:
          await pool.query("DELETE FROM students WHERE id_user = ?", [id]);
          break;
        case 3:
          await pool.query("DELETE FROM teachers WHERE id_user = ?", [id]);
          break;
        case 4:
          await pool.query("DELETE FROM administrators WHERE id_user = ?", [
            id,
          ]);
          break;
        default:
          console.error(
            `El role ${role_id} no requiere eliminación en una tabla`,
          );
          break;
      }
      const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);
      await pool.commit();
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      return false;
    }
  }

  /**
   * Actualiza un usuario en la base de datos
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
}
