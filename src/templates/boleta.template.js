/**
 ** Deseno de boletas de los estudiantes
 * @param {object} seccionInfo
 * @param {object} student
 * @param {Array<object} filasAsignaturas
 * @param {object} resumen
 * @returns
 */
export const boletaTemplate = (
  seccionInfo,
  student,
  filasAsignaturas,
  resumen,
) => {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Boleta de Calificaciones Informativa</title>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <style>
    @page { 
      size: letter portrait; 
      margin: 10mm; 
    }
    body { 
      font-family: 'Helvetica', 'Arial', sans-serif; 
      -webkit-print-color-adjust: exact; 
      color-adjust: exact;
    }
    /* Bordes estilo formato oficial */
    table, th, td { border: 1px solid #94a3b8 !important; }
  </style>
</head>
<body class="bg-white text-slate-800 text-xs p-2">

  <div class="flex justify-between items-center border-b-2 border-slate-900 pb-3 mb-4">
    <div class="w-2/3">
      <p class="text-[9px] font-bold uppercase tracking-tight text-slate-500">República Bolivariana de Venezuela</p>
      <p class="text-[9px] font-bold uppercase tracking-tight text-slate-500">Ministerio del Poder Popular para la Educación</p>
      <h1 class="text-base font-black uppercase text-slate-900 tracking-tight mt-1">
        ${seccionInfo.school_name || "U.E.N Juana de Escalona"}
      </h1>
      <p class="text-[10px] text-slate-500">Código Plantel: <span class="font-bold text-slate-700">${seccionInfo.school_code || "N/A"} / ${seccionInfo.SIG}</span></p>
    </div>
    <div class="text-right w-1/3">
      <div class="inline-block bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded uppercase tracking-wider mb-1">
        Boleta de Notas
      </div>
      <p class="text-[10px] font-bold text-slate-600">Año Escolar: <span class="text-slate-900">${seccionInfo.period}</span></p>
    </div>
  </div>

  <div class="grid grid-cols-3 gap-2 border border-slate-300 rounded p-3 bg-slate-50/50 mb-4">
    <div class="col-span-2 space-y-1">
      <p class="uppercase text-[10px] text-slate-500 font-bold tracking-wider">Datos del Estudiante</p>
      <p class="text-sm font-bold text-slate-900">
        ${(student.last_name || "").toUpperCase()}, ${(student.name || "").toUpperCase()}
      </p>
      <p class="text-slate-600">Cédula: <span class="font-mono font-bold text-slate-800">${student.document || "N/A"}</span></p>
    </div>
    <div class="space-y-1 border-l border-slate-200 pl-3">
      <p class="uppercase text-[10px] text-slate-500 font-bold tracking-wider">Ubicación Académica</p>
      <p class="font-bold text-blue-900">${seccionInfo.year_name || "QUINTO AÑO"}</p>
      <p class="font-semibold text-slate-700">Sección: <span class="text-cyan-600 font-black">"${(seccionInfo.section_name || "A").toUpperCase()}"</span></p>
    </div>
  </div>

  <table class="w-full border-collapse border border-slate-400 text-center text-[11px] mb-4">
    <thead>
      <tr class="bg-slate-800 text-white uppercase text-[10px] tracking-wider font-bold">
        <th class="p-2 text-left pl-3 w-[45%]">Áreas de Formación (Asignaturas)</th>
        <th class="p-2 w-[12%]">1° Momento</th>
        <th class="p-2 w-[12%]">2° Momento</th>
        <th class="p-2 w-[12%]">3° Momento</th>
        <th class="p-2 w-[19%] bg-slate-900 text-[#04C4D9]">Definitiva Año</th>
      </tr>
    </thead>
    <tbody>
      ${
        filasAsignaturas ||
        `
        <tr>
          <td colspan="5" class="p-4 italic text-slate-400">No hay calificaciones cargadas en el sistema.</td>
        </tr>
      `
      }
    </tbody>
  </table>

  <div class="grid grid-cols-3 gap-3 mb-6">
    <div class="border border-slate-400 rounded p-2 text-center flex flex-col justify-center bg-slate-900 text-white">
      <p class="text-[9px] uppercase font-bold text-[#04C4D9] tracking-wider">Promedio General</p>
      <p class="text-2xl font-black font-mono mt-1">${resumen?.promedio || "00"}</p>
      <p class="text-[8px] text-slate-400 mt-0.5 uppercase">Escala de 01 a 20 pts</p>
    </div>

    <div class="col-span-2 border border-slate-400 rounded p-2 bg-slate-50">
      <p class="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1">Apreciación del Docente Guía / Observaciones</p>
      <p class="text-[10px] text-slate-700 leading-relaxed italic">
        ${resumen?.observaciones || "Estudiante demuestra alto compromiso académico, asistencia regular y excelente participación en las actividades de los grupos de creación y producción institucional."}
      </p>
    </div>
  </div>

  <div class="mt-auto pt-8">
    <div class="grid grid-cols-3 gap-4 text-center">
      
      <div class="flex flex-col justify-between h-24">
        <div class="w-4/5 mx-auto border-b border-slate-400 mt-auto mb-1"></div>
        <div>
          <p class="font-bold text-slate-800 text-[10px] uppercase">Docente Guía</p>
          <p class="text-[9px] text-slate-500">${seccionInfo.teacher_name || "Profesor"} ${seccionInfo.teacher_last_name || ""}</p>
        </div>
      </div>

      <div class="flex items-center justify-center border border-dashed border-slate-300 rounded bg-slate-50/30 relative h-24 max-w-[140px] mx-auto w-full">
        <p class="text-[8px] font-bold text-slate-300 uppercase tracking-widest select-none">SELLO HÚMEDO<br>DEL PLANTEL</p>
        <div class="absolute border border-slate-200 rounded-full w-16 h-16 opacity-5"></div>
      </div>

      <div class="flex flex-col justify-between h-24">
        <div class="w-4/5 mx-auto border-b border-slate-400 mt-auto mb-1"></div>
        <div>
          <p class="font-bold text-slate-800 text-[10px] uppercase">Control de Estudios</p>
          <p class="text-[9px] text-slate-500">Dirección de Evaluación</p>
        </div>
      </div>

    </div>

    <div class="text-center text-[8px] text-slate-400 border-t border-slate-100 pt-3 mt-8 flex justify-between px-2">
      <span>SIGACE • Sistema Inteligente de Control de Estudios</span>
      <span class="font-mono">ID-VALIDACIÓN: ${student.document || "0000"}-2026</span>
    </div>
  </div>

</body>
</html>`;
};
