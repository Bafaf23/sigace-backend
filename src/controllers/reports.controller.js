import { Students } from "../models/Students.model.js";
import { Representative } from "../models/Representative.model.js";
import { Grade } from "../models/Grade.model.js";
import { boletaTemplate } from "../templates/boleta.template.js";
import { enrollmentP } from "../templates/EnrollmetP.template.js";
import { listSection } from "../templates/listSectio.template.js";
import { Sections } from "../models/Section.model.js";
import { Subject } from "../models/Subject.model.js";
import { Lapse } from "../models/Lapse.model.js";
import { School } from "../models/School.model.js";
import { noteSheet } from "../templates/noteSheet.template.js";
import { reporteFinalRendimientoEstudiantil } from "../templates/reporteFinalRendimientoEstudiantil.template.js";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import logger from "../utils/logger.js";
import { Academic_periods } from "../models/Academin_period.model.js";
import { LoadAcademic } from "../models/LoadAcademic.model.js";
import { promises } from "dns";

/**
 * CONFIGURACIÓN REUSABLE DE LANZAMIENTO PUPPETEER
 */
const LAUNCH_ARGS = {
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-web-security"],
};

/**
 ** Genera la lista de seccion con todos los estudinantes que la conforman
 *
 * @async
 * @function sectionList
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const sectionList = async (req, res) => {
  const { id_section } = req.params;
  const SIG = req.user?.SIG;

  let browser = null;

  try {
    const [school, section] = await Promise.all([
      School.getSchoolBySIG(SIG),
      Sections.getStudent({ id_section, SIG }),
    ]);

    if (!section) {
      return res
        .status(404)
        .json({ success: false, message: "Sección no encontrada" });
    }

    const filasEstudiantes = section.students
      .map(
        (student, index) => `
      <tr class="border-b border-slate-200">
        <td class="p-3 text-xs text-slate-500 font-medium">${index + 1}</td>
        <td class="p-3 text-xs font-bold text-blue-700">${student.tuition_number || "N/A"}</td><td class="p-3 text-xs text-slate-600">${student.id_card || "Este estudiante debe tramitar su cedula"}</td>
        <td class="p-3 text-xs font-bold text-slate-800">${`${student.name || ""} ${student.last_name || ""}`}</td>
      </tr>
    `,
      )
      .join("");

    const studentCount = section.students.length;
    const nameLogo = school.logo_school;
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

    const htmlContent = listSection(
      school,
      section,
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

    const filenameYear = (section.name || "Año").replace(/\s+/g, "_");
    const filenameSection = (section.nomenclature || "Seccion").replace(
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
 ** Crea la boletas de calificaciones para los estudiantes
 *
 * @async
 * @function reportCard
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const reportCard = async (req, res) => {
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
    logger.info("Generando el certificado..., espere por favor...");
    const [grades, section, student, school, periods] = await Promise.all([
      Students.grade({
        SIG: SIG,
        idStudent: Number(id_student),
        idPeriod: id_period,
      }),
      Sections.getStudent({ id_section: id_section, SIG: SIG }),
      Students.byID(id_student),
      School.getSchoolBySIG(SIG),
      Academic_periods.getAcademicPeriods(SIG),
    ]);

    if (!section || !student || !school) {
      return res.status(404).json({
        success: false,
        code: "BOLETA_DATA_NOT_FOUND",
        message:
          "No se encontró la información del estudiante o de la sección para estructurar la boleta.",
      });
    }

    const period = periods.find((item) => item.is_active === true);

    logger.info("Inicianado carculo de promedio...");

    const uniqueSubjects = grades[0]?.subjects;
    const arrayDefinitive = [];

    const rowsSubjec = uniqueSubjects
      .map((subject) => {
        const getScoreForLapse = (lapseIndex) => {
          const lapse = grades[lapseIndex];
          const match = lapse?.subjects.find(
            (s) => s.code_subject === subject.code_subject,
          );
          return match && match.score !== null ? match.score : 0;
        };

        const scoreM1 = getScoreForLapse(0);
        const scoreM2 = getScoreForLapse(1);
        const scoreM3 = getScoreForLapse(2);

        const scores = [scoreM1, scoreM2, scoreM3];

        const totamSum = scores.reduce((acc, curr) => acc + curr, 0);
        const definitivingScore = totamSum / scores.length;
        arrayDefinitive.push(definitivingScore);
        return `<tr class="border-b border-slate-200 text-[12px]">
                  <td class="p-2 text-left pl-3 font-bold text-slate-700">${subject.name.toUpperCase()}</td>
                  <td class="p-2 text-center text-[13px] font-bold">${scoreM1}</td>
                  <td class="p-2 text-center text-[13px] font-bold">${scoreM2}</td>
                  <td class="p-2 text-center text-[13px] font-bold">${scoreM3}</td>
                  <td class="p-2 text-center text-[13px] font-bold">${definitivingScore}</td>
                </tr>`;
      })
      .join("");

    const resumen = arrayDefinitive.reduce((acc, curr) => {
      const sum = acc + curr;
      const average = sum / arrayDefinitive.length;

      return {
        average: average,
      };
    });

    logger.info("Cargando la certifiacion....");
    const htmlContent = boletaTemplate({
      secction: section,
      student: student,
      filasAsignaturas: rowsSubjec,
      school: school,
      resumen: resumen,
      period: period,
    });

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

    const filenameYear = (section.name || "Anio").replace(/\s+/g, "_");
    const filenameSection = (section.nomenclature || "Seccion").replace(
      /\s+/g,
      "_",
    );
    const studentDoc = student.user?.id_card || "Estudiante";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=Boleta_${studentDoc}_${filenameYear}_${filenameSection}.pdf`,
    );

    logger.info("Exito, la certificacion esta lista.");
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
 ** Genera la planilla de incripcion de un estudiante
 *
 * @async
 * @function enrollmetP
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const enrollmetP = async (req, res) => {
  const { id_student } = req.params;
  const SIG = req.user?.SIG ;
  const id_period = req.user?.id_period;
  let browser = null;

  if (!SIG || !id_student) {
    return res.status(400).json({
      success: false,
      code: "INCOMPLETE_ENROLLMENT_REPORT_PARAMS",
      message:
        "Error al procesar la planilla: Faltan datos esenciales en los parámetros.",
    });
  }

  try {
    logger.info("Generando planilla de inscripcion...");
    const [student, school] = await Promise.all([
      Students.byID(id_student),
      School.getSchoolBySIG(SIG),
    ]);

    if (!student || !school) {
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
      logoBase64 = `data:image/${formato};base64,${imagenBuffer.toString("base64")}`;
    }

    const htmlContent = enrollmentP(student, school, logoBase64);

    browser = await puppeteer.launch(LAUNCH_ARGS);
    const page = await browser.newPage();

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
    logger.info("Exito, planilla generada");
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
 ** Genera un reporte con todas las califiaciones de una seccion, distinto a RFRE para el control interno, con esatdisticas.
 *
 * @async
 * @function sheetNote
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
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
    const lapses = await Lapse.getLapses(SIG, id_period);
    const lapseActive = lapses?.find((lapse) => lapse.is_active === true);

    if (!lapseActive) {
      return res.status(404).json({
        success: false,
        code: "NO_ACTIVE_LAPSE_FOR_REPORT",
        message:
          "No es posible procesar la sábana debido a que no existe un lapso académico activo bajo evaluación.",
      });
    }

    const [section, school, loadAcademic] = await Promise.all([
      Sections.getStudent({ id_section, SIG }),
      School.getSchoolBySIG(SIG),
      LoadAcademic.get({ SIG, id_section }),
    ]);

    if (!section || section.length === 0) {
      return res.status(404).json({
        success: false,
        code: "SHEET_NOTES_EMPTY",
        message:
          "No se localizaron calificaciones registradas en este lapso para compilar la sábana de la sección.",
      });
    }

    // lista de ids de las cargaas academicas de una seccion
    const loadAcademicId = loadAcademic
      .flatMap((load) => load.academicLoad)
      .map((load) => load.id_load_academic);

    const grades = await Promise.all(
      loadAcademicId.map((id) => Grade.getBySection(id)),
    );

    /*   const studentsMap = rows.students.reduce((acc, row) => {
      const doc = row.student.user.id_card;

      if (!acc[doc]) {
        acc[doc] = {
          document: doc,
          name: row.students.user.name,
          last_name: row.students.user.student_last_name,
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
    }, {}); */
    /* 
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
    }); */

    /* const uniqueSubjects = rows.reduce((acc, row) => {
      if (!acc.some((sub) => sub.code_subject === row.subject_code)) {
        acc.push({
          code_subject: row.subject_code,
          name: row.subject_name,
          abbreviation: row.abbreviation,
        });
      }
      return acc;
    }, []); */

    const htmlContent = noteSheet({
      section,
      school,
      loadAcademic,
      laspseActive: lapseActive,
      grades,
    });

    browser = await puppeteer.launch(LAUNCH_ARGS);
    const page = await browser.newPage();

    // CONFIGURACIÓN CLAVE PARA SÁBANA DE NOTAS (FORMATO A4 COMPLETO)
    await page.setViewport({ width: 1400, height: 900 });
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
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

/**
 ** Genera la planilla de incripcion de un estudiante
 *
 * @async
 * @function resumenFinalE
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const resumenFinalE = async (req, res) => {
  const SIG = req.user?.SIG;
  const id_period = req.user?.id_period;
  const { id_section } = req.params;

  if (!SIG || !id_section) {
    return res.status(400).json({
      success: false,
      code: "INCOMPLETE_SHEET_PARAMS",
      message:
        "Los parámetros institucionales de la sección son requeridos para auditar el reporte.",
    });
  }

  try {
    logger.info("Cargando informacion...");
    const [school, section, loadAcademic] = await Promise.all([
      School.getSchoolBySIG(SIG),
      Sections.getStudent({ id_section, SIG }),
      LoadAcademic.get({ SIG, id_section }),
    ]);

    const loadAcademicIds = loadAcademic
      .flatMap((item) => item.academicLoad || [])
      .map((load) => load.id_load_academic)
      .filter(Boolean);

    const gradesRawList = await Promise.all(
      loadAcademicIds.map((id) => Grade.getBySection(id)),
    );

    if (!school || !section || !loadAcademic)
      return logger.info("No hay informacion necesaria para generar el RFRE");

    const htmlContent = reporteFinalRendimientoEstudiantil({
      section: section,
      loadAcademic: loadAcademic,
      school: school,
      grades: gradesRawList,
    });

    let browser = null;
    browser = await puppeteer.launch(LAUNCH_ARGS);
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "Legal",
      landscape: false,
      scale: 0.82,
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: "4mm",
        right: "3mm",
        bottom: "4mm",
        left: "4mm",
      },
    });
    await browser.close();
    browser = null;

    const year = section.name || "Seccion";

    const fileName = `Resumen Final del Rendimineto Estudiantil${year.replace(/\s+/g, "_")}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error) {
    logger.error(error);
  }
};
