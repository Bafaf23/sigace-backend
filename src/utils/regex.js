/**
 * Espreciones predetermindas en el sistema
 * @typedef {Object} patterns
 */
export const patterns = {
  number: /^([1-9]|[1-9][0-9]|[1-9][0-9][0-9]|[1-9][0-9][0-9][0-9])/,
  text: /^[a-zA-Z]+( [a-zA-Z]+)*$/,
  numberText: /^[a-zA-Z0-9]+$/,
  otp: /^[a-zA-Z0-9]{6}$/,
};

/**
 * Conparador de Expreciones regulares permitidas en el sietama
 * @param {string} pattern - Patron de validacion
 * @param {any} value - valor a validar
 * @returns {Boolean} - valor de la comparacion
 */
export function regex(pattern, value) {
  return pattern.test(value);
}
