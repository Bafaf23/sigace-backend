/**
 ** Deseno de boletas de los estudiantes
 * @param {object} seccionInfo
 * @param {object} student
 * @param {Array<object} filasAsignaturas
 * @param {object} resumen
 * @returns
 */
export const boletaTemplate = ({
  secction,
  student,
  filasAsignaturas,
  resumen,
  school,
  period,
}) => {
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

  <div class="flex justify-between items-center border-b-2 border-orange-700 pb-3 mb-4">
    <div class="w-2/3">
      <p class="text-[10px] font-bold uppercase tracking-tight text-slate-500">República Bolivariana de Venezuela</p>
      <p class="text-[10px] font-bold uppercase tracking-tight text-slate-500">Ministerio del Poder Popular para la Educación</p>
      <h1 class="text-base font-black uppercase text-slate-900 tracking-tight mt-1">
        ${school.name || "*"}
      </h1>
      <p class="text-[10px] text-slate-500">Código Plantel: <span class="font-bold text-slate-700">${school.code_DEA || "N/A"} / ${school.SIG}</span></p>
    </div>
    <div class="text-right w-1/2">
      <div class="inline-block bg-slate-900 text-white text-[13px] font-black px-3 py-1 rounded uppercase tracking-wider mb-1">
        Resumen de Calificaciones
      </div>
      <p class="text-[10px] font-bold text-slate-600">Año Escolar: <span class="text-slate-900">${period?.name || "*"}</span></p>
    </div>
  </div>

  <div class="grid grid-cols-3 gap-2 border border-slate-300 rounded p-3 bg-slate-50/50 mb-4">
    <div class="col-span-2 space-y-1">
      <p class="uppercase text-[10px] text-slate-500 font-bold tracking-wider">Datos del Estudiante</p>
      <p class="text-sm font-bold text-slate-900">
        ${(student.user?.name || "").toUpperCase()} ${(student.user?.last_name || "").toUpperCase()}
      </p>
      <div class="flex gap-5">
        <p class="text-slate-600">Cédula: <span class="font-mono font-bold text-slate-800">${student.user.id_card || "N/A"}</span></p>
        <p class="text-slate-600">Número de Matricula: <span class="font-mono font-bold text-slate-800">${student.tuition_number || "N/A"}</span></p>
      </div>
    </div>
    <div class="space-y-1 border-l border-slate-200 pl-3">
      <p class="uppercase text-[10px] text-slate-500 font-bold tracking-wider">Ubicación Académica</p>
      <p class="font-bold text-blue-900">${secction.name || "QUINTO AÑO"}</p>
      <p class="font-semibold text-slate-700">Sección: <span class="text-cyan-600 font-black">"${(secction.nomenclature || "A").toUpperCase()}"</span></p>
    </div>
  </div>
<div class="overflow-hidden rounded-xl border border-slate-400 mb-4">
  <table class="border-collapse w-full text-center text-[11px]">
    <thead>
      <tr class="bg-slate-800 text-white uppercase tracking-wider font-bold">
        <th class="p-2 text-left pl-3 w-[45%]">Áreas de Formación (Asignaturas)</th>
        <th class="p-2 w-[12%]">1° Momento</th>
        <th class="p-2 w-[12%]">2° Momento</th>
        <th class="p-2 w-[12%]">3° Momento</th>
        <th class="p-2 w-[19%] bg-slate-900 text-[#04C4D9] rounded-tr-xl">Definitiva Año</th>
      </tr>
    </thead>
    <tbody>
      ${filasAsignaturas}
    </tbody>
  </table>
</div>

</div>
  <div class="grid grid-cols-3 gap-3 mb-6">
    <div class="border border-slate-400 rounded p-2 text-center flex flex-col justify-center bg-slate-900 text-white">
      <p class="text-[9px] uppercase font-bold text-orange-500 tracking-wider">Promedio General</p>
      <p class="text-2xl font-black  mt-1">${resumen?.average || "*"}</p>
      <p class="text-[8px] text-slate-400 mt-0.5 uppercase">Escala de 1 a 20 pts</p>
    </div>

    <div class="col-span-2 border border-slate-400 rounded p-2 bg-slate-50">
      <p class="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1">Apreciación del Docente Guía / Observaciones</p>
      <p class="text-[10px] text-slate-700 leading-relaxed italic h-5">
        ${resumen?.observaciones || ""}
      </p>
    </div>
  </div>

  <div class="mt-auto pt-8">
    <div class="grid grid-cols-2 gap-4 text-center">
      
      <div class="flex flex-col justify-between h-24">
        <div class="w-4/5 mx-auto border-b border-slate-400 mt-auto mb-1"></div>
        <div>
          <p class="font-bold text-slate-800 text-[10px] uppercase">Docente Guía</p>
          <p class="text-[9px] text-slate-500">${secction.guide?.name || "Profesor"} ${secction.guide?.last_name || ""}</p>
        </div>
      </div>


      <div class="flex flex-col justify-between h-24">
        <div class="w-4/5 mx-auto border-b border-slate-400 mt-auto mb-1"></div>
        <div>
          <p class="font-bold text-slate-800 text-[10px] uppercase">Control de Estudios</p>
          <p class="text-[9px] text-slate-500">Dirección de Evaluación</p>
        </div>
      </div>

    </div>
  </div>

</body>
</html>`;
};
