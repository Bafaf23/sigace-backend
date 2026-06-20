import { Users } from "../models/Users.model.js";

export const createUser = async (req, res) => {
  try {
    console.log("createUser... creating user...");

    if (!req.body) {
      return res.status(400).json({ error: "No se proporcionaron datos" });
    }

    const document = req.body.typeDocuement + req.body.document;

    /* Generar una contraseña generica para el usuario esta debe ser cambiada por el usuario en el primer login  document(4)@2026*/
    const passgeneric = req.body.document.substring(0, 4) + "@2026";

    console.log("passgeneric", passgeneric);

    const user = await Users.createUser({
      document: document,
      name: req.body.name,
      last_name: req.body.last_name,
      email: req.body.email,
      phone: req.body.phone,
      role_id: req.body.role_id,
      SIG: req.body.SIG,
      password: passgeneric,
    });

    if (!user) {
      console.log("❌ createUser... error creating user...");

      return res.status(500).json({ error: "Error al crear usuario" });
    }

    console.log("✅ createUser... user created successfully...");

    return res
      .status(201)
      .json({ success: true, message: "Usuario creado correctamente" });
  } catch (error) {
    console.error("❌ Error al crear un usuario:", error);
    throw error;
  }
};

export const getUsers = async (_req, res) => {
  try {
    console.log("✅ getUsers... getting users...");
    const users = await Users.getUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error("❌ Error al obtener usuarios:", error);

    throw error;
  }
};

export const changePassword = async (req, res) => {
  try {
    console.log("✅ changePassword... changing password...");

    const { newPassword, confirmPassword, confirmNewPassword } = req.body;
    const passwordConfirmation = confirmNewPassword ?? confirmPassword;

    if (!newPassword || !passwordConfirmation) {
      return res.status(400).json({ error: "Debe enviar ambas contraseñas" });
    }

    if (newPassword !== passwordConfirmation) {
      return res.status(400).json({ error: "Las contraseñas no coinciden" });
    }

    console.log(`${req.user.id} ${req.user.email}`);

    const passwordChanged = await Users.changePassword(
      req.user.id,
      newPassword,
    );

    if (!passwordChanged) {
      console.log("❌ changePassword... error changing password...");

      return res.status(500).json({ error: "Error al cambiar la contraseña" });
    }

    if (req.session?.user?.id_user === req.id) {
      req.session.user.mustChangePassword = false;
    }

    console.log("✅ changePassword... password changed successfully...");

    return res.status(200).json({
      success: true,
      mustChangePassword: false,
      message:
        "Contraseña actualizada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.",
    });
  } catch (error) {
    console.error("❌ Error al cambiar la contraseña:", error);
    throw error;
  }
};

export const deleteUser = async (req, res) => {
  try {
    console.log("⚠️ deleteUser... warning deleting user...");

    const authHeader = req.headers.authorization;
    const idUser = req.params.id;
    const role_id = req.body.roleId;

    if (!authHeader) {
      console.log(" ❌ deleteUser denied... no authorization header...");
      return res.status(401).json({ error: "No autorizado" });
    }

    if (!idUser) {
      console.log(" ❌ deleteUser denied... no id provided...");
      return res
        .status(400)
        .json({ error: "No se proporcionó el ID del usuario" });
    }

    const deletedUser = await Users.deleteUser(idUser, role_id);
    if (!deletedUser) {
      console.log(" ❌ deleteUser denied... error deleting user...");
      return res.status(500).json({ error: "Error al eliminar usuario" });
    }

    console.log("✅ deleteUser... user deleted successfully...");

    return res
      .status(200)
      .json({ success: true, message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.log(" ❌ deleteUser denied... error deleting user...");

    console.error("❌ Error al eliminar usuario:", error);
    return res.status(500).json({ error: "Error al eliminar usuario" });
  }
};

export const updateUser = async (req, res) => {
  try {
    console.log("⚠️ updateUser... warning updating user...");

    const user = { ...req.body, id: req.body.id };
    if (!user.id) {
      console.log(" ❌ updateUser denied... no id provided...");
      return res
        .status(400)
        .json({ error: "No se proporcionó el ID del usuario" });
    }
    if (!user) {
      console.log(" ❌ updateUser denied... no user provided...");
      return res.status(400).json({ error: "No se proporcionó el usuario" });
    }
    const updatedUser = await Users.updateUser(user);
    if (!updatedUser) {
      console.log(" ❌ updateUser denied... error updating user...");
      return res.status(500).json({ error: "Error al actualizar usuario" });
    }

    console.log("✅ updateUser... user updated successfully...");

    return res
      .status(200)
      .json({ success: true, message: "Usuario actualizado correctamente" });
  } catch (error) {
    console.log(" ❌ updateUser denied... error updating user...");

    console.error("❌ Error al actualizar usuario:", error);
    return res.status(500).json({ error: "Error al actualizar usuario" });
  }
};

export const getProfile = async (req, res) => {
  console.log(req.user.email);

  console.log(`Obtiendo los datos del perfil`);


  if (!req.session) {
    console.log(`No hay una session activa`);
    res
      .status(404)
      .json({ success: false, message: "Inicia session nuevamente" });
  }


  if (!req.user.email) {
    console.log(`hubo un error al obtiner el correo del usuario`);
  }
  const [dataPorfil] = await Users.getUsers(req.user.email);

  if (!dataPorfil) {
    console.log(`No hay datos del usuario`);
  }

  return res.status(202).json(dataPorfil);
};
