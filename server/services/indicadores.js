/**
 * indicadores.js — Indicadores mensuales para presentar a la dirección.
 *
 * mensual("AAAA-MM") devuelve, para el mes elegido y los 12 meses que
 * terminan en él:
 *   mes          resumen del mes (tickets, resueltos, % dentro de la meta de
 *                2 días, tiempo promedio de resolución, calificación promedio,
 *                piezas de insumos que salieron) y la comparación con el mes
 *                anterior
 *   tendencia    [{ mes, tickets, resueltos, horas_promedio, pct_meta, piezas }]
 *   por_categoria / por_sucursal (tickets del mes)
 *   consumo_sucursal (piezas del mes por sucursal de destino)
 *   top_insumos  (5 más usados del mes)
 *
 * Reglas (las mismas del resto del sistema):
 *   - Un ticket cuenta en el mes en que se levantó (fecha_subido).
 *   - El tiempo de resolución y la meta se miden en el mes en que se resolvió
 *     (fecha_resuelto), solo para tickets Resuelto.
 *   - Meta: resolver en 2 días (48 h) o menos.
 *   - Consumo: salidas de inventario (internas activas y solicitudes
 *     aceptadas); las salidas anuladas no cuentan.
 *
 * @module server/services/indicadores
 */
import pool from "../config/db.js";
import MovimientoInventario from "./movimiento-inventario.js";

export const META_HORAS = 48;

const pad2 = (n) => String(n).padStart(2, "0");

/** Meses "AAAA-MM" desde n-1 meses antes de `mes` hasta `mes`. */
export function mesesHasta(mes, n = 12) {
  const [y, m] = mes.split("-").map(Number);
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    out.push(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}`);
  }
  return out;
}

const finDeMes = (mes) => {
  const [y, m] = mes.split("-").map(Number);
  return `${mes}-${pad2(new Date(y, m, 0).getDate())}`;
};
const num = (v, dec = 1) => (v == null ? null : Math.round(Number(v) * 10 ** dec) / 10 ** dec);

const Indicadores = {
  mensual: async (mes) => {
    const meses = mesesHasta(mes, 12);
    const desde = `${meses[0]}-01`;
    const hasta = finDeMes(mes);

    // Tickets levantados por mes y cómo terminaron.
    const [creados] = await pool.query(
      `SELECT DATE_FORMAT(fecha_subido, '%Y-%m') AS mes, COUNT(*) AS tickets,
              SUM(estatus = 'Resuelto') AS resueltos, SUM(estatus = 'No Resuelto') AS no_resueltos,
              SUM(estatus = 'Cancelado') AS cancelados, SUM(estatus = 'En proceso') AS abiertos
         FROM ticket
        WHERE fecha_subido >= ? AND fecha_subido < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY mes`, [desde, hasta]);

    // Tiempo de resolución por mes de resolución.
    const [resol] = await pool.query(
      `SELECT DATE_FORMAT(fecha_resuelto, '%Y-%m') AS mes, COUNT(*) AS n,
              AVG(TIMESTAMPDIFF(MINUTE, fecha_subido, fecha_resuelto)) / 60 AS horas_promedio,
              SUM(TIMESTAMPDIFF(MINUTE, fecha_subido, fecha_resuelto) <= ? * 60) AS en_meta,
              AVG(calificacion) AS calificacion, COUNT(calificacion) AS calificados
         FROM ticket
        WHERE estatus = 'Resuelto' AND fecha_resuelto IS NOT NULL
          AND fecha_resuelto >= ? AND fecha_resuelto < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY mes`, [META_HORAS, desde, hasta]);

    const consumo = await MovimientoInventario.consumo({ desde, hasta });
    const consumoMes = await MovimientoInventario.consumo({ desde: `${mes}-01`, hasta });

    const mapC = new Map(creados.map(r => [r.mes, r]));
    const mapR = new Map(resol.map(r => [r.mes, r]));
    const mapP = new Map(consumo.por_mes.map(r => [r.mes, r.piezas]));
    const tendencia = meses.map(m => {
      const c = mapC.get(m) || {}, r = mapR.get(m) || {};
      const n = Number(r.n) || 0;
      return {
        mes: m,
        tickets:        Number(c.tickets) || 0,
        resueltos:      Number(c.resueltos) || 0,
        no_resueltos:   Number(c.no_resueltos) || 0,
        cancelados:     Number(c.cancelados) || 0,
        abiertos:       Number(c.abiertos) || 0,
        horas_promedio: n ? num(r.horas_promedio) : null,
        pct_meta:       n ? Math.round((Number(r.en_meta) / n) * 100) : null,
        calificacion:   Number(r.calificados) ? num(r.calificacion) : null,
        piezas:         mapP.get(m) || 0,
      };
    });

    const [porCategoria] = await pool.query(
      `SELECT COALESCE(c.nombre_categoria, 'Sin categoría') AS etiqueta, COUNT(*) AS tickets
         FROM ticket t LEFT JOIN categoria c ON c.id_categoria = t.id_categoria
        WHERE t.fecha_subido >= ? AND t.fecha_subido < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY etiqueta ORDER BY tickets DESC, etiqueta`, [`${mes}-01`, hasta]);

    const [porSucursal] = await pool.query(
      `SELECT COALESCE(s.nombre_sucursal, 'Sin sucursal') AS etiqueta, COUNT(*) AS tickets
         FROM ticket t
         JOIN empleado e ON e.id_empleado = t.id_empleado
         LEFT JOIN sucursal s ON s.id_sucursal = e.id_sucursal
        WHERE t.fecha_subido >= ? AND t.fecha_subido < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY etiqueta ORDER BY tickets DESC, etiqueta`, [`${mes}-01`, hasta]);

    const [consumoSucursal] = await pool.query(
      `SELECT COALESCE(s.nombre_sucursal, sa.destino_texto, 'Sin sucursal') AS etiqueta, SUM(m.cantidad) AS piezas
         FROM movimiento_inventario m
         LEFT JOIN v_salida_interna sa ON sa.id_salida = m.id_salida
         LEFT JOIN sucursal s        ON s.id_sucursal = m.id_sucursal_destino
        WHERE m.tipo = 'Salida'
          AND (sa.id_salida IS NULL OR sa.estatus = 'Activa')
          AND m.fecha >= ? AND m.fecha < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY etiqueta ORDER BY piezas DESC, etiqueta`, [`${mes}-01`, hasta]);

    const actual   = tendencia[tendencia.length - 1];
    const anterior = tendencia[tendencia.length - 2];
    return {
      mes,
      meta_horas: META_HORAS,
      resumen: { ...actual, anterior },
      tendencia,
      por_categoria:    porCategoria.map(r => ({ nombre: r.etiqueta, tickets: Number(r.tickets) })),
      por_sucursal:     porSucursal.map(r => ({ nombre: r.etiqueta, tickets: Number(r.tickets) })),
      consumo_sucursal: consumoSucursal.map(r => ({ nombre: r.etiqueta, piezas: Number(r.piezas) })),
      top_insumos:      consumoMes.por_insumo.slice(0, 5).map(x => ({ nombre: x.nombre, piezas: x.piezas })),
    };
  },
};

export default Indicadores;
