/**
 * stock.js
 *
 * Límite ÚNICO de "stock bajo" para todo el servidor (alertas, etiquetas de
 * disponibilidad y el endpoint /insumos/stock-bajo). El cliente tiene su
 * espejo en client/src/utils/stock.js: si se cambia aquí, cambiarlo allá.
 *
 *   stock = 0              → Sin stock (agotado)
 *   0 < stock <= STOCK_BAJO → Stock bajo
 *   stock > STOCK_BAJO      → Disponible
 *
 * @module server/utils/stock
 */
export const STOCK_BAJO = 1;

/** Columna SQL `disponibilidad` calculada con el límite único. */
export const SQL_DISPONIBILIDAD = (alias = "i") => `CASE
           WHEN ${alias}.stock  = 0 THEN 'Sin stock'
           WHEN ${alias}.stock <= ${STOCK_BAJO} THEN 'Stock bajo'
           ELSE 'Disponible'
         END`;
