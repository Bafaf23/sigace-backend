import { Teachers } from "../models/Teachers.model.js";
import { Academic_periods } from "../models/Academin_period.model.js";

export const getTeachers = async (req, res) => {
  try {
    console.log("🔍 getTeachers");

    // 🌟 CORREGIDO: Desestructuramos correctamente las propiedades desde req.query
    const { SIG, id_period } = req.query;
    const authHeader = req.headers.authorization;

    if (!SIG) {
      console.log("❌ SIG es requerido");
      return res.status(400).json({ message: "SIG es requerido" });
    }

    if (!authHeader) {
      console.log(
        "❌ Authorization: No tienes permisos para realizar esta acción",
      );
      return res
        .status(401)
        .json({ message: "No tienes permisos para realizar esta acción" });
    }

    let targetPeriodId = id_period;

    // 🌟 Ahora sí funcionará la validación porque si no viene en la URL, será undefined
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
    console.log("🔍 getLoadAcademicTeacher");
    const { id } = req.params;
    if (!id) {
      console.log(`❌ el ID es requerido`);
      return res.status(200).json(loadAcademicTeacher);
    }
    const loadAcademicTeacher = await Teachers.getLoadAcademicTeacher(id);
    console.log("✅ loadAcademicTeacher");
    return res.status(200).json(loadAcademicTeacher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
