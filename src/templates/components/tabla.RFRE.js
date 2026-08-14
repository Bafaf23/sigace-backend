/**
 * Componente Tabla Rendimiento Estudiantil (Formato Exacto MPPE - Hoja EMG)
 * @param {Array} students - Arreglo con datos de los estudiantes
 * @param {Object} statsPorMateria - Objeto con totales por asignatura
 * @param {Array} materias - Lista de asignaturas del plan de estudio (por defecto 1° a 3° año: CA, ILE, MA, EF, AP, CN, GHC, OC, PG)
 * @param {number} totalFilas - Total de filas obligatorias (35)
 */

export const TablaRendimiento = (
  students = [],
  statsPorMateria = {},
  materias = [
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
  ],
  totalFilas = 35,
) => {
  const columnasMaterias = [...materias.map((m) => m.key), "GRUPO"];

  // 1. Generación de las 35 filas exactas
  const filasHtml = Array.from({ length: totalFilas })
    .map((_, index) => {
      const s = students[index];
      const num = index + 1;

      // Fila vacía inhabilitada con asteriscos (*)
      if (!s) {
        return `
        <tr class="h-[17px] text-[8px] text-slate-600">
          <td class="font-bold text-slate-900">${num}</td>
          <td>*</td>
          <td>*</td>
          <td>*</td>
          <td>*</td>
          <td>*</td>
          <td>*</td>
          <td>*</td>
          <td>*</td>
          <td>*</td>
          ${columnasMaterias.map(() => `<td>*</td>`).join("")}
        </tr>
      `;
      }

      // Fila con datos del estudiante
      return `
      <tr class="h-[17px] text-[8px]">
        <td class="font-bold">${num}</td>
        <td class="font-mono text-[7.5px]">${s.cedula || "*"}</td>
        <td class="text-left px-1 uppercase truncate max-w-[120px]">${s.apellidos || "*"}</td>
        <td class="text-left px-1 uppercase truncate max-w-[120px]">${s.nombres || "*"}</td>
        <td class="text-left px-1 uppercase truncate max-w-[90px]">${s.lugarNacimiento || "*"}</td>
        <td class="uppercase">${s.efNacimiento || "*"}</td>
        <td class="uppercase">${s.sexo || "*"}</td>
        <td>${s.diaNac || "*"}</td>
        <td>${s.mesNac || "*"}</td>
        <td>${s.anoNac || "*"}</td>
        ${materias.map((m) => `<td>${s.notas?.[m.key] ?? "*"}</td>`).join("")}
        <td class="uppercase">${s.grupo || "*"}</td>
      </tr>
    `;
    })
    .join("");

  // Helper para filas de estadísticas del footer
  const renderFilaStat = (etiqueta, keyStat) => `
  <tr class="h-[18px] text-[8px]">
    <td colspan="5" class="font-bold text-left px-2 bg-slate-50 border-r border-slate-700">${etiqueta}</td>
    ${columnasMaterias
      .map(
        (k) => `
      <td class="font-semibold">${statsPorMateria[k]?.[keyStat] ?? (k === "GRUPO" ? "" : "0")}</td>
    `,
      )
      .join("")}
  </tr>
`;

  const filasResumen = [
    {
      label: "Inscritos",
      key: "inscritos",
      defaultVal: (k) => (k === "GRUPO" ? "" : students.length),
    },
    { label: "Inasistentes", key: "inasistentes", defaultVal: () => "0" },
    { label: "Aprobados", key: "aprobados", defaultVal: () => "0" },
    { label: "No Aprobados", key: "noAprobados", defaultVal: () => "0" },
    { label: "No Cursantes", key: "noCursantes", defaultVal: () => "0" },
  ];

  //renderiza el footer de la tabla para los datos de inscritos etc
  const tfootHtml = filasResumen
    .map(
      (stat, idx) => `
  <tr class="h-[18px] text-[8px]">
    <!-- La celda general solo se renderiza una vez en la primera fila (Inscritos) con rowspan=5 -->
    ${
      idx === 0
        ? `
      <td rowspan="5" colspan="5" class="font-bold text-center text-[10px] uppercase p-2 border-r border-slate-700 bg-slate-50">
        Total de Áreas de Formación
      </td>
    `
        : ""
    }

    <!-- Etiqueta de la métrica (Ocupa Cols: EF, SEXO, DÍA, MES, AÑO) -->
    <td colspan="5" class="font-bold text-left px-2 bg-slate-50 border-r border-slate-700">${stat.label}</td>

    <!-- Valores para cada asignatura y la columna GRUPO -->
    ${columnasMaterias
      .map(
        (k) => `
      <td class="font-semibold">
        ${statsPorMateria[k]?.[stat.key] ?? stat.defaultVal(k)}
      </td>
    `,
      )
      .join("")}
  </tr>
`,
    )
    .join("");

  return `<table class="w-full text-center border-collapse border border-slate-700 text-[8px]">
      <thead>
        <!-- Títulos Superiores de Sección -->
        <tr class=" font-bold text-[8.5px]">
          <th colspan="10" class="text-left px-2 py-0.5 border-r border-slate-700">III. Identificación del Estudiante:</th>
          <th colspan="${columnasMaterias.length}" class="text-left px-2 py-0.5">IV. Resumen Final del Rendimiento:</th>
        </tr>

        <!-- Encabezados de Columna -->
        <tr class=" font-bold text-[10px]">
          <th rowspan="4" class="w-[2.5%] p-0.5">N°</th>
          <th rowspan="4" class="w-[9%] p-0.5">Cédula de<br>Identidad</th>
          <th rowspan="4" class="w-[13%] p-0.5">Apellidos</th>
          <th rowspan="4" class="w-[13%] p-0.5">Nombres</th>
          <th rowspan="4" class="w-[11%] p-0.5">Lugar de<br>Nacimiento</th>
          <th rowspan="4" class="w-[2.5%] p-0.5">EF</th>
          <th rowspan="4" class="w-[2%] p-0.5 text-[7px] [writing-mode:vertical-lr] rotate-180 mx-auto">SEXO</th>
          <th colspan="3" rowspan="2" class="p-0.5">FECHA DE<br>NACIMIENTO</th>
          <th colspan="${columnasMaterias.length - 1}" class="p-0.5 tracking-wider">ÁREAS DE FORMACIÓN</th>
          <th rowspan="3" class="w-[7%] p-0.5 text-[6px] leading-tight uppercase">
            PARTICIPACIÓN EN<br>GRUPOS DE<br>CREACIÓN,<br>RECREACIÓN Y<br>PRODUCCIÓN
          </th>
        </tr>

        <!-- ÁREA COMÚN -->
        <tr class=" font-bold text-[10px]">
          <th colspan="${columnasMaterias.length - 1}" class="p-0.5 uppercase">ÁREA COMÚN</th>
        </tr>

        <!-- Números de Materias (1, 2, 3...) -->
        <tr class="font-bold text-[7px]">
          <th rowspan="2" class="w-[2%] p-0.5 [writing-mode:vertical-lr] rotate-180">DÍA</th>
          <th rowspan="2" class="w-[2%] p-0.5 [writing-mode:vertical-lr] rotate-180">MES</th>
          <th rowspan="2" class="w-[2.5%] p-0.5 [writing-mode:vertical-lr] rotate-180">AÑO</th>
          ${materias.map((m) => `<th class="p-0.5">${m.num}</th>`).join("")}
        </tr>

        <!-- Acrónimos de Materias (CA, ILE, MA...) y Columna GRUPO -->
        <tr class="font-bold text-[7.5px]">
          ${materias.map((m) => `<th class="w-[3.5%]" title="${m.title}">${m.label}</th>`).join("")}
          <th class="p-0.5 text-[7px]">GRUPO</th>
        </tr>
      </thead>

      <!-- Cuerpo de la Tabla -->
      <tbody>
        ${filasHtml}
        ${tfootHtml}
      </tbody>

    </table>`;
};
