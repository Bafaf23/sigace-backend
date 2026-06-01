/**
 * Obtiene el periodo actual en formato "YYYY-YYYY"
 * @returns {string} - El periodo actual en formato "YYYY-YYYY"
 */
export function getCurrentPeriod() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  let yearStart;
  let yearEnd;

  if (currentMonth >= 9) {
    yearStart = currentYear;
    yearEnd = currentYear + 1;
  } else {
    yearStart = currentYear - 1;
    yearEnd = currentYear;
  }
  return `${yearStart}-${yearEnd}`;
}
