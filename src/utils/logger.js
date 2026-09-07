const IS_PROD = process.env.NODE_ENV === "production";

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const CURRENT_LEVEL = IS_PROD ? LOG_LEVELS.info : LOG_LEVELS.debug;

const COLORS = {
  reset: "\x1b[0m",
  debug: "\x1b[36m", // Cían
  info: "\x1b[32m", // Verde
  warn: "\x1b[33m", // Amarillo
  error: "\x1b[31m", // Rojo
};

function formatMessage(level, message, meta = null) {
  const timestamp = new Date().toISOString();

  if (IS_PROD) {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...(meta && typeof meta === "object" ? { meta } : {}),
    });
  } else {
    const color = COLORS[level] || COLORS.reset;
    const metaStr = meta ? ` | ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] ${color}${level.toUpperCase()}${COLORS.reset}: ${message}${metaStr}`;
  }
}

const logger = {
  debug(message, meta) {
    if (CURRENT_LEVEL <= LOG_LEVELS.debug) {
      console.log(formatMessage("debug", message, meta));
    }
  },
  info(message, meta) {
    if (CURRENT_LEVEL <= LOG_LEVELS.info) {
      console.log(formatMessage("info", message, meta));
    }
  },
  warn(message, meta) {
    if (CURRENT_LEVEL <= LOG_LEVELS.warn) {
      console.warn(formatMessage("warn", message, meta));
    }
  },
  error(message, meta) {
    if (CURRENT_LEVEL <= LOG_LEVELS.error) {
      console.error(formatMessage("error", message, meta));
    }
  },
};

export default logger;
