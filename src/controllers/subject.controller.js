import { Subject } from "../models/Subject.model.js";
import { LapseModel } from "../models/Lapse.model.js";
import { Sections } from "../models/Section.model.js";

/**
 * Registra una nueva materia autogenerando su código único por nivel
 */
export const createSubject = async (req, res) => {
  try {
    console.log("⚠️ createSubject");
    const { name, year_id } = req.body ?? {};

    if (!name || !year_id) {
      return res
        .status(400)
        .json({ message: "Todos los campos son requeridos" });
    }

    const years = await Subject.getYears(req.user.SIG);

    const yearSelet = years.find((year) => year.id == year_id);

    if (!yearSelet) {
      console.log(`❌ No se encontró ningún año escolar con el ID: ${year_id}`);
      return res.status(400).json({
        message:
          "El año escolar seleccionado no es válido para esta institución.",
      });
    }

    // Extraer el número (ej: de "1er Año" extrae "1", de "2do Año" extrae "2")
    const suffix = String(yearSelet.name).substring(0, 1).toUpperCase();
    const code_suffix = suffix.padStart(2, "0");
    const code_subject = `${name.substring(0, 3).toUpperCase()}-${code_suffix}-${req.user.SIG}`;

    const abbreviation = `${name.substring(0, 3).toUpperCase()}`;

    console.log(`Código generado automáticamente: ${code_subject}`);

    const subject = new Subject(
      code_subject,
      name,
      abbreviation,
      year_id,
      req.user.SIG,
    );
    const subjectCreated = await Subject.createSubject(subject);

    if (!subjectCreated) {
      return res.status(400).json({ message: "Error al crear la materia" });
    }

    console.log("✅ Subject created successfully");
    return res.status(201).json({ message: "Materia creada correctamente" });
  } catch (error) {
    console.error("❌ Error en createSubject:", error);
    return res.status(500).json({ message: "Error al crear la materia" });
  }
};

/**
 * Obtiene todas las materias asociadas a un colegio (SIG)
 */
export const getSubjects = async (req, res) => {
  try {
    console.log("⚠️ getSubjects");
    const SIG = req.user.SIG;

    if (!SIG) {
      return res.status(400).json({ message: "SIG es requerido" });
    }

    const subjects = await Subject.getSubjects(SIG);

    if (!subjects || subjects.length === 0) {
      return res.status(404).json({ message: "No se encontraron materias" });
    }

    console.log("✅ Subjects found successfully");
    return res.status(200).json(subjects);
  } catch (error) {
    console.error("❌ Error en getSubjects:", error);
    return res.status(500).json({ message: "Error al obtener las materias" });
  }
};

/**
 * Obtiene la lista de años académicos disponibles por institución
 */
export const getYears = async (req, res) => {
  try {
    console.log("⚠️ getYears");
    const SIG = req.user.SIG;

    if (!SIG) {
      return res.status(400).json({ message: "SIG es requerido" });
    }

    const years = await Subject.getYears(SIG);

    if (!years || years.length === 0) {
      return res.status(404).json({ message: "No se encontraron años" });
    }

    console.log("✅ Years found successfully");
    return res.status(200).json(years);
  } catch (error) {
    console.error("❌ Error en getYears:", error);
    return res.status(500).json({ message: "Error al obtener los años" });
  }
};

/**
 * 🧠 CONTROLADOR CRÍTICO: Obtiene la carga académica de un estudiante
 * mapeando evaluaciones y procesando su nota final acumulada sin duplicados.
 */
export const getSubjectBySection = async (req, res) => {
  try {
    console.log(`⚠️ Buscando materias de sección...`);
    const { id_student } = req.params;
    const SIG = req.user.SIG;

    if (!id_student || !SIG) {
      console.log(`❌ Parámetros requeridos faltantes`);
      return res.status(400).json({
        error: true,
        message: "El ID del estudiante y el SIG son requeridos",
      });
    }

    // 1. Validar existencia del lapso escolar activo
    const lapses = await LapseModel.getLapses(SIG);
    const lapseActive = lapses.find((lapse) => lapse.is_active);

    if (!lapseActive) {
      console.log(`❌ No hay lapso activo para el SIG: ${SIG}`);
      return res
        .status(404)
        .json({ error: true, message: "No hay un lapso académico activo" });
    }

    // 2. Extraer la sección actual a la que pertenece el estudiante
    const getSection = await Sections.getSectionByStudent(SIG, id_student);
    if (!getSection || !getSection.id_section) {
      console.log(`❌ El estudiante ${id_student} no posee sección asignada`);
      return res.status(404).json({
        error: true,
        message: "El estudiante no está inscrito en ninguna sección",
      });
    }

    const id_section = getSection.id_section;

    console.log(
      `🔃 Cargando asignaturas desde el modelo para Sección ID: ${id_section}...`,
    );

    // 3. Consultar modelo (Este método ya agrupa internamente por 'subject_code' vía reduce)
    const subjectSections = await Subject.getSubjectBySection({
      id_lapse: lapseActive.id,
      id_section: id_section,
      id_student: id_student,
      SIG: SIG,
    });

    if (!subjectSections || subjectSections.length === 0) {
      console.log(
        `❌ Aún no hay registros de materias configurados en este nivel`,
      );
      return res.status(404).json({
        error: true,
        message: "Aún no hay materias asignadas en tu sección",
      });
    }

    // Extraemos de la primera fila estructurada los metadatos globales de la sección
    const year = subjectSections[0].year_name;
    const section = subjectSections[0].section_name;

    // 4. 🧠 Cálculo dinámico de notas definitivas sobre la data limpia agrupada
    const cleanSubjects = subjectSections.map((subject) => {
      let finalGradeAccumulator = 0;

      // El modelo ya inyectó un array nativo 'evaluations' para cada materia
      if (subject.evaluations && Array.isArray(subject.evaluations)) {
        subject.evaluations.forEach((evalItem) => {
          if (evalItem.grade !== null && evalItem.grade !== undefined) {
            const grade = parseFloat(evalItem.grade);
            const percentage = parseFloat(evalItem.porcentage); // Viene formateado desde el modelo

            // Fórmula estándar ponderada: (Nota * Porcentaje) / 100
            finalGradeAccumulator += (grade * percentage) / 100;
          }
        });
      }

      return {
        id: subject.code, // Usamos el código único (ej: MAT-01) como id de fila para Next.js (Evita el Key Error)
        subject_name: subject.subject_name,
        evaluations: subject.evaluations || [], // Se despacha limpio a la tabla del cliente
        final_grade: finalGradeAccumulator.toFixed(2), // Clampeamos decimales infinitos de coma flotante
      };
    });

    console.log(
      `✅ Materias y planes de evaluación despachados con éxito para: ${year} - ${section}`,
    );

    return res.status(200).json({
      status: "success",
      year: year,
      section_id: id_section,
      section: section,
      subjects: cleanSubjects,
    });
  } catch (error) {
    console.error("❌ Error crítico en getSubjectBySection:", error);
    return res.status(500).json({
      error: true,
      message: "Error interno del servidor al procesar la carga académica",
    });
  }
};

export const deleteSubjects = async (req, res) => {
  try {
    console.log(`⚠️ Eliminando Asignatura`);

    const { code_subject } = req.params;

    if (!code_subject) {
      console.log(`El id de la asignatura es requerido`);
      return res.status(500).json({
        success: false,
        message:
          "Upss... No se puedo eliminar la asigantura, intenta de nuevo.",
      });
    }

    const del = await Subject.deleteSubjects(code_subject, req.user.SIG);

    if (del === false) {
      console.log(`La asignatura ya fue eliminada del sistema`);
      return res.status(500).json({
        success: false,
        message:
          "Upss... No se puedo eliminar la asigantura, intenta de nuevo.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "La asignatura fue eliminada con exito.",
    });
  } catch (error) {
    console.error(error);
  }
};
