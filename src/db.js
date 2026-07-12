import { createPool } from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const pool = createPool({
  host: process.env.DB_SERVER,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("Conexión a la base de datos establecida exitosamente.");
    connection.release(); // Siempre libera la conexión de prueba al pool
  } catch (error) {
    console.error("Error crítico al conectar a la base de datos:", error);
  }
})();

export const closeDatabaseConnection = async () => {
  try {
    await pool.end();
    console.log("Pool de conexiones a la base de datos cerrado");
  } catch (error) {
    console.error("Error al cerrar el pool de la base de datos:", error);
    throw error;
  }
};
