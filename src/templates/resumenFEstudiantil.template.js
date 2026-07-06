/**
 ** Planilla del MPPE Resumen Final de Rendimineto Estudiantil en formato EMG-31059
 * todo: Modificarga plantilla para hacer una copia exacta a la origial del MPPE
 * @returns {Element}
 */
export const RFRE = async () => {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Resumen Final del Rendimiento Estudiantil (EMG)</title>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <style>
    /* Configuración estricta para tamaño Carta horizontal (típico de sábanas de notas del MPPE) */
    @page { 
      size: letter landscape; 
      margin: 5mm; 
    }
    body { 
      font-family: 'Helvetica', 'Arial', sans-serif; 
      -webkit-print-color-adjust: exact; 
      color-adjust: exact;
    }
    /* Estilo para micro-textos oficiales obligatorios */
    .text-micro { font-size: 7px; line-height: 1.1; }
    .text-table-head { font-size: 8px; font-weight: bold; line-height: 1.2; }
    .text-table-body { font-size: 9px; font-weight: bold; }
    
    /* Forzar bordes delgados de estilo fotocopia/oficial ministerial */
    table, th, td { border: 1px solid #475569 !important; }
  </style>
</head>
<body class="bg-white p-4 text-slate-800 text-[10px]">

  <div class="flex justify-between items-start mb-2 border-b pb-2 border-slate-400">
    <div class="w-1/3">
      <p class="font-bold uppercase text-[9px] tracking-tight">Gobierno Bolivariano de Venezuela</p>
      <p class="font-medium text-[8px] text-slate-600 uppercase">Ministerio del Poder Popular para la Educación</p>
      <p class="font-semibold text-[9px] mt-1 text-blue-900">RESUMEN FINAL DEL RENDIMIENTO ESTUDIANTIL</p>
      <p class="text-micro text-slate-500">Código del Formato: EMG</p>
    </div>
    
    <div class="w-1/3 text-center border px-2 py-1 border-slate-300 rounded bg-slate-50">
      <p class="font-bold uppercase text-[9px]">II. Datos del Plantel</p>
      <p class="text-left mt-1"><span class="font-bold text-slate-600">Nombre:</span> ${seccionInfo.school_name || "U.E.N Juana de Escalona"}</p>
      <p class="text-left"><span class="font-bold text-slate-600">Código del Plantel:</span> ${seccionInfo.school_code || "N/A"}</p>
      <p class="text-left text-micro truncate"><span class="font-bold text-slate-600">Dirección:</span> ${seccionInfo.address || "Caracas, Venezuela"}</p>
    </div>

    <div class="w-1/4 text-right text-micro">
      <p><span class="font-bold">Año Escolar:</span> 2025-2026</p>
      <p><span class="font-bold">Entidad Federal:</span> Distrito Capital</p>
      <p><span class="font-bold">Municipio:</span> Libertador</p>
      <p><span class="font-bold">Tipo de Evaluación:</span> FINAL</p>
      <p class="font-bold text-slate-500 mt-1">Página 1 de 1</p>
    </div>
  </div>

  <table class="w-full text-center border-collapse border border-slate-600">
    <thead>
      <tr class="bg-slate-100 text-table-head uppercase">
        <th rowspan="3" class="w-[3%] p-1">N°</th>
        <th rowspan="3" class="w-[10%] p-1">Cédula de<br>Identidad</th>
        <th rowspan="3" class="w-[15%] p-1">Apellidos</th>
        <th rowspan="3" class="w-[15%] p-1">Nombres</th>
        <th rowspan="3" class="w-[5%] text-micro p-0.5">Sexo<br>(M/F)</th>
        <th colspan="2" class="text-micro p-0.5">Fecha Nac.</th>
        <th colspan="12" class="p-1 tracking-wider">IV. Resumen Final del Rendimiento (Calificaciones)</th>
      </tr>
      <tr class="bg-slate-50 text-micro font-bold">
        <th rowspan="2" class="p-0.5 w-[3%]">Mes</th>
        <th rowspan="2" class="p-0.5 w-[3%]">Día</th>
        <th class="p-1 w-[4%]" title="Castellano">CA</th>
        <th class="p-1 w-[4%]" title="Inglés y otras Lenguas Extranjeras">ILE</th>
        <th class="p-1 w-[4%]" title="Matemáticas">MA</th>
        <th class="p-1 w-[4%]" title="Educación Física">EF</th>
        <th class="p-1 w-[4%]" title="Física">FI</th>
        <th class="p-1 w-[4%]" title="Química">QU</th>
        <th class="p-1 w-[4%]" title="Biología">BI</th>
        <th class="p-1 w-[4%]" title="Ciencias de la Tierra">CT</th>
        <th class="p-1 w-[4%]" title="Geografía, Historia y Ciudadanía">GHC</th>
        <th class="p-1 w-[4%]" title="Formación para la Soberanía Nacional">FS</th>
        <th class="p-1 w-[4%]" title="Orientación y Convivencia">OC</th>
        <th class="p-1 w-[6%] text-[6px]" title="Participación en Grupos de Creación, Recreación y Producción">PG / GRUPO</th>
      </tr>
      <tr class="bg-slate-100 text-[7px] font-black text-slate-500">
        <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th><th>9</th><th>10</th><th>11</th><th>12</th>
      </tr>
    </thead>
    <tbody>
      ${
        filasEstudiantes ||
        `
        <tr>
          <td colspan="19" class="p-4 text-center text-slate-400 font-medium italic">
            No se encontraron estudiantes inscritos para generar la matriz de rendimiento.
          </td>
        </tr>
      `
      }
    </tbody>
  </table>

  <div class="flex justify-end items-center gap-6 mt-1 text-micro font-bold text-slate-600 uppercase bg-slate-50 p-1 border border-t-0 border-slate-400">
    <div>Inscritos: <span class="text-slate-900 ml-0.5">${students.length}</span></div>
    <div>Aprobados: <span class="text-green-700 ml-0.5">${students.filter((s) => (s.def_final || 0) >= 10).length || 0}</span></div>
    <div>No Aprobados: <span class="text-red-700 ml-0.5">${students.filter((s) => (s.def_final || 0) < 10).length || 0}</span></div>
    <div>Inasistentes: <span class="text-slate-900 ml-0.5">0</span></div>
  </div>

  <div class="flex gap-2 mt-3 w-full">
    <div class="w-1/3 border p-2 border-slate-400 rounded bg-slate-50">
      <h3 class="font-bold border-b border-slate-300 pb-0.5 text-slate-700 uppercase tracking-tight">VI. Identificación del Curso</h3>
      <div class="grid grid-cols-2 gap-x-2 gap-y-1 mt-1 text-[9px]">
        <p><span class="font-bold text-slate-500">Plan de Estudio:</span> <br>Educación Media General</p>
        <p><span class="font-bold text-slate-500">Código de Plan:</span> <br>31059</p>
        <p><span class="font-bold text-slate-500">Año / Sección:</span> <br>${seccionInfo.year_name || "QUINTO"} - "${(seccionInfo.section_name || "A").toUpperCase()}"</p>
        <p><span class="font-bold text-slate-500">Total Sección:</span> <br>${students.length} estudiantes</p>
      </div>
    </div>

    <div class="w-2/3 border p-2 border-slate-400 rounded flex flex-col justify-between">
      <div>
        <h3 class="font-bold border-b border-slate-300 pb-0.5 text-slate-700 uppercase tracking-tight">VII. Observaciones</h3>
        <p class="text-micro text-slate-400 mt-1 italic">El presente resumen no presenta enmiendas, tachaduras ni modificaciones de carácter legal en el registro físico o digital de calificaciones iniciales.</p>
      </div>
      <div class="text-right text-micro font-bold text-slate-500">
        VIII. Fecha de Remisión: ____ / ____ / ________
      </div>
    </div>
  </div>

  <div class="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-dashed border-slate-300">
    <div class="flex flex-col justify-between border border-slate-300 rounded p-2 text-center h-28 bg-white relative">
      <p class="font-bold uppercase text-slate-600 text-micro">Director(a) de la Institución</p>
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
        <div class="border-4 border-slate-700 border-double rounded-full w-20 h-20 flex items-center justify-center font-bold text-[8px] tracking-tight uppercase p-1">SELLO PLANTEL</div>
      </div>
      <div class="mt-auto">
        <div class="w-3/4 mx-auto border-b border-slate-400 mb-1"></div>
        <p class="font-bold uppercase text-slate-800 text-micro">${seccionInfo.teacher_name || "No asignado"} ${seccionInfo.teacher_last_name || ""}</p>
        <p class="text-[8px] text-slate-500">C.I: ${seccionInfo.teacher_document || "N/A"}</p>
      </div>
    </div>

    <div class="flex flex-col justify-between border border-slate-300 rounded p-2 text-center h-28 bg-white relative">
      <p class="font-bold uppercase text-slate-600 text-micro">Funcionario Receptor MPPE</p>
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
        <div class="border-4 border-slate-700 border-double rounded-sm w-20 h-16 flex items-center justify-center font-bold text-[8px] tracking-tight uppercase p-1">SELLO ZONA</div>
      </div>
      <div class="mt-auto">
        <div class="w-3/4 mx-auto border-b border-slate-400 mb-1"></div>
        <p class="font-medium text-slate-400 text-micro uppercase">Firma y Cédula Identidad</p>
        <p class="text-[8px] text-slate-400">IX. Fecha de Recepción</p>
      </div>
    </div>

    <div class="flex flex-col justify-between bg-slate-900 text-slate-300 rounded p-2 text-[8px] leading-relaxed">
      <div>
        <p class="font-bold uppercase text-[#04C4D9] text-micro tracking-wider mb-1">Aclaratoria de Nomenclatura:</p>
        <p><span class="font-bold text-white">1-CA:</span> Castellano | <span class="font-bold text-white">2-ILE:</span> Inglés y otras Lenguas</p>
        <p><span class="font-bold text-white">3-MA:</span> Matemáticas | <span class="font-bold text-white">4-EF:</span> Educación Física</p>
        <p><span class="font-bold text-white">5-FI:</span> Física | <span class="font-bold text-white">6-QU:</span> Química | <span class="font-bold text-white">7-BI:</span> Biología</p>
        <p><span class="font-bold text-white">8-CT:</span> C. de la Tierra | <span class="font-bold text-white">9-GHC:</span> Geografía, Hist. y Ciu.</p>
        <p><span class="font-bold text-white">10-FS:</span> Formación Soberanía | <span class="font-bold text-white">11-OC:</span> Orientación y Conv.</p>
      </div>
      <div class="text-right text-[#04C4D9] font-black tracking-tight border-t border-slate-700 pt-1 mt-1 text-micro uppercase">
        SIGACE Inteligente • MPPE Compilance
      </div>
    </div>
  </div>

</body>
</html>`;
};
