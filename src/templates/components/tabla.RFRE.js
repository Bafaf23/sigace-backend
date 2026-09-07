/**
 * Componente Tabla Rendimiento Estudiantil (Formato Exacto MPPE - Hoja EMG)
 * @param {Object} section - Objeto con datos de la sección y sus estudiantes
 * @param {Array} loadAcademic - Lista agrupada con la carga académica y materias
 * @param {Array} grades - Estructura de notas recibida del backend: [ { V30123456: { MAT: 15 } } ]
 */
export const TablaRendimiento = ({
  section = {},
  loadAcademic = [],
  grades = [],
}) => {
  const academicLoadList = loadAcademic?.[0]?.academicLoad || [];

  const columnasMaterias = [
    ...academicLoadList.map((m) => m.subject.abbreviation),
    "GRUPO",
  ];

  const studentsList = section?.students || [];

  // 1. Extraer el objeto mapa de notas principal
  const gradesLookup = Array.isArray(grades) && grades[0] ? grades[0] : {};

  // Helper local para extraer la cédula normalizada (ej: "V30123456")
  const getStudentCard = (s) => {
    const rawCard = String(s?.id_card || s?.user?.id_card || "").trim();
    if (!rawCard) return "";
    return rawCard.startsWith("V") || rawCard.startsWith("E")
      ? rawCard
      : `V${rawCard}`;
  };

  // 2. Generación de las filas de los estudiantes
  const filasHtml = Array.from({ length: studentsList.length })
    .map((_, index) => {
      const s = studentsList[index];
      const num = index + 1;

      // Fila vacía inhabilitada con asteriscos (*)
      if (!s) {
        return `
        <tr class="h-[17px] text-slate-600 border-b border-slate-300 text-center text-[10px]">
          <td class="font-bold text-slate-900 border-r border-slate-300">${num}</td>
          <td class="border-r border-slate-300">*</td>
          <td class="border-r border-slate-300">*</td>
          <td class="border-r border-slate-300">*</td>
          <td class="border-r border-slate-300">*</td>
          <td class="border-r border-slate-300">*</td>
          <td class="border-r border-slate-300">*</td>
          <td class="border-r border-slate-300">*</td>
          <td class="border-r border-slate-300">*</td>
          <td class="border-r border-slate-300">*</td>
          ${columnasMaterias.map(() => `<td class="border-r border-slate-300">*</td>`).join("")}
        </tr>
      `;
      }

      // Descomposición segura de la fecha de nacimiento (DD/MM/AAAA)
      const birthDate = s?.birth_date ? new Date(s.birth_date) : null;

      const day = birthDate
        ? String(birthDate.getUTCDate()).padStart(2, "0")
        : "*";
      const month = birthDate
        ? String(birthDate.getUTCMonth() + 1).padStart(2, "0")
        : "*";
      const year = birthDate ? birthDate.getUTCFullYear() : "*";

      const studentCard = getStudentCard(s);

      // Generación de celdas de materias
      const celdasMaterias = academicLoadList
        .map((m) => {
          const subjectKey = m.subject?.abbreviation || m.subject?.code_subject;

          // Búsqueda directa en el objeto: gradesLookup["V30123456"]["MAT"]
          const rawNota =
            gradesLookup[studentCard]?.[subjectKey] ??
            s?.grades?.[m.id_load_academic];

          let displayNota = "*";
          if (rawNota !== undefined && rawNota !== null && rawNota !== "") {
            const numNota = Number(rawNota);
            displayNota = isNaN(numNota) ? rawNota : Math.round(numNota);
          }

          return `<td class="border-r border-slate-300">${displayNota}</td>`;
        })
        .join("");

      return `
      <tr class="h-[17px] text-[10.5px] font-medium text-center border-b border-slate-300 uppercase">
        <td class="font-bold text-slate-950 border-r border-slate-300">${num}</td>
        <td class="whitespace-nowrap border-r border-slate-300">${s?.id_card || s?.user?.id_card || "*"}</td>
        <td class="text-left px-1 border-r border-slate-300">${s?.last_name || s?.user?.last_name || "*"}</td>
        <td class="text-left px-1 border-r border-slate-300">${s?.name || s?.user?.name || "*"}</td>
        <td class="text-left px-1 border-r border-slate-300">${s?.birth_place || "*"}</td>
        <td class="border-r border-slate-300">${s?.ef || "*"}</td>
        <td class="border-r border-slate-300">${s?.gender || s?.user?.gender || "*"}</td>
        <td class="border-r border-slate-300">${day}</td>
        <td class="border-r border-slate-300">${month}</td>
        <td class="border-r border-slate-300">${year}</td>
        ${celdasMaterias}
        <td class="border-r border-slate-300">${s?.grupo || "*"}</td>
      </tr>
    `;
    })
    .join("");

  // 3. Helper para obtener conteos resumidos por columna de materia
  const getMetricCount = (abbreviation, key) => {
    // Si viene precalculado en loadAcademi
    if (loadAcademic?.[0]?.[key]?.[abbreviation] !== undefined) {
      return loadAcademic[0][key][abbreviation];
    }

    if (abbreviation === "GRUPO") return "";

    let aprobados = 0;
    let noAprobados = 0;
    let inasistentes = 0;

    studentsList.forEach((st) => {
      const studentCard = getStudentCard(st);
      const rawNota = gradesLookup[studentCard]?.[abbreviation];

      if (rawNota === undefined || rawNota === null || rawNota === "*") {
        inasistentes++;
      } else {
        const val = Number(rawNota);
        if (!isNaN(val)) {
          if (val >= 10) aprobados++;
          else noAprobados++;
        }
      }
    });

    switch (key) {
      case "inscritos":
        return studentsList.length;
      case "aprobados":
        return aprobados;
      case "noAprobados":
        return noAprobados;
      case "inasistentes":
        return inasistentes;
      default:
        return "0";
    }
  };

  // 4. Filas de métricas para el footer
  const filasResumen = [
    { label: "Inscritos", key: "inscritos" },
    { label: "Inasistentes", key: "inasistentes" },
    { label: "Aprobados", key: "aprobados" },
    { label: "No Aprobados", key: "noAprobados" },
    { label: "No Cursantes", key: "noCursantes" },
  ];

  const tfootHtml = filasResumen
    .map(
      (stat, idx) => `
    <tr class="h-[18px] text-[8.5px] text-center border-t border-slate-700 uppercase">
      ${
        idx === 0
          ? `
        <td rowspan="5" colspan="5" class="font-bold text-center text-[10px] uppercase p-2 border-r border-slate-700">
          Total de Áreas de Formación
        </td>
      `
          : ""
      }
      <td colspan="5" class="font-bold text-left px-2 border-r border-slate-700">${stat.label}</td>

      ${columnasMaterias
        .map(
          (k) => `
        <td class="font-semibold border-r border-slate-700">
          ${getMetricCount(k, stat.key)}
        </td>
      `,
        )
        .join("")}
    </tr>
  `,
    )
    .join("");

  return `<table class="w-full text-center border-collapse border border-slate-700 font-sans">
      <thead>
        <!-- Títulos Superiores de Sección -->
        <tr class="font-bold text-[11px] border-b border-slate-700 uppercase">
          <th colspan="10" class="text-left px-2 py-0.5 border-r border-slate-700">III. Identificación del Estudiante:</th>
          <th colspan="${columnasMaterias.length}" class="text-left px-2 py-0.5">IV. Resumen Final del Rendimiento:</th>
        </tr>

        <!-- Encabezados de Columna -->
        <tr class="font-bold text-[10px] border-b border-slate-700 uppercase">
          <th rowspan="4" class="w-[2.5%] p-0.5 border-r border-slate-700">N°</th>
          <th rowspan="4" class="w-[9%] p-0.5 border-r border-slate-700">Cédula de<br>Identidad</th>
          <th rowspan="4" class="w-[13%] p-0.5 border-r border-slate-700">Apellidos</th>
          <th rowspan="4" class="w-[13%] p-0.5 border-r border-slate-700">Nombres</th>
          <th rowspan="4" class="w-[11%] p-0.5 border-r border-slate-700">Lugar de<br>Nacimiento</th>
          <th rowspan="4" class="w-[2.5%] p-0.5 border-r border-slate-700">EF</th>
          <th rowspan="4" class="w-[2%] p-0.5 text-[7px] [writing-mode:vertical-lr] rotate-180 border-r border-slate-700">SEXO</th>
          <th colspan="3" rowspan="2" class="p-0.5 border-r border-slate-700">FECHA DE<br>NACIMIENTO</th>
          <th colspan="${academicLoadList.length}" class="p-0.5 tracking-wider border-b border-r border-slate-700">ÁREAS DE FORMACIÓN</th>
          <th rowspan="3" class="w-[7%] p-0.5 text-[6px] leading-tight border-r border-slate-700">
            PARTICIPACIÓN EN<br>GRUPOS DE<br>CREACIÓN,<br>RECREACIÓN Y<br>PRODUCCIÓN
          </th>
        </tr>

        <!-- ÁREA COMÚN -->
        <tr class="font-bold text-[10px] border-b border-slate-700 uppercase">
          <th colspan="${academicLoadList.length}" class="p-0.5 border-r border-slate-700">ÁREA COMÚN</th>
        </tr>

        <!-- Números de Materias (1, 2, 3...) -->
        <tr class="font-bold text-[10px] border-b border-slate-700 uppercase">
          <th rowspan="2" class="w-[2%] p-0.5 [writing-mode:vertical-lr] rotate-180 border-r border-slate-700">DÍA</th>
          <th rowspan="2" class="w-[2%] p-0.5 [writing-mode:vertical-lr] rotate-180 border-r border-slate-700">MES</th>
          <th rowspan="2" class="w-[2.5%] p-0.5 [writing-mode:vertical-lr] rotate-180 border-r border-slate-700">AÑO</th>
          ${academicLoadList.map((_, i) => `<th class="p-0.5 border-r border-slate-700">${i + 1}</th>`).join("")}
        </tr>

        <!-- Acrónimos de Materias (CA, ILE, MA...) y Columna GRUPO -->
        <tr class="font-bold text-[10px] border-b border-slate-700 uppercase">
          ${academicLoadList
            .map(
              (m) =>
                `<th class="w-[3.5%] p-0.5 border-r border-slate-700" title="${m.subject?.name}">${m.subject?.abbreviation}</th>`,
            )
            .join("")}
          <th class="p-0.5 text-[7px] border-r border-slate-700">GRUPO</th>
        </tr>
      </thead>

      <!-- Cuerpo de la Tabla -->
      <tbody>
        ${filasHtml}
      </tbody>

      <!-- Pie de Tabla (Estadísticas) -->
      <tfoot>
        ${tfootHtml}
      </tfoot>
    </table>`;
};
