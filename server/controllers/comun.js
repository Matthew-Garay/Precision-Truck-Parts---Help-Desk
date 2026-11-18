/**
 * comun.js
 *
 * Auxiliares compartidos por los controladores de solicitudes, insumos e
 * inventario (antes vivían dentro de solicitudes-controller.js).
 *
 *   errDetalle(err)        detalle del error SQL solo fuera de producción.
 *   esAdmin(req)           true si el usuario autenticado es admin (rol 1).
 *   sinStock / sinStockLista  quitan stock y disponibilidad para el rol Usuario.
 *   toPosId(v)             id entero positivo o null.
 *   validarRutaSucursales  verifica que origen y destino existan y sean distintos.
 *
 * @module server/controllers/comun
 */
import { isProd } from '../utils/helpers.js';

export const errDetalle = (err) => isProd() ? {} : {
  detalle: err.message,
  ...(err.sqlMessage ? { sqlMessage: err.sqlMessage } : {}),
  ...(err.errno != null ? { codigo: err.errno } : {}),
  ...(err.sqlState ? { sqlState: err.sqlState } : {}),
};
// ── Stock: dato interno del inventario ─────────────────────────────────────
// El rol Usuario (id_rol !== 1) NO debe ver el stock en ningún momento:
// ni la cifra exacta ni el campo calculado "disponibilidad" (que delata
// rangos: sin stock / stock bajo). El admin (id_rol === 1) sigue recibiendo
// ambos campos con normalidad.
export const esAdmin = (req) => req?.usuario?.id_rol === 1;
export const sinStock = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  const { stock, disponibilidad, ...resto } = obj;
  return resto;
};
export const sinStockLista = (filas) => (Array.isArray(filas) ? filas.map(sinStock) : filas);

/** Convierte un valor de body/params en id entero positivo o null. */
export const toPosId = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Verifica que dos sucursales existan y sean distintas. Devuelve error o null. */
export const validarRutaSucursales = async (conn, id_sucursal_origen, id_sucursal_destino) => {
  const [sucs] = await conn.query(
    "SELECT id_sucursal FROM sucursal WHERE id_sucursal IN (?)",
    [[id_sucursal_origen, id_sucursal_destino]]
  );
  if (sucs.length !== 2) return { campo: null, message: "La sucursal de origen o la de destino no existen" };
  if (id_sucursal_origen === id_sucursal_destino)
    return { campo: "id_sucursal_destino", message: "La sucursal de origen y la de destino deben ser distintas" };
  return null;
};
