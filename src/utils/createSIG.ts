/**
 * Crea un string con el prefijo SIG y un número aleatorio de 7 dígitos
 * @returns un string con el prefijo SIG y un número aleatorio de 7 dígitos
 */
export const createSIG = (): string => {
  const prefix = "SIG";
  const randomNumber = Math.floor(Math.random() * 10000);
  return `${prefix}${randomNumber}`;
};
