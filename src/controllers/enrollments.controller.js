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
