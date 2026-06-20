import { createPool } from "mysql2/promise";

export const connectToDatabase = async () => {
  try {
    const connection = await createPool({
      host: `${process.env.DB_SERVER}`,
      user: `${process.env.DB_USER}`,
      password: `${process.env.DB_PASSWORD}`,
      database: `${process.env.DB_DATABASE}`,
      port: process.env.DB_PORT,
    });
    console.log("Conexión a la base de datos establecida");
    return connection;
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error);
    throw error;
  }
};

export const closeDatabaseConnection = async (connection) => {
  try {
    await connection.end();
    console.log("Conexión a la base de datos cerrada");
  } catch (error) {
    console.error("Error al cerrar la conexión a la base de datos:", error);
    throw error;
  }
};
