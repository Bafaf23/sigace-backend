import { School } from "../models/School.model.js";

export const getAllSchools = async (_req, res) => {
  try {
    console.log("--------------------------------");
    console.log("⚠️ getAllSchools... getting all schools...");
    console.log("--------------------------------");
    const schools = await School.getAllSchools();
    console.log("--------------------------------");
    console.log("✅ getAllSchools... schools obtained successfully...");
    console.log("--------------------------------");
    return res.status(200).json(schools);
  } catch (error) {
    console.log("--------------------------------");
    console.log("❌ getAllSchools... error getting all schools...");
    console.log("--------------------------------");
    res.status(500).json({ error: "Error al obtener las escuelas" });
  }
};

export const getSchoolBySIG = async (req, res) => {
  try {
    console.log("--------------------------------");
    console.log("⚠️ getSchoolBySIG... getting school by SIG...");
    console.log("--------------------------------");
    const SIG = req.params.SIG;
    if (!SIG) {
      console.log("--------------------------------");
      console.log("❌ getSchoolBySIG... error getting school by SIG...");
      console.log("--------------------------------");
      return res.status(500).json({ error: "El SIG es requerido" });
    }

    const school = await School.getSchoolBySIG(SIG);

    if (!school) {
      console.log("--------------------------------");
      console.log("❌ getSchoolBySIG... error getting school by SIG...");
      console.log("--------------------------------");
      return new Promise((resolve) => {
        resolve(res.status(500).json({ error: "Escuela no encontrada" }));
      });
    }
    return new Promise((resolve) => {
      console.log("--------------------------------");
      console.log("✅ getSchoolBySIG... school obtained successfully...");
      console.log("--------------------------------");
      resolve(res.status(200).json(school));
    });
  } catch (error) {
    console.log("--------------------------------");
    console.log(
      "❌ getSchoolBySIG... error getting school by SIG.. . error:",
      error,
    );
    console.log("--------------------------------");
    return new Promise((resolve) => {
      resolve(res.status(500).json({ error: "Error al obtener la escuela" }));
    });
  }
};

export const createSchool = async (req, res) => {
  try {
    console.log("--------------------------------");
    console.log("🟢 createSchool... creating school...");
    console.log("--------------------------------");

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

    console.log("--------------------------------");
    console.log("✅ createSchool... School created successfully");
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

export const deleteSchool = async (req, res) => {
  try {
    console.log("--------------------------------");
    console.log("🟢 deleteSchool... deleting school...");
    console.log("--------------------------------");
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
    console.log("--------------------------------");
    console.log("✅ deleteSchool... School deleted successfully");
    console.log("--------------------------------");
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
    console.log("--------------------------------");
    console.log("🟢 updateSchool... updating school...");
    console.log("--------------------------------");

    const school = {
      ...req.body,
      SIG: req.body.sig ?? req.body.SIG,
    };

    if (!school.SIG) {
      return res.status(500).json({ error: "El SIG es requerido" });
    }
    const updatedSchool = await School.updateSchool(school);

    if (!updatedSchool) {
      console.log("--------------------------------");
      console.log("❌ updateSchool... error updating school");
      console.log("--------------------------------");
      return res.status(500).json({ error: "Error al actualizar la escuela" });
    }
    console.log("--------------------------------");
    console.log("✅ updateSchool... School updated successfully");
    console.log("--------------------------------");
    return res.status(200).json({
      success: true,
      message: "Escuela actualizada correctamente",
    });
  } catch (error) {
    console.log("--------------------------------");
    console.log("❌ updateSchool... error updating school");
    console.log("--------------------------------");
    return res.status(500).json({ error: "Error al actualizar la escuela" });
  }
};

export const getRoles = async (_req, res) => {
  try {
    console.log("--------------------------------");
    console.log("✅ getRoles... getting roles...");
    console.log("--------------------------------");
    const roles = await School.getRole();
    res.status(200).json(roles);
  } catch (error) {
    console.error("❌ Error al obtener roles:", error);
    throw error;
  }
};
