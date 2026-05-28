import { Subject } from "../models/Subject.model.js";

export const createSubject = async (req, res) => {
  try {
    console.log("⚠️ createSubject");

    const { code_subject, name, year_academic, SIG } = req.body ?? {};

    if (!code_subject || !name || !year_academic || !SIG) {
      return res
        .status(400)
        .json({ message: "Todos los campos son requeridos" });
    }

    const subject = new Subject(code_subject, name, year_academic, SIG);
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
