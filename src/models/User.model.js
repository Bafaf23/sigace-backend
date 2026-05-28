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

  static async getUsers() {
    let db;
    try {
      db = await connectToDatabase();

      const [users] = await db.query(
        "SELECT u.id, u.document, u.name, u.last_name, u.email, u.phone, u.role_id, u.SIG, u.is_first_login, u.is_active, r.name AS role, s.name AS school FROM users u INNER JOIN roles r ON u.role_id = r.id INNER JOIN schools s ON u.SIG = s.SIG",
      );
      return users.map(
        ({
          id,
          document,
          name,
          last_name,
          email,
          phone,
          role,
          SIG,
          school,
          is_first_login,
          is_active,
        }) => ({
          id,
          document,
          name,
          last_name,
          email,
          phone,
          role,
          school,
          is_first_login,
          is_active,
          SIG,
        }),
      );
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      return [];
    } finally {
      await closeDatabaseConnection(db);
    }
  }

  static async createUser(user) {
    let db;
    try {
      db = await connectToDatabase();
      const [result] = await db.query(
        "INSERT INTO users (document, name, last_name, email, phone, role_id, SIG, pass) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          user.document,
          user.name,
          user.last_name,
          user.email,
          user.phone,
          user.role_id,
          user.SIG,
          await bcrypt.hash(user.password, 10),
        ],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error al crear usuario:", error);
      return false;
    } finally {
      await closeDatabaseConnection(db);
    }
  }

  static async getUserByEmail(email) {
    let db;
    try {
      db = await connectToDatabase();
      const [result] = await db.query(
        "SELECT u.id, u.document, u.name, u.last_name, u.email, u.phone, u.pass AS password, r.name AS role, u.SIG, u.is_first_login, u.is_active FROM users u INNER JOIN roles r ON u.role_id = r.id WHERE u.email = ?",
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

  static async deleteUser(id) {
    let db;
    try {
      db = await connectToDatabase();
      const [result] = await db.query("DELETE FROM users WHERE id = ?", [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      return false;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }

  static async updateUser(user) {
    let db;
    try {
      db = await connectToDatabase();
      const [result] = await db.query(
        "UPDATE users SET name = ?, last_name = ?, email = ?, phone = ?, role_id = ?, SIG = ? WHERE id = ?",
        [
          user.name,
          user.last_name,
          user.email,
          user.phone,
          user.role_id,
          user.SIG,
          user.id,
        ],
      );
      return result.affectedRows > 0;
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
