import type { Request, Response } from "express";
import { School } from "../models/School.model.js";
import { errorMonitor } from "node:events";

export const getAllSchools = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    console.log("getAllSchools");
    const schools = await School.getAllSchools();
    res.status(200).json(schools);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener las escuelas" });
  }
};

export const getSchoolBySIG = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    console.log("getSchoolBySIG");
    const SIG = req.params.SIG as string;
    if (!SIG) {
      res.status(500).json({ error: "El SIG es requerido" });
    }

    const school = await School.getSchoolBySIG(SIG);

    if (!school) {
      return new Promise((resolve) => {
        resolve(res.status(500).json({ error: "Escuela no encontrada" }));
      });
    }
    return new Promise((resolve) => {
      resolve(res.status(200).json(school));
    });
  } catch (error) {
    return new Promise((resolve) => {
      resolve(res.status(500).json({ error: "Error al obtener la escuela" }));
    });
  }
};

export const createSchool = async (
  req: Request,
  res: Response,
): Promise<void | Response> => {
  try {
    console.log("--------------------------------");
    console.log("createSchool... creando escuela...");
    console.log("--------------------------------");

    const school = req.body;
    if (!school) {
      return new Promise((resolve) => {
        resolve(res.status(500).json({ error: "La escuela es requerida" }));
      });
    }
    const newSchool = await School.createSchool(school);

    if (!newSchool) {
      return new Promise((resolve) => {
        resolve(res.status(500).json({ error: "Error al crear la escuela" }));
      });
    }

    console.log("--------------------------------");
    console.log("Escuela creada correctamente");
    console.log("--------------------------------");
    
    return new Promise((resolve) => {
      resolve(
        res
          .status(200)
          .json({ success: true, message: "Escuela creada correctamente" }),
      );
    });
  } catch (error) {
    return new Promise((resolve) => {
      resolve(res.status(500).json({ error: "Error al crear la escuela" }));
    });
  }
};
