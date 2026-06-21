import { Grade } from "../models/Grade.model.js";

export const createGrade = async (req, res) => {
  try {
    console.log(`⚠️ Create Grade`);
    const { id_evaluation, id_student, grade } = req.body;

    if (!id_evaluation || !id_student || grade == null) {
      return res
        .status(400)
        .json({ success: false, message: "La información es requerida" });
    }

    if (grade === 0) {
      console.log(`❌ Nota no valida, ${grade}, tiene que ser mayor que 0`);
      return res
        .status(400)
        .json({ success: false, message: "La nota no puede ser 0" });
    } else if (grade > 20) {
      console.log(`❌ Nota no valida, ${grade}, tiene que ser menor que 20`);
      return res
        .status(400)
        .json({ success: false, message: "La nota no puede ser mayor a 20" });
    }

    const note = await Grade.createGrade({ id_evaluation, id_student, grade });
    if (note) {
      return res.status(200).json({
        success: true,
        message: "La calificación fue cargada exitosamente",
      });
    }

    return res
      .status(500)
      .json({ success: false, message: "No se pudo cargar la calificación" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
};

export const getGradeStudents = async (req, res) => {
  try {
    console.log(`⚠️ Get grade...`);

    // 1. CORREGIDO: Buscamos el ID ya sea en los Query params (?idLoadAcademic=...) o en los Path params (/:idLoadAcademic)
    const idLoadAcademic = req.params.id_load_academic;

    if (!idLoadAcademic) {
      console.log(`❌ El parámetro idLoadAcademic es requerido`);
      return res
        .status(400) // 400 es "Bad Request" (Error del cliente por no mandar el dato)
        .json({
          success: false,
          message: "El ID de la carga académica es requerido",
        });
    }

    console.log(`🔃 Loading grade...`);

    // 2. CORREGIDO: Añadido 'await' y pasamos el parámetro envuelto en un objeto {}
    // Nota: Si usas el método por carga académica que armamos antes, cámbialo por: Grade.getGradesByAcademicLoad
    const gradeStudent = await Grade.getGradeStudent({ idLoadAcademic });

    // 3. CORREGIDO: Las consultas de BD devuelven Arrays. Validamos si no existe o viene vacío con .length
    if (!gradeStudent || gradeStudent.length === 0) {
      console.log(`❌ Esta carga académica no tiene notas...`);
      return res.status(404).json({
        success: false,
        message: "No hay notas registradas para esta carga académica",
      });
    }

    console.log(`✅ Grade exists`);
    return res.status(200).json({ success: true, data: gradeStudent });
  } catch (error) {
    console.log(`Error en el controlador: ${error}`);
    return res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
};
