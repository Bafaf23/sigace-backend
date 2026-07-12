import fs from "fs/promises"; // Cambiado a promesas asíncronas
import path from "path";
import juice from "juice";
import { Resend } from "resend";

export const welcomeEmail = async (userName, userEmail) => {
  try {
    console.log("📬 [Servicio Correo]: Iniciando validaciones...");

    if (!process.env.RESEND_API_KEY) {
      throw new Error(
        "La variable de entorno RESEND_API_KEY no está definida.",
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const templatePath = path.join(
      process.cwd(),
      "src/templates/welcomeEmail.html",
    );

    const cleanToField = Array.isArray(userEmail)
      ? userEmail[0]?.trim()
      : String(userEmail || "").trim();

    if (!cleanToField) {
      throw new Error("El destinatario (userEmail) está vacío o es inválido.");
    }

    console.log(
      "📬 [Servicio Correo]: Leyendo plantilla HTML de forma asíncrona...",
    );
    // Usamos await fs.readFile para no bloquear el hilo de Node.js
    let htmlContent = await fs.readFile(templatePath, "utf8");

    console.log("📬 [Servicio Correo]: Reemplazando variables del template...");
    htmlContent = htmlContent
      .replace(/{{userName}}/g, userName)
      .replace(/{{userEmail}}/g, userEmail);

    console.log(
      "📬 [Servicio Correo]: Aplicando Juice para estilos en línea...",
    );
    // ¡OJO! Si se congela aquí, remueve la etiqueta <script> de Tailwind de tu HTML
    const htmlWithInlineStyles = juice(htmlContent);

    console.log(
      "📬 [Servicio Correo]: Conectando con la API de Resend para el envío...",
    );
    const response = await resend.emails.send({
      from: "SIGACE <no-replay@sigace.xyz>",
      to: cleanToField,
      subject: "¡Bienvenido a bordo!",
      html: htmlWithInlineStyles,
    });
    const emailId = response?.data?.id || response?.id || "ID_DESCONOCIDO";

    if (response?.error) {
      throw new Error(`Resend API Error: ${response.error.message}`);
    }

    console.log("✅ [Servicio Correo]: Correo enviado con éxito. ID:", emailId);
    return { success: true, id: emailId };
  } catch (error) {
    console.error(
      "❌ [Servicio Correo Interno]: Error fatal detectado:",
      error.message || error,
    );
    return { success: false, error: error.message || error };
  }
};

export const sendResetPasswordEmail = async (userName, userEmail, resetUrl) => {
  try {
    console.log("📬 [Servicio Correo]: Iniciando validaciones...");

    if (!process.env.RESEND_API_KEY) {
      throw new Error(
        "La variable de entorno RESEND_API_KEY no está definida.",
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const templatePath = path.join(
      process.cwd(),
      "src/templates/resetPasswordEmail.html",
    );

    const cleanToField = Array.isArray(userEmail)
      ? userEmail[0]?.trim()
      : String(userEmail || "").trim();

    if (!cleanToField) {
      throw new Error("El destinatario (userEmail) está vacío o es inválido.");
    }

    // 1. Cambiamos a 'let' para permitir la manipulación del string
    let htmlContent = await fs.readFile(templatePath, "utf8");

    // 2. Reemplazamos los placeholders del HTML template
    htmlContent = htmlContent
      .replace(/{{userName}}/g, userName)
      .replace(/{{resetUrl}}/g, resetUrl);

    // 3. Aplicamos estilos inline con juice
    const htmlWithInlineStyles = juice(htmlContent);

    // 4. Enviamos usando la API de Resend
    const response = await resend.emails.send({
      from: "SIGACE <no-replay@sigace.xyz>",
      to: cleanToField,
      subject: "Restablecimiento de contraseña",
      html: htmlWithInlineStyles,
    });

    // 5. Manejo robusto de la respuesta de Resend
    if (response?.error) {
      throw new Error(
        `Resend API Error: ${response.error.message || JSON.stringify(response.error)}`,
      );
    }

    const emailId = response?.data?.id || response?.id || "ID_DESCONOCIDO";
    console.log("✅ [Servicio Correo]: Correo enviado con éxito. ID:", emailId);

    return { success: true, id: emailId };
  } catch (error) {
    console.error(
      "❌ [Servicio Correo Interno]: Error fatal detectado:",
      error.message || error,
    );
    return { success: false, error: error.message || error };
  }
};
