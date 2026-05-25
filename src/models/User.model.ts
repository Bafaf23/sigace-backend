import type { RowDataPacket } from "mysql2";
import { connectToDatabase, closeDatabaseConnection } from "../db.js";
import bcrypt from "bcryptjs";

export interface UserListItem {
  cedula: string;
  nombre: string;
  apellido: string;
  email: string;
  numeroDeTelefono: string;
  rol: number;
  SIG: string;
}

interface UserRow extends RowDataPacket, UserListItem {}

interface AuthUserRow extends RowDataPacket {
  id: number;
  cedula: string;
  nombre: string;
  apellido: string;
  email: string;
  numeroDeTelefono: string;
  contraseña: string;
  rol: string;
  SIG: string;
}

export class User {
  constructor(
    public cedula: string,
    public nombre: string,
    public apellido: string,
    public email: string,
    public numeroDeTelefono: string,
    public rol: string,
    public password: string,
    public SIG: string,
  ) {
    this.cedula = cedula;
    this.nombre = nombre;
    this.apellido = apellido;
    this.email = email;
    this.numeroDeTelefono = numeroDeTelefono;
    this.rol = rol;
    this.password = password;
    this.SIG = SIG;
  }

  public static async getUsers(): Promise<UserListItem[]> {
    try {
      const db = await connectToDatabase();

      const [users] = await db.query<UserRow[]>(
        "SELECT cedula, nombre, apellido, email, numero_de_telefono AS numeroDeTelefono, rol_id AS rol, SIG FROM usuarios",
      );
      return users.map(
        ({ cedula, nombre, apellido, email, numeroDeTelefono, rol, SIG }) => ({
          cedula,
          nombre,
          apellido,
          email,
          numeroDeTelefono,
          rol,
          SIG,
        }),
      );
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      throw error;
    } finally {
      await closeDatabaseConnection();
    }
  }

  public static async createUser(user: User): Promise<boolean> {
    try {
      const db = await connectToDatabase();
      const [result] = await db.query(
        "INSERT INTO usuarios (cedula, nombre, apellido, email, numero_de_telefono, rol_id, SIG, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          user.cedula,
          user.nombre,
          user.apellido,
          user.email,
          user.numeroDeTelefono,
          user.rol,
          user.SIG,
          await bcrypt.hash(user.password, 10),
        ],
      );
      await closeDatabaseConnection();
      return true;
    } catch (error) {
      console.error("Error al crear usuario:", error);
      await closeDatabaseConnection();
      return false;
    }
  }

  public static async getUserByEmail(
    email: string,
  ): Promise<AuthUserRow | null> {
    try {
      const db = await connectToDatabase();
      const [result] = await db.query<AuthUserRow[]>(
        "SELECT u.id, u.cedula, u.nombre, u.apellido, u.email, u.numero_de_telefono AS numeroDeTelefono, u.contraseña, r.nombre AS rol, u.SIG FROM usuarios u INNER JOIN roles r ON u.rol_id = r.id WHERE u.email = ?",
        [email],
      );
      await closeDatabaseConnection();
      return result[0] || null;
    } catch (error) {
      console.error("Error al obtener usuario por email:", error);
      await closeDatabaseConnection();
      return null;
    } finally {
      await closeDatabaseConnection();
    }
  }
}
