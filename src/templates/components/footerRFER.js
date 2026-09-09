/**
 * Componente Parte 2: Profesores, Curso, Observaciones, Remisión y Recepción (MPPE EMG)
 * @param {Array} loadAcademic - Datos recibidos del backend
 * @param {Object} [sectionOverride] - Datos adicionales de sección (opcional)
 */
export const footerRFRE = (loadAcademic = [], section = {}, school) => {
  // 1. Manejo seguro si la respuesta es un Array `[{ section, academicLoad }]` o un Objeto directo
  const rootData = Array.isArray(loadAcademic) ? loadAcademic[0] || {} : data;

  // Extraemos la sección y la carga académica desde rootData
  const sectionData = rootData.section || sectionOverride.section || {};

  // Aplanamos academicLoad por si viene como array anidado [[Object], [Object]]
  const academicLoad = Array.isArray(rootData.academicLoad)
    ? rootData.academicLoad.flat()
    : [];

  // Mapeo con los códigos/abreviaturas estándar de las materias
  const areasBase = [
    { key: "CA", num: 1, label: "CA", title: "Castellano", code: "CAS" },
    {
      key: "ILE",
      num: 2,
      label: "ILE",
      title: "Inglés y Otras Lenguas Extranjeras",
      code: "ILE",
    },
    { key: "MA", num: 3, label: "MA", title: "Matemáticas", code: "MAT" },
    { key: "EF", num: 4, label: "EF", title: "Educación Física", code: "EDF" },
    { key: "FI", num: 5, label: "FI", title: "Física", code: "FIS" },
    { key: "QU", num: 6, label: "QU", title: "Química", code: "QUI" },
    { key: "BI", num: 7, label: "BI", title: "Biología", code: "BIO" },
    {
      key: "CT",
      num: 8,
      label: "CIE",
      title: "Ciencias de la Tierra",
      code: "CIE",
    },
    {
      key: "GHC",
      num: 9,
      label: "GHC",
      title: "Geografía, Historia y Ciudadanía",
      code: "GHC",
    },
    {
      key: "FSN",
      num: 10,
      label: "FSN",
      title: "Formación para la Soberanía Nacional",
      code: "FSN",
    },
    {
      key: "OC",
      num: 11,
      label: "OC",
      title: "Orientación y Convivencia",
      code: "OC",
    },
    { key: "PGCRP", num: 12, label: "PGCRP", title: "PGCRP", code: "PGCRP" },
  ];
  console.log(academicLoad);

  const director = school?.usersByRole?.director?.[0];

  const directorFullName = director
    ? `${director.name || ""} ${director.last_name || ""}`.trim()
    : " ";

  const directorIdCard = director?.id_card || " ";

  const filasProfesoresHtml = areasBase
    .map((area) => {
      const item =
        academicLoad.find(
          (acad) =>
            acad?.subject?.abbreviation?.toUpperCase() === area.code ||
            acad?.subject?.abbreviation?.toUpperCase() === area.key,
        ) || {};

      const teacher = item.teacher || {};

      // Formatea "APELLIDO, NOMBRE" de manera segura
      let nombreProfesor = "";
      if (teacher.last_name || teacher.name) {
        nombreProfesor = `${teacher.name || ""} ${teacher.last_name || ""}`
          .trim()
          .toUpperCase();
      } else if (teacher.nombre) {
        nombreProfesor = teacher.nombre.toUpperCase();
      }

      const cedula = teacher.document || "";

      return `
      <tr class="h-[18px] text-[12px]">
        <td class="font-bold border border-slate-700 w-[2%] text-center">${area.num}</td>
        <td class="font-bold border border-slate-700 text-center w-[3%]">${area.label}</td>
        <td class="text-left px-1 border border-slate-700 w-[28%] font-medium">${area.title}</td>
        <td class="text-left px-1 border border-slate-700 uppercase font-semibold">${nombreProfesor}</td>
        <td class="border border-slate-700 w-[12%] text-center">${cedula}</td>
        <td class="border border-slate-700 w-[15%]"></td>
      </tr>
    `;
    })
    .join("");

  return `<div class="w-full text-[15px] font-sans">
      
      <!-- BLOQUE SUPERIOR: SECCIÓN V Y SECCIÓN VI ALINEADAS -->
      <div class="flex w-full">
        
        <!-- SECCIÓN V: PROFESORES POR ÁREAS (IZQUIERDA - 72% ANCHO) -->
        <div class="w-[72%] border-l border-slate-700">
          <table class="w-full border-collapse">
            <thead>
              <tr class="font-bold text-[12px]">
                <th colspan="3" class="text-left px-1 py-0.5 border border-slate-700">V. Profesores por Áreas:</th>
                <th rowspan="2" class="p-0.5 border border-slate-700 w-[25%]">Apellidos y Nombres</th>
                <th rowspan="2" class="p-0.5 border border-slate-700 w-[12%]">Cédula de Identidad</th>
                <th rowspan="2" class="p-0.5 border border-slate-700 w-[15%]">Firma</th>
              </tr>
              <tr class="font-bold text-[12px]">
                <th class="p-0.5 border border-slate-700">N°</th>
                <th colspan="2" class="p-0.5 border border-slate-700">Áreas de Formación</th>
              </tr>
            </thead>
            <tbody>
              ${filasProfesoresHtml}
            </tbody>
          </table>
        </div>

        <!-- SECCIÓN VI: IDENTIFICACIÓN DEL CURSO (DERECHA - 28% ANCHO) -->
        <div class="w-[28%] border-r border-t border-b border-slate-700 flex flex-col justify-between text-center">
          <div>
            <div class="font-bold text-[10px] p-0.5 border-b border-slate-700 text-left px-1">
              VI. Identificación del Curso:
            </div>
            
            <div class="font-bold text-[10px] p-0.5 border-b border-slate-700 uppercase">PLAN DE ESTUDIO:</div>
            <div class="p-1 border-b border-slate-700 text-[8px] font-semibold">${sectionData.planEstudio || "EDUCACIÓN MEDIA GENERAL"}</div>

            <div class="font-bold text-[7.5px] p-0.5 border-b border-slate-700 uppercase">CÓDIGO:</div>
            <div class="p-1 border-b border-slate-700 font-mono text-[10px]">${sectionData.code || sectionData.codigo || "31059"}</div>

            <div class="font-bold text-[10px] p-0.5 border-b border-slate-700 uppercase">AÑO CURSADO</div>
            <div class="p-1 border-b border-slate-700 text-[10px] font-semibold uppercase">${sectionData.name || sectionData.anoCursado || "PRIMER"}</div>

            <div class="font-bold text-[10px] p-0.5 border-b border-slate-700 uppercase">SECCIÓN</div>
            <div class="p-0.5 border-slate-700 text-[10px] font-bold uppercase">${sectionData.nomenclature || sectionData.seccion || "A"}</div>
          </div>

          <!-- Total estudiantes -->
          <div class="grid grid-cols-2 text-[9px] font-bold border-t border-slate-700">
            <div class="p-0.5 border-r border-slate-700 leading-tight uppercase">
              N° DE ESTUDIANTES<br>POR SECCIÓN
            </div>
            <div class="p-0.5 leading-tight uppercase">
              N° DE ESTUDIANTES<br>EN ESTA PÁGINA
            </div>
          </div>
          <div class="grid grid-cols-2 text-[9px] font-bold border-t border-slate-700">
            <div class="p-0.5 border-r border-slate-700">${sectionData.students?.length ?? 35}</div>
            <div class="p-0.5">${sectionData.students?.length ?? 1}</div>
          </div>
        </div>

      </div>

      <!-- SECCIÓN VII: OBSERVACIONES -->
      <div class="w-full border-x border-b border-slate-700">
        <div class="font-bold uppercase text-[8.5px] p-0.5 border-b border-slate-700 px-1">
          VII. Observaciones:
        </div>
        <div class="h-8 p-1 text-[8px] uppercase italic text-slate-700">
          ${sectionData.observaciones || ""}
        </div>
      </div>

      <!-- BLOQUE INFERIOR: VIII. REMISIÓN, SELLOS Y IX. RECEPCIÓN -->
      <div class="grid grid-cols-12 w-full border-x border-b border-slate-700 text-center">
        
        <!-- VIII. Fecha de Remisión (Director/a) -->
        <div class="col-span-3 border-r border-slate-700 flex flex-col justify-between">
          <div class="font-bold uppercase text-[10px] p-0.5 border-b border-slate-700 text-left px-1">
            VIII. Fecha de Remisión:
          </div>
          <div class="p-0.5 border-b border-slate-700 font-bold text-[10px]">Director(a)</div>
          
          <div class="text-left px-1 py-0.5 text-[10px] border-b border-slate-300">Apellidos y Nombres:</div>
          <div class="p-0.5 font-bold uppercase text-[10px] border-b border-slate-700">
            ${directorFullName}
          </div>
          
          <div class="text-left px-1 py-0.5 text-[10px] border-b border-slate-300">Cédula de Identidad:</div>
          <div class="p-0.5 font-mono font-semibold text-[10px] border-b border-slate-700">
            ${directorIdCard}
          </div>
          
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
          <div class="font-bold uppercase text-[10px] p-0.5 border-b border-slate-700 text-left px-1">
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
            SELLO DEL CENTRO DE DESARROLLO DE<br> LA CALIDAD EDUCATIVA ESTADAL
          </span>
        </div>

      </div>

    </div>`;
};
