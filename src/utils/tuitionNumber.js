import { prisma } from "../lib/prisma.js";
import logger from "./logger.js";

/**
 * Genera un número de matrícula único para un estudiante.
 ** 1        | Prefijo (1)   | Primera letra del nombre del colegio (ej: "J")
 ** 2-5      | Código SIG    | Parte numérica del SIG de la escuela (ej: "3333")
 ** 6-9      | Año (4)       | Año en curso de la inscripción (ej: "2026")
 ** 10+      | Secuencia     | Total de estudiantes + 1 (ej: "01", "02")
 * @param {string} SIG - SIG de la escuela
 * @returns {Promise<string|null>} El número de matrícula único formateado (ej: "J3333202601")
 */
export const tuitionNumber = async (SIG) => {
  try {
    logger.info("Generando numero de matricula...");
    const year = new Date().getFullYear();

    const school = await prisma.school.findUnique({
      where: {
        SIG: SIG,
      },
    });

    if (!school)
      return logger.error("El codigo SIG no corresponde a una colegio");

    const name = school.school_name.slice(5).toUpperCase().trim() || "X";
    const prefix = `${name.charAt(0)}${SIG.slice(3).trim()}`;

    const totalStudents = await prisma.student.count({
      where: {
        SIG: SIG,
      },
    });

    const next = totalStudents + 1;
    logger.info("Exito, numero de matricula generado", {
      tuitionNumber: `${prefix}${year}${next}`,
    });
    return `${prefix}${year}${next}`;
  } catch (error) {
    console.error("Error al generar número de matrícula:", error);
    return null;
  } finally {
    await prisma.$disconnect;
  }
};

await tuitionNumber("SIG3728");
