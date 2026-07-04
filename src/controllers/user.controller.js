import { Users } from "../models/Users.model.js";
import { welcomeEmail } from "../services/resend.service.js";

function formatText(text) {
  if (typeof text !== "string" || !text.trim()) {
    return "";
  }
  const cleanStr = text.trim();
  const regexPermitido = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/;
  if (!regexPermitido.test(cleanStr)) {
    console.warn("⚠️ El texto contiene caracteres no permitidos.");
    return null;
  }
  return cleanStr.charAt(0).toUpperCase() + cleanStr.slice(1).toLowerCase();
}

/**
 * ==========================================================================
 * 1. CREAR UN NUEVO USUARIO
 * ==========================================================================
 */
export const createUser = async (req, res) => {
  try {
    console.log("⚠️ [SIGACE API]: Inicializando creación de usuario...");

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        code: "EMPTY_PAYLOAD",
        message: "No se proporcionaron datos en el cuerpo de la solicitud.",
      });
    }

    const document = (
      (req.body.typeDocuement || "") + (req.body.document || "")
    ).trim();
    const rawDocument = req.body.document ? String(req.body.document) : "";
    const passgeneric = rawDocument.substring(0, 4) + "@2026";

    const formattedName = formatText(req.body.name);

    const user = await Users.createUser({
      document,
      name: formatText(req.body.name),
      last_name: formatText(req.body.last_name),
      email: req.body.email ? req.body.email.trim() : "",
      phone: req.body.phone,
      role_id: req.body.role_id,
      SIG: req.user?.SIG,
      password: passgeneric,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        code: "USER_CREATION_FAILED",
        message:
          "No se pudo procesar la inserción del usuario. Verifica los campos duplicados.",
      });
    }

    console.log(`Enviando correo... ${req.body.email}`);
    welcomeEmail(
      formattedName,
      /*req.body.email*/ "bryantffacen@gmail.com",
    ).catch((error) => {
      console.error(
        "❌ [Background Task Error]: Falló el envío del correo de bienvenida:",
        error,
      );
    });

    return res.status(201).json({
      success: true,
      code: "USER_CREATED",
      message: "Cuenta de usuario creada correctamente.",
    });
  } catch (error) {
    console.error("❌ Error en createUser:", error);
    return res.status(500).json({
      success: false,
      code: "CREATE_USER_INTERNAL_ERROR",
      message:
        "Fallo técnico en el servidor al intentar dar de alta al usuario.",
      error: error.message,
    });
  }
};

/**
 * ==========================================================================
 * 2. OBTENER TODOS LOS USUARIOS
 * ==========================================================================
 */
export const getUsers = async (_req, res) => {
  try {
    console.log("🔍 [SIGACE API]: Listando la base general de usuarios...");
    const users = await Users.getUsers();

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        code: "USERS_NOT_FOUND",
        message: "No se registran cuentas de usuario creadas en el sistema.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Colección de usuarios cargada exitosamente.",
      data: users,
    });
  } catch (error) {
    console.error("❌ Error en getUsers:", error);
    return res.status(500).json({
      success: false,
      code: "GET_USERS_INTERNAL_ERROR",
      message: "Error de infraestructura al consultar el índice de usuarios.",
      error: error.message,
    });
  }
};

/**
 * ==========================================================================
 * 3. CAMBIAR CONTRASEÑA (SEGURIDAD / PRIMER INGRESO)
 * ==========================================================================
 */
export const changePassword = async (req, res) => {
  try {
    console.log(
      "🔒 [SIGACE API]: Procesando actualización de credenciales de seguridad...",
    );

    const { newPassword, confirmPassword, confirmNewPassword } = req.body;
    const passwordConfirmation = confirmNewPassword ?? confirmPassword;

    if (!newPassword || !passwordConfirmation) {
      return res.status(400).json({
        success: false,
        code: "MISSING_PASSWORDS",
        message:
          "Solicitud denegada: Debe ingresar y confirmar la nueva contraseña corporativa.",
      });
    }

    if (newPassword !== passwordConfirmation) {
      return res.status(400).json({
        success: false,
        code: "PASSWORDS_DO_NOT_MATCH",
        message:
          "Validación fallida: Las contraseñas suministradas no coinciden entre sí.",
      });
    }

    const passwordChanged = await Users.changePassword(
      req.user.id,
      newPassword,
    );

    if (!passwordChanged) {
      return res.status(400).json({
        success: false,
        code: "PASSWORD_UPDATE_FAILED",
        message:
          "No se pudo actualizar la contraseña. Revisa que cumpla con los estándares de seguridad.",
      });
    }

    // Limpieza de banderas de cambio forzado en sesión activa si aplica
    if (req.session?.user?.id_user === req.user?.id) {
      req.session.user.mustChangePassword = false;
    }

    return res.status(200).json({
      success: true,
      code: "PASSWORD_CHANGED",
      mustChangePassword: false,
      message:
        "Contraseña actualizada correctamente. Las credenciales de seguridad han sido renovadas.",
    });
  } catch (error) {
    console.error("❌ Error en changePassword:", error);
    return res.status(500).json({
      success: false,
      code: "CHANGE_PASSWORD_INTERNAL_ERROR",
      message: "Fallo crítico al sincronizar la nueva clave criptográfica.",
      error: error.message,
    });
  }
};

/**
 * ==========================================================================
 * 4. ELIMINAR / RECOGER CUENTA DE USUARIO
 * ==========================================================================
 */
export const deleteUser = async (req, res) => {
  try {
    console.log(
      "⚠️ [SIGACE API]: Evaluando revocación de cuenta de usuario...",
    );

    const authHeader = req.headers.authorization;
    const idUser = req.params.id;
    const role_id = req.body.roleId;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED_ACTION",
        message:
          "Acceso restringido: No se detectó una firma de autorización válida.",
      });
    }

    if (!idUser) {
      return res.status(400).json({
        success: false,
        code: "MISSING_USER_ID",
        message: "Es requerido especificar el ID único del usuario a remover.",
      });
    }

    const deletedUser = await Users.deleteUser(idUser, role_id);
    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        code: "USER_DELETE_FAILED",
        message:
          "El usuario no existe en la base de datos o ya fue purgado del sistema.",
      });
    }

    return res.status(200).json({
      success: true,
      code: "USER_DELETED",
      message:
        "La cuenta de usuario y sus permisos asociados fueron eliminados correctamente.",
    });
  } catch (error) {
    console.error("❌ Error en deleteUser:", error);
    return res.status(500).json({
      success: false,
      code: "DELETE_USER_INTERNAL_ERROR",
      message:
        "Error de restricción relacional: No se puede eliminar si el usuario tiene registros vinculados.",
      error: error.message,
    });
  }
};

/**
 * ==========================================================================
 * 5. ACTUALIZAR ATRIBUTOS DE USUARIO
 * ==========================================================================
 */
export const updateUser = async (req, res) => {
  try {
    console.log("⚠️ [SIGACE API]: Sincronizando modificaciones de usuario...");

    const userId = req.body.id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        code: "MISSING_UPDATE_ID",
        message: "No se especificó el ID del usuario para aplicar los cambios.",
      });
    }

    const updatedUser = await Users.updateUser({ ...req.body, id: userId });
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        code: "USER_UPDATE_FAILED",
        message:
          "No se modificó el registro. Es posible que el usuario no exista.",
      });
    }

    return res.status(200).json({
      success: true,
      code: "USER_UPDATED",
      message: "Datos de usuario actualizados de forma exitosa.",
    });
  } catch (error) {
    console.error("❌ Error en updateUser:", error);
    return res.status(500).json({
      success: false,
      code: "UPDATE_USER_INTERNAL_ERROR",
      message: "Contratiempo técnico en el servidor al actualizar el perfil.",
      error: error.message,
    });
  }
};

/**
 * ==========================================================================
 * 6. OBTENER EXPEDIENTE DE PERFIL EN SESIÓN
 * ==========================================================================
 */
export const getProfile = async (req, res) => {
  try {
    console.log(
      "🔍 [SIGACE API]: Cargando credenciales del perfil en sesión...",
    );

    if (!req.session) {
      return res.status(401).json({
        success: false,
        code: "SESSION_EXPIRED",
        message:
          "Sesión caducada. Por favor, ingresa tus credenciales nuevamente.",
      });
    }

    const email = req.user?.email;
    if (!email) {
      return res.status(400).json({
        success: false,
        code: "MISSING_SESSION_EMAIL",
        message:
          "No se localizó una dirección de correo vinculada al token actual.",
      });
    }

    const usersList = await Users.getUsers(email);
    const dataProfil = usersList && usersList[0];

    if (!dataProfil) {
      return res.status(404).json({
        success: false,
        code: "PROFILE_NOT_FOUND",
        message:
          "No se hallaron datos de perfil válidos para el usuario en sesión.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ficha de perfil autorizada.",
      data: dataProfil,
    });
  } catch (error) {
    console.error("❌ Error en getProfile:", error);
    return res.status(500).json({
      success: false,
      code: "GET_PROFILE_INTERNAL_ERROR",
      message: "Error interno al compilar el estado del perfil.",
      error: error.message,
    });
  }
};
