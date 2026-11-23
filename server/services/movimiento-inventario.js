/**
 * movimiento-inventario.js
 *
 * Modelo del kardex de inventario (tabla `movimiento_inventario`).
 *
 * Cada fila es un movimiento físico de material:
 *   tipo            'Entrada' (compra/reposición/aumento), 'Salida' (por una
 *                   solicitud aceptada o una salida interna) o 'Ajuste'
 *                   (disminución por corrección o conteo físico).
 *   cantidad        unidades movidas, siempre positivas.
 *   stock_anterior  stock del insumo antes del movimiento.
 *   stock_nuevo     stock del insumo después del movimiento.
 *   id_sucursal_origen / id_sucursal_destino
 *                   ruta del material: de dónde sale y a dónde llega.
 *   id_solicitud    solicitud que originó la salida (SOL-…).
 *   id_salida       salida interna que originó la salida (SAL-…). Folio,
 *                   prioridad, solicitante y justificación viven en
 *                   `salida_interna`, NO en `motivo`.
 *   id_empleado     quién registró el movimiento.
 *   motivo          texto libre solo para entradas y ajustes ("Traído de…").
 *   fecha           fecha física (puede ser retroactiva).
 *   fecha_registro  cuándo se capturó; el kardex se ordena por id (captura).
 *
 * Este modelo NUNCA modifica `insumo.stock`: lo hace cada controlador en la
 * misma transacción, con el valor exacto de stock_nuevo.
 *
 * Metodos:
 *
 *   registrar(conn, datos)
 *     Inserta un movimiento. Recibe la conexion con transaccion activa para que
 *     el descuento/aumento de stock y su movimiento queden en la misma transaccion.
 *
 *   porInsumo(id_insumo, limite)
 *     Ultimos movimientos de un insumo, mas recientes primero.
 *
 *   porSolicitud(id_solicitud)
 *     Movimientos generados por una solicitud (para la hoja impresa).
 *
 *   listar({ page, limit, tipo, id_insumo, id_sucursal, q, fecha_inicio, fecha_fin })
 *     Listado paginado con filtros, con nombres de insumo, sucursales,
 *     empleado y folio resueltos por JOIN. `q` busca por texto libre en
 *     nombre/marca/modelo del insumo, motivo o folio. Devuelve { rows, total }.
 *
 *   resumen()
 *     Totales del dia/mes para el dashboard de inventario.
 *
 * @module server/services/movimiento-inventario
 * @requires ../config/db.js
 * @exports MovimientoInventario (default)
 */
import pool from '../config/db.js';

// Nombre completo normalizado de un alias de `empleado`.
const NOMBRE = (a) =>
  `NULLIF(REGEXP_REPLACE(TRIM(CONCAT(IFNULL(${a}.nombre,''),' ',IFNULL(${a}.ap_paterno,''),' ',IFNULL(${a}.ap_materno,''))), ' +', ' '), '')`;

// FROM compartido por el listado y su COUNT(*): asi los filtros que tocan
// tablas unidas (solicitante de la salida, folio, etc.) funcionan en ambos.
const FROM_JOIN = `
  FROM movimiento_inventario m
  LEFT JOIN insumo         i  ON m.id_insumo           = i.id_insumo
  LEFT JOIN sucursal       so ON m.id_sucursal_origen  = so.id_sucursal
  LEFT JOIN sucursal       sd ON m.id_sucursal_destino = sd.id_sucursal
  LEFT JOIN solicitud      s  ON m.id_solicitud        = s.id_solicitud
  LEFT JOIN v_salida_interna sa ON m.id_salida         = sa.id_salida
  LEFT JOIN empleado       e  ON m.id_empleado         = e.id_empleado
  LEFT JOIN empleado       es ON sa.id_solicitante     = es.id_empleado
  LEFT JOIN departamento   ds ON es.id_departamento    = ds.id_departamento
  LEFT JOIN sucursal       ss ON es.id_sucursal        = ss.id_sucursal
  LEFT JOIN empleado       er ON sa.id_responsable     = er.id_empleado`;

// Los datos de una salida interna viven en `salida_interna` (normalizado) y
// ya NO dentro de `motivo`. Para no romper pantallas que solo muestran texto,
// `motivo` se compone al leer cuando el movimiento no trae uno propio.
const SELECT_JOIN = `
  SELECT m.id_movimiento, m.tipo, m.cantidad, m.stock_anterior, m.stock_nuevo,
         m.id_sucursal_origen, m.id_sucursal_destino, m.id_solicitud, m.id_salida,
         m.id_empleado, m.fecha, m.fecha_registro,
         COALESCE(m.motivo,
           CASE
             WHEN sa.id_salida IS NOT NULL THEN CONCAT('[', sa.folio_salida, '] Salida interna',
                                                       IFNULL(CONCAT(' · ', sa.justificacion), ''))
             WHEN s.id_solicitud IS NOT NULL THEN CONCAT('Entrega de material por solicitud ', s.folio_solicitud)
           END) AS motivo,
         m.id_insumo,
         i.nombre AS nombre_insumo, i.descripcion, i.marca, i.modelo, i.imagen_url,
         -- Piezas con número de serie que salieron con este movimiento (fase 4)
         (SELECT GROUP_CONCAT(u.num_serie ORDER BY u.num_serie SEPARATOR ', ')
            FROM insumo_unidad u WHERE u.id_mov_salida = m.id_movimiento) AS series,
         so.nombre_sucursal AS nombre_sucursal_origen,
         sd.nombre_sucursal AS nombre_sucursal_destino,
         s.folio_solicitud,
         ${NOMBRE("e")} AS nombre_empleado,
         -- Datos estructurados de la salida interna
         sa.folio_salida,
         sa.prioridad      AS prioridad_salida,
         sa.estatus        AS estatus_salida,
         sa.motivo_anulacion,
         sa.fecha_anulacion,
         sa.justificacion,
         sa.destino_texto,
         sa.id_solicitante,
         COALESCE(${NOMBRE("es")}, sa.solicitante_texto) AS nombre_solicitante,
         ds.nombre_departamento AS puesto_solicitante,
         ss.nombre_sucursal     AS sucursal_solicitante,
         es.num_empleado        AS num_empleado_solicitante,
         sa.id_responsable,
         COALESCE(${NOMBRE("er")}, sa.responsable_texto) AS nombre_responsable
  ${FROM_JOIN}`;

const MovimientoInventario = {

  registrar: async (conn, {
    id_insumo, tipo, cantidad, stock_anterior, stock_nuevo,
    id_sucursal_origen = null, id_sucursal_destino = null,
    id_solicitud = null, id_salida = null, id_empleado = null, motivo = null, fecha = null,
  }) => {
    const columns = [
      "id_insumo", "tipo", "cantidad", "stock_anterior", "stock_nuevo",
      "id_sucursal_origen", "id_sucursal_destino", "id_solicitud", "id_salida", "id_empleado", "motivo"
    ];
    const values = [
      id_insumo, tipo, Math.abs(cantidad), stock_anterior ?? 0, stock_nuevo ?? 0,
      id_sucursal_origen, id_sucursal_destino, id_solicitud, id_salida, id_empleado, motivo || null
    ];
    // fecha solo se incluye cuando se envía explícitamente; si se omite,
    // MySQL aplica el DEFAULT (CURRENT_TIMESTAMP) de la columna NOT NULL.
    if (fecha != null) {
      columns.push("fecha");
      values.push(fecha);
    }
    // IMPORTANTE: este metodo SOLO registra el movimiento (kardex). NUNCA toca
    // `insumo.stock`: cada llamador ya actualiza el stock en su transaccion
    // con el valor exacto de `stock_nuevo`. Sumar aqui otra vez duplicaba
    // cada entrada (bug del commit 27cc552, corregido 2026-11-15).
    const placeholders = columns.map(() => "?").join(", ");
    const [r] = await conn.query(
      `INSERT INTO movimiento_inventario (${columns.join(", ")}) VALUES (${placeholders})`,
      values
    );
    return r.insertId;
  },

  porInsumo: async (id_insumo, limite = 30) => {
    const [rows] = await pool.query(
      `${SELECT_JOIN}
       WHERE m.id_insumo = ?
       -- Kardex en orden de CAPTURA: stock_anterior/stock_nuevo se calculan en
       -- ese orden, asi que ordenar por la fecha manual (que puede ser
       -- retroactiva) mostraria la cadena de existencias rota.
       ORDER BY m.id_movimiento DESC
       LIMIT ?`,
      [id_insumo, limite]
    );
    return rows;
  },

  porSolicitud: async (id_solicitud) => {
    const [rows] = await pool.query(
      `${SELECT_JOIN}
       WHERE m.id_solicitud = ?
       ORDER BY i.nombre ASC`,
      [id_solicitud]
    );
    return rows;
  },

  listar: async ({
    page = 1, limit = 50, tipo, id_insumo, id_sucursal, id_sucursal_destino,
    id_sucursal_relacionada, manuales, folio, q, fecha_inicio, fecha_fin,
  } = {}) => {
    const where = [];
    const params = [];
    if (tipo)         { where.push("m.tipo = ?");                          params.push(tipo); }
    if (id_insumo)    { where.push("m.id_insumo = ?");                     params.push(id_insumo); }
    if (id_sucursal_destino) { where.push("m.id_sucursal_destino = ?");    params.push(id_sucursal_destino); }
    // "Salidas de mi sucursal": las que van a mi sucursal O las que pidió
    // alguien de mi sucursal. Muchas salidas viajan por un punto intermedio
    // (p. ej. Tecámac) y el destino no es la sucursal final del solicitante.
    if (id_sucursal_relacionada) {
      where.push("(m.id_sucursal_destino = ? OR es.id_sucursal = ?)");
      params.push(id_sucursal_relacionada, id_sucursal_relacionada);
    }
    if (manuales)      { where.push("m.id_solicitud IS NULL"); }
    if (folio)        { where.push("(s.folio_solicitud LIKE ? OR sa.folio_salida LIKE ?)");
                        params.push(`%${folio}%`, `%${folio}%`); }
    if (q)            { const like = `%${q}%`;
                        where.push(`(i.nombre LIKE ? OR i.marca LIKE ? OR i.modelo LIKE ?
                                     OR m.motivo LIKE ? OR IFNULL(s.folio_solicitud,'') LIKE ?
                                     OR IFNULL(sa.folio_salida,'') LIKE ? OR IFNULL(sa.justificacion,'') LIKE ?
                                     OR IFNULL(${NOMBRE("es")}, IFNULL(sa.solicitante_texto,'')) LIKE ?)`);
                        params.push(like, like, like, like, like, like, like, like); }
    if (id_sucursal)  { where.push("(m.id_sucursal_origen = ? OR m.id_sucursal_destino = ?)");
                        params.push(id_sucursal, id_sucursal); }
    if (fecha_inicio) { where.push("DATE(m.fecha) >= ?");                  params.push(fecha_inicio); }
    if (fecha_fin)    { where.push("DATE(m.fecha) <= ?");                  params.push(fecha_fin); }
    const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total ${FROM_JOIN} ${whereSQL}`,
      params
    );
    const [rows] = await pool.query(
      `${SELECT_JOIN}
       ${whereSQL}
       ORDER BY m.fecha DESC, m.id_movimiento DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit]
    );
    return { rows, total };
  },

  resumen: async () => {
    // Los limites se calculan en MySQL (zona de la conexion, -06:00). Antes se
    // armaban con toISOString() (UTC) y el "dia" quedaba recorrido 6 horas.
    const [[row]] = await pool.query(
      `SELECT
          COALESCE(SUM(DATE(fecha) = CURDATE() AND tipo = 'Entrada'), 0) AS entradas_hoy,
          COALESCE(SUM(DATE(fecha) = CURDATE() AND tipo = 'Salida'),  0) AS salidas_hoy,
          COALESCE(SUM(fecha >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND fecha < DATE_FORMAT(CURDATE(), '%Y-%m-01') + INTERVAL 1 MONTH AND tipo = 'Entrada'), 0) AS entradas_mes,
          COALESCE(SUM(fecha >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND fecha < DATE_FORMAT(CURDATE(), '%Y-%m-01') + INTERVAL 1 MONTH AND tipo = 'Salida'),  0) AS salidas_mes,
          COUNT(*) AS total_movimientos
        FROM movimiento_inventario`
    );
    return row ?? {};
  },

  /**
   * consumo({ desde, hasta })
   * Material que SALIÓ del inventario entre dos fechas (AAAA-MM-DD, ambas
   * inclusive): salidas internas ACTIVAS y entregas por solicitud. El área es
   * la del solicitante (salida interna) o la del empleado (solicitud).
   *
   * Devuelve:
   *   La SUCURSAL es la de destino de la salida; si no tiene, la del empleado
   *   que la pidió.
   *
   *   detalle    [{ mes, sucursal, area, id_insumo, nombre, piezas }]  (para Excel)
   *   por_insumo [{ id_insumo, nombre, marca, modelo, stock, piezas,
   *                 operaciones, promedio_mensual, meses_cobertura }]
   *   por_area   [{ area, piezas, operaciones }]
   *   por_sucursal [{ sucursal, piezas, operaciones, insumos: [{ id_insumo, nombre, piezas }] }]
   *   por_mes    [{ mes, piezas }]   (todos los meses del rango, aunque sean 0)
   *   totales    { piezas, operaciones, insumos, meses }
   */
  consumo: async ({ desde, hasta }) => {
    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(m.fecha, '%Y-%m') AS mes,
              m.id_insumo, i.nombre, i.marca, i.modelo, i.stock,
              COALESCE(asa.nombre_area, dsa.nombre_departamento, aso.nombre_area, dso.nombre_departamento, 'Sin área') AS area,
              COALESCE(sd.nombre_sucursal, sa.destino_texto, ss.nombre_sucursal, 'Sin sucursal') AS sucursal,
              SUM(m.cantidad) AS piezas,
              GROUP_CONCAT(DISTINCT COALESCE(CONCAT('SAL', m.id_salida), CONCAT('SOL', m.id_solicitud), CONCAT('MOV', m.id_movimiento))) AS ops
         FROM movimiento_inventario m
         JOIN insumo i               ON i.id_insumo = m.id_insumo
         LEFT JOIN v_salida_interna sa ON sa.id_salida = m.id_salida
         LEFT JOIN empleado esa      ON esa.id_empleado = sa.id_solicitante
         LEFT JOIN departamento dsa  ON dsa.id_departamento = esa.id_departamento
         LEFT JOIN area asa          ON asa.id_area = dsa.id_area
         LEFT JOIN solicitud s       ON s.id_solicitud = m.id_solicitud
         LEFT JOIN empleado eso      ON eso.id_empleado = s.id_empleado
         LEFT JOIN departamento dso  ON dso.id_departamento = eso.id_departamento
         LEFT JOIN area aso          ON aso.id_area = dso.id_area
         LEFT JOIN sucursal sd       ON sd.id_sucursal = m.id_sucursal_destino
         LEFT JOIN sucursal ss       ON ss.id_sucursal = COALESCE(esa.id_sucursal, eso.id_sucursal)
        WHERE m.tipo = 'Salida'
          AND (sa.id_salida IS NULL OR sa.estatus = 'Activa')
          AND m.fecha >= ? AND m.fecha < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY mes, m.id_insumo, area, sucursal
        ORDER BY mes, piezas DESC`,
      [desde, hasta]
    );

    // Meses del rango (para que los meses sin consumo aparezcan con 0).
    const meses = [];
    let [y, mth] = desde.split("-").map(Number);
    const [by, bm] = hasta.split("-").map(Number);
    while (y < by || (y === by && mth <= bm)) {
      meses.push(`${y}-${String(mth).padStart(2, "0")}`);
      if (mth === 12) { y++; mth = 1; } else mth++;
    }

    const porInsumo = new Map();
    const porArea   = new Map();
    const porSucursal = new Map();
    const porMes    = new Map(meses.map(m => [m, 0]));
    const opsTotal  = new Set();
    for (const r of rows) {
      const piezas = Number(r.piezas) || 0;
      const ops = String(r.ops || "").split(",").filter(Boolean);
      ops.forEach(o => opsTotal.add(o));

      const ins = porInsumo.get(r.id_insumo) || { id_insumo: r.id_insumo, nombre: r.nombre, marca: r.marca, modelo: r.modelo, stock: Number(r.stock) || 0, piezas: 0, _ops: new Set() };
      ins.piezas += piezas; ops.forEach(o => ins._ops.add(o));
      porInsumo.set(r.id_insumo, ins);

      const ar = porArea.get(r.area) || { area: r.area, piezas: 0, _ops: new Set() };
      ar.piezas += piezas; ops.forEach(o => ar._ops.add(o));
      porArea.set(r.area, ar);

      const su = porSucursal.get(r.sucursal) || { sucursal: r.sucursal, piezas: 0, _ops: new Set(), _ins: new Map() };
      su.piezas += piezas; ops.forEach(o => su._ops.add(o));
      const si = su._ins.get(r.id_insumo) || { id_insumo: r.id_insumo, nombre: r.nombre, piezas: 0 };
      si.piezas += piezas; su._ins.set(r.id_insumo, si);
      porSucursal.set(r.sucursal, su);

      porMes.set(r.mes, (porMes.get(r.mes) || 0) + piezas);
    }
    // El promedio se calcula desde el PRIMER mes con consumo del rango: los
    // meses previos a que se empezara a registrar en el sistema darían 0 y
    // bajarían el promedio de forma engañosa.
    const primero = meses.findIndex(m => (porMes.get(m) || 0) > 0);
    const nMeses = Math.max(1, primero >= 0 ? meses.length - primero : meses.length);
    const fin = (x) => { const { _ops, ...resto } = x; return { ...resto, operaciones: _ops.size }; };
    const por_insumo = [...porInsumo.values()].map(fin).map(x => {
      const promedio = x.piezas / nMeses;
      return {
        ...x,
        promedio_mensual: Math.round(promedio * 10) / 10,
        // Meses que alcanza el stock actual al ritmo de consumo del periodo.
        meses_cobertura: promedio > 0 ? Math.round((x.stock / promedio) * 10) / 10 : null,
      };
    }).sort((a, b) => b.piezas - a.piezas || String(a.nombre).localeCompare(String(b.nombre)));

    return {
      detalle: rows.map(r => ({ mes: r.mes, sucursal: r.sucursal, area: r.area, id_insumo: r.id_insumo, nombre: r.nombre, piezas: Number(r.piezas) || 0 })),
      por_insumo,
      por_area: [...porArea.values()].map(fin).sort((a, b) => b.piezas - a.piezas),
      por_sucursal: [...porSucursal.values()].map(({ _ops, _ins, ...s }) => ({
        ...s, operaciones: _ops.size,
        insumos: [..._ins.values()].sort((a, b) => b.piezas - a.piezas || String(a.nombre).localeCompare(String(b.nombre))),
      })).sort((a, b) => b.piezas - a.piezas),
      por_mes:  [...porMes.entries()].map(([mes, piezas]) => ({ mes, piezas })),
      totales: {
        piezas: por_insumo.reduce((a, x) => a + x.piezas, 0),
        operaciones: opsTotal.size,
        insumos: por_insumo.length,
        meses: nMeses,
      },
    };
  },
  /**
   * frecuencia({ desde, hasta, agrupar, hoy })
   * Cada cuánto se entrega cada insumo a cada área / puesto / sucursal.
   *
   *   agrupar: "area" (puestos agrupados en área; un puesto sin área cuenta como
   *            su propio nombre) | "puesto" | "sucursal" (sucursal de destino).
   *
   * Por cada grupo + insumo:
   *   entregas        días distintos con entrega (salida interna activa o solicitud aceptada)
   *   piezas          total entregado en el rango
   *   cada_dias       MEDIANA de días entre entregas (null con < 2 entregas):
   *                   la mediana no se mueve por una entrega aislada atrasada
   *   piezas_por_entrega, por_semana (piezas / semanas entre 1.ª y última entrega)
   *   ultima, proxima (ultima + cada_dias), estado: "atrasado" | "pronto" (≤ 7 días) | "al_dia"
   *   confianza       "baja" (2 entregas) | "media" (3–4) | "alta" (5+)
   * Orden: primero lo que ya toca o está atrasado, luego por frecuencia.
   */
  frecuencia: async ({ desde, hasta, agrupar = "sucursal", hoy = new Date() }) => {
    const GRUPO = {
      area:     "COALESCE(aa.nombre_area, d.nombre_departamento, 'Sin área')",
      puesto:   "COALESCE(d.nombre_departamento, 'Sin puesto')",
      sucursal: "COALESCE(sd.nombre_sucursal, sa.destino_texto, se.nombre_sucursal, 'Sin sucursal')",
    }[agrupar];
    if (!GRUPO) throw Object.assign(new Error("Agrupación no válida"), { statusCode: 400 });
    const [rows] = await pool.query(
      `SELECT ${GRUPO} AS grupo, m.id_insumo, i.nombre, i.marca, i.modelo, i.stock,
              DATE_FORMAT(m.fecha, '%Y-%m-%d') AS dia, SUM(m.cantidad) AS piezas
         FROM movimiento_inventario m
         JOIN insumo i                ON i.id_insumo = m.id_insumo
         LEFT JOIN v_salida_interna sa ON sa.id_salida = m.id_salida
         LEFT JOIN solicitud s        ON s.id_solicitud = m.id_solicitud
         LEFT JOIN empleado e         ON e.id_empleado = COALESCE(sa.id_solicitante, s.id_empleado)
         LEFT JOIN departamento d     ON d.id_departamento = e.id_departamento
         LEFT JOIN area aa            ON aa.id_area = d.id_area
         LEFT JOIN sucursal sd        ON sd.id_sucursal = m.id_sucursal_destino
         LEFT JOIN sucursal se        ON se.id_sucursal = e.id_sucursal
        WHERE m.tipo = 'Salida'
          AND (sa.id_salida IS NULL OR sa.estatus = 'Activa')
          AND m.fecha >= ? AND m.fecha < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY grupo, m.id_insumo, dia
        ORDER BY grupo, m.id_insumo, dia`,
      [desde, hasta]
    );
    const DIA = 86400000;
    const aFecha = (s) => { const [y, mo, d] = s.split("-").map(Number); return new Date(y, mo - 1, d); };
    const iso = (f) => `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
    const hoyDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const mediana = (v) => { const o = [...v].sort((a, b) => a - b); const k = o.length >> 1; return o.length % 2 ? o[k] : (o[k - 1] + o[k]) / 2; };

    // Entregas separadas por 2 días o menos son la misma reposición entregada
    // en partes (06/10 y 07/10): se juntan para no reportar "cada 1 día".
    const JUNTAR_DIAS = 2;
    const grupos = new Map();
    for (const r of rows) {
      const k = `${r.grupo}\u0000${r.id_insumo}`;
      if (!grupos.has(k)) grupos.set(k, { grupo: r.grupo, id_insumo: r.id_insumo, nombre: r.nombre, marca: r.marca, modelo: r.modelo, stock: Number(r.stock) || 0, dias: [] });
      const dias = grupos.get(k).dias, piezas = Number(r.piezas) || 0, prev = dias[dias.length - 1];
      if (prev && (aFecha(r.dia) - aFecha(prev.dia)) / DIA <= JUNTAR_DIAS) prev.piezas += piezas;
      else dias.push({ dia: r.dia, piezas });
    }
    const res = [...grupos.values()].map(g => {
      const fechas = g.dias.map(x => aFecha(x.dia));
      const piezas = g.dias.reduce((a, x) => a + x.piezas, 0);
      const huecos = fechas.slice(1).map((f, i) => Math.round((f - fechas[i]) / DIA));
      const cada = huecos.length ? Math.round(mediana(huecos)) : null;
      const ultima = fechas[fechas.length - 1];
      const proxima = cada ? new Date(ultima.getTime() + cada * DIA) : null;
      const faltan = proxima ? Math.round((proxima - hoyDia) / DIA) : null;
      const semanas = Math.max(1, (ultima - fechas[0]) / (7 * DIA));
      return {
        grupo: g.grupo, id_insumo: g.id_insumo, nombre: g.nombre, marca: g.marca, modelo: g.modelo, stock: g.stock,
        entregas: g.dias.length, piezas,
        cada_dias: cada,
        cada_semanas: cada ? Math.round((cada / 7) * 10) / 10 : null,
        piezas_por_entrega: Math.round((piezas / g.dias.length) * 10) / 10,
        por_semana: g.dias.length >= 2 ? Math.round((piezas / semanas) * 100) / 100 : null,
        primera: iso(fechas[0]), ultima: iso(ultima),
        proxima: proxima ? iso(proxima) : null,
        faltan_dias: faltan,
        estado: faltan == null ? null : faltan < 0 ? "atrasado" : faltan <= 7 ? "pronto" : "al_dia",
        confianza: g.dias.length >= 5 ? "alta" : g.dias.length >= 3 ? "media" : g.dias.length === 2 ? "baja" : null,
        historial: g.dias,
      };
    });
    const peso = { atrasado: 0, pronto: 1, al_dia: 2 };
    res.sort((a, b) =>
      (a.cada_dias == null) - (b.cada_dias == null) ||
      (peso[a.estado] ?? 3) - (peso[b.estado] ?? 3) ||
      (a.faltan_dias ?? 1e9) - (b.faltan_dias ?? 1e9) ||
      String(a.grupo).localeCompare(String(b.grupo)) || String(a.nombre).localeCompare(String(b.nombre)));
    return {
      agrupar,
      con_frecuencia: res.filter(x => x.cada_dias != null).length,
      sin_frecuencia: res.filter(x => x.cada_dias == null).length,
      filas: res,
    };
  },
};

export default MovimientoInventario;
