/**
 * stock.js
 *
 * Límite ÚNICO de "stock bajo" en el cliente (colores, contadores y Excel).
 * Espejo de server/utils/stock.js: si se cambia aquí, cambiarlo allá.
 *
 * @module client/utils/stock
 */
export const STOCK_BAJO = 1;

/** Color de semáforo para una cantidad de stock. */
export const colorStock = (n) => {
  const v = Number(n) || 0;
  return v === 0 ? "#dc2626" : v <= STOCK_BAJO ? "#d97706" : "#16a34a";
};
