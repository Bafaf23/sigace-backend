import { prisma } from "../lib/prisma.js";
/**
 * Genera un número de matrícula único para un estudiante
 * @param {string} SIG - SIG de la escuela
 * @returns {string} El número de matrícula único
 */
export const generateTuitionNumber = async (SIG) => {
  try {
    const prefix = "MAT";
    const year = new Date().getFullYear();

    const totalStudents = await prisma.student.count({
      where: {
        SIG: SIG,
      },
    });

    const next = totalStudents + 1;

    return `${SIG}-${year}-${next}`;
  } catch (error) {
    console.error("Error al generar número de matrícula:", error);
    return null;
  }
};
