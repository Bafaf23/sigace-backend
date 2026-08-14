/**
 * Componente Encabezado para la planilla del MPPE
 * @param {Object} dataSchool
 * @returns {string} HTML String
 */
export const Header = (dataSchool = {}) => {
  return ` <header class="mb-2 flex w-full flex-col items-start justify-between pb-2">
  <div class="mb-2 flex w-full justify-between">
    <div class="w-1/2">
      <img src="https://www.mppe.gob.ve/static/mppeweb/images/MPPEducacion.png" alt="Ministerio del Poder Popular para la Educación" class="max-w-full object-cover" />
    </div>

    <div class="text-center">
      <div>
        <h1 class="text-[12px] font-bold uppercase underline">Resumen Final del rendimiento estudiantil</h1>
        <p class="text-xs font-bold">Código del Formato: EMG</p>
      </div>
      <p class="mt-2 text-left text-[11px]"><span class="font-bold">I. Año Escolar:</span> ${dataSchool.period || "2025-2026"}</p>
      <div class="flex gap-2 text-[11px]">
        <p class="text-left"><span class="font-bold">Tipo de Evaluación:</span> ${dataSchool.eval_type || "FINAL"}</p>
        <p class="text-left"><span class="font-bold">Mes y Año:</span> ${new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" })}</p>
      </div>
    </div>
  </div>

  <div class="w-full space-y-0.5 text-[11px]">
    <h2 class="mb-1 pb-0.5 text-[12px] font-bold">II. Datos de la Institución Educativa:</h2>

    <div class="flex gap-4">
      <p><span class="font-bold">Código de la Institución Educativa:</span> ${dataSchool.DEA || "N/A"}</p>
      <p><span class="font-bold">Denominación y Epónimo:</span> ${dataSchool.school_name || "U.E.N COLEGIO"}</p>
    </div>

    <div class="flex gap-4">
      <p><span class="font-bold">Dirección:</span> ${dataSchool.adress || "N/A"}</p>
      <p><span class="font-bold">Teléfono:</span> ${dataSchool.phone || "N/A"}</p>
    </div>

    <div class="flex gap-4">
      <p><span class="font-bold">Municipio:</span> ${dataSchool.municipio || "Libertador"}</p>
      <p><span class="font-bold">Entidad Federal:</span> ${dataSchool.entidad_federal || "Distrito Capital"}</p>
      <p><span class="font-bold">CDCEE:</span> ${dataSchool.cdcee || "N/A"}</p>
    </div>

    <div class="flex gap-4">
      <p><span class="font-bold">Director(a):</span> ${dataSchool.director?.name || "N/A"}</p>
      <p><span class="font-bold">Cédula de Identidad:</span> ${dataSchool.director?.dni || "N/A"}</p>
    </div>
  </div>
</header>`;
};
