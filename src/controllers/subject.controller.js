import { Subject } from "../models/Subject.model.js";

export const createSubject = async (req, res) => {
  try {
    console.log("⚠️ createSubject");

    const { name, SIG, year_id } = req.body ?? {};

    if (!name || !SIG || !year_id) {
      return res
        .status(400)
        .json({ message: "Todos los campos son requeridos" });
    }

    const suffix = String(year_id).substring(0, 1).toUpperCase();
    const code_suffix = suffix.padStart(2, "0");

    const code_subject = `${name.substring(0, 3).toUpperCase()}-${code_suffix}`;

    const subject = new Subject(code_subject, name, year_id, SIG);
    const subjectCreated = await Subject.createSubject(subject);

    if (!subjectCreated) {
      return res.status(400).json({ message: "Error al crear la materia" });
    }
    console.log("✅ Subject created successfully");
    return res.status(201).json({ message: "Materia creada correctamente" });
  } catch (error) {
    return res.status(500).json({ message: "Error al crear la materia" });
  }
};

export const getSubjects = async (req, res) => {
  try {
    console.log("⚠️ getSubjects");
    const { SIG } = req.params ?? {};

    if (!SIG) {
      return res.status(400).json({ message: "SIG es requerido" });
    }

    const subjects = await Subject.getSubjects(SIG);

    if (subjects.length === 0) {
      return res.status(400).json({ message: "No se encontraron materias" });
    }
    console.log("✅ Subjects found successfully");
    return res.status(200).json(subjects);
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener las materias" });
  }
};

export const getYears = async (req, res) => {
  try {
    console.log("⚠️ getYears");
    const { SIG } = req.params ?? {};
    const years = await Subject.getYears(SIG);

    if (years.length === 0) {
      return res.status(400).json({ message: "No se encontraron años" });
    }
    console.log("✅ Years found successfully");
    return res.status(200).json(years);
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener los años" });
  }
};
