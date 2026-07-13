import { Students } from "../models/Students.model.js";
import { Representative } from "../models/Representative.model.js";
import { Grade } from "../models/Grade.model.js";
import { boletaTemplate } from "../templates/boleta.template.js";
import { enrollmentP } from "../templates/EnrollmetP.template.js";
import { listSection } from "../templates/listSectio.template.js";
import { Sections } from "../models/Section.model.js";
import { Subject } from "../models/Subject.model.js";
import { LapseModel } from "../models/Lapse.model.js";
import { School } from "../models/School.model.js";
import { noteSheet } from "../templates/noteSheet.template.js";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

/**
 * CONFIGURACIÓN REUSABLE DE LANZAMIENTO PUPPETEER
 */
const LAUNCH_ARGS = {
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-web-security"],
};

/**
 * ==========================================================================
 * 1. GENERAR LISTA DE ESTUDIANTES POR SECCIÓN
 * ==========================================================================
 */
export const sectionList = async (req, res) => {
  const { id_section } = req.params;
  const SIG = req.user?.SIG;
  let browser = null;

  try {
    const [students, sectionsResult] = await Promise.all([
      Students.getStudentsBySection({ id_section, SIG }),
      Sections.getSectionByID(SIG, id_section),
    ]);

    if (!sectionsResult) {
      return res
        .status(404)
        .json({ success: false, message: "Sección no encontrada" });
    }

    const filasEstudiantes = students
      .map(
        (student, index) => `
      <tr class="border-b border-slate-200">
        <td class="p-3 text-xs text-slate-500 font-medium">${index + 1}</td>
        <td class="p-3 text-xs font-bold text-blue-700">${student.tuition_number || "N/A"}</td>
        <td class="p-3 text-xs font-bold text-slate-800">${`${student.name || ""} ${student.last_name || ""}`}</td>
        <td class="p-3 text-xs text-slate-600">${student.document || "N/A"}</td>
      </tr>
    `,
      )
      .join("");

    const studentCount = students.length;
    const nameLogo = sectionsResult.logo_school;
    let logoBase64 = "";

    if (nameLogo) {
      const rutaDelLogo = path.join(process.cwd(), "public", "logos", nameLogo);
      if (fs.existsSync(rutaDelLogo)) {
        const imagenBuffer = fs.readFileSync(rutaDelLogo);
        let formato = path.extname(nameLogo).replace(".", "").toLowerCase();
        if (formato === "jpg") formato = "jpeg";
        logoBase64 = `data:image/${formato};base64,${imagenBuffer.toString("base64")}`;
      }
    }

    console.log(sectionsResult);

    const htmlContent = listSection(
      sectionsResult,
      filasEstudiantes,
      logoBase64,
      studentCount,
    );

    fs.writeFileSync(
      path.join(process.cwd(), "debug-reporte.html"),
      htmlContent,
    );

    browser = await puppeteer.launch(LAUNCH_ARGS);
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    // networkidle0 obliga a esperar que cargue el CDN css tradicional
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      preferCSSPageSize: false,
      margin: { top: "15mm", right: "15mm", bottom: "15mm", left: "15mm" },
    });

    await browser.close();
    browser = null;

    const filenameYear = (sectionsResult.year_name || "Anio").replace(
      /\s+/g,
      "_",
    );
    const filenameSection = (sectionsResult.section_name || "Seccion").replace(
      /\s+/g,
      "_",
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Lista_${filenameYear}_Seccion_${filenameSection}.pdf`,
    );

    return res.end(pdfBuffer);
  } catch (error) {
    console.error("❌ Error en sectionList:", error);
    return res
      .status(500)
      .json({ success: false, error: "Error al generar PDF" });
  } finally {
    if (browser !== null) await browser.close();
  }
};

/**
 * ==========================================================================
 * 2. GENERAR BOLETA DE CALIFICACIONES DE ESTUDIANTE
 * ==========================================================================
 */
export const boleta = async (req, res) => {
  const { id_student, id_section, id_period } = req.params;
  const SIG = req.user?.SIG;
  let browser = null;

  if (!id_student || !id_section) {
    return res.status(400).json({
      success: false,
      code: "INCOMPLETE_BOLETA_PARAMS",
      message:
        "Faltan parámetros requeridos en la solicitud para procesar la boleta.",
    });
  }

  try {
    const [grades, seccionInfoResult, student] = await Promise.all([
      Grade.getGradesForBoleta(SIG, id_student, id_section),
      Sections.getSectionByID(SIG, id_section),
      Students.getStudentByID(id_student, id_period),
    ]);

    const seccionInfo = seccionInfoResult?.[0] || seccionInfoResult;

    if (!seccionInfo || !student) {
      return res.status(404).json({
        success: false,
        code: "BOLETA_DATA_NOT_FOUND",
        message:
          "No se encontró la información del estudiante o de la sección para estructurar la boleta.",
      });
    }

    let totalAcumulado = 0;
    let materiasContadas = 0;

    const rowsSubjec = grades
      .map((subject) => {
        const classNota = (n) =>
          n < 10 ? "text-red-600 font-bold bg-red-50" : "text-slate-900";
        const classDef = (n) =>
          n < 10
            ? "text-red-700 font-black bg-red-100"
            : "text-blue-950 font-black bg-slate-100";

        let notaMateriaValida = 0;
        let lapsosActivosMateria = 0;

        if (subject.momento_1 != null) {
          notaMateriaValida += parseFloat(subject.momento_1);
          lapsosActivosMateria++;
        }
        if (subject.momento_2 != null) {
          notaMateriaValida += parseFloat(subject.momento_2);
          lapsosActivosMateria++;
        }
        if (subject.momento_3 != null) {
          notaMateriaValida += parseFloat(subject.momento_3);
          lapsosActivosMateria++;
        }

        const promedioMateria =
          lapsosActivosMateria > 0
            ? notaMateriaValida / lapsosActivosMateria
            : 0;
        totalAcumulado += promedioMateria;
        materiasContadas++;

        return `
        <tr class="border-b border-slate-200">
          <td class="p-2 text-left pl-3 font-bold text-slate-700">${subject.subject_name.toUpperCase()}</td>
          <td class="p-2 text-center ${classNota(subject.momento_1)}">${String(subject.momento_1 || 0).padStart(2, "0")}</td>
          <td class="p-2 text-center ${classNota(subject.momento_2)}">${String(subject.momento_2 || 0).padStart(2, "0")}</td>
          <td class="p-2 text-center ${classNota(subject.momento_3)}">${String(subject.momento_3 || 0).padStart(2, "0")}</td>
          <td class="p-2 font-mono text-center text-xs ${classDef(subject.definitiva_ano)}">${String(subject.definitiva_ano || 0).padStart(2, "0")}</td>
        </tr>`;
      })
      .join("");

    const promedioGeneral =
      materiasContadas > 0
        ? (totalAcumulado / materiasContadas).toFixed(1)
        : "00";

    const resumen = {
      promedio: promedioGeneral,
      observaciones:
        promedioGeneral >= 10
          ? "Estudiante demuestra rendimiento satisfactorio, logrando consolidar las competencias del nivel escolar."
          : "Estudiante requiere asistir de forma obligatoria a los procesos de nivelación académica en las áreas reprobadas.",
    };

    const htmlContent = boletaTemplate(
      seccionInfo,
      student,
      rowsSubjec,
      resumen,
    );

    browser = await puppeteer.launch(LAUNCH_ARGS);
    const page = await browser.newPage();

    // FIJAMOS EL VISOR Y ASIGNAMOS MARGENES
    await page.setViewport({ width: 1200, height: 800 });
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      preferCSSPageSize: false,
      margin: { top: "15mm", right: "15mm", bottom: "15mm", left: "15mm" },
    });

    await browser.close();
    browser = null;

    const filenameYear = (seccionInfo.year_name || "Anio").replace(/\s+/g, "_");
    const filenameSection = (seccionInfo.section_name || "Seccion").replace(
      /\s+/g,
      "_",
    );
    const studentDoc = student.document || "Estudiante";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=Boleta_${studentDoc}_${filenameYear}_${filenameSection}.pdf`,
    );
    return res.end(pdfBuffer);
  } catch (error) {
    if (browser) await browser.close();
    console.error("❌ Error al generar la boleta:", error);
    return res.status(500).json({
      success: false,
      code: "BOLETA_GENERATION_ERROR",
      message:
        "Ocurrió un error de infraestructura al compilar la boleta de calificaciones.",
    });
  }
};

/**
 * ==========================================================================
 * 3. GENERAR PLANILLA DE INSCRIPCIÓN / MATRÍCULA
 * ==========================================================================
 */
export const enrollmetP = async (req, res) => {
  const { id_student, id_representative } = req.params;
  const SIG = req.user?.SIG;
  const id_period = req.user?.id_period;
  let browser = null;

  if (!SIG || !id_representative || !id_student) {
    return res.status(400).json({
      success: false,
      code: "INCOMPLETE_ENROLLMENT_REPORT_PARAMS",
      message:
        "Error al procesar la planilla: Faltan datos esenciales en los parámetros.",
    });
  }

  try {
    const [student, school, representative] = await Promise.all([
      Students.getStudentByID(id_student, id_period),
      School.getSchoolBySIG(SIG),
      Representative.getRepresentativeByID(id_representative),
    ]);

    if (!student || !school || !representative) {
      return res.status(404).json({
        success: false,
        code: "ENROLLMENT_DATA_NOT_FOUND",
        message:
          "No se encontró la información completa requerida para asentar la planilla de matrícula.",
      });
    }

    const nameLogo = school.logo_school || "default.png";
    const rutaDelLogo = path.join(process.cwd(), "public", "logos", nameLogo);
    let logoBase64 = "";

    if (fs.existsSync(rutaDelLogo)) {
      const imagenBuffer = fs.readFileSync(rutaDelLogo);
      const formato = path.extname(nameLogo).replace(".", "");
      // CORRECCIÓN: Se agrega plantilla de string que faltaba para leer el buffer
      logoBase64 = `data:image/${formato};base64,${imagenBuffer.toString("base64")}`;
    }

    const htmlContent = enrollmentP(
      student,
      school,
      representative,
      logoBase64,
    );

    browser = await puppeteer.launch(LAUNCH_ARGS);
    const page = await browser.newPage();

    // OPTIMIZACIÓN DE AJUSTES EN HOJA DE MATRÍCULA
    await page.setViewport({ width: 1200, height: 800 });
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      preferCSSPageSize: false,
      margin: { top: "15mm", right: "15mm", bottom: "15mm", left: "15mm" },
    });

    await browser.close();
    browser = null;

    const fileName = `Planilla_${student.tuition_number || "INS"}-${student.id || "0"}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error) {
    if (browser) await browser.close();
    console.error(
      "❌ Error catastrófico en el controlador de la planilla:",
      error,
    );
    return res.status(500).json({
      success: false,
      code: "ENROLLMENT_REPORT_INTERNAL_ERROR",
      message:
        "Ocurrió un error interno en el servidor al compilar el archivo PDF de matrícula estudiantil.",
    });
  }
};

/**
 * ==========================================================================
 * 4. GENERAR SÁBANA COMPLETA DE CALIFICACIONES DE UNA SECCIÓN
 * ==========================================================================
 */
export const sheetNote = async (req, res) => {
  const SIG = req.user?.SIG;
  const id_period = req.user?.id_period;
  const { id_section } = req.params;

  let browser = null;

  if (!SIG || !id_section) {
    return res.status(400).json({
      success: false,
      code: "INCOMPLETE_SHEET_PARAMS",
      message:
        "Los parámetros institucionales de la sección son requeridos para auditar el reporte.",
    });
  }

  try {
    const lapses = await LapseModel.getLapses(SIG, id_period);
    const lapseActive = lapses?.find((lapse) => lapse.is_active === 1);

    if (!lapseActive) {
      return res.status(404).json({
        success: false,
        code: "NO_ACTIVE_LAPSE_FOR_REPORT",
        message:
          "No es posible procesar la sábana debido a que no existe un lapso académico activo bajo evaluación.",
      });
    }

    const rows = await Subject.getGradesForSheetNote({
      id_lapse: lapseActive.id,
      id_section: Number(id_section),
      SIG: SIG,
    });

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        code: "SHEET_NOTES_EMPTY",
        message:
          "No se localizaron calificaciones registradas en este lapso para compilar la sábana de la sección.",
      });
    }

    const sectionResult = await Sections.getSectionByID(SIG, id_section);
    const section = sectionResult?.[0] || sectionResult;

    if (!section) {
      return res.status(404).json({
        success: false,
        code: "SHEET_SECTION_NOT_FOUND",
        message:
          "La sección a la que intenta acceder no se encuentra activa o configurada.",
      });
    }

    const studentsMap = rows.reduce((acc, row) => {
      const doc = row.student_document;

      if (!acc[doc]) {
        acc[doc] = {
          document: doc,
          name: row.student_name,
          last_name: row.student_last_name,
          _acumuladores: {},
          definitivas: {},
          promedio: 0,
          status: "Aprobado",
        };
      }

      const est = acc[doc];
      const materia = row.subject_code;
      const nota = parseFloat(row.evaluation_grade) || 0;
      const porcentaje = parseFloat(row.evaluation_porcentage) / 100 || 0;

      if (!est._acumuladores[materia]) {
        est._acumuladores[materia] = 0;
      }

      est._acumuladores[materia] += nota * porcentaje;
      return acc;
    }, {});

    const processedStudents = Object.values(studentsMap).map((student) => {
      let sumaDefinitivas = 0;
      let totalMaterias = 0;
      let materiasReprobadas = 0;

      for (const materia in student._acumuladores) {
        const notaDefinitiva = Math.round(student._acumuladores[materia]);
        student.definitivas[materia] = notaDefinitiva;
        sumaDefinitivas += notaDefinitiva;
        totalMaterias++;

        if (notaDefinitiva < 10) {
          materiasReprobadas++;
        }
      }

      student.promedio =
        totalMaterias > 0
          ? (sumaDefinitivas / totalMaterias).toFixed(1)
          : "0.0";

      if (materiasReprobadas > 3) {
        student.status = "Reprobado";
      } else if (materiasReprobadas >= 1) {
        student.status = "Pendiente";
      } else {
        student.status = "Aprobado";
      }

      delete student._acumuladores;
      return student;
    });

    const uniqueSubjects = rows.reduce((acc, row) => {
      if (!acc.some((sub) => sub.code_subject === row.subject_code)) {
        acc.push({
          code_subject: row.subject_code,
          name: row.subject_name,
          abbreviation: row.abbreviation,
        });
      }
      return acc;
    }, []);

    const htmlContent = noteSheet(
      section,
      processedStudents,
      uniqueSubjects,
      lapseActive,
    );

    browser = await puppeteer.launch(LAUNCH_ARGS);
    const page = await browser.newPage();

    // CONFIGURACIÓN CLAVE PARA SÁBANA DE NOTAS (FORMATO A4 COMPLETO)
    await page.setViewport({ width: 1400, height: 900 });
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true, // Cambiado a true por las dimensiones de la tabla de una sábana escolar
      printBackground: true,
      preferCSSPageSize: false,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    });

    await browser.close();
    browser = null;

    const sectionName = section.section_name || "Seccion";
    const fileName = `Sabana_Notas_${sectionName.replace(/\s+/g, "_")}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error) {
    if (browser !== null) await browser.close();
    console.error(`❌ Error crítico en sheetNote:`, error);
    return res.status(500).json({
      success: false,
      code: "NOTE_SHEET_INTERNAL_ERROR",
      message:
        "Ocurrió un error interno al intentar estructurar la sábana de notas consolidada.",
    });
  }
};
