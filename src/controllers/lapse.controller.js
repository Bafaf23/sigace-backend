import { LapseModel } from "../models/Lapse.model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const { verify } = jwt;

export const getLapses = async (req, res) => {
  try {
    console.log(`⚠️ Getting lapses...`);
    const { SIG } = req.params;
    if (!SIG) {
      return res.status(400).json({ message: "SIG es requerido" });
    }
    const lapses = await LapseModel.getLapses(SIG);
    console.log(`✅ Lapses obtenidos correctamente`);
    res.status(200).json(lapses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener los lapses" });
  }
};

export const createLapse = async (req, res) => {
  try {
    console.log(`⚠️ Creating lapse...`);

    const { SIG } = req.params;
    if (!SIG) {
      console.log(`⚠️ SIG es requerido`);
      return res.status(400).json({ message: "SIG es requerido" });
    }

    const periods = await LapseModel.getAcademicPeriods(SIG);
    console.log(`✅ Periodos académicos obtenidos`);
    const periodActive = periods[0];

    if (!periodActive) {
      console.log(
        `⚠️ No existe un periodo académico activo para esta institución`,
      );
      return res.status(400).json({
        message: "No existe un periodo académico activo para esta institución",
      });
    }

    console.log(`✅ Periodo académico activo encontrado: ${periodActive.name}`);

    const lapsos = [];
    let dateRef = new Date(periodActive.start_date);
    for (let i = 1; i <= 3; i++) {
      // El inicio de este lapso es la fecha de referencia actual
      const start_date = new Date(dateRef);

      // El cierre es 3 meses después
      const end_date = new Date(start_date);
      end_date.setMonth(end_date.getMonth() + 3);

      const nuevoLapsoData = {
        id_period: periodActive.id,
        name: `Lapso ${i}`,
        start_date: start_date.toISOString().split("T")[0],
        end_date: end_date.toISOString().split("T")[0],
        is_active: i === 1,
      };

      const createdLapse = await LapseModel.createLapses(nuevoLapsoData);
      lapsos.push(createdLapse);

      dateRef = new Date(end_date);
      dateRef.setDate(dateRef.getDate() + 7);
    }

    console.log(lapsos);
    console.log(`✅ Los 3 Lapsos del año escolar fueron creados exitosamente`);
    return res.status(201).json({
      success: true,
      message:
        "Año escolar inicializado: Se crearon los 3 Lapsos automáticamente.",
      lapses: lapsos,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear el lapso" });
  }
};

export const endLapse = async (req, res) => {
  try {
    console.log(`⚠️ Ending lapse...`);
    const auth = req.headers.authorization;
    const idLapse = req.params.id;
    if (!idLapse) {
      return res.status(400).json({ message: "ID del lapso es requerido" });
    }
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = auth.split(" ")[1];
    const decoded = verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "Administrador") {
      return res
        .status(401)
        .json({ message: "No tienes permisos para finalizar el lapso" });
    }
    const lapse = await LapseModel.endLapse(idLapse);
    console.log(`✅ Lapso finalizado correctamente`);
    res
      .status(200)
      .json({ success: true, message: "Lapso finalizado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al finalizar el lapso" });
  }
};

export const startLapse = async (req, res) => {
  try {
    console.log(`⚠️ Starting lapse...`);
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "ID del lapso es requerido" });
    }
    const success = await LapseModel.startLapse(id);
    if (success) {
      console.log(`✅ Lapso iniciado correctamente`);
      res
        .status(200)
        .json({ success: true, message: "Lapso iniciado correctamente" });
    } else {
      console.log(
        `⚠️ Ya existe un lapso activo, finaliza el lapso anterior para iniciar uno nuevo`,
      );
      return res.status(409).json({
        error:
          "Ya existe un lapso activo, finaliza el lapso anterior para iniciar uno nuevo",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al iniciar el lapso" });
  }
};

export const createAcademicPeriod = async (req, res) => {
  try {
    console.log(`⚠️ Creating academic period...`);
    const auth = req.headers.authorization;
    const SIG = req.params.SIG;

    if (!SIG) {
      return res.status(400).json({ message: "SIG es requerido" });
    }
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = auth.split(" ")[1];
    const decoded = verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "Administrador") {
      return res.status(401).json({
        message: "No tienes permisos para crear el periodo académico",
      });
    }
    const periods = await LapseModel.getAcademicPeriods(SIG);
    const periodActive = periods[0];

    if (periodActive) {
      console.log(`⚠️ Periodo académico activo: ${periodActive.name}`);
      return res.status(400).json({
        message: `Ya existe un periodo académico activo: ${periodActive.name}`,
      });
    }

    const name =
      new Date().getFullYear() + "-" + (new Date().getFullYear() + 1); // Ej: "2025-2026"
    const start_date = new Date().toISOString().split("T")[0]; // Ej: "2025-09-15"
    const end_date = new Date(start_date);
    end_date.setMonth(end_date.getMonth() + 12); // Ej: "2026-07-31"

    const academicPeriod = await LapseModel.createAcademicPeriod({
      name,
      start_date,
      end_date,
      SIG,
    });
    console.log(`✅ Periodo académico creado correctamente`);
    res.status(201).json({
      success: true,
      message: "Periodo académico creado correctamente",
      academicPeriod,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear el periodo académico" });
  }
};

export const endAcademicPeriod = async (req, res) => {
  try {
    console.log(`⚠️ Ending academic period...`);
    const auth = req.headers.authorization;
    const { SIG } = req.params;
    if (!SIG) {
      return res.status(400).json({ message: "SIG es requerido" });
    }
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = auth.split(" ")[1];
    const decoded = verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "Administrador") {
      return res.status(401).json({
        message: "No tienes permisos para finalizar el periodo académico",
      });
    }
    const academicPeriod = await LapseModel.endAcademicPeriod(SIG);
    console.log(`✅ Periodo académico finalizado correctamente`);
    res.status(200).json({
      success: true,
      message: "Periodo académico finalizado correctamente",
      academicPeriod,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error al finalizar el periodo académico" });
  }
};

export const getAcademicPeriods = async (req, res) => {
  try {
    console.log(`⚠️ Getting academic periods...`);
    const auth = req.headers.authorization;
    const { SIG } = req.params;
    if (!SIG) {
      return res.status(400).json({ message: "SIG es requerido" });
    }
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = auth.split(" ")[1];
    const decoded = verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "Administrador") {
      return res.status(401).json({
        message: "No tienes permisos para obtener los periodos académicos",
      });
    }
    const academicPeriods = await LapseModel.getAcademicPeriods(SIG);
    const periodActive = academicPeriods[0];
    if (!periodActive) {
      return res.status(400).json({
        message: "No existe un periodo académico activo para esta institución",
      });
    }
    console.log(
      `✅ Periodos académicos obtenidos correctamente` + periodActive.name,
    );
    res.status(200).json({
      success: true,
      message: "Periodos académicos obtenidos correctamente",
      periodActive,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error al obtener los periodos académicos" });
  }
};
