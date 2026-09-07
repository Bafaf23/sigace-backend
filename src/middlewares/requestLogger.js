import logger from "../utils/logger.js";

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const { method, originalUrl, params = {}, query = {}, body = {} } = req;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const logText = `${req.method} ${req.originalUrl} | Status: ${status} | ${duration}ms`;

    if (status >= 500) {
      logger.error(logText);
    } else if (status >= 400) {
      logger.warn(logText);
    } else {
      logger.info(logText);
    }
  });

  next();
};
