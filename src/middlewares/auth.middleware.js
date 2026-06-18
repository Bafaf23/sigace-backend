import jwt from "jsonwebtoken";
const { verify } = jwt;

/**
 * Middleware para proteger rutas verificando el JWT de la cookie auth_token.
 * Si es válido, inyecta los datos decodificados en req.user.
 */
export const verificarAutenticacion = (req, res, next) => {
  try {
    const token = req.cookies?.auth_token;

    if (!token) {
      console.log("❌ Acceso denegado: Cookie 'auth_token' ausente.");
      return res.status(401).json({ error: "Acceso denegado. Inicie sesión nuevamente." });
    }

    // Verificamos el token directamente desde la cookie
    const decoded = verify(token, process.env.JWT_SECRET);
    
    // Inyectamos los datos del usuario decodificados en el objeto request
    req.user = decoded; 
    
    return next(); // Damos paso al controlador correspondiente
  } catch (error) {
    console.error("❌ Error en verificación de Token:", error.message);
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Su sesión ha expirado. Por favor, vuelva a ingresar." });
    }
    
    return res.status(401).json({ error: "Token inválido o corrupto." });
  }
};

/**
 * Middleware complementario para validar roles específicos.
 * Se ejecuta inmediatamente después de verificarAutenticacion.
 */
export const permitirRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.role)) {
      return res.status(403).json({ 
        message: "No tiene los permisos o el rol requerido para realizar esta acción." 
      });
    }
    return next();
  };
};