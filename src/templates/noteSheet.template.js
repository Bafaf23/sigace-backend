/**
 * Plantilla de consolidado de calificaciones por sección y año (Formato Vertical Sincronizado).
 * @param {object} section - objeto informativo de la sección
 * @param {Array<object>} students - estudiantes procesados con sus definitivas estructuradas
 * @param {Array<object>} subjects - asignaturas únicas de esa sección
 * @param {object} laspseActive - datos del lapso/momento académico activo
 * @returns {string} Código HTML listo para ser procesado por Puppeteer
 */
export function noteSheet({
  section,
  loadAcademic,
  laspseActive,
  school,
  grades = [],
}) {
  // Blinda las variables locales contra valores nulos o tipos de datos incorrectos
  const validSubjects = Array.isArray(loadAcademic[0].academicLoad)
    ? loadAcademic[0].academicLoad
    : [];
  const validStudents = Array.isArray(section?.students)
    ? section?.students
    : [];

  const totalEstudiantes = validStudents.length;
  const aprobados = validStudents.filter((s) => s.status === "aprobado").length;
  const aplazados = totalEstudiantes - aprobados;
  const reprobados = validStudents.filter(
    (s) => s.status === "reprobado",
  ).length;
  const eficiencia =
    totalEstudiantes > 0
      ? ((aprobados / totalEstudiantes) * 100).toFixed(2)
      : "0.00";

  const normalizedGrades = Array.isArray(grades)
    ? Object.assign({}, ...grades)
    : grades;

  return `<!DOCTYPE html>
  <html lang="es" class="bg-white h-full">
    <head>
      <meta charset="UTF-8">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @media print {
          @page {
            size: portrait;
            margin: 0.6cm;
          }
          body { color: #0f172a; }
        }
      </style>
    </head>
    <body class="antialiased text-slate-800 p-0">
      <main class="max-w-[210mm] mx-auto bg-white p-2 min-h-screen flex flex-col justify-between">
        <div>
          <header class="flex justify-between items-center border-b border-slate-200 pb-3 text-xs">
            <div>
              <h2 class="font-bold text-[12px] text-slate-500">República Bolivariana de Venezuela</h2>
              <p class="font-bold text-slate-500 text-[11px]">Ministerio del Poder Popular para la Educación</p>
              <h1 class="font-extrabold uppercase text-slate-900 text-lg mt-0.5">${
                school?.name || "N/A"
              }</h1>
            </div>
            <div class="text-right text-[11px] text-slate-500 space-y-0.5">
              <p><span class="font-bold">Fecha:</span> ${new Date().toLocaleDateString(
                "es-VE",
              )}</p>
              <p><strong class="font-bold">Codigo SIG:</strong> ${
                school?.SIG || "N/A"
              }</p>
            </div>
          </header>
  
          <section class="my-3 flex justify-between items-center bg-slate-50 border border-slate-200/60 p-2.5 px-4 rounded-xl">
            <div>
              <span class="text-[9px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 rounded border border-indigo-100">
                Control de Estudios
              </span>
              <h2 class="text-sm font-black text-slate-950 tracking-tight mt-0.5">Resumen de Rendimiento Academico</h2>
            </div>
            <div class="text-right text-xs font-medium text-slate-600 space-y-0.5">
              <p><strong class="text-slate-900">Momento académico:</strong> ${
                laspseActive?.name || ""
              }</p>
              <p><strong class="text-slate-900">Año / Sección:</strong> ${
                section?.name || ""
              } "${section?.nomenclature || ""}"</p>
              <p><strong class="text-slate-900">Período Escolar:</strong> ${
                laspseActive?.period.name || ""
              }</p>
            </div>
          </section>
  
          <div class="overflow-hidden border border-slate-300 rounded-xl shadow-sm">
            <table class="w-full border-collapse text-center text-[12px]">
              <thead>
                <tr class="bg-slate-900 text-white font-bold uppercase tracking-wider text-[9px]">
                  <th class="p-2 border-r border-slate-800 w-[95px]">Cédula / Matricula</th>
                  <th class="text-left p-2 pl-3 bg-slate-950 w-[25%] border-r border-slate-800">Nombre y Apellido</th>
                  ${validSubjects
                    .map(
                      (subject) => `
                    <th class="p-2 border-r border-slate-800 bg-indigo-950/40 text-indigo-200 max-w-[80px] truncate" title="${
                      subject.subject.name
                    }">
                      ${subject.subject.abbreviation}
                    </th>`,
                    )
                    .join("")}
                  <th class="p-2 bg-slate-800 text-slate-200 w-[45px]">Prom</th>
                  <th class="p-2 bg-slate-800 text-slate-200 w-[70px]">Estatus</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 text-slate-700">
                ${validStudents
                  .map((student) => {
                    const studentCardId =
                      student.id_card || student.tuition_number;

                    const studentGrades = normalizedGrades[studentCardId] || {};
                    const scoresList = Object.values(studentGrades).filter(
                      (val) => typeof val === "number" && !isNaN(val),
                    );

                    // Calculo de promedio
                    const average =
                      scoresList > 0
                        ? (
                            scoresList.reduce((acc, curr) => acc + curr, 0) /
                            scoresList.length
                          ).toFixed(0)
                        : "0";

                    return `
                  <tr class="h-7 odd:bg-slate-50/50">
                    <td class="p-1.5 border-r border-slate-200 font-medium text-slate-500">${studentCardId}</td>
                    <td class="text-left p-1.5 pl-3 font-bold text-slate-900 border-r border-slate-200 uppercase truncate">
                      ${student.name} ${student.last_name}
                    </td>
                    ${validSubjects
                      .map((subject) => {
                        const subjectId = subject.subject?.abbreviation;
                        const score = studentGrades[subjectId];
                        const scoreValid = score ? score : "0";
                        const esAplazado = scoreValid < 10;

                        return `
                      <td class="p-1.5 border-r ${
                        esAplazado ? "text-red-600 font-bold bg-red-50/40" : ""
                      }">
                        ${scoreValid}
                      </td>`;
                      })
                      .join("")}
                    <td class="p-1.5 border-r font-bold bg-slate-50 text-slate-900">${average}</td>
                    <td class="p-1.5 font-bold uppercase text-[9px] ${
                      student.status === "aprobado"
                        ? "text-emerald-700 bg-emerald-50/30"
                        : "text-amber-700 bg-amber-50/30"
                    }">
                      ${student.status}
                    </td>
                  </tr>`;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
  
          <section class="mt-3 grid grid-cols-3 gap-3 text-center text-[12px]">
            <div class="bg-slate-50 border border-slate-200/60 p-2 rounded-xl">
              <p class="font-bold text-slate-400 uppercase tracking-wider">Eficiencia de Sección</p>
              <p class="text-xs font-black text-slate-800 mt-0.5">${eficiencia}%</p>
            </div>
            <div class="bg-indigo-50/30 border border-indigo-100 p-2 rounded-xl">
              <p class="font-bold text-indigo-500 uppercase tracking-wider">Aprobados</p>
              <p class="text-xs font-black text-indigo-950 mt-0.5">${aprobados} Estudiantes</p>
            </div>
            <div class="bg-amber-50/30 border border-amber-100 p-2 rounded-xl">
              <p class="font-bold text-amber-600 uppercase tracking-wider">Estrategia de Evaluación (EE)</p>
              <p class="text-xs font-black text-amber-950 mt-0.5">${aplazados} Estudiantes</p>
            </div>
            <div class="bg-red-50/30 border border-red-100 p-2 rounded-xl col-span-3">
              <p class="font-bold text-red-600 uppercase tracking-wider">Reprobados</p>
              <p class="text-xs font-black text-red-950 mt-0.5">${reprobados} Estudiantes</p>
            </div>
          </section>
        </div>
  
        <div class="mt-8">
          <footer class="grid grid-cols-2 gap-12 text-center text-[10px]">
            <div class="flex flex-col items-center">
              <div class="w-40 border-b border-slate-300 h-6"></div>
              <p class="mt-1 font-bold text-slate-800">${
                section?.guide
                  ? `${section.guide.name} ${section.guide.last_name}`
                  : "Docente Guía"
              }</p>
              <p class="mt-1 font-bold text-slate-800">${
                section?.guide ? `${section.guide.document}` : " "
              }</p>
              <p class="text-[9px] text-slate-400">Firma Autorizada</p>
            </div>
            <div class="flex flex-col items-center">
              <div class="w-40 border-b border-slate-300 h-6"></div>
              <p class="mt-1 font-bold text-slate-800">Coordinación de Control de Estudios</p>
              <p class="text-[9px] text-slate-400">Firma y Sello Húmedo</p>
            </div>
          </footer>
  
          <div class="mt-5 pt-1.5 border-t border-slate-100 flex justify-between items-center text-[8px] text-slate-400">
            <p>Documento Emitido de forma Segura por SchoPack</p>
            <p>ID de Auditoría: ${school.SIG}-${section.id}#${Math.floor(Math.random() * 10)}</p>
          </div>
        </div>
      </main>
    </body>
  </html>`;
}
