import { Teachers } from "../models/Teachers.model.js";
export const getTeachers = async (req, res) => {
  try {
    console.log("🔍 getTeachers");
    const SIG = req.query.SIG;
    const authHeader = req.headers.authorization;

    if (!SIG) {
      console.log("❌ SIG es requerido");
      return res.status(400).json({ message: "SIG es requerido" });
    }

    if (!authHeader) {
      console.log(
        "❌ Authorization no tienes persimoso para realizar esta acción",
      );
      return res
        .status(401)
        .json({ message: "No tienes persimoso para realizar esta acción" });
    }

    const teachers = await Teachers.getTeachers(SIG);

    console.log("✅ teachers");
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
