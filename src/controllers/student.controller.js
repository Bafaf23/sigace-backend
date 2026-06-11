import { Students } from "../models/Students.model.js";
import { Representative } from "../models/Representative.model.js";
import { Users } from "../models/Users.model.js";
import jsonwebtoken from "jsonwebtoken";
import { generateTuitionNumber } from "../utils/tuitoinNumber.js";
import dotenv from "dotenv";
dotenv.config();
const { verify } = jsonwebtoken;

/* Obtener todos los estudiantes */
export const getStudents = async (req, res) => {
  try {
    console.log("⚠️ getStudents");
    const { SIG } = req.params;

    const auth = req.headers.authorization;
    const token = auth?.startsWith("Bearer ") ? auth.split(" ")[1] : null;
    let tokenUser = null;

    if (token) {
      try {
        tokenUser = verify(token, process.env.JWT_SECRET);
      } catch (_error) {
        return res.status(401).json({ error: "Token inválido" });
      }
    }

    const authUser = tokenUser ?? req.session?.user;
    const userRole = authUser?.role;
    const allowedRoles = ["SuperAdmin", "Director", "Administrador"];

    if (!authUser || !allowedRoles.includes(userRole)) {
      return res
        .status(403)
        .json({ error: "No tienes permisos para acceder a esta ruta" });
    }

    const schoolSIG = SIG?.trim();

    if (!schoolSIG) {
      return res.status(400).json({ message: "SIG es requerido" });
    }

    const students = await Students.getAllStudents({ SIG: schoolSIG });

    if (students.length === 0) {
      return res
        .status(404)
        .json({ message: "Esta escuela no tiene estudiantes" });
    }

    console.log("✅ Estudiantes obtenidos correctamente");
    return res.status(200).json(students);
  } catch (error) {
    console.error("Error en getStudents:", error);
    res.status(500).json({ message: error.message });
  }
};
/* Crear un estudiante */
export const createStudent = async (req, res) => {
  try {
    console.log("⚠️ createStudent");

    /* Datos del estudiante */
    const studentObject = {
      SIG: req.body.SIG,
      document: `${req.body.documentType}${req.body.document}`,
      name: req.body.name,
      last_name: req.body.lastName,
      phone: req.body.phone,
      representative_id: req.body.representative_id,
      gender: req.body.gender,
      role_id: req.body.role_id,
      email: req.body.email,
      birth_date: req.body.birthDate,

      isNewEntry: req.body.isNewEntry,
      previousSchool: req.body.previousSchool,
      previousSchoolCode: req.body.previousSchoolCode,
      previousYear: req.body.previousYear,
      previousSection: req.body.previousSection,
      canaimaSerial: req.body.canaimaSerial,

      SIG: req.body.SIG,

      allergies: req.body.allergies,
      medical_condition: req.body.medicalCondition,
      weight: req.body.weight,
      height: req.body.height,
      shirt_size: req.body.shirtSize,
      pants_size: req.body.pantSize,
      shoe_size: req.body.shoeSize,

      year_id: req.body.year_id,
      id_section: req.body.id_section,
      id_period: req.body.id_period,
    };

    /* Datos del representante */
    const representativeObject = {
      document: `${req.body.repdniType}${req.body.repdni}`,
      name: req.body.repName,
      last_name: req.body.repLastName,
      phone: req.body.repPhone,
      relationship: req.body.relationship,
      repEmail: req.body.repEmail,
      birthCertificate: req.body.birthCertificate,
    };

    if (
      Object.values(representativeObject).some((value) => value === undefined)
    ) {
      return res
        .status(400)
        .json({ error: true, message: "Algunos campos son requeridos" });
    }

    const auth = req.headers.authorization;
    const token = auth?.startsWith("Bearer ") ? auth.split(" ")[1] : null;
    let tokenUser = null;
    if (token) {
      try {
        tokenUser = verify(token, process.env.JWT_SECRET);
      } catch (error) {
        return res.status(401).json({ error: true, message: "Token inválido" });
      }
    }
    if (!tokenUser) {
      return res.status(401).json({ error: true, message: "Token inválido" });
    }

    const representativeId =
      await Representative.createRepresentative(representativeObject);

    if (!representativeId) {
      return res
        .status(400)
        .json({ error: true, message: "Error al crear el representante" });
    }

    /* Contraseña genérica: primeros 4 caracteres del documento + @2026 (cambio obligatorio en primer login) */
    const passgeneric = studentObject.document.substring(0, 4) + "@2026";

    /* Generar el número de matrícula único */
    const tuitionNumber = await generateTuitionNumber(studentObject.SIG);
    if (!tuitionNumber) {
      return res.status(400).json({
        error: true,
        message: "Error al generar el número de matrícula",
      });
    }

    const userId = await Users.createUser({
      ...studentObject,
      password: passgeneric,
      representative_id: representativeId,
      tuition_number: tuitionNumber,
      status: "Activo",
    });

    if (!userId) {
      return res
        .status(400)
        .json({ error: true, message: "Error al crear el usuario" });
    }

    console.log("✅ Estudiante creado correctamente");
    return res.status(201).json({
      success: true,
      message: "El estudiante se ha creado correctamente",
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};
/* Actualizar un estudiante */
export const updateStudent = async (req, res) => {
  try {
    console.log("⚠️ updateStudent");

    const userUpdateObject = {
      document: req.body.document,
      name: req.body.name,
      last_name: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      role_id: req.body.role_id,
      id: req.body.id_user,
    };

    const studentUpdateObject = {
      gender: req.body.gender,
      SIG: req.body.SIG,
      allergies: req.body.allergies,
      medical_condition: req.body.medicalCondition,
      weight: req.body.weight,
      height: req.body.height,
      shirt_size: req.body.shirtSize,
      pants_size: req.body.pantSize,
      shoe_size: req.body.shoeSize,
      status: req.body.status,
      birth_date: req.body.birthDate,
      id: req.body.id_student,
    };

    const userUpdated = await Users.updateUser(userUpdateObject);

    if (userUpdated === false) {
      return res
        .status(404)
        .json({ error: true, message: "Error al actualizar el estudiante" });
    }

    const studentUpdated = await Students.updateStudent(
      studentUpdateObject.id,
      studentUpdateObject,
    );

    if (studentUpdated === false) {
      return res
        .status(404)
        .json({ error: true, message: "Error al actualizar el estudiante" });
    }

    console.log("✅ Estudiante actualizado correctamente");
    return res
      .status(200)
      .json({ success: true, message: "Estudiante actualizado correctamente" });
  } catch (error) {
    console.error("Error en updateStudent:", error);
    res.status(500).json({ error: true, message: error.message });
  }
};
/* Obtener los estudiantes no matriculados */
export const getStudentNotEnrolled = async (req, res) => {
  try {
    console.log("⚠️ getStudentNotEnrolled");
    const { id_period, SIG } = req.params;

    if (!SIG) {
      return res.status(400).json({ message: "SIG es requerido" });
    }

    if (!id_period) {
      return res.status(400).json({ message: "ID del periodo es requerido" });
    }

    const students = await Students.getStudentNotEnrolled({ id_period, SIG });

    if (!students?.length) {
      return res
        .status(404)
        .json({ message: "No hay estudiantes no matriculados" });
    }

    console.log("✅ Estudiantes no matriculados obtenidos");
    return res.status(200).json(students);
  } catch (error) {
    console.error("Error en getStudentNotEnrolled:", error);
    res.status(500).json({ error: true, message: error.message });
  }
};

/* Obtener los estudiantes de una sección */
export const getStudentsBySection = async (req, res) => {
  try {
    console.log("⚠️ getStudentsBySection");
    const { id_section, SIG } = req.params;
    if (!id_section) {
      return res.status(400).json({ message: "ID de la sección es requerido" });
    }
    if (!SIG) {
      return res.status(400).json({ message: "SIG es requerido" });
    }

    const students = await Students.getStudentsBySection({ id_section, SIG });

    if (!students?.length) {
      return res
        .status(404)
        .json({ message: "No hay estudiantes en esta sección" });
    }

    console.log("✅ Estudiantes de la sección obtenidos");
    return res.status(200).json(students);
  } catch (error) {
    console.error("Error en getStudentsBySection:", error);
    res.status(500).json({ error: true, message: error.message });
  }
};
