import { connectToDatabase } from "../db.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { createSIG } from "../utils/createSIG.js";

const emptyToNull = (value: string | null | undefined): string | null => {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : null;
};

/**
 * Interfaz para el resultado de la consulta a la base de datos de las escuelas
 */
interface SchoolRow extends RowDataPacket {
  SIG: string;
  nombre: string;
  direccion: string;
  telefono: string;
  correo: string;
  tipo: string;
  rif: string | null;
  codigo_DEA: string | null;
}

/**
 * Interfaz para el resultado de la consulta a la base de datos de la escuela
 */
interface SchoolResponse extends RowDataPacket {
  SIG: string;
  nombre: string;
  direccion: string;
  telefono: string;
  correo: string;
  tipo: string;
  rif: string | null;
  codigo_DEA: string | null;
}
export class School {
  constructor(
    public nombre: string,
    public direccion: string,
    public telefono: string,
    public correo: string,
    public tipo: string,
    public rif: string | null,
    public codigo_DEA: string | null,
  ) {
    this.nombre = nombre;
    this.direccion = direccion;
    this.telefono = telefono;
    this.correo = correo;
    this.tipo = tipo;
    this.rif = rif;
    this.codigo_DEA = codigo_DEA;
  }

  public static async getAllSchools(): Promise<SchoolRow[]> {
    try {
      const connection = await connectToDatabase();
      const [rows] = await connection.query<SchoolRow[]>(
        "SELECT * FROM liceos",
      );
      return rows;
    } catch (error) {
      console.error("Error al obtener las escuelas:", error);
      throw error;
    }
  }

  public static async getSchoolBySIG(
    SIG: string,
  ): Promise<SchoolResponse | undefined> {
    try {
      const connection = await connectToDatabase();
      const [rows] = await connection.query<SchoolRow[]>(
        "SELECT * FROM liceos WHERE SIG = ?",
        [SIG],
      );
      return rows[0];
    } catch (error) {
      console.error("Error al obtener la escuela:", error);
      throw error;
    }
  }

  public static async createSchool(
    school: SchoolResponse,
  ): Promise<boolean | undefined> {
    try {
      const connection = await connectToDatabase();
      const SIG = createSIG();
      const rif = emptyToNull(school.rif);
      const codigoDEA = emptyToNull(school.codigo_DEA);
      const [result] = await connection.query<ResultSetHeader>(
        "INSERT INTO liceos (SIG, nombre, direccion, telefono, email, tipo, rif, codigo_DEA) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          SIG,
          school.nombre,
          school.direccion,
          school.telefono,
          school.correo,
          school.tipo,
          rif,
          codigoDEA,
        ],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error al crear la escuela:", error);
      throw error;
    }
  }
}
