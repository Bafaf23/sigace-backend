import { LoadAcademic } from "../models/LoadAcademic.model.js";
import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const { verify } = jsonwebtoken;

export const createLoadAcademic = async (req, res) => {
  try {
    console.log("⚠️ createLoadAcademic controller");
    const { teacherId, sectionId, id_period, subjectId, SIG } = req.body;

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
      res
        .status(201)
        .json({ message: "Registro de carga académica creado correctamente" });
    } else {
      console.log("❌ Error al crear el registro de carga académica");
      res
        .status(500)
        .json({ message: "Error al crear el registro de carga académica" });
    }
  } catch (error) {
    console.error("Error al crear el registro de carga académica:", error);
    res
      .status(500)
      .json({ message: "Error al crear el registro de carga académica" });
  }
};

export const getLoadAcademic = async (req, res) => {
  try {
    console.log("⚠️ getLoadAcademic controller");
    const { SIG } = req.params;
    const auth = req.headers.authorization;
    if (!auth) {
      console.log("❌ Authorization is required");
      return res.status(401).json({ message: "Authorization is required" });
    }
    const token = auth.split(" ")[1];
    const decoded = verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      console.log("❌ Invalid token");
      return res.status(401).json({ message: "Invalid token" });
    }

    if (!SIG) {
      console.log("❌ SIG is required");
      return res.status(400).json({ message: "SIG is required" });
    }
    console.log("🔃 getLoadAcademic controller");
    const result = await LoadAcademic.getLoadAcademic(SIG);
    console.log("✅ getLoadAcademic controller");
    res.status(200).json(result);
  } catch (error) {
    console.error("Error al obtener el registro de carga académica:", error);
    res
      .status(500)
      .json({ message: "Error al obtener el registro de carga académica" });
  }
};
