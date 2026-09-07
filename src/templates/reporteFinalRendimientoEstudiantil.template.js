import { Header } from "./components/header.RFRE.js";
import { TablaRendimiento } from "./components/tabla.RFRE.js";
import { footerRFRE } from "./components/footerRFER.js";

/**
 ** Planilla del MPPE Resumen Final de Rendimineto Estudiantil en formato EMG-31059
 * @param {object} school - Informacion de la escuela
 */
export const reporteFinalRendimientoEstudiantil = ({
  section,
  loadAcademic,
  school,
  grades,
}) => {
  return `
  <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sábana de Rendimiento Estudiantil - MPPE</title>
      
      <!-- Carga de Tailwind CSS -->
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        /* 1. Forzar colapso de bordes */
        table {
                border-collapse: collapse !important;
                width: 100%;
              }

        /* 2. Aplicar borde visible a absolutamente TODAS las celdas e incrustar el fondo */
        table th, 
        table td {
              border: 1px solid #334155 !important; /* #334155 equivale a slate-700 */
              background-clip: padding-box !important; /* Evita que el bg-color tape el borde */
              }

        /* 3. Asegurar bordes exteriores gruesos para las secciones principales */
        .border-collapse-custom {
          border: 1.5px solid #000000 !important;
        }
      </style>
    </head>
    <body class="bg-white text-slate-900 p-0 m-0">
      ${Header(school)}  
      ${TablaRendimiento({ section: section, loadAcademic: loadAcademic, grades: grades })}
      ${footerRFRE(loadAcademic, section, school)}
    </body>
      `;
};
