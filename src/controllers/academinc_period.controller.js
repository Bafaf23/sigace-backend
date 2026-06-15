import { Academic_periods } from "../models/Academin_period.model.js";
import { Enrollments } from "../models/Enrollments.model.js";
import jwt from "jsonwebtoken";

const { verify } = jwt;

export const createAcademicPeriod = async (req, res) => {
  try {
    console.log(`⚠️ Creating academic period...`);

    // CONTROL DEFENSIVO: Si req.body no existe por problemas de middleware,
    // evitamos que tire un error fatal inicializando un objeto vacío.
    const body = req.body || {};

    const auth = req.headers.authorization;
    const SIG = req.params.SIG;

    // CORRECCIÓN: Soportar tanto 'dateStart' como 'dateStard' (el del Front) para evitar fallos
    const namePeriod = body.namePeriod;
    const dateStart = body.dateStart || body.dateStard;
    const dateEnd = body.dateEnd;

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

    // Validar que los campos requeridos no vengan vacíos antes de operar en la BD
    if (!namePeriod || !dateStart || !dateEnd) {
      return res.status(400).json({
        message:
          "Faltan datos requeridos. Verifique el nombre, fecha de inicio y de cierre.",
      });
    }

    const periods = await Academic_periods.getAcademicPeriods(SIG);
    const periodActive = periods.find((item) => item.is_active === 1);

    if (periodActive) {
      console.log(`⚠️ Periodo académico activo: ${periodActive.name}`);
      return res.status(400).json({
        message: `Ya existe un periodo académico activo: ${periodActive.name}`,
      });
    }

    const academicPeriod = await Academic_periods.createAcademicPeriod({
      name: namePeriod,
      start_date: dateStart,
      end_date: dateEnd,
      SIG: SIG,
    });

    console.log(`✅ Periodo académico creado correctamente`);
    res.status(201).json({
      success: true,
      message: "Periodo académico creado correctamente",
      academicPeriod,
    });
  } catch (error) {
    console.error("❌ Error en createAcademicPeriod:", error);
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

    const currentPeriod = await Academic_periods.getAcademicPeriods(SIG);
    const currentPeriodActive = currentPeriod.find(
      (item) => item.is_active === 1,
    );

    if (!currentPeriodActive || !currentPeriodActive.id) {
      return res.status(404).json({
        message: "No se encontró ningún periodo académico activo para cerrar",
      });
    }

    console.log(
      `📊 Calculando rendimientos finales para el periodo ID: ${currentPeriodActive.id}...`,
    );
    await Enrollments.processFinalStates(currentPeriodActive.id);

    const academicPeriod = await Academic_periods.endAcademicPeriod(SIG);

    console.log(
      `✅ Periodo académico finalizado y estados de alumnos calculados correctamente`,
    );

    res.status(200).json({
      success: true,
      message:
        "Periodo académico finalizado y rendimientos procesados correctamente",
      academicPeriod,
    });
  } catch (error) {
    console.error("❌ Error en endAcademicPeriod:", error);
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

    const academicPeriods = await Academic_periods.getAcademicPeriods(SIG);

    if (!academicPeriods || academicPeriods.length === 0) {
      return res.status(404).json({
        message:
          "No existen periodos académicos registrados para esta institución",
      });
    }

    const periodActive = academicPeriods.find((item) => item.is_active === 1);

    console.log(
      `✅ ${academicPeriods.length} Periodos académicos recuperados con éxito.`,
    );

    res.status(200).json({
      success: true,
      message: "Periodos académicos obtenidos correctamente",
      periodActive: periodActive || null,
      allPeriods: academicPeriods,
    });
  } catch (error) {
    console.error("❌ Error en getAcademicPeriods:", error);
    res
      .status(500)
      .json({ message: "Error al obtener los periodos académicos" });
  }
};
