import logger from "../utils/logger.js";

export const subdomainHandler = (req, res, next) => {
  const host = req.headers.host;
  const origin = req.headers.origin;

  let targetHost = host;

  if (origin) {
    try {
      const parsedUrl = new URL(origin);
      targetHost = parsedUrl.host;
    } catch (e) {}
  }

  const hostWithoutPort = targetHost.split(":")[0];
  const parts = hostWithoutPort.split(".");

  let subdomain = null;

  if (parts.includes("localhost")) {
    if (parts.length > 1 && parts[0] !== "localhost" && parts[0] !== "www") {
      subdomain = parts[0];
    }
  } else if (parts.length > 2) {
    if (parts[0] !== "www") {
      subdomain = parts[0];
    }
  }

  logger.debug("subdominio detectado:", { subdomain });

  req.subdomain = subdomain;
  next();
};
