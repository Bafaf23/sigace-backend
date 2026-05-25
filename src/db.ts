import { createPool } from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const connectToDatabase = async () => {
  try {
    const connection = await createPool({
      host: "localhost",
      user: "root",
      password: "",
      database: "sigace_db",
      port: 3306,
    });
    console.log("Conexión a la base de datos establecida");
    return connection;
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error);
    throw error;
  }
};

export const closeDatabaseConnection = async () => {
  try {
    const connection = await connectToDatabase();
    if (connection) {
      await connection.end();
      console.log("Conexión a la base de datos cerrada");
    } else {
      console.log("No hay conexión a la base de datos para cerrar");
    }
  } catch (error) {
    console.error("Error al cerrar la conexión a la base de datos:", error);
    throw error;
  }
};
