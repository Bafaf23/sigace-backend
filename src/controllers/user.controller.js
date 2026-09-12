import { Users } from "../models/Users.model.js";
import logger from "../utils/logger.js";
import { welcomeEmail } from "../services/resend.service.js";

function formatText(text) {
  if (typeof text !== "string" || !text.trim()) {
    return "";
  }
  const cleanStr = text.trim();

  const regexPermitido = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/;

  if (!regexPermitido.test(cleanStr)) {
    logger.warn("El texto contiene caracteres no permitidos.");
    return null;
  }
  return cleanStr.charAt(0).toUpperCase() + cleanStr.slice(1).toLowerCase();
}

/**
 * Inserta un registro de usuario al sisitema
 *
 * @async
 * @function createUser
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const createUser = async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    logger.error("No se proporcionaron datos para procesar el registro.");
    return res.status(400).json({
      success: false,
      code: "EMPTY_PAYLOAD",
      message: "No se proporcionaron datos en el cuerpo de la solicitud.",
    });
  }

  try {
    const document = (req.body.typeDocuement + req.body.document).trim();
    const rawDocument = req.body.document ? String(req.body.document) : "";
    const passgeneric = rawDocument.substring(0, 4) + "@2026";

    const formattedName = formatText(req.body.name);

    const user = await Users.create({
      document: document,
      name: formatText(req.body.name),
      last_name: formatText(req.body.last_name),
      email: req.body.email.trim(),
      phone: req.body.phone,
      role_id: req.body.role_id,
      SIG: req.user.SIG,
      password: passgeneric,
    });

    if (!user) {
      logger.error("Error al intentar prosesar el registro.");
      return res.status(402).json({
        success: false,
        code: "USER_CREATION_FAILED",
        message:
          "No se pudo procesar la inserción del usuario. Verifica los campos duplicados.",
      });
    }

    const userFir = user.name;

    logger.info("Iniciaindo proceso de envio de correo de bienvenida.");
    await welcomeEmail(formattedName, req.body.email).catch((error) => {
      console.error(
        "❌ [Background Task Error]: Falló el envío del correo de bienvenida:",
        error,
      );
    });

    logger.info("Registro prosesado con exito.", { name: userFir });

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
 * Obtiene a todos los usuarios en el sistema para la adminitracion sudo
 *
 * @async
 * @function getUsers
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const getUsers = async (req, res) => {
  try {
    const users = await Users.getUsers();

    if (!users || users.length === 0) {
      logger.warn(`No hay usuarios registrados.`);
      return res.status(404).json({
        success: false,
        code: "USERS_NOT_FOUND",
        message: "No se registran cuentas de usuario creadas en el sistema.",
      });
    }

    const userLisp = users.filter((user) => user.id !== req.user.id);

    const userProser = userLisp.map((user) => ({
      id: user.id,
      document: user.id_card,
      name: user.name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      school: {
        name: user.school?.name ?? "Sin asignación",
        SIG: user.school?.SIG ?? "Sin asignación",
      },
    }));

    logger.debug("Usuarios cargados desde la base de datos", {
      total: users.length,
    });

    if (process.env.NODE_ENV !== "production") {
      console.table(userProser);
    }

    return res.status(200).json({
      success: true,
      message: "Colección de usuarios cargada exitosamente.",
      data: userProser,
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
 * Metodo de cambio de credenciales
 *
 * @async
 * @function changePassword
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const changePassword = async (req, res) => {
  const { newPassword, confirmPassword, confirmNewPassword } = req.body;
  const passwordConfirmation = confirmNewPassword ?? confirmPassword;

  if (!newPassword || !passwordConfirmation) {
    logger.error("Sin contrasenas para peocesar la solictud");
    return res.status(400).json({
      success: false,
      code: "MISSING_PASSWORDS",
      message:
        "Solicitud denegada: Debe ingresar y confirmar la nueva contraseña corporativa.",
    });
  }

  if (newPassword !== passwordConfirmation) {
    logger.error(
      "Las contrasenas no cumplen con los requisitosde igualdad necesarios.",
    );

    return res.status(400).json({
      success: false,
      code: "PASSWORDS_DO_NOT_MATCH",
      message:
        "Validación fallida: Las contraseñas suministradas no coinciden entre sí.",
    });
  }

  try {
    logger.debug("Realizando el cambio de llave de acceso...");
    const passwordChanged = await Users.changePassword(
      req.user.id,
      newPassword,
    );

    if (!passwordChanged) {
      logger.debug("No se resivio la informacion");
      return res.status(400).json({
        success: false,
        code: "PASSWORD_UPDATE_FAILED",
        message:
          "No se pudo actualizar la contraseña. Revisa que cumpla con los estándares de seguridad.",
      });
    }

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
 * TODO: ajustar controlador por la nueva forma estandar
 */
export const deleteUser = async (req, res) => {
  try {
    const idUser = req.params.id;

    if (!idUser) {
      return res.status(400).json({
        success: false,
        code: "MISSING_USER_ID",
        message: "Es requerido especificar el ID único del usuario a remover.",
      });
    }

    const deletedUser = await Users.deleteUser(idUser);
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
 * Actualiza la informacion permitida de un usuario
 *
 * @async
 * @function updateUser
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const updateUser = async (req, res) => {
  const userId = req.body.id;

  if (!userId) {
    logger.error("No se localizo el ID del usuario.");
    return res.status(400).json({
      success: false,
      code: "MISSING_UPDATE_ID",
      message: "No se especificó el ID del usuario para aplicar los cambios.",
    });
  }

  try {
    const updatedUser = await Users.updateUser({ ...req.body, id: userId });

    if (!updatedUser) {
      logger.error(
        "No se pudo modificar la informacion en el sistema, intenta nuevamente.",
      );
      return res.status(404).json({
        success: false,
        code: "USER_UPDATE_FAILED",
        message:
          "No se modificó el registro. Es posible que el usuario no exista.",
      });
    }

    logger.debug("Informacion actualizada con exito.", userId);

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
 * Obtiene los datos del perfil del usuario logeado
 *
 * @async
 * @function getProfile
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const getProfile = async (req, res) => {
  if (!req.session) {
    logger.error("No hay una session activa");
    return res.status(401).json({
      success: false,
      code: "SESSION_EXPIRED",
      message:
        "Sesión caducada. Por favor, ingresa tus credenciales nuevamente.",
    });
  }

  const email = req.user?.email;

  if (!email) {
    logger.error("Email sin expesificar", { email });
    return res.status(400).json({
      success: false,
      code: "MISSING_SESSION_EMAIL",
      message:
        "No se localizó una dirección de correo vinculada al token actual.",
    });
  }

  try {
    const usersList = await Users.getUsers(email);

    const dataProfile = usersList.reduce((user) => {
      const schoolData =
        user.role !== "sudo" && user.school
          ? { SIG: user.school.SIG, name: user.school.name ?? "sin asignar" }
          : {};

      return {
        user: {
          id_card: user.document,
          name: user.name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        school: schoolData,
      };
    });

    if (!usersList) {
      logger.error("No se localizo el perfil solicitado.");
      return res.status(404).json({
        success: false,
        code: "PROFILE_NOT_FOUND",
        message:
          "No se hallaron datos de perfil válidos para el usuario en sesión.",
      });
    }

    logger.debug("Perfil sincronizado correctamente", { email });

    if (process.env.NODE_ENV !== "production") {
      console.table(
        usersList.map((user) => ({
          id: user.id,
          id_card: user.id_card,
          name: user.name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
          SIG: user.school?.SIG ?? "sin asiganr",
          school: user.school?.name ?? "sin asignar",
        })),
      );
    }
    return res.status(200).json({
      success: true,
      message: "Ficha de perfil autorizada.",
      data: dataProfile,
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

/**
 * Obtiene a todos el personal de un colegio, excluyendo a los estudiantes
 *
 * @async
 * @function userSchool
 * @param {import("express").Request} req - Objeto de solicitud de Express.
 * @param {import("express").Response} res - Objeto de respuesta de Express.
 * @returns {Promise<import("express").Response>} Respuesta HTTP en formato JSON con la lista de escuelas.
 */
export const userSchool = async (req, res) => {
  const SIG = /* req.user.SIG */ "SIG4320";
  const id = /* req.user.id */ 55;

  if (!SIG) {
    logger.error("SIG no encontrado", { SIG });
    return res.status(404).json({
      success: false,
      code: "MISSING_SCHOOL_SIG",
      message: "El codigo SIG es necesario",
    });
  }

  try {
    logger.info("cargando..., por favor espera...");
    const users = await Users.usersSchool(SIG);

    if (!users || users.length == 0) {
      logger.error("No hay usuarios es este colegio o el SIG es incorrecto.");
      return res.status(402).json({
        success: false,
        code: "USER_CREATION_FAILED",
        message:
          "No se pudo procesar la inserción del usuario. Verifica los campos duplicados.",
      });
    }

    const usersProces = users.filter((item) => item.id !== id);

    logger.info("Carga completada!");

    return res.status(201).json({
      success: true,
      code: "USER_CREATED",
      message: "Cuenta de usuario creada correctamente.",
      data: usersProces,
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
