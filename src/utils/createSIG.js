/**
 * Crea un string con el prefijo SIG y un número aleatorio de 4 dígitos
 * @returns un string con el prefijo SIG y un número aleatorio de 4 dígitos
 */
export const createSIG = () => {
  const prefix = "SIG";
  const randomNumber = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${prefix}${randomNumber}`;
};
