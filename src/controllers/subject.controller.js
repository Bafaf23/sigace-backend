import { Subject } from "../models/Subject.model.js";
import { LapseModel } from "../models/Lapse.model.js";
import { Sections } from "../models/Section.model.js";
export const createSubject = async (req, res) => {
  try {
    console.log("⚠️ createSubject");

    const { name, SIG, year_id } = req.body ?? {};

    if (!name || !SIG || !year_id) {
      return res
        .status(400)
        .json({ message: "Todos los campos son requeridos" });
    }

    const suffix = String(year_id).substring(0, 1).toUpperCase();
    const code_suffix = suffix.padStart(2, "0");

    const code_subject = `${name.substring(0, 3).toUpperCase()}-${code_suffix}`;

    const subject = new Subject(code_subject, name, year_id, SIG);
    const subjectCreated = await Subject.createSubject(subject);

    if (!subjectCreated) {
      return res.status(400).json({ message: "Error al crear la materia" });
    }
    console.log("✅ Subject created successfully");
    return res.status(201).json({ message: "Materia creada correctamente" });
  } catch (error) {
    return res.status(500).json({ message: "Error al crear la materia" });
  }
};

export const getSubjects = async (req, res) => {
  try {
    console.log("⚠️ getSubjects");
    const { SIG } = req.params ?? {};

    if (!SIG) {
      return res.status(400).json({ message: "SIG es requerido" });
    }

    const subjects = await Subject.getSubjects(SIG);

    if (subjects.length === 0) {
      return res.status(400).json({ message: "No se encontraron materias" });
    }
    console.log("✅ Subjects found successfully");
    return res.status(200).json(subjects);
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener las materias" });
  }
};

export const getYears = async (req, res) => {
  try {
    console.log("⚠️ getYears");
    const { SIG } = req.params ?? {};
    const years = await Subject.getYears(SIG);

    if (years.length === 0) {
      return res.status(400).json({ message: "No se encontraron años" });
    }
    console.log("✅ Years found successfully");
    return res.status(200).json(years);
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener los años" });
  }
};

export const getSubjectBySection = async (req, res) => {
  try {
    console.log(`⚠️ Buscando materias de seccion...`);
    const { id_student, SIG } = req.params;

    if (!id_student || !SIG) {
      console.log(`❌ Parámetros requeridos faltantes`);
      return res.status(400).json({
        error: true,
        message: "El id de la seccion, del estudiante y el SIG son requeridos",
      });
    }

    const lapses = await LapseModel.getLapses(SIG);
    const lapseActive = lapses.find((lapse) => lapse.is_active);

    const getSection = await Sections.getSectionByStudent(SIG, id_student);
    const id_section = getSection.id_section;

    if (!lapseActive) {
      console.log(`❌ No hay lapso activo para el SIG: ${SIG}`);
      return res
        .status(404)
        .json({ error: true, message: "No hay un lapso académico activo" });
    }

    console.log(`🔃 Cargando materias para la sección ID: ${id_section}...`);

    const subjectSections = await Subject.getSubjectBySection(
      lapseActive.id,
      id_section,
      id_student,
    );

    if (!subjectSections || subjectSections.length === 0) {
      console.log(`❌ Aun no hay materias en tu seccion`);
      return res
        .status(404)
        .json({ error: true, message: "Aun no hay materias en tu seccion" });
    }

    const year = subjectSections[0].year_name;
    const section = subjectSections[0].section_name;

    const subjectMap = {};

    subjectSections.forEach((item) => {
      // 1. Inicializar la materia si no existe en el mapa
      if (!subjectMap[item.code]) {
        subjectMap[item.code] = {
          id: item.code,
          subject_name: item.subject_name,
          evaluations: [],
          final_grade: 0,
        };
      }

      if (item.evaluation_id) {
        // 🌟 Buscamos si esta evaluación ya fue metida previamente en ESTA materia
        const evaluationExistente = subjectMap[item.code].evaluations.find(
          (e) => e.id === item.evaluation_id,
        );

        if (!evaluationExistente) {
          // Si no existe, la insertamos con la nota actual (así sea null por ahora)
          subjectMap[item.code].evaluations.push({
            id: item.evaluation_id,
            name: item.activity_name,
            referent_teorical: item.referent_teorical,
            porcentage: item.evaluation_porcentage,
            evaluation_date: item.evaluation_date,
            grade: item.evaluation_grade, // Puede ser un número o null
          });

          // Sumamos al acumulado de la nota definitiva si tiene nota válida
          if (
            item.evaluation_grade !== null &&
            item.evaluation_grade !== undefined
          ) {
            const grade = parseFloat(item.evaluation_grade);
            const porcentage = parseFloat(item.evaluation_porcentage);
            subjectMap[item.code].final_grade += (grade * porcentage) / 100;
          }
        } else {
          // 🌟 ¡LA MAGIA AQUÍ!: Si la evaluación ya existía pero su nota guardada era null,
          // y esta nueva fila sí trae una nota válida para el estudiante, la sobreescribimos.
          if (
            (evaluationExistente.grade === null ||
              evaluationExistente.grade === undefined) &&
            item.evaluation_grade !== null &&
            item.evaluation_grade !== undefined
          ) {
            // Reemplazamos el null por la nota real
            evaluationExistente.grade = item.evaluation_grade;

            // Calculamos y sumamos su peso correspondiente a la nota definitiva
            const grade = parseFloat(item.evaluation_grade);
            const porcentage = parseFloat(item.evaluation_porcentage);
            subjectMap[item.code].final_grade += (grade * porcentage) / 100;
          }
        }
      }
    });

    const cleanSubjects = Object.values(subjectMap).map((subject) => ({
      ...subject,
      final_grade: subject.final_grade.toFixed(2),
    }));

    console.log(`✅ Materias por seccion cargadas con éxito`);
    return res.status(200).json({
      status: "success",
      year: year,
      section: section,
      subjects: cleanSubjects,
    });
  } catch (error) {
    console.log("❌ Error en getSubjectBySection:", error);
    return res.status(500).json({
      error: true,
      message: "Error interno del servidor al cargar las materias",
    });
  }
};
