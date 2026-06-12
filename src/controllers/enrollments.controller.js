import { Enrollments } from "../models/Enrollments.model.js";

export const createEnrollment = async (req, res) => {
  console.log("⚠️ createEnrollment... creating enrollment");
  const { id_student, id_period, id_section, status } = req.body;

  if (!id_student || !id_period || !id_section || !status) {
    console.log("❌ to the createEnrollment... missing data");
    return res.status(400).json({
      error: true,
      message: "Faltan datos requeridos para crear el registro de matrícula",
    });
  }

  const enrollment = new Enrollments(id_student, id_period, id_section, status);
  console.log("🔄 to the createEnrollment... enrollment", enrollment);
  const result = await Enrollments.createEnrollment(enrollment);
  if (result > 0) {
    console.log(
      "✅ to the createEnrollment... enrollment created successfully",
    );
    return res.status(201).json({
      error: false,
      message: "Registro de matrícula creado correctamente",
    });
  }
  console.log("❌ to the createEnrollment... error creating enrollment");
  return res.status(400).json({
    error: true,
    message: "Error al crear el registro de matrícula",
  });
};

export const getApprovedStudents = async (req, res) => {
  try {
    const { id_period } = req.query;

    if (!id_period) {
      return res.status(400).json({
        success: false,
        message: "El ID del periodo académico es requerido.",
      });
    }

    // AGREGADO: el 'await' para esperar que la BD responda
    const studentAproved = await Enrollments.getApprovedForPromotion(id_period);

    // Cambiado a 200 o 404 según prefieras, pero devolviendo el formato estructurado
    if (studentAproved.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        message: "No hay Estudiantes aprobados en este momento",
      });
    }

    return res.status(200).json({
      success: true,
      count: studentAproved.length,
      data: studentAproved,
    });
  } catch (error) {
    console.log(error);
    // AGREGADO: Respuesta en caso de que la query SQL falle por sintaxis
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor al procesar la solicitud.",
    });
  }
};
