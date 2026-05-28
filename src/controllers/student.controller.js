import { Student } from "../models/Student.model.js";

export const getStudents = async (req, res) => {
  try {
    const { SIG } = req.params;
    const authUser = req.session?.user;
    const userRole = authUser?.role;
    const allowedRoles = ["SuperAdmin", "Director", "Administrador"];

    if (!allowedRoles.includes(userRole)) {
      return res
        .status(403)
        .json({ error: "No tienes permisos para acceder a esta ruta" });
    }

    const schoolSIG = SIG?.trim();

    if (!schoolSIG) {
      return res.status(400).json({ message: "SIG es requerido" });
    }

    const students = await Student.getAllStudents({ SIG: schoolSIG });

    if (students.length === 0) {
      return res
        .status(404)
        .json({ message: "Esta escuela no tiene estudiantes" });
    }
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
