import { Teachers } from "../models/Teachers.model.js";
import { Academic_periods } from "../models/Academin_period.model.js";

export const getTeachers = async (req, res) => {
  try {
    console.log("🔍 getTeachers");

    const SIG = req.user.SIG;
    const id_period = req.user.id_period;

    if (!SIG) {
      console.log("❌ SIG es requerido");
      return res.status(400).json({ message: "SIG es requerido" });
    }

    let targetPeriodId = id_period;

    if (!targetPeriodId) {
      console.log(
        "📅 No se especificó id_period, buscando el periodo activo...",
      );
      const periods = await Academic_periods.getAcademicPeriods(SIG);

      // Validamos que existan periodos registrados
      if (!periods || periods.length === 0) {
        console.log("❌ No se encontraron periodos registrados para este SIG");
        return res.status(404).json({
          message:
            "No se encontró ningún periodo académico registrado para esta institución.",
        });
      }

      const activePeriod = periods.find((item) => item.is_active === 1);

      if (!activePeriod) {
        console.log("❌ no active period found");
        return res.status(404).json({
          message:
            "No se encontró ningún periodo académico activo para esta institución.",
        });
      }
      targetPeriodId = activePeriod.id;
    }

    console.log(
      `🔄 Buscando profesores para SIG: ${SIG} | Periodo: ${targetPeriodId}`,
    );

    // Ejecutamos la consulta pasándole las propiedades limpias
    const teachers = await Teachers.getAllTeachersWithLoad({
      SIG: SIG,
    });

    if (!teachers || teachers.length === 0) {
      console.log("⚠️ No se encontraron profesores registrados");
      return res
        .status(404)
        .json({ message: "Esta escuela no tiene profesores registrados" });
    }

    console.log("✅ Profesores obtenidos con éxito");
    return res.status(200).json(teachers);
  } catch (error) {
    console.error("❌ Error en getTeachers:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getLoadAcademicTeacher = async (req, res) => {
  try {
    console.log("🔍 Iniciando getLoadAcademicTeacher");

    const SIG = req.user.SIG;
    const id = req.user.id;

    // 1. Validación de parámetros con el HTTP Status correcto (400)
    if (!id || !SIG) {
      console.log(
        `❌ Error: El ID del profesor y el SIG son totalmente requeridos.`,
      );
      return res.status(400).json({
        success: false,
        error: "Faltan parámetros obligatorios (ID o SIG).",
      });
    }

    // 2. Ejecutamos la consulta en el Modelo
    const teacherData = await Teachers.getTeacherWithLoadByID(SIG, id);
    console.log("✅ Resultado del modelo loadAcademicTeacher:", teacherData);

    // 3. Si el modelo devuelve null, respondemos de forma controlada con un 404
    if (!teacherData) {
      return res.status(404).json({
        success: false,
        error:
          "No se encontró ningún profesor con el ID suministrado en este período activo.",
      });
    }

    // 4. Respondemos con éxito pasándole directamente el array que tu frontend mapea
    // Si tu frontend espera el objeto completo del profesor, manda 'teacherData'
    // Si espera solo las materias, manda 'teacherData.academic_load'
    return res.status(200).json(teacherData.academic_load || []);
  } catch (error) {
    console.error("❌ Error catastrófico en getLoadAcademicTeacher:", error);
    return res.status(500).json({ error: error.message });
  }
};
