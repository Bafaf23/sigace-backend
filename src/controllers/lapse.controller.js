import { LapseModel } from "../models/Lapse.model.js";
import { Academic_periods } from "../models/Academin_period.model.js";
import jwt from "jsonwebtoken";

const { verify } = jwt;

export const getLapses = async (req, res) => {
  try {
    console.log(`⚠️ Getting lapses...`);
    const { SIG, id_period } = req.params;

    if (!SIG && !id_period) {
      return res.status(400).json({ message: "SIG es requerido" });
    }
    const lapses = await LapseModel.getLapses(SIG, id_period);
    console.log(`✅ Lapses obtenidos correctamente`);
    res.status(200).json(lapses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener los lapsos" });
  }
};

export const getLapseActive = async (req, res) => {
  try {
    console.log(`⚠️ Getting Lapse Acive`);
    const { SIG } = req.params;
    if (!SIG) {
      return res.status(400).json({ message: "SIG es requerido" });
    }
    console.log(`🔃 Obteniando el lapso...`);
    const lapses = await LapseModel.getLapses(SIG);
    console.log(`🔃 Obteniando el lapso.......`);
    const lapseActive = lapses.find((lapse) => lapse.is_active === 1);
    console.log(lapseActive);
    return res.status(200).json(lapseActive);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener el lapso activo" });
  }
};

export const createLapse = async (req, res) => {
  try {
    console.log(`⚠️ Creating lapse...`);
    const { SIG } = req.params;

    const body = req.body || {};
    const { nameLapse, dateStart, dateEnd } = body;

    if (!SIG) {
      return res
        .status(400)
        .json({ message: "SIG es requerido en los parámetros" });
    }

    if (!nameLapse || !dateStart || !dateEnd) {
      console.log(`⚠️ Todos los campos son requeridos`);
      return res
        .status(400)
        .json({ message: "Todos los campos son requeridos" });
    }

    const periods = await Academic_periods.getAcademicPeriods(SIG);
    console.log(`✅ Periodos académicos obtenidos`);
    const periodActive = periods.find((item) => item.is_active === 1);

    if (!periodActive) {
      console.log(
        `⚠️ No existe un periodo académico activo para esta institución`,
      );
      return res.status(400).json({
        message: "No existe un periodo académico activo para esta institución",
      });
    }

    console.log(`✅ Periodo académico activo encontrado: ${periodActive.name}`);

    const lapse = await LapseModel.createLapses({
      id_period: periodActive.id,
      name: nameLapse,
      start_date: dateStart,
      end_date: dateEnd,
      is_active: true,
    });

    console.log(lapse);
    console.log(`✅ EL ${lapse.name} fueron creados exitosamente`);
    return res.status(201).json({
      success: true,
      message:
        "Año escolar inicializado: Se crearon los 3 Lapsos automáticamente.",
      lapses: lapse,
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
