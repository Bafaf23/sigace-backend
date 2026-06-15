import { Sections } from "../models/Section.model.js";
import { getCurrentPeriod } from "../utils/periodAc.js";
import jsonwebtoken from "jsonwebtoken";

const { verify } = jsonwebtoken;

export const createSection = async (req, res) => {
  try {
    console.log("⚠️ createSection");
    const SIG = req.body.SIG;
    const id_year = req.body.yearId;
    const name = req.body.name;
    const guide_id = req.body.teacherId;
    const capacity = req.body.capacity;
    const id_period = req.body.id_period;

    console.log("section data: ", {
      name,
      SIG,
      id_year,
      id_period,
      guide_id,
      capacity,
    });

    const auth = req.headers.authorization;
    const token = auth?.startsWith("Bearer ") ? auth.split(" ")[1] : null;

    let tokenUser = null;

    if (token) {
      try {
        tokenUser = verify(token, process.env.JWT_SECRET);
      } catch (_error) {
        console.log("❌ createSection... error creating section...");

        return res.status(401).json({ error: true, message: "Token inválido" });
      }
    }

    if (!tokenUser) {
      console.log("❌ createSection... error creating section...");
      return res.status(401).json({ error: true, message: "Token inválido" });
    }

    if (!name || !SIG || !id_year || !guide_id || !capacity) {
      console.log("❌ Todos los campos son requeridos");
      return res.status(400).json({
        success: false,
        error: true,
        message: "Todos los campos son requeridos",
      });
    }

    console.log("🔄 create section loading...");
    const section = await Sections.createSection({
      name,
      SIG,
      id_period,
      id_year,
      guide_id,
      capacity,
    });

    if (!section) {
      console.log("❌ Error trying to create the section");
      return res
        .status(400)
        .json({ success: false, message: "Error al crear la sección" });
    }
    console.log("✅ Section created successfully");
    res
      .status(201)
      .json({ success: true, message: "Sección creada correctamente" });
  } catch (error) {
    console.log("❌ Error trying to create the section", error);
    res.status(500).json({
      success: false,
      error: true,
      message: "Error al crear la sección",
    });
  }
};

export const getSections = async (req, res) => {
  try {
    console.log("⚠️ getSections");
    const SIG = req.params.SIG;
    const id_period = req.params.id_period;
    const auth = req.headers.authorization;
    const token = auth?.startsWith("Bearer ") ? auth.split(" ")[1] : null;
    let tokenUser = null;
    if (token) {
      try {
        tokenUser = verify(token, process.env.JWT_SECRET);
      } catch (_error) {
        console.log("❌ getSections... error getting sections...");
        return res.status(401).json({ error: true, message: "Token inválido" });
      }
    }
    if (!tokenUser) {
      console.log("❌ getSections... error getting sections...");
      return res.status(401).json({ error: true, message: "Token inválido" });
    }
    if (!SIG || !id_period) {
      console.log("❌ getSections... error getting sections...");
      return res.status(400).json({ error: true, message: "SIG es requerido" });
    }
    console.log("🔄 getSections loading...");
    const sections = await Sections.getSections(SIG, id_period);
    console.log("✅ Sections found successfully");
    console.log(sections);
    return res.status(200).json(sections);
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener las secciones" });
  }
};
