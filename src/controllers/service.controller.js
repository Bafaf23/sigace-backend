import { Services } from "../models/Services.model.js";
import logger from "../utils/logger.js";

export const getServices = async (req, res) => {
  try {
    const services = await Services.getAll();

    if (!services || services.length == 0) {
      logger.error("No hay servicios registrados", { service: services });
      return res.status(404).json({
        success: false,
        code: "SERVICE_SAVE_FALLID",
        message: "No hay servicios en estos momentos.",
      });
    }

    return res.status(200).json({
      success: true,
      data: services,
    });
  } catch (e) {
    console.error(e);
  }
};

export const updatePrice = async (req, res) => {
  const newPrice = req.body.price;
  const id = req.body.id;

  if (!newPrice && !id) {
    logger.warn("EL nuevo precio es necesario para continuar", {
      di: id,
      price: newPrice,
    });
    return res.status(404).json({
      success: false,
      code: "NEW_PRECIE_REQUERID",
      message: "EL precio ingresado es incorecto, intenta de nuevo",
    });
  }

  try {
    logger.info("Actualizando el precio...");
    const updatePrice = await Services.updatePrice({ id, price: newPrice });

    if (!updatePrice) {
      logger.warn("No se pudo actualizar el precio", { updatePrice });
      return res.status(404).json({
        success: false,
        code: "NEW_PRECIE_REQUERID",
        message: "EL precio no se pudo actualizar, intenta de nuevo",
      });
    }

    logger.info("Exito, el precio fue actualizado");
    return res.status(202).json({
      success: true,
      message: "Precio actualizado",
      data: updatePrice,
    });
  } catch (error) {
    logger.error("Error en el controlador service", { meta: error });
  }
};
