import { Students } from "../models/Students.model.js";
import { Representative } from "../models/Representative.model.js";
import { Grade } from "../models/Grade.model.js";
import { boletaTemplate } from "../templates/boleta.template.js";
import { enrollmentP } from "../templates/EnrollmetP.template.js"; // Asegúrate de que coincida con el nombre del archivo real
import { Sections } from "../models/Section.model.js";
import puppeteer from "puppeteer";
import { School } from "../models/School.model.js";

/**
 * Genera la lista de los estudiantes por sección de un Colegio
 */
export const sectionList = async (req, res) => {
  const { SIG, id_section } = req.params;
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
    const students = await Students.getStudentsBySection({
      id_section: id_section,
      SIG: SIG,
    });

    const [seccionInfo] = await Sections.getSectionByID(SIG, id_section);

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

    const htmlContent = `<!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
      <style>
        @page { size: letter; margin: 0; }
        body { font-family: 'Helvetica', -webkit-print-color-adjust: exact; }
        .watermark {
          position: absolute; top: 35%; left: 25%; width: 50%;
          opacity: 0.03; z-index: -1; transform: rotate(-30deg);
        }
      </style>
    </head>
    <body class="bg-white p-12 text-slate-700 relative min-h-screen flex flex-col justify-between">
      <div class="absolute top-0 left-0 right-0 h-2 bg-[#04C4D9]"></div>
      <div>
        <div class="flex justify-between items-center border-b-2 border-slate-100 pb-4">
          <div>
            <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">República Bolivariana de Venezuela</p>
            <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Ministerio del Poder Popular para la Educación</p>
            <h1 class="text-base font-bold text-slate-900 mt-1 uppercase">${seccionInfo.school_name || "N/A"}</h1>
            <span class="inline-block bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded mt-2 uppercase">
              ${seccionInfo.year_name || "AÑO NO ASIGNADO"} - SECCIÓN "${(seccionInfo.section_name || "").toUpperCase()}"
            </span>
          </div>
          <div class="text-right">
            <h2 class="text-sm font-black text-slate-900 tracking-tight">LISTA DE</h2>
            <h2 class="text-sm font-black text-[#04C4D9] tracking-tight">ESTUDIANTES</h2>
            <p class="text-[10px] text-slate-400 mt-1 font-medium">Total Aula: ${students.length} Alumnos</p>
          </div>
        </div>
        <table class="w-full mt-6 text-left border-collapse">
          <thead>
            <tr class="bg-slate-800 text-white uppercase text-[10px] font-bold tracking-wider">
              <th class="p-3 rounded-l w-[8%]">N°</th>
              <th class="p-3 w-[22%]">Matrícula</th>
              <th class="p-3 w-[45%]">Apellidos y Nombres</th>
              <th class="p-3 rounded-r w-[25%]">Cédula de Identidad</th>
            </tr>
          </thead>
          <tbody>
            ${filasEstudiantes || '<tr><td colspan="4" class="text-center p-4 text-slate-400 text-xs">No hay estudiantes inscritos en esta sección</td></tr>'}
          </tbody>
        </table>
      </div>
      <div class="mt-auto">
        <div class="flex justify-around items-center pt-12">
          <div class="w-[35%] border-t border-slate-300 text-center pt-2">
            <p class="text-[10px] font-bold text-slate-800">Docente / Guía</p>
            <p class="text-[10px] text-slate-500 font-medium uppercase">
              ${seccionInfo.teacher_name || "No asignado"} ${seccionInfo.teacher_last_name || ""}
            </p>
            <p class="text-[10px] text-slate-500 font-medium">
              ${seccionInfo.teacher_document ? seccionInfo.teacher_document : ""}
            </p>
          </div>
          <div class="w-[35%] border-t border-slate-300 text-center pt-2">
            <p class="text-[10px] font-bold text-slate-800">Control de Estudios</p>
          </div>
        </div>
        <div class="text-center text-[9px] text-slate-400 border-t border-slate-100 pt-4 mt-8">
          SIGACE • Simplificando procesos, impulsando el futuro.
        </div>
      </div>
    </body>
    </html>`;

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
  const { SIG, id_student, id_representative } = req.params;

  if (!SIG || !id_representative || !id_student) {
    console.log(
      `❌ Error al procesar la planilla de inscripción: faltan datos`,
    );
    return res.status(400).json({
      // Cambiado a 400 (Bad Request)
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

    const htmlContent = enrollmentP(student, school, representative);

    browser = await puppeteer.launch({
      headless: true, // Cambiado a true clásico (o 'new') para compatibilidad limpia
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // 2. 🌟 CORREGIDO: Se inyecta el contenido HTML al navegador antes de compilar el PDF
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
