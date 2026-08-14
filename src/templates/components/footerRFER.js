/**
 * Componente Parte 2: Profesores, Curso, Observaciones, Remisión y Recepción (MPPE EMG)
 * @param {Array} materias - Lista con docentes [{ acronimo: 'CA', nombreArea: 'Castellano', profesor: '', cedula: '' }]
 * @param {Object} cursoInfo - Datos de la sección y curso
 */
export const footerRFRE = (materias = [], cursoInfo = {}) => {
  const areasBase = [
    { key: "CA", num: 1, label: "CA", title: "Castellano" },
    {
      key: "ILE",
      num: 2,
      label: "ILE",
      title: "Inglés y Otras Lenguas Extranjeras",
    },
    { key: "MA", num: 3, label: "MA", title: "Matemáticas" },
    { key: "EF", num: 4, label: "EF", title: "Educación Física" },
    { key: "FI", num: 5, label: "FI", title: "Fisica" },
    { key: "QU", num: 6, label: "QU", title: "Quimica" },
    {
      key: "BI",
      num: 7,
      label: "BI",
      title: "Biologia",
    },
    {
      key: "CT",
      num: 8,
      label: "CT",
      title: "Ciencias de la Tierra",
    },
    {
      key: "GHC",
      num: 9,
      label: "GHC",
      title: "Geografía, Historia y Ciudadanía",
    },
    {
      key: "FSN",
      num: 10,
      label: "FSN",
      title: "Formacion para la Soberania Nacional",
    },
    { key: "OC", num: 11, label: "OC", title: "Orientacion y Convivivencia" },
    { key: "PGCRP", num: 12, label: "PGCRP", title: "PGCRP" },
  ];
  const filasProfesoresHtml = areasBase
    .map((area, index) => {
      const prof = materias[index] || {};
      return `
      <tr class="h-[18px] text-[8px]">
        <td class="font-bold border border-slate-700 w-[3%]">${area.num}</td>
        <td class="font-bold border border-slate-700 w-[3.5%] bg-slate-50">${area.label}</td>
        <td class="text-left px-1 border border-slate-700 w-[28%] font-medium">${area.title}</td>
        <td class="text-left px-1 border border-slate-700 uppercase font-semibold">${prof.nombre || ""}</td>
        <td class="font-mono border border-slate-700 w-[18%]">${prof.cedula || ""}</td>
        <td class="border border-slate-700 w-[15%]"></td>
      </tr>
    `;
    })
    .join("");

  return `<div class="w-full mt-1 text-[10px] font-sans">
      
      <!-- BLOQUE SUPERIOR: SECCIÓN V Y SECCIÓN VI ALINEADAS -->
      <div class="flex w-full border-t border-slate-700">
        
        <!-- SECCIÓN V: PROFESORES POR ÁREAS (IZQUIERDA - 72% ANCHO) -->
        <div class="w-[72%] border-l border-b border-slate-700">
          <table class="w-full">
            <thead>
              <tr class="font-bold  text-[10px]">
                <th colspan="3" class="text-left px-1 py-0.5 border border-slate-700">V. Profesores por Áreas:</th>
                <th rowspan="2" class="p-0.5 border border-slate-700 w-[25%]">Apellidos y Nombres</th>
                <th rowspan="2" class="p-0.5 border border-slate-700 w-[25%]">Cédula de Identidad</th>
                <th rowspan="2" class="p-0.5 border border-slate-700 w-[20%]">Firma</th>
              </tr>
              <tr class="font-bold text-[10px]">
                <th class="p-0.5 border border-slate-700">N°</th>
                <th colspan="2" class="p-0.5 border border-slate-700">Áreas de Formación</th>
                <th class="border border-slate-700"></th>
                <th class="border border-slate-700"></th>
                <th class="border border-slate-700"></th>
              </tr>
            </thead>
            <tbody>
              ${filasProfesoresHtml}
            </tbody>
          </table>
        </div>

        <!-- SECCIÓN VI: IDENTIFICACIÓN DEL CURSO (DERECHA - 28% ANCHO) -->
        <div class="w-[28%] border-r border-b border-l border-slate-700 flex flex-col justify-between text-center">
          <div>
            <div class="font-bold text-[10px] p-0.5 border-b border-slate-700 text-left px-1">
              VI. Identificación del Curso:
            </div>
            
            <div class="font-bold text-[10px] p-0.5 border-b border-slate-700 uppercase">PLAN DE ESTUDIO:</div>
            <div class="p-1 border-b border-slate-700 text-[8px] font-semibold">${cursoInfo.planEstudio || "EDUCACIÓN MEDIA GENERAL"}</div>

            <div class="font-bold text-[7.5px] p-0.5 border-b border-slate-700 uppercase">CÓDIGO:</div>
            <div class="p-1 border-b border-slate-700 font-mono text-[10px]">${cursoInfo.codigo || "31059"}</div>

            <div class="font-bold text-[10px] p-0.5 border-b border-slate-700 uppercase">AÑO CURSADO</div>
            <div class="p-1 border-b border-slate-700 text-[10px] font-semibold uppercase">${cursoInfo.anoCursado || "TERCER"}</div>

            <div class="font-bold text-[10px] p-0.5 border-b border-slate-700 uppercase">SECCIÓN</div>
            <div class="p-1 border-b border-slate-700 text-[10px] font-bold uppercase">${cursoInfo.seccion || "U"}</div>
          </div>

          <!-- Total estudiantes -->
          <div class="grid grid-cols-2 text-[10px] font-bold border-t border-slate-700">
            <div class="p-0.5 border-r border-slate-700 leading-tight uppercase">
              N° DE ESTUDIANTES<br>POR SECCIÓN
            </div>
            <div class="p-0.5 leading-tight uppercase">
              N° DE ESTUDIANTES<br>EN ESTA PÁGINA
            </div>
          </div>
          <div class="grid grid-cols-2 text-[9px] font-bold border-t border-slate-700">
            <div class="p-0.5 border-r border-slate-700">${cursoInfo.totalSeccion ?? 1}</div>
            <div class="p-0.5">${cursoInfo.totalPagina ?? 1}</div>
          </div>
        </div>

      </div>

      <!-- SECCIÓN VII: OBSERVACIONES -->
      <div class="w-full border-x border-b border-slate-700">
        <div class=" font-bold uppercase text-[8.5px] p-0.5 border-b border-slate-700 px-1">
          VII. Observaciones:
        </div>
        <div class="h-8 p-1 text-[8px] uppercase italic text-slate-700">
        
        </div>
      </div>

      <!-- BLOQUE INFERIOR: VIII. REMISIÓN, SELLOS Y IX. RECEPCIÓN -->
      <div class="grid grid-cols-12 w-full border-x border-b border-slate-700 text-center">
        
        <!-- VIII. Fecha de Remisión (Director/a) -->
        <div class="col-span-3 border-r border-slate-700 flex flex-col justify-between">
          <div class=" font-bold uppercase text-[10px] p-0.5 border-b border-slate-700 text-left px-1">
            VIII. Fecha de Remisión:
          </div>
          <div class="p-0.5 border-b border-slate-700 font-bold text-[10px]">Director(a)</div>
          
          <div class="text-left px-1 py-0.5 text-[10px] border-b border-slate-300">Apellidos y Nombres:</div>
          <div class="p-0.5 font-bold uppercase text-[10px] border-b border-slate-700">${cursoInfo.director.name || "CAMACHO, GRISELA M."}</div>
          
          <div class="text-left px-1 py-0.5 text-[10px] border-b border-slate-300">Cédula de Identidad:</div>
          <div class="p-0.5 font-mono font-semibold text-[10px] border-b border-slate-700">${cursoInfo.director.cedula || "V-9587784"}</div>
          
          <div class="text-left px-1 py-0.5 text-[10px]">Firma:</div>
          <div class="h-6"></div>
        </div>

        <!-- SELLO DEL PLANTEL -->
        <div class="col-span-3 border-r border-slate-700 flex items-center justify-center p-2">
          <span class="font-bold text-[8.5px] text-slate-500 uppercase tracking-wider">
            SELLO DEL PLANTEL
          </span>
        </div>

        <!-- IX. Fecha de Recepción (Funcionario) -->
        <div class="col-span-3 border-r border-slate-700 flex flex-col justify-between">
          <div class=" font-bold uppercase text-[10px] p-0.5 border-b border-slate-700 text-left px-1">
            IX. Fecha de Recepción:
          </div>
          <div class="p-0.5 border-b border-slate-700 font-bold text-[10px]">Funcionario Receptor</div>
          
          <div class="text-left px-1 py-0.5 text-[10px] border-b border-slate-300">Apellidos y Nombres:</div>
          <div class="p-0.5 font-bold uppercase text-[7.5px] border-b border-slate-700 h-5"></div>
          
          <div class="text-left px-1 py-0.5 text-[10px] border-b border-slate-300">Cédula de Identidad:</div>
          <div class="h-5 p-0.5 font-mono font-semibold text-[10px] border-b border-slate-700"></div>
          
          <div class="text-left px-1 py-0.5 text-[10px]">Firma:</div>
          <div class="h-6"></div>
        </div>

        <!-- SELLO DE LA ZONA EDUCATIVA -->
        <div class="col-span-3 flex items-center justify-center p-2">
          <span class="font-bold text-[8.5px] text-slate-500 uppercase tracking-wider text-center">
            SELLO DE LA ZONA<br>EDUCATIVA
          </span>
        </div>

      </div>

    </div>`;
};
