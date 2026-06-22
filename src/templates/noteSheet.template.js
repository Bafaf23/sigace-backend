/**
 * Plantilla de consolidado de calificaciones por seccion y año (Formato Vertical Sincronizado).
 * @param {object} section - objeto informativo de la sección
 * @param {Array<object>} students - estudiantes procesados con sus definitivas estructuradas
 * @param {Array<object>} subjects - asignaturas únicas de esa sección
 * @returns {string} Código HTML listo para ser procesado por Puppeteer
 */
export function noteSheet(section, students, subjects) {
  // Blinda las variables locales contra valores nulos o tipos de datos incorrectos
  const validSubjects = Array.isArray(subjects) ? subjects : [];
  const validStudents = Array.isArray(students) ? students : [];

  // 📈 CÁLCULO DE ESTADÍSTICAS REALES DE LA SECCIÓN
  const totalAlumnos = validStudents.length;
  const aprobados = validStudents.filter((s) => s.status === "Aprobado").length;
  const aplazados = totalAlumnos - aprobados;
  const eficiencia =
    totalAlumnos > 0 ? ((aprobados / totalAlumnos) * 100).toFixed(2) : "0.00";

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
                                    <h1 class="font-extrabold uppercase text-slate-900 text-lg mt-0.5">${section?.school_name || "N/A"}</h1>
                                </div>
                                <div class="text-right text-[11px] text-slate-500 space-y-0.5">
                                    <p><span class="font-bold">Fecha:</span> ${new Date().toLocaleDateString("es-VE")}</p>
                                    <p><strong class="font-bold">SIGACE:</strong> ${section?.SIG || "N/A"}</p>
                                </div>
                            </header>
        
                            <section class="my-3 flex justify-between items-center bg-slate-50 border border-slate-200/60 p-2.5 px-4 rounded-xl">
                                <div>
                                    <span class="text-[9px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 rounded border border-indigo-100">
                                        Control de Estudios
                                    </span>
                                    <h2 class="text-sm font-black text-slate-950 tracking-tight mt-0.5">Acta Consolidada de Calificaciones</h2>
                                </div>
                                <div class="text-right text-xs font-medium text-slate-600 space-y-0.5">
                                    <p><strong class="text-slate-900">Año / Sección:</strong> ${section?.year_name || ""} "${section?.section_name || ""}"</p>
                                    <p><strong class="text-slate-900">Periodo Escolar:</strong> ${section?.period || ""}</p>
                                </div>
                            </section>
        
                            <div class="overflow-hidden border border-slate-300 rounded-xl shadow-sm">
                                <table class="w-full border-collapse text-center text-[12px]">
                                    <thead>
                                        <tr class="bg-slate-900 text-white font-bold uppercase tracking-wider text-[9px]">
                                            <th class="p-2 border-r border-slate-800 w-[95px]">Cédula</th>
                                            <th class="text-left p-2 pl-3 bg-slate-950 w-[25%] border-r border-slate-800">Nombre y Apellido</th>
                                            
                                            ${validSubjects
                                              .map(
                                                (subject) => `
                                                <th class="p-2 border-r border-slate-800 bg-indigo-950/40 text-indigo-200 max-w-[80px] truncate" title="${subject.name}">${subject.abbreviation || subject.code_subject}</th>
                                            `,
                                              )
                                              .join("")}
                                            
                                            <th class="p-2 bg-slate-800 text-slate-200 w-[45px]">Prom</th>
                                            <th class="p-2 bg-slate-800 text-slate-200 w-[70px]">Estatus</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-slate-200 text-slate-700">
                                        
                                        ${validStudents
                                          .map(
                                            (student) => `
                                            <tr class="h-7 odd:bg-slate-50/50">
                                                <td class="p-1.5 border-r border-slate-200 font-medium text-slate-500 font-mono">${student.document}</td>
                                                <td class="text-left p-1.5 pl-3 font-bold text-slate-900 border-r border-slate-200 uppercase truncate">
                                                    ${student.last_name}, ${student.name}
                                                </td>
                                                
                                                ${validSubjects
                                                  .map((subject) => {
                                                    // 🔥 CORRECCIÓN CRÍTICA: Buscamos usando 'code_subject' para sincronizar con el backend
                                                    const nota =
                                                      student.definitivas?.[
                                                        subject.code_subject
                                                      ] ?? 0;
                                                    const notaFormateada =
                                                      String(nota).padStart(
                                                        2,
                                                        "0",
                                                      );
                                                    const esAplazado =
                                                      nota < 10;
                                                    return `
                                                        <td class="p-1.5 border-r font-mono ${esAplazado ? "text-red-600 font-bold bg-red-50/40" : ""}">
                                                            ${notaFormateada}
                                                        </td>
                                                    `;
                                                  })
                                                  .join("")}
                                                
                                                <td class="p-1.5 border-r font-bold bg-slate-50 text-slate-900 font-mono">${student.promedio}</td>
                                                <td class="p-1.5 font-bold uppercase text-[9px] ${student.status === "Aprobado" ? "text-emerald-700 bg-emerald-50/30" : "text-amber-700 bg-amber-50/30"}">
                                                    ${student.status}
                                                </td>
                                            </tr>
                                        `,
                                          )
                                          .join("")}
                                        
                                    </tbody>
                                </table>
                            </div>
        
                            <section class="mt-3 grid grid-cols-3 gap-3 text-center text-[10px]">
                                <div class="bg-slate-50 border border-slate-200/60 p-2 rounded-xl">
                                    <p class="font-bold text-slate-400 uppercase tracking-wider">Eficiencia de Sección</p>
                                    <p class="text-xs font-black text-slate-800 mt-0.5">${eficiencia}%</p>
                                </div>
                                <div class="bg-indigo-50/30 border border-indigo-100 p-2 rounded-xl">
                                    <p class="font-bold text-indigo-500 uppercase tracking-wider">Aprobados Directos</p>
                                    <p class="text-xs font-black text-indigo-950 mt-0.5">${aprobados} Alumnos</p>
                                </div>
                                <div class="bg-amber-50/30 border border-amber-100 p-2 rounded-xl">
                                    <p class="font-bold text-amber-600 uppercase tracking-wider">Estrategia de Evaluación (EE)</p>
                                    <p class="text-xs font-black text-amber-950 mt-0.5">${aplazados} Alumnos</p>
                                </div>
                            </section>
                        </div>
        
                        <div class="mt-8">
                            <footer class="grid grid-cols-2 gap-12 text-center text-[10px]">
                                <div class="flex flex-col items-center">
                                    <div class="w-40 border-b border-slate-300 h-6"></div>
                                    <p class="mt-1 font-bold text-slate-800">${section?.teacher_name ? `${section.teacher_name} ${section.teacher_last_name}` : "Docente Guía"}</p>
                                    <p class="text-[9px] text-slate-400">Firma Autorizada</p>
                                </div>
                                <div class="flex flex-col items-center">
                                    <div class="w-40 border-b border-slate-300 h-6"></div>
                                    <p class="mt-1 font-bold text-slate-800">Coordinación de Control de Estudios</p>
                                    <p class="text-[9px] text-slate-400">Firma y Sello Húmedo</p>
                                </div>
                            </footer>
        
                            <div class="mt-5 pt-1.5 border-t border-slate-100 flex justify-between items-center text-[8px]  text-slate-400">
                                <p>Documento Emitido de forma Segura por SIGACE</p>
                                <p>ID de Auditoría: SECURE-8D-VALID</p>
                            </div>
                        </div>
                    </main>
                </body>
                </html>`;
}
