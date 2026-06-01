import { Users } from "../models/Users.model.js";
import jsonwebtoken from "jsonwebtoken";

const { verify } = jsonwebtoken;

export const createUser = async (req, res) => {
  try {
    console.log("--------------------------------");
    console.log("createUser... creating user...");
    console.log("--------------------------------");

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
      console.log("--------------------------------");
      console.log("❌ createUser... error creating user...");
      console.log("--------------------------------");
      return res.status(500).json({ error: "Error al crear usuario" });
    }
    console.log("--------------------------------");
    console.log("✅ createUser... user created successfully...");
    console.log("--------------------------------");
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
    console.log("--------------------------------");
    console.log("✅ getUsers... getting users...");
    console.log("--------------------------------");

    const users = await Users.getUsers();
    res.status(200).json(users);
  } catch (error) {
    console.log("--------------------------------");
    console.log(" ❌ getUsers... error getting users...");
    console.log("--------------------------------");
    console.error("❌ Error al obtener usuarios:", error);
    throw error;
  }
};

export const changePassword = async (req, res) => {
  try {
    console.log("--------------------------------");
    console.log("✅ changePassword... changing password...");
    console.log("--------------------------------");

    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    let tokenUser = null;
    if (token) {
      try {
        tokenUser = verify(token, process.env.JWT_SECRET || "secret");
      } catch (_error) {
        console.log("--------------------------------");
        console.log("❌ changePassword... error changing password...");
        console.log("--------------------------------");
        return res.status(401).json({ error: "Token inválido o expirado" });
      }
    }

    const id = tokenUser?.id ?? req.session?.user?.id;

    if (!id) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const { newPassword, confirmPassword, confirmNewPassword } = req.body;
    const passwordConfirmation = confirmNewPassword ?? confirmPassword;

    if (!newPassword || !passwordConfirmation) {
      return res.status(400).json({ error: "Debe enviar ambas contraseñas" });
    }

    if (newPassword !== passwordConfirmation) {
      return res.status(400).json({ error: "Las contraseñas no coinciden" });
    }

    const passwordChanged = await Users.changePassword(id, newPassword);

    if (!passwordChanged) {
      console.log("--------------------------------");
      console.log("❌ changePassword... error changing password...");
      console.log("--------------------------------");
      return res.status(500).json({ error: "Error al cambiar la contraseña" });
    }

    if (req.session?.user?.id === id) {
      req.session.user.mustChangePassword = false;
    }

    console.log("--------------------------------");
    console.log("✅ changePassword... password changed successfully...");
    console.log("--------------------------------");

    return res.status(200).json({
      success: true,
      mustChangePassword: false,
      message:
        "Contraseña cambiada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.",
    });
  } catch (error) {
    console.error("❌ Error al cambiar la contraseña:", error);
    throw error;
  }
};

export const deleteUser = async (req, res) => {
  try {
    console.log("--------------------------------");
    console.log("⚠️ deleteUser... warning deleting user...");
    console.log("--------------------------------");

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

    console.log("--------------------------------");
    console.log("✅ deleteUser... user deleted successfully...");
    console.log("--------------------------------");
    return res
      .status(200)
      .json({ success: true, message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.log("--------------------------------");
    console.log(" ❌ deleteUser denied... error deleting user...");
    console.log("--------------------------------");
    console.error("❌ Error al eliminar usuario:", error);
    return res.status(500).json({ error: "Error al eliminar usuario" });
  }
};

export const updateUser = async (req, res) => {
  try {
    console.log("--------------------------------");
    console.log("⚠️ updateUser... warning updating user...");
    console.log("--------------------------------");
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
    console.log("--------------------------------");
    console.log("✅ updateUser... user updated successfully...");
    console.log("--------------------------------");
    return res
      .status(200)
      .json({ success: true, message: "Usuario actualizado correctamente" });
  } catch (error) {
    console.log("--------------------------------");
    console.log(" ❌ updateUser denied... error updating user...");
    console.log("--------------------------------");
    console.error("❌ Error al actualizar usuario:", error);
    return res.status(500).json({ error: "Error al actualizar usuario" });
  }
};
