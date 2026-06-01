import { connectToDatabase, closeDatabaseConnection } from "../db.js";
/**
 * Genera un número de matrícula único para un estudiante
 * @param {string} SIG - SIG de la escuela
 * @returns {string} El número de matrícula único
 */
export const generateTuitionNumber = async (SIG) => {
  let db;
  try {
    const prefix = "MAT"; // Matrícula
    const year = new Date().getFullYear();
    db = await connectToDatabase();
    const [rows] = await db.query(
      "SELECT COUNT(*) AS total FROM students WHERE SIG = ?",
      [SIG],
    );
    const next = Number(rows[0]?.total ?? 0) + 1;
    return `${prefix}-${SIG}-${year}-${next}`;
  } catch (error) {
    console.error("Error al generar número de matrícula:", error);
    return null;
  } finally {
    if (db) {
      await closeDatabaseConnection(db);
    }
  }
};
