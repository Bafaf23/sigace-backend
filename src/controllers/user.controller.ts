import { User } from "../models/User.model.js";
import type { Request, Response } from "express";

export const createUser = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "No se proporcionaron datos" });
    }
    const user = await User.createUser({
      cedula: req.body.cedula,
      nombre: req.body.nombre,
      apellido: req.body.apellido,
      email: req.body.email,
      numeroDeTelefono: req.body.numeroDeTelefono,
      rol: req.body.rol,
      SIG: req.body.SIG,
      password: req.body.password,
    });

    if (!user) {
      return res.status(500).json({ error: "Error al crear usuario" });
    }
    return res.status(201).json({ message: "Usuario creado correctamente" });
  } catch (error) {
    console.error("❌ Error al crear un usuario:", error);
    throw error;
  }
};

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await User.getUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error("❌ Error al obtener usuarios:", error);
    throw error;
  }
};
