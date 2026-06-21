import { Students } from "../models/Students.model.js";
import { Representative } from "../models/Representative.model.js";
import { Grade } from "../models/Grade.model.js";
import { boletaTemplate } from "../templates/boleta.template.js";
import { enrollmentP } from "../templates/EnrollmetP.template.js";
import { listSection } from "../templates/listSectio.template.js";
import { Sections } from "../models/Section.model.js";
import fs from "fs";
import puppeteer from "puppeteer";
import { School } from "../models/School.model.js";
import path from "path";

/**
 * Genera la lista de los estudiantes por sección de un Colegio
 */
export const sectionList = async (req, res) => {
  const { id_section } = req.params;
  const SIG = req.user.SIG;
  let browser = null;

  if (!SIG || !id_section) {
    console.log(
      "❌ No se pudo generar el PDF debido a falta de parámetros (SIG o id_section).",
    );
    return res.status(400).json({
      success: false,
      message: "No se pudo generar el PDF, faltan datos requeridos.",
    });
  }

  try {
    const [students, sectionsResult] = await Promise.all([
      Students.getStudentsBySection({ id_section, SIG }),
      Sections.getSectionByID(SIG, id_section),
    ]);

    const seccionInfo = sectionsResult?.[0];

    if (!seccionInfo) {
      return res.status(404).json({
        success: false,
        message: "No se encontró información para la sección especificada.",
      });
    }

    const filasEstudiantes = students
      .map(
        (student, index) => `
        <tr class="${index % 2 === 1 ? "bg-slate-50" : "bg-white"} border-b border-slate-200">
          <td class="p-3 text-xs text-slate-500 font-medium">${index + 1}</td>
          <td class="p-3 text-xs font-bold text-blue-700">${student.tuition_number || "N/A"}</td>
          <td class="p-3 text-xs font-bold text-slate-800">${`${student.last_name || ""}, ${student.name || ""}`.toUpperCase()}</td>
          <td class="p-3 text-xs text-slate-600">${student.document || "N/A"}</td>
        </tr>
      `,
      )
      .join("");

    const studentAcount = students.length;

    // 3. Procesamiento del Logo / Marca de Agua en Base64
    const nameLogo = seccionInfo.logo_school || "default.png";
    const rutaDelLogo = path.join(process.cwd(), "public", "logos", nameLogo);
    let logoBase64 = "";

    if (fs.existsSync(rutaDelLogo)) {
      const imagenBuffer = fs.readFileSync(rutaDelLogo);
      let formato = path.extname(nameLogo).replace(".", "").toLowerCase();
      if (formato === "jpg") formato = "jpeg"; // Estandarizar para el data URI
      logoBase64 = `data:image/${formato};base64,${imagenBuffer.toString("base64")}`;
    }

    const htmlContent = listSection(
      seccionInfo,
      filasEstudiantes,
      logoBase64,
      studentAcount,
    );

    // 4. Generación del PDF con Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    await browser.close();
    browser = null;

    // 5. Formateo del nombre del archivo de descarga
    const filenameYear = (seccionInfo.year_name || "Anio").replace(/\s+/g, "_");
    const filenameSection = (seccionInfo.section_name || "Seccion").replace(
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
    if (browser !== null) {
      await browser.close();
    }
    console.error(
      "❌ Error crítico en sectionList al compilar reporte con Puppeteer:",
      error,
    );
    return res.status(500).json({
      success: false,
      message: "Ocurrió un error interno al procesar el documento PDF.",
    });
  }
};

/**
 * Genera la boleta de notas del estudiante
 */
export const boleta = async (req, res) => {
  const { SIG, id_student, id_section } = req.params;
  let browser = null;

  if (!SIG || !id_student || !id_section) {
    console.log(`❌ Los datos son requeridos`);
    return res.status(400).json({
      success: false,
      message: "Faltan parámetros requeridos en la solicitud.",
    });
  }

  try {
    const grades = await Grade.getGradesForBoleta(SIG, id_student, id_section);
    const [seccionInfo] = await Sections.getSectionByID(SIG, id_section);
    const student = await Students.getStudentByID(id_student);

    if (!seccionInfo || !student) {
      return res.status(404).json({
        success: false,
        message:
          "No se encontró la información del estudiante o de la sección.",
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

        if (subject.definitiva_ano > 0) {
          totalAcumulado += parseFloat(subject.definitiva_ano);
          materiasContadas++;
        }

        return `
        <tr class="border-b border-slate-200">
          <td class="p-2 text-left pl-3 font-bold text-slate-700">${subject.subject_name.toUpperCase()}</td>
          <td class="p-2 font-mono text-center ${classNota(subject.momento_1)}">${String(subject.momento_1 || 0).padStart(2, "0")}</td>
          <td class="p-2 font-mono text-center ${classNota(subject.momento_2)}">${String(subject.momento_2 || 0).padStart(2, "0")}</td>
          <td class="p-2 font-mono text-center ${classNota(subject.momento_3)}">${String(subject.momento_3 || 0).padStart(2, "0")}</td>
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
          ? "Estudiante demuestra rendimiento satisfactorio, logrando consolidar las competencias."
          : "Estudiante requiere asistir a los procesos de nivelación en las áreas reprobadas.",
    };

    const htmlContent = boletaTemplate(
      seccionInfo,
      student,
      rowsSubjec,
      resumen,
    );

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
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
    if (browser) {
      await browser.close();
    }
    console.error("❌ Error al generar la boleta:", error);
    return res.status(500).json({
      success: false,
      message: "Ocurrió un error al procesar la boleta de calificaciones.",
    });
  }
};

/**
 * Genera la planilla de inscripción
 */
export const enrollmetP = async (req, res) => {
  const { id_student, id_representative } = req.params;

  const SIG = req.user.SIG;

  if (!SIG || !id_representative || !id_student) {
    console.log(
      `❌ Error al procesar la planilla de inscripción: faltan datos`,
    );
    return res.status(400).json({
      success: false,
      message: "Error al procesar la planilla, faltan datos esenciales",
    });
  }

  let browser = null;
  try {
    const [student, school, representative] = await Promise.all([
      Students.getStudentByID(id_student),
      School.getSchoolBySIG(SIG),
      Representative.getRepresentativeByID(id_representative),
    ]);

    if (!student || !school || !representative) {
      console.warn(
        `⚠️ Intento de generación fallido: Información incompleta en BD`,
      );
      return res.status(404).json({
        success: false,
        message:
          "No se encontró la información completa del estudiante, plantel o representante para generar este documento.",
      });
    }

    const nameLogo = school.logo_school || "default.png";
    const rutaDelLogo = path.join(process.cwd(), "public", "logos", nameLogo);
    let logoBase64 = "";

    if (fs.existsSync(rutaDelLogo)) {
      const imagenBuffer = fs.readFileSync(rutaDelLogo);
      const formato = path.extname(nameLogo).replace(".", ""); // png, jpg, etc.
      logoBase64 = `data:image/${formato};base64,${imagenBuffer.toString("base64")}`;
    }

    const htmlContent = enrollmentP(
      student,
      school,
      representative,
      logoBase64,
    );

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" },
    });

    const fileName = `Planilla_${student.tuition_number || "INS"}-${student.id || "0"}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.setHeader("Content-Length", pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    console.error(
      "❌ Error catastrófico en el controlador de la planilla:",
      error,
    );

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message:
          "Ocurrió un error interno en el servidor al compilar el archivo PDF.",
      });
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
