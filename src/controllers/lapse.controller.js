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
    if (!SIG) {
      console.log(`⚠️ SIG es requerido`);
      return res.status(400).json({ message: "SIG es requerido" });
    }

    const periods = await Academic_periods.getAcademicPeriods(SIG);
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
