import { Sessions } from "../models/Sessions.model.js";

export const createSession = async (req, res) => {
  try {
    const { name, SIG } = req.body;

    if (!name || !SIG) {
      return res.status(400).json({ message: "Nombre y SIG son requeridos" });
    }

    const session = await Sessions.createSession({ name, SIG });

    if (!session) {
      return res.status(400).json({ message: "Error al crear la sesión" });
    }
    res.status(201).json({ message: "Sesión creada correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al crear la sesión" });
  }
};
