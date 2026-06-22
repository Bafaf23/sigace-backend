import { Students } from "../models/Students.model.js";
import { Representative } from "../models/Representative.model.js";
import { Grade } from "../models/Grade.model.js";
import { boletaTemplate } from "../templates/boleta.template.js";
import { enrollmentP } from "../templates/EnrollmetP.template.js";
import { listSection } from "../templates/listSectio.template.js";
import { Sections } from "../models/Section.model.js";
import { Subject } from "../models/Subject.model.js";
import { LapseModel } from "../models/Lapse.model.js";
import fs from "fs";
import { noteSheet } from "../templates/noteSheet.template.js";
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
  const { id_student, id_section } = req.params;
  const SIG = req.user.SIG;
  let browser = null;

  if (!id_student || !id_section) {
    console.log(`❌ Los datos son requeridos`);
    return res.status(400).json({
      success: false,
      message: "Faltan parámetros requeridos en la solicitud.",
    });
  }

  try {
    const grades = await Grade.getGradesForBoleta(SIG, id_student, id_section);
    const seccionInfo = await Sections.getSectionByID(SIG, id_section);
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
  const id_period = req.user.id_period;

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
      Students.getStudentByID(id_student, id_period),
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

/**
 * Genera la noteSheet de una sección (Sábana Completa o Estudiante Único)
 */
export const sheetNote = async (req, res) => {
  console.log(`Generando la noteSheet...`);

  const SIG = req.user?.SIG;
  const { id_section } = req.params;

  if (!SIG || !id_section) {
    console.log(`Parámetros faltantes en la solicitud.`);
    return res
      .status(400)
      .json({ success: false, message: "Los parámetros son requeridos." });
  }

  try {
    // 1. Validar existencia del lapso escolar activo
    const lapses = await LapseModel.getLapses(SIG);
    const lapseActive = lapses.find((lapse) => lapse.is_active === 1);

    if (!lapseActive) {
      console.log(`No se encontró un lapso activo en el sistema.`);
      return res.status(404).json({
        success: false,
        message:
          "No es posible generar el reporte porque no existe un lapso académico activo.",
      });
    }

    // 2. Buscar calificaciones
    const rows = await Subject.getGradesForSheetNote({
      id_lapse: lapseActive.id,
      id_section: Number(id_section),
      SIG: SIG,
    });

    console.log("Primera fila de la BD:", rows[0]);

    if (!rows || rows.length === 0) {
      console.log(`No se encontraron registros académicos.`);
      return res.status(404).json({
        success: false,
        message:
          "No se encontraron calificaciones asociadas a los parámetros proporcionados.",
      });
    }

    // 3. Buscar datos descriptivos de la sección
    const section = await Sections.getSectionByID(SIG, id_section);
    if (!section) {
      console.log(`Sección no encontrada o no preparada.`);
      return res.status(404).json({
        success: false,
        message:
          "Lo sentimos, la sección a la que quieres acceder no está preparada.",
      });
    }

    // 4. Mapear y procesar las notas acumuladas usando 'subject_code'
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
      const materia = row.subject_code; // 🔥 CORREGIDO: Antes tenías code_subject
      const nota = parseFloat(row.evaluation_grade) || 0;

      // Usamos el nombre exacto de tu BD 'evaluation_porcentage'
      const porcentaje = parseFloat(row.evaluation_porcentage) / 100 || 0;

      if (!est._acumuladores[materia]) {
        est._acumuladores[materia] = 0;
      }

      est._acumuladores[materia] += nota * porcentaje;
      return acc;
    }, {});

    // 5. Calcular definitivas, promedios y estatus final
    const processedStudents = Object.values(studentsMap).map((student) => {
      let sumaDefinitivas = 0;
      let totalMaterias = 0;
      let tieneAplazadas = false;

      for (const materia in student._acumuladores) {
        const notaDefinitiva = Math.round(student._acumuladores[materia]);
        student.definitivas[materia] = notaDefinitiva; // Guardado bajo el código único
        sumaDefinitivas += notaDefinitiva;
        totalMaterias++;

        if (notaDefinitiva < 10) {
          tieneAplazadas = true;
        }
      }

      student.promedio =
        totalMaterias > 0
          ? (sumaDefinitivas / totalMaterias).toFixed(1)
          : "0.0";
      student.status = tieneAplazadas ? "Pendiente" : "Aprobado";

      delete student._acumuladores; // Limpieza temporal de memoria
      return student;
    });

    // 6. Extracción limpia de asignaturas únicas usando 'subject_code' para evitar colisiones
    const uniqueSubjects = rows.reduce((acc, row) => {
      // 🔥 CORREGIDO: Mapeamos usando subject_code para que coincida con los alumnos
      if (!acc.some((sub) => sub.code_subject === row.subject_code)) {
        acc.push({
          code_subject: row.subject_code,
          name: row.subject_name,
          abbreviation: row.abbreviation,
        });
      }
      return acc;
    }, []);

    console.log(
      `Estructurando sábana vertical para ${processedStudents.length} alumnos.`,
    );

    // 7. Renderizado HTML
    const htmlContent = noteSheet(section, processedStudents, uniqueSubjects);

    console.log(
      "Compilando HTML a binario PDF con Puppeteer (Formato Vertical)...",
    );

    // 8. Lanzar Puppeteer para generar el binario PDF
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: false,
      printBackground: true,
      margin: { top: "0.6cm", right: "0.6cm", bottom: "0.6cm", left: "0.6cm" },
    });

    await browser.close();

    // 9. Configuración y entrega de cabeceras HTTP del archivo PDF
    const sectionName = section.section_name || "Seccion";
    const fileName = `Sabana_Notas_${sectionName.replace(/\s+/g, "_")}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.setHeader("Content-Length", pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    console.error(`❌ Error crítico en sheetNote:`, error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message:
          "Ocurrió un error interno al intentar generar la sábana de notas.",
        error: error.message,
      });
    }
  }
};
