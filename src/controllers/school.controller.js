import { School } from "../models/School.model.js";

export const getAllSchools = async (_req, res) => {
  try {
    console.log("⚠️ getAllSchools... getting all schools...");

    const schools = await School.getAllSchools();

    console.log("✅ getAllSchools... schools obtained successfully...");

    return res.status(200).json(schools);
  } catch (error) {
    console.log("❌ getAllSchools... error getting all schools...");

    res.status(500).json({ error: "Error al obtener las escuelas" });
  }
};

export const getSchoolBySIG = async (req, res) => {
  try {
    console.log("⚠️ getSchoolBySIG... getting school by SIG...");

    const SIG = req.params.SIG;
    if (!SIG) {
      console.log("❌ getSchoolBySIG... error getting school by SIG...");

      return res.status(500).json({ error: "El SIG es requerido" });
    }

    const school = await School.getSchoolBySIG(SIG);

    if (!school) {
      console.log("❌ getSchoolBySIG... error getting school by SIG...");

      return new Promise((resolve) => {
        resolve(res.status(500).json({ error: "Escuela no encontrada" }));
      });
    }
    return new Promise((resolve) => {
      console.log("✅ getSchoolBySIG... school obtained successfully...");

      resolve(res.status(200).json(school));
    });
  } catch (error) {
    console.log(
      "❌ getSchoolBySIG... error getting school by SIG.. . error:",
      error,
    );

    return new Promise((resolve) => {
      resolve(res.status(500).json({ error: "Error al obtener la escuela" }));
    });
  }
};

export const createSchool = async (req, res) => {
  try {
    console.log("🟢 createSchool... creating school...");

    const school = req.body;
    if (!school) {
      return new Promise((resolve) => {
        resolve(res.status(500).json({ error: "La escuela es requerida" }));
      });
    }

    console.log(school);
    const newSchool = await School.createSchool(school);

    if (!newSchool) {
      return new Promise((resolve) => {
        resolve(res.status(500).json({ error: "Error al crear la escuela" }));
      });
    }

    console.log("✅ createSchool... School created successfully");

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

export const deleteSchool = async (req, res) => {
  try {
    console.log("🟢 deleteSchool... deleting school...");

    const SIG = req.params.SIG;
    if (!SIG) {
      return new Promise((resolve) => {
        resolve(res.status(500).json({ error: "El SIG es requerido" }));
      });
    }
    const deletedSchool = await School.deleteSchool(SIG);
    if (!deletedSchool) {
      return new Promise((resolve) => {
        resolve(
          res.status(500).json({ error: "Error al eliminar la escuela" }),
        );
      });
    }

    console.log("✅ deleteSchool... School deleted successfully");

    return new Promise((resolve) => {
      resolve(
        res
          .status(200)
          .json({ success: true, message: "Escuela eliminada correctamente" }),
      );
    });
  } catch (error) {
    return new Promise((resolve) => {
      resolve(res.status(500).json({ error: "Error al eliminar la escuela" }));
    });
  }
};

export const updateSchool = async (req, res) => {
  try {
    console.log("🟢 updateSchool... updating school...");

    const school = {
      ...req.body,
      SIG: req.body.sig ?? req.body.SIG,
    };

    if (!school.SIG) {
      return res.status(500).json({ error: "El SIG es requerido" });
    }
    const updatedSchool = await School.updateSchool(school);

    if (!updatedSchool) {
      console.log("❌ updateSchool... error updating school");

      return res.status(500).json({ error: "Error al actualizar la escuela" });
    }

    console.log("✅ updateSchool... School updated successfully");

    return res.status(200).json({
      success: true,
      message: "Escuela actualizada correctamente",
    });
  } catch (error) {
    console.log("❌ updateSchool... error updating school");

    return res.status(500).json({ error: "Error al actualizar la escuela" });
  }
};

export const getRoles = async (_req, res) => {
  try {
    console.log("✅ getRoles... getting roles...");

    const roles = await School.getRole();
    res.status(200).json(roles);
  } catch (error) {
    console.error("❌ Error al obtener roles:", error);
    throw error;
  }
};
