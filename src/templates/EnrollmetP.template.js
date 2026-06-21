/**
 ** Planilla de inscripción con Logo de la Escuela como Marca de Agua
 * @param {object} student - Información del estudiante
 * @param {object} school - Información del colegio donde se inscribe (debe incluir logoBase64)
 * @param {object} representative - Información del Representante del estudiante
 * @returns {string}
 */
export const enrollmentP = (student, school, representative, logoSchool) => {
  return `  
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
        <title>Planilla de Inscripción - SIGACE</title>
        
        <style>
            @page {
                size: letter;
                margin: 0;
            }
            @media print {
                body {
                    background-color: #ffffff;
                    color: #334155;
                }
                .print-exact {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
            }
            body {
                font-family: "Helvetica";
            }
        </style>
    
      <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    </head>
    <body class="bg-white text-[#334155] print-exact">
    
        <div class="relative bg-white pl-10 pr-10 pt-[15px] pb-5 overflow-hidden flex flex-col justify-between select-none">
            
            <div class="absolute top-0 left-0 right-0 h-[6px] bg-[#04C4D9] print-exact"></div>
    
            <div class="absolute inset-0 flex justify-center items-center pointer-events-none z-0 overflow-hidden">
                ${
                  logoSchool
                    ? `<img src="${logoSchool}" alt="Logo Escuela Marca de Agua" class="w-100 h-100 object-contain opacity-6" />`
                    : "sin Logo"
                }
            </div>
    
            <div class="relative z-10 flex flex-col justify-between h-full">
                
                <div>
                    <header class="flex justify-between items-center mb-[30px] mt-[10px]">
                        <div class="flex flex-col w-[65%]">
                            <span class="text-[12px] text-[#64748B] font-medium tracking-wide">República Bolivariana de Venezuela</span>
                            <span class="text-[12px] text-[#64748B] font-medium tracking-wide">Ministerio del Poder Popular para la Educación</span>
                            <h1 class="text-2xl font-bold text-[#0F172A] tracking-wider mt-[4px] uppercase">${school.name || "N/A"}</h1>
                            <div class="bg-[#F1F5F9] py-1 px-2 rounded mt-1 self-start text-[12px] text-[#64748B] font-semibold print-exact">
                                <span>SIGACE • Fecha: ${new Date().toLocaleDateString("es-VE")}</span>
                            </div>
                        </div>
    
                        <div class="w-[35%] text-right font-bold text-md">
                            <p class="text-[#1E293B]">PLANILLA DE</p>
                            <p class="text-cyan-600">INSCRIPCIÓN</p>
                            <p class="text-[#1E293B] mt-[2px]">${school.SIG || "SIG0000"}-${student.id_student || "0"}</p>
                        </div>
                    </header>

                    <section class="mb-10">
                        <div class="flex items-center justify-between border-b border-[#E2E8F0] pb-[5px] mb-[12px]">
                            <div class="flex items-center">
                                <div class="bg-[#1E293B] text-white w-[20px] h-[20px] rounded-full text-[10px] flex items-center justify-center mr-2 font-bold print-exact">1</div>
                                <h2 class="text-md font-bold text-[#1E293B] uppercase tracking-wide">Información del Estudiante</h2>
                            </div>
                            
                            <div class="bg-[#EFF6FF] border border-[#BFDBFE] rounded py-[3px] px-2 flex items-center print-exact">
                                <span class="text-[12px] font-bold text-[#2563EB] uppercase mr-1">Nº Matrícula:</span>
                                <span class="text-[12px] font-bold text-[#1D4ED8]">${student.tuition_number || "N/A"}</span>
                            </div>
                        </div>
    
                        <div class="flex -mx-1">
                            <div class="w-[55%] px-1 mb-[5px]">
                                <label class="text-[12px] font-bold text-[#94A3B8] block uppercase tracking-wide">Nombres y Apellidos</label>
                                <div class="text-[12px] text-[#1E293B] py-[6px] border-b border-[#CBD5E1] min-h-[20px] uppercase font-bold tracking-wide">${student.name || ""} ${student.last_name || ""}</div>
                            </div>
                            <div class="w-[25%] px-1 mb-[5px]">
                                <label class="text-[12px] font-bold text-[#94A3B8] block uppercase tracking-wide">Cédula de Identidad</label>
                                <div class="text-[12px] text-[#1E293B] py-[6px] border-b border-[#CBD5E1] min-h-[20px] font-bold">${student.document || "N/A"}</div>
                            </div>
                            <div class="w-[20%] px-1 mb-[5px]">
                                <label class="text-[12px] font-bold text-[#94A3B8] block uppercase tracking-wide">Sexo</label>
                                <div class="text-[12px] text-[#1E293B] py-[6px] border-b border-[#CBD5E1] min-h-[20px] uppercase font-semibold">${student.gender || "N/A"}</div>
                            </div>
                        </div>
    
                        <div class="flex -mx-1 mt-2">
                            <div class="w-[30%] px-1 mb-[5px]">
                                <label class="text-[12px] font-bold text-[#94A3B8] block uppercase tracking-wide">Fecha de Nacimiento</label>
                                <div class="text-[12px] text-[#1E293B] py-[6px] border-b border-[#CBD5E1] min-h-[20px] font-bold">
                                    ${student.birth_date ? new Date(student.birth_date).toLocaleDateString("es-VE") : "N/A"}
                                </div>
                            </div>
                            <div class="w-[45%] px-1 mb-[5px]">
                                <label class="text-[12px] font-bold text-[#94A3B8] block uppercase tracking-wide">Correo Electrónico</label>
                                <div class="text-[12px] text-[#1E293B] py-[6px] border-b border-[#CBD5E1] min-h-[20px] lowercase font-semibold">${student.email || "N/A"}</div>
                            </div>
                            <div class="w-[25%] px-1 mb-[5px]">
                                <label class="text-[12px] font-bold text-[#94A3B8] block uppercase tracking-wide">Número de Teléfono</label>
                                <div class="text-[12px] text-[#1E293B] py-[6px] border-b border-[#CBD5E1] min-h-[20px] font-bold">${student.phone || "N/A"}</div>
                            </div>
                        </div>
    
                        <div class="flex -mx-1 mt-2">
                            <div class="w-full px-1 mb-[5px]">
                                <label class="text-[12px] font-bold text-[#94A3B8] block uppercase tracking-wide">Condición</label>
                                <div class="text-[12px] text-[#1E293B] py-[6px] border-b border-[#CBD5E1] min-h-[20px] uppercase font-bold">${student.condition || "NUEVO INGRESO"}</div>
                            </div>
                            <div class="w-full px-1 mb-[5px]">
                                <label class="text-[12px] font-bold text-[#94A3B8] block uppercase tracking-wide">Año</label>
                                <div class="text-[12px] text-[#1E293B] py-[6px] border-b border-[#CBD5E1] min-h-[20px] uppercase font-bold">${student.year_name || "NUEVO INGRESO"}</div>
                            </div>
                            <div class="w-full px-1 mb-[5px]">
                                <label class="text-[12px] font-bold text-[#94A3B8] block uppercase tracking-wide">Sección</label>
                                <div class="text-[12px] text-[#1E293B] py-[6px] border-b border-[#CBD5E1] min-h-[20px] uppercase font-bold">${student.section_name || "NUEVO INGRESO"}</div>
                            </div>
                        </div>
                    </section>
    
                    <section class="mb-10">
                        <div class="flex items-center border-b border-[#E2E8F0] pb-[5px] mb-[12px]">
                            <div class="bg-[#1E293B] text-white w-[20px] h-[20px] rounded-full text-[10px] flex items-center justify-center mr-2 font-bold print-exact">2</div>
                            <h2 class="text-md font-bold text-[#1E293B] uppercase tracking-wide">Datos Médicos</h2>
                        </div>
    
                        <div class="flex -mx-1">
                            <div class="w-[40%] px-1 mb-[5px]">
                                <label class="text-[12px] font-bold text-[#94A3B8] block uppercase tracking-wide">Alergias</label>
                                <div class="text-[12px] text-[#1E293B] py-[6px] border-b border-[#CBD5E1] min-h-[20px] uppercase font-semibold ${!student.allergies ? "italic text-slate-400 font-normal" : ""}">
                                    ${student.allergies || "Ninguna"}
                                </div>
                            </div>
                            <div class="w-[35%] px-1 mb-[5px]">
                                <label class="text-[12px] font-bold text-[#94A3B8] block uppercase tracking-wide">Peso y Altura</label>
                                <div class="text-[12px] text-[#1E293B] py-[6px] border-b border-[#CBD5E1] min-h-[20px] font-bold">
                                    ${student.weight ? student.weight + " kg" : "N/A kg"} / ${student.height ? student.height + " cm" : "N/A cm"}
                                </div>
                            </div>
                            <div class="w-[25%] px-1 mb-[5px]">
                                <label class="text-[12px] font-bold text-[#94A3B8] block uppercase tracking-wide">Talla de camisa</label>
                                <div class="text-[12px] text-[#1E293B] py-[6px] border-b border-[#CBD5E1] min-h-[20px] uppercase font-bold">${student.shirt_size || "N/A"}</div>
                            </div>
                        </div>
    
                        <div class="flex -mx-1 mt-2">
                            <div class="w-[25%] px-1 mb-[5px]">
                                <label class="text-[12px] font-bold text-[#94A3B8] block uppercase tracking-wide">Talla de pantalón</label>
                                <div class="text-[12px] text-[#1E293B] py-[6px] border-b border-[#CBD5E1] min-h-[20px] uppercase font-bold">${student.pants_size || "N/A"}</div>
                            </div>
                            <div class="w-[25%] px-1 mb-[5px]">
                                <label class="text-[12px] font-bold text-[#94A3B8] block uppercase tracking-wide">Talla de zapatos</label>
                                <div class="text-[12px] text-[#1E293B] py-[6px] border-b border-[#CBD5E1] min-h-[20px] uppercase font-bold">${student.shoe_size || "N/A"}</div>
                            </div>
                            <div class="w-[50%] px-1 mb-[5px]">
                                <label class="text-[12px] font-bold text-[#94A3B8] block uppercase tracking-wide">Enfermedad o Condición Médica</label>
                                <div class="text-[12px] text-[#1E293B] py-[6px] border-b border-[#CBD5E1] min-h-[20px] uppercase font-semibold ${!student.medical_condition ? "italic text-slate-400 font-normal" : ""}">
                                    ${student.medical_condition || "Ninguna"}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section class="mb-[15px]">
                        <div class="flex items-center border-b border-[#E2E8F0] pb-[5px] mb-[12px]">
                            <div class="bg-[#1E293B] text-white w-[20px] h-[20px] rounded-full text-[10px] flex items-center justify-center mr-2 font-bold print-exact">3</div>
                            <h2 class="text-md font-bold text-[#1E293B] uppercase tracking-wide">Representante Legal</h2>
                        </div>
    
                        <div class="flex -mx-1">
                            <div class="w-[50%] px-1 mb-[5px]">
                                <label class="text-[12px] font-bold text-[#94A3B8] block uppercase tracking-wide">Nombre del Representante</label>
                                <div class="text-[12px] text-[#1E293B] py-[6px] border-b border-[#CBD5E1] min-h-[20px] uppercase font-bold tracking-wide">
                                    ${representative.name || ""} ${representative.last_name || ""}
                                </div>
                            </div>
                            <div class="w-[25%] px-1 mb-[5px]">
                                <label class="text-[12px] font-bold text-[#94A3B8] block uppercase tracking-wide">Cédula de Identidad</label>
                                <div class="text-[12px] text-[#1E293B] py-[6px] border-b border-[#CBD5E1] min-h-[20px] font-bold">${representative.document || "N/A"}</div>
                            </div>
                            <div class="w-[25%] px-1 mb-[5px]">
                                <label class="text-[12px] font-bold text-[#94A3B8] block uppercase tracking-wide">Parentesco</label>
                                <div class="text-[12px] text-[#1E293B] py-[6px] border-b border-[#CBD5E1] min-h-[20px] uppercase font-bold">${representative.relationship || "N/A"}</div>
                            </div>
                        </div>
    
                        <div class="flex -mx-1 mt-2">
                            <div class="w-[30%] px-1 mb-[5px]">
                                <label class="text-[12px] font-bold text-[#94A3B8] block uppercase tracking-wide">Teléfono</label>
                                <div class="text-[12px] text-[#1E293B] py-[6px] border-b border-[#CBD5E1] min-h-[20px] font-bold">${representative.phone || "N/A"}</div>
                            </div>
                            <div class="w-[70%] px-1 mb-[5px]">
                                <label class="text-[12px] font-bold text-[#94A3B8] block uppercase tracking-wide">Correo Electrónico</label>
                                <div class="text-[12px] text-[#1E293B] py-[6px] border-b border-[#CBD5E1] min-h-[20px] lowercase font-semibold ${!representative.repEmail ? "text-slate-400 italic font-normal" : ""}">
                                    ${representative.repEmail || "N/A"}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
    
                <div class="mt-20">
                    <div class="flex justify-between pt-[55px]">
                        <div class="w-[30%] border-t border-[#CBD5E1] text-center pt-[6px]">
                            <p class="text-[11px] font-bold text-[#1E293B] uppercase tracking-wide">Estudiante</p>
                            <p class="text-[11px] text-[#64748B] leading-tight uppercase font-bold tracking-wide">${student.name || ""} ${student.last_name || ""}</p>
                            <p class="text-[11px] text-[#64748B] leading-tight">${student.document || ""}</p>
                        </div>
    
                        <div class="w-[30%] border-t border-[#CBD5E1] text-center pt-[6px]">
                            <p class="text-[11px] font-bold text-[#1E293B] uppercase tracking-wide">Representante Legal</p>
                            <p class="text-[11px] text-[#64748B] leading-tight uppercase font-bold tracking-wide">${representative.name || ""} ${representative.last_name || ""}</p>
                            <p class="text-[11px] text-[#64748B] leading-tight">${representative.document || ""}</p>
                        </div>
    
                        <div class="w-[30%] border-t border-[#CBD5E1] text-center pt-[6px]">
                            <p class="text-[11px] font-bold text-[#1E293B] uppercase tracking-wide">Control de Estudios</p>
                            <p class="text-[11px] text-[#64748B] leading-tight uppercase font-black text-slate-400 tracking-wider">FIRMA Y SELLO</p>
                            <p class="text-[11px] text-[#64748B] leading-tight text-slate-400 uppercase font-medium tracking-wide">RECEPTOR AUTORIZADO</p>
                        </div>
                    </div>
    
                    <footer class="text-center text-[9px] text-[#94A3B8] mt-[30px] pb-[5px] font-medium">
                        Documento generado digitalmente por el Sistema de Gestión Académica SIGACE.
                    </footer>
                </div>
            </div>
        </div>
    </body>
    </html>`;
};
