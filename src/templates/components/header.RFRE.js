/**
 * Componente Encabezado para la planilla del MPPE (Formato EMG)
 * @param {Object} school - Datos del plantel institucional
 * @returns {string} HTML String
 */
export const Header = (school = {}) => {
  const director = school?.usersByRole?.director?.[0];
  const directorFullName = director
    ? `${director.name || ""} ${director.last_name || ""}`.trim()
    : "N/A";
  const directorIdCard = director?.id_card || "N/A";

  // Formato de fecha del reporte
  const currentDate = new Date().toLocaleDateString("es-VE", {
    month: "long",
    year: "numeric",
  });

  return ` 
  <header class="mb-3 w-full font-sans leading-snug">
    <!-- Encabezado Superior: Logo y Título -->
    <div class="mb-3 flex w-full justify-between items-start">
      <div class="w-5/12">
        <img 
          src="https://www.mppe.gob.ve/static/mppeweb/images/MPPEducacion.png" 
          alt="Ministerio del Poder Popular para la Educación" 
          class="max-w-[250px] h-auto object-contain" 
        />
      </div>

      <div class="w-7/12 flex flex-col justify-end">
        <h1 class="text-[13px] text-center font-bold uppercase underline tracking-tight text-slate-950">Resumen Final del rendimiento estudiantil</h1>
        <p class="text-[11px]  text-center font-semibold text-slate-600">Código del Formato: <span class="font-bold text-slate-950">EMG</span></p>
        
        <div class="mt-2 flex gap-4 text-[12px]">
          <p><span class="font-medium text-slate-600">I. Año Escolar:</span> <span class="font-bold text-slate-950">${school?.period || "2025-2026"}</span></p>
          <p><span class="font-medium text-slate-600">Tipo de Evaluación:</span> <span class="font-bold text-slate-950">${school?.eval_type || "FINAL"}</span></p>
          <p><span class="font-medium text-slate-600">Mes y Año:</span> <span class="font-bold uppercase text-slate-950">${currentDate}</span></p>
        </div>
      </div>
    </div>

    <!-- Sección II: Datos de la Institución Educativa -->
    <div class="w-full space-y-1.5 text-[11px]">
      <h2 class="font-bold text-[12px] uppercase tracking-wide text-slate-950 pb-0.5 mb-1.5">
        II. Datos de la Institución Educativa:
      </h2>

      <!-- Fila 1: Código DEA y Denominación -->
      <div class="grid grid-cols-12 gap-x-3">
        <p class="col-span-4 truncate"><span class="font-medium text-slate-600">Código de la I.E.:</span> <span class="font-bold uppercase text-slate-950">${school?.code_DEA || "N/A"}</span></p>
        <p class="col-span-8 truncate"><span class="font-medium text-slate-600">Denominación y Epónimo:</span> <span class="font-bold uppercase text-slate-950">${school?.name || "U.E.N COLEGIO"}</span></p>
      </div>

      <!-- Fila 2: Dirección (Sin truncate y en Mayúsculas), Teléfono, Municipio y Estado -->
      <div class="grid grid-cols-12 gap-x-3">
        <p class="col-span-5"><span class="font-medium text-slate-600">Dirección:</span> <span class="font-bold uppercase text-slate-950">${school?.address || "N/A"}</span></p>
        <p class="col-span-2 truncate"><span class="font-medium text-slate-600">Teléfono:</span> <span class="font-bold uppercase text-slate-950">${school?.phone || "N/A"}</span></p>
        <p class="col-span-2 truncate"><span class="font-medium text-slate-600">Municipio:</span> <span class="font-bold uppercase text-slate-950">${school?.municipality || "LIBERTADOR"}</span></p>
        <p class="col-span-3 truncate"><span class="font-medium text-slate-600">Entidad Federal:</span> <span class="font-bold uppercase text-slate-950">${school?.state || "DISTRITO CAPITAL"}</span></p>
      </div>

      <!-- Fila 3: CDCEE, Director y Cédula -->
      <div class="grid grid-cols-12 gap-x-3">
        <p class="col-span-4 truncate"><span class="font-medium text-slate-600">CDCEE:</span> <span class="font-bold uppercase text-slate-950">${school?.cdcee?.name || "N/A"}</span></p>
        <p class="col-span-5 truncate"><span class="font-medium text-slate-600">Director(a):</span> <span class="font-bold uppercase text-slate-950">${directorFullName}</span></p>
        <p class="col-span-3 truncate"><span class="font-medium text-slate-600">C.I.:</span> <span class="font-bold uppercase text-slate-950">${directorIdCard}</span></p>
      </div>
    </div>
  </header>`;
};
