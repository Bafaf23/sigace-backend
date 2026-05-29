import { connectToDatabase, closeDatabaseConnection } from "../db.js";
import bcrypt from "bcryptjs";

export class User {
  constructor(
    id,
    document,
    name,
    last_name,
    email,
    phone,
    role_id,
    password,
    is_first_login,
    is_active,
    SIG,
    created_at,
    updated_at,
  ) {
    this.id = id;
    this.document = document;
    this.name = name;
    this.last_name = last_name;
    this.email = email;
    this.phone = phone;
    this.role_id = role_id;
    this.password = password;
    this.is_first_login = is_first_login;
    this.is_active = is_active;
    this.SIG = SIG;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  /**
   * Obtiene todos los usuarios de la base de datos o un usuario por su email
   * @param {string} email - El email del usuario a buscar
   * @returns {Array<object>} Los usuarios encontrados
   * @returns {null} Null si no se encuentra el usuario
   * @returns {boolean} False si ocurre un error al obtener los usuarios
   */
  static async getUsers(email) {
    let db;
    try {
      db = await connectToDatabase();

      let queryEmail = `SELECT 
        u.id, u.document, u.name, u.last_name, u.email, u.phone, u.role_id,
        u.is_first_login, u.is_active,
        r.name AS role,
        s.SIG AS student_sig, s.representative_id, s.tuition_number, s.year_id, 
        s.session_id, s.allergies, s.medical_condition, s.weight, s.height, 
        s.shirt_size, s.pants_size, s.shoe_size, s.status AS student_status,
        t.SIG AS teacher_sig,
        a.SIG AS admin_sig,
        sc.SIG AS school_sig, sc.name AS school_name, sc.address AS school_address,
        sc.phone AS school_phone, sc.email AS school_email, sc.type AS school_type,
        sc.DEA_CODE AS school_DEA_CODE, sc.RIF AS school_RIF
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
        s.SIG AS student_sig, s.representative_id, s.tuition_number, s.year_id, 
        s.session_id, s.allergies, s.medical_condition, s.weight, s.height, 
        s.shirt_size, s.pants_size, s.shoe_size, s.status AS student_status,
        t.SIG AS teacher_sig,
        a.SIG AS admin_sig,
        sc.SIG AS school_sig, sc.name AS school_name, sc.address AS school_address,
        sc.phone AS school_phone, sc.email AS school_email, sc.type AS school_type,
        sc.DEA_CODE AS school_DEA_CODE, sc.RIF AS school_RIF
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      LEFT JOIN students s ON u.id = s.id_user
      LEFT JOIN teachers t ON u.id = t.id_user
      LEFT JOIN administrators a ON u.id = a.id_user
      LEFT JOIN schools sc ON sc.SIG = COALESCE(s.SIG, t.SIG, a.SIG)`;

      let query = email ? queryEmail : queryAll;

      const [rows] = await db.query(query, email ? [email] : []);

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
            SIG: row.student_sig,
            representative_id: row.representative_id,
            tuition_number: row.tuition_number,
            year_id: row.year_id,
            session_id: row.session_id,
          };
        }

        if (row.teacher_sig) {
          user.teachers = {
            SIG: row.teacher_sig,
          };
        }
        if (row.admin_sig) {
          user.administrators = { SIG: row.admin_sig };
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
          };
        }

        return user;
      });
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      return [];
    } finally {
      await closeDatabaseConnection(db);
    }
  }

  /**
   * Crea un nuevo usuario en la base de datos y relaciona el usuario con la tabla correspondiente
   * @param {object} user
   * @returns {number} El id del usuario creado
   * @returns {boolean} False si ocurre un error al crear el usuario
   */
  static async createUser(user) {
    let db;
    let connection;
    try {
      db = await connectToDatabase();
      connection = await db.getConnection();
      await connection.beginTransaction();

      const hashedPassword = await bcrypt.hash(user.password, 10);
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
            "INSERT INTO students (id_user, SIG, representative_id, tuition_number, year_id, session_id, allergies, medical_condition, weight, height, shirt_size, pants_size, shoe_size, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              idUser,
              user.SIG,
              user.representative_id,
              user.tuition_number,
              user.year_id,
              user.session_id,
              user.allergies,
              user.medical_condition,
              user.weight,
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
            "INSERT INTO administrators (id_user, SIG) VALUES (?, ?)",
            [idUser, user.SIG],
          );
          break;
        default:
          console.error(
            `El role ${roleUser} no requiere registro en una tabla`,
          );
          break;
      }
      await connection.commit();
      return idUser;
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      console.error("Error al crear usuario:", error);
      return false;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * Obtiene un usuario por su email
   * @param {string} email
   * @returns {object} El usuario encontrado
   * @returns {null} Null si no se encuentra el usuario
   */
  static async getUserByEmail(email) {
    let db;
    try {
      db = await connectToDatabase();
      const [result] = await db.query(
        `SELECT u.id, u.document, u.name, u.last_name, u.email, u.phone, u.pass AS password, r.name AS role, u.is_first_login, u.is_active,
        COALESCE(t.SIG, a.SIG, s.SIG) AS SIG
        FROM users u 
        INNER JOIN roles r ON u.role_id = r.id 
        LEFT JOIN students s ON u.id = s.id_user
        LEFT JOIN schools sch_est ON s.SIG = sch_est.SIG
        LEFT JOIN teachers t ON u.id = t.id_user
        LEFT JOIN schools sch_prof ON t.SIG = sch_prof.SIG
        LEFT JOIN administrators a ON u.id = a.id_user
        LEFT JOIN schools sch_adm ON a.SIG = sch_adm.SIG
        WHERE u.email = ?`,
        [email],
      );
      return result[0] || null;
    } catch (error) {
      console.error("Error al obtener usuario por email:", error);
      return null;
    } finally {
      await closeDatabaseConnection(db);
    }
  }

  static async changePassword(id, newPassword) {
    let db;
    try {
      db = await connectToDatabase();
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const [result] = await db.query(
        "UPDATE users SET pass = ?, is_first_login = ? WHERE id = ?",
        [hashedPassword, 0, id],
      );

      if (result.affectedRows === 0) {
        return false;
      }

      const [users] = await db.query("SELECT pass FROM users WHERE id = ?", [
        id,
      ]);

      return users[0]
        ? await bcrypt.compare(newPassword, users[0].pass)
        : false;
    } catch (error) {
      console.error("Error al cambiar la contraseña:", error);
      return false;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }

  /**
   * Elimina un usuario de la base de datos
   * @param {number} id
   * @returns {boolean} True si el usuario se eliminó correctamente, false si no se pudo eliminar
   */
  static async deleteUser(id, role_id) {
    let db;
    let connection;
    try {
      db = await connectToDatabase();
      connection = await db.getConnection();
      await connection.beginTransaction();
      switch (role_id) {
        case 2:
          await connection.query("DELETE FROM students WHERE id_user = ?", [
            id,
          ]);
          break;
        case 3:
          await connection.query("DELETE FROM teachers WHERE id_user = ?", [
            id,
          ]);
          break;
        case 4:
          await connection.query(
            "DELETE FROM administrators WHERE id_user = ?",
            [id],
          );
          break;
        default:
          console.error(
            `El role ${role_id} no requiere eliminación en una tabla`,
          );
          break;
      }
      const [result] = await connection.query(
        "DELETE FROM users WHERE id = ?",
        [id],
      );
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      return false;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  static async updateUser(user) {
    let db;
    try {
      db = await connectToDatabase();
      const [result] = await db.query(
        "UPDATE users SET name = ?, last_name = ?, email = ?, phone = ?, role_id = ? WHERE id = ?",
        [
          user.name,
          user.last_name,
          user.email,
          user.phone,
          user.role_id,
          user.id,
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
          await db.query(sigQuery, [user.SIG, user.id]);
        }
      }

      return true;
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      return false;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }
}
