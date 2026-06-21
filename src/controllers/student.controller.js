import { Students } from "../models/Students.model.js";
import { Representative } from "../models/Representative.model.js";
import { Users } from "../models/Users.model.js";
import { generateTuitionNumber } from "../utils/tuitoinNumber.js";
import { Academic_periods } from "../models/Academin_period.model.js";

/* Obtener todos los estudiantes */
export const getStudents = async (req, res) => {
  try {
    console.log("⚠️ getStudents");
    const SIG = req.user.SIG;
    const id_period = req.user.id_period;

    console.log("🔄 to the getStudents... userRole", req.user.role);

    if (!SIG) {
      console.log("❌ to the getStudents... schoolSIG is required");
      return res.status(400).json({ message: "SIG es requerido" });
    }

    let targetPeriodId = id_period;

    if (!targetPeriodId) {
      // Si el frontend no mandó id_period, buscamos cuál es el activo en la institución
      const periods = await Academic_periods.getAcademicPeriods(SIG);
      const activePeriod = periods.find((item) => item.is_active === 1);

      if (!activePeriod) {
        console.log("❌ to the getStudents... no active period found");
        return res.status(404).json({
          message:
            "No se encontró ningún periodo académico activo para esta institución.",
        });
      }
      targetPeriodId = activePeriod.id;
    }
    console.log("🔄 to the getStudents... schoolSIG", SIG);
    const students = await Students.getAllStudents({
      SIG: SIG,
      id_period: Number(targetPeriodId),
    });

    if (students.length === 0) {
      console.log("❌ to the getStudents... no students found");
      return res
        .status(404)
        .json({ message: "Esta escuela no tiene estudiantes" });
    }
    console.log("✅ to the getStudents... students found");
    res.status(200).json(students);
  } catch (error) {
    console.log("❌ to the getStudents... error", error);
    res.status(500).json({ message: error.message });
  }
};

/* Crear un estudiante */
export const createStudent = async (req, res) => {
  try {
    console.log("⚠️ createStudent");

    /* Datos del estudiante unificados */
    const studentObject = {
      SIG: req.user?.SIG, // 💡 Usa el de la sesión o el cuerpo de forma segura
      document: `${req.body.documentType}${req.body.document}`,
      name: req.body.name,
      last_name: req.body.lastName,
      phone: req.body.phone,
      representative_id: req.body.representative_id,
      gender: req.body.gender,
      role_id: req.body.role_id || 2, // Por defecto rol estudiante
      email: req.body.email,
      birth_date: req.body.birthDate,
      isNewEntry: req.body.isNewEntry,
      previousSchool: req.body.previousSchool,
      previousSchoolCode: req.body.previousSchoolCode,
      previousYear: req.body.previousYear,
      previousSection: req.body.previousSection,

      allergies: req.body.allergies,
      medical_condition: req.body.medicalCondition,
      weight: req.body.weight,
      height: req.body.height,
      shirt_size: req.body.shirtSize,
      pants_size: req.body.pantSize,
      shoe_size: req.body.shoeSize,

      year_id: req.body.year,
      id_section: req.body.section,
      id_period: req.user?.id_period,
    };

    /* Datos del representante */
    const representativeObject = {
      document: `${req.body.repdniType}${req.body.repdni}`,
      name: req.body.repName,
      last_name: req.body.repLastName,
      phone: req.body.repPhone,
      relationship: req.body.relationship,
      repEmail: req.body.repEmail,
    };

    // Validar campos requeridos del representante antes de insertar
    if (!req.body.repdni || !req.body.repName || !req.body.repLastName) {
      return res.status(400).json({
        success: false,
        message: "Los datos básicos del representante son requeridos",
      });
    }

    const representativeId =
      await Representative.createRepresentative(representativeObject);

    if (!representativeId) {
      return res
        .status(400)
        .json({ success: false, message: "Error al crear el representante" });
    }

    /* Contraseña genérica */
    const passgeneric = studentObject.document.substring(0, 4) + "@2026";

    /* Generar el número de matrícula único */
    const tuitionNumber = await generateTuitionNumber(studentObject.SIG);

    if (!tuitionNumber) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Error al generar el número de matrícula",
        });
    }

    const userId = await Users.createUser({
      ...studentObject,
      password: passgeneric,
      representative_id: representativeId,
      tuition_number: tuitionNumber,
      status: "Nuevo Ingreso",
    });

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "Error al crear el usuario" });
    }

    console.log("✅ Estudiante creado correctamente");
    return res.status(201).json({
      success: true,
      message: "El estudiante se ha inscrito correctamente en el sistema.",
    });
  } catch (error) {
    console.error("❌ Error en createStudent:", error);
    res.status(500).json({ success: false, message: error.message });
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
      id_user: req.body.id_user,

    };

    const studentUpdateObject = {
      gender: req.body.gender,
      SIG: req.user?.SIG || req.body.SIG,
      allergies: req.body.allergies,
      medical_condition: req.body.medicalCondition,
      weight: req.body.weight,
      height: req.body.height,
      shirt_size: req.body.shirtSize,
      pants_size: req.body.pantSize,
      shoe_size: req.body.shoeSize,
      birth_date: req.body.birthDate,
      id: req.body.id_student,
    };

    console.log(userUpdateObject)
    console.log(studentUpdateObject)

    const userUpdated = await Users.updateUser(userUpdateObject);

    if (userUpdated === false) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No se pudo actualizar los datos de usuario",
        });
    }

    const studentUpdated = await Students.updateStudent(
      studentUpdateObject.id,
      studentUpdateObject,
    );

    if (studentUpdated === false) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "No se pudieron actualizar los datos escolares del estudiante",
        });
    }

    console.log("✅ Estudiante actualizado correctamente");
    return res
      .status(200)
      .json({ success: true, message: "Estudiante actualizado correctamente" });
  } catch (error) {
    console.error("❌ Error en updateStudent:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* Obtener los estudiantes no matriculados */
export const getStudentNotEnrolled = async (req, res) => {
  try {
    console.log("⚠️ getStudentNotEnrolled");

    // 💡 Busca tanto en params como de forma segura en la sesión del usuario si aplica
    const SIG = req.params.SIG || req.user?.SIG;
    const id_period = req.params.id_period || req.query.id_period;

    if (!SIG) {
      return res
        .status(400)
        .json({
          success: false,
          message: "El código SIG de la institución es requerido",
        });
    }

    if (!id_period || isNaN(parseInt(id_period))) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Un ID de periodo escolar válido es requerido",
        });
    }

    const students = await Students.getStudentNotEnrolled({
      id_period: parseInt(id_period),
      SIG,
    });

    if (!students || students.length === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Todos los estudiantes se encuentran matriculados en este lapso.",
        });
    }

    console.log("✅ Estudiantes no matriculados obtenidos");
    return res.status(200).json({ success: true, data: students });
  } catch (error) {
    console.error("❌ Error en getStudentNotEnrolled:", error);
    res.status(500).json({ success: false, message: error.message });
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

export const getStudentByID = async (req, res) => {
  const { id_student } = req.params;

  const id_period = req.user.id_period

  if (!id_student) {
    console.log(`❌ Id es requerido`);
    res
      .status(404)
      .json({ success: false, message: "Id el estudante es requerido" });
  }
  console.log(id_student)

  const student = await Students.getStudentByID(id_student, id_period);

  if (!student) {
    console.log(`❌ No existe el estudiante`);
   return res.status(404).json({
      success: false,
      message:
        "Upss..., para que no hay imfomacion de este estudiante, recarga la pagina, si el problema persiste conatacta a soporte.",
    });
  } 

  console.log(student)

  return res.status(200).json(student);
};

export const getRecordStudent = async (req, res) => {
  console.log(`⚠️ Recuperando el récord académico del estudiante`);

  const id_student = req.params.id_student 

  if (!id_student) {
    console.log(`❌ No se proporcionó el ID del estudiante`);
    return res.status(400).json({
      success: false,
      message: "El ID del estudiante es requerido para procesar la solicitud.",
    });
  }

  try {
    console.log("🔄 Cargando el récord desde la base de datos...");
    const record = await Students.getRecordStudent(id_student);

    // Al usar el modelo optimizado que agrupa por JS, el resultado es un array directo limpio
    if (!record || record.length === 0) {
      console.log(
        `❌ No se encontró récord para el estudiante ID: ${id_student}`,
      );
      return res.status(404).json({
        success: false,
        message:
          "Parece que el estudiante no tiene récord académico registrado todavía.",
      });
    }

    console.log("✅ Récord procesado con éxito para el cliente", record);
    return res.status(200).json(record);
  } catch (error) {
    console.error("❌ Error interno al recuperar el récord académico:", error);
    return res.status(500).json({
      success: false,
      message:
        "Ocurrió un error interno en el servidor al procesar el expediente académico.",
      error: error.message,
    });
  }
};
