import { LoadAcademic } from "../models/LoadAcademic.model.js";

export const createLoadAcademic = async (req, res) => {
  try {
    console.log("⚠️ createLoadAcademic controller");
    const { teacherId, sectionId, id_period, subjectId } = req.body;
    const SIG = req.user.SIG;

    if (!teacherId || !sectionId || !id_period || !subjectId || !SIG) {
      console.log("❌ to the capas is required");
      return res
        .status(400)
        .json({ message: "Todos los campos son requeridos" });
    }
    console.log("🔃 createLoadAcademic controller");
    const loadAcademic = new LoadAcademic(
      null,
      teacherId,
      SIG,
      sectionId,
      id_period,
      subjectId,
      new Date(),
    );

    const result = await LoadAcademic.createLoadAcademic(loadAcademic);
    console.log("✅ createLoadAcademic controller");
    if (result) {
      return res
        .status(201)
        .json({ message: "Registro de carga académica creado correctamente" });
    } else {
      console.log("❌ Error al crear el registro de carga académica");
      return res
        .status(500)
        .json({ message: "Error al crear el registro de carga académica" });
    }
  } catch (error) {
    console.error("Error al crear el registro de carga académica:", error);
    return res
      .status(500)
      .json({ message: "Error al crear el registro de carga académica" });
  }
};

export const getLoadAcademic = async (req, res) => {
  try {
    console.log("⚠️ getLoadAcademic controller");

    const SIG = req.user.SIG;

    if (!SIG) {
      console.log("❌ SIG is required");
      return res.status(400).json({ message: "SIG is required" });
    }
    console.log("🔃 getLoadAcademic controller");

    const result = await LoadAcademic.getLoadAcademic(SIG);

    console.log("✅ getLoadAcademic controller");

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error al obtener el registro de carga académica:", error);
    return res
      .status(500)
      .json({ message: "Error al obtener el registro de carga académica" });
  }
};
