/**
 * Plantilla lista de secciones
 * @param {object} seccionInfo - indormacion de la seccion
 * @param {string} filasEstudiantes - filas ya prcesadas en el controlador de los estudantes de la seccion
 * @param {string} logoSchool - logo del colegio
 * @returns {string}
 */
export function listSection(
  seccionInfo,
  filasEstudiantes,
  logoSchool,
  studentAcount,
) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <style>
    @page { size: letter; margin: 0; }
    body { font-family: 'Helvetica' }
    
    .watermark {
      position: absolute; 
      top: 50%; 
      left: 50%; 
      width: 60%;
      opacity: 0.03; 
      z-index: -1; 
      transform: translate(-50%, -50%);
      transform-origin: center;
    }
  </style>
</head>
<body class="bg-white p-12 text-slate-700 relative min-h-screen flex flex-col justify-between">
  <div class="absolute top-0 left-0 right-0 h-2 bg-[#04C4D9]"></div>
  ${logoSchool ? `<img class="watermark" src="${logoSchool}">` : ``}
  <div>
    <div class="flex justify-between items-center border-b-2 border-slate-100 pb-4 relative">
      <div>
        <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">República Bolivarian de Venezuela</p>
        <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Ministerio del Poder Popular para la Educación</p>
        <h1 class="text-base font-bold text-slate-900 mt-1 uppercase">${seccionInfo.school_name || "N/A"}</h1>
        <span class="inline-block bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded mt-2 uppercase">
          ${seccionInfo.year_name || "AÑO NO ASIGNADO"} - SECCIÓN "${(seccionInfo.section_name || "").toUpperCase()}"
        </span>
      </div>
      <div class="text-right">
        <h2 class="text-sm font-black text-slate-900 tracking-tight">LISTA DE</h2>
        <h2 class="text-sm font-black text-[#04C4D9] tracking-tight">ESTUDIANTES</h2>
        <p class="text-[10px] text-slate-400 mt-1 font-medium">Total Aula: ${studentAcount} Estudiantes</p>
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
        <p class="text-[12px] font-bold text-slate-800">Docente / Guía</p>
        <p class="text-[10px] text-slate-500 font-medium uppercase">
          ${seccionInfo.teacher_name || "No asignado"} ${seccionInfo.teacher_last_name || ""}
        </p>
        <p class="text-[12px] text-slate-500 font-medium">
          ${seccionInfo.teacher_document ? seccionInfo.teacher_document : ""}
        </p>
      </div>
      <div class="w-[35%] border-t border-slate-300 text-center pt-2">
        <p class="text-[12px] font-bold text-slate-800">Control de Estudios</p>
        <p class="text-[12px] text-slate-500 font-medium uppercase">FIRMA Y SELLO AUTORIZADO</p>
      </div>
    </div>
    <div class="text-center text-[9px] text-slate-400 border-t border-slate-100 pt-4 mt-8">
      SIGACE • Simplificando procesos, impulsando el futuro.
    </div>
  </div>
</body>
</html>`;
}
