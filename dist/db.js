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
    }
    catch (error) {
        console.error("Error al conectar a la base de datos:", error);
        throw error;
    }
};
//# sourceMappingURL=db.js.map