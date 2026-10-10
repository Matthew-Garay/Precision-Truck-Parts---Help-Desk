import { apiFetch } from "./api";

/**
 * salidasHistorial.js
 *
 * Utilidades para mostrar las SALIDAS MANUALES de insumos (folio SAL-…)
 * junto a las solicitudes (SOL-…) dentro del "Historial de Insumos":
 *   - Admin     → Pages/Admin/HistorialInsumos.jsx
 *   - Sucursal  → Pages/Usuario/SolicitudInsumo.jsx (tab Mis Solicitudes)
 *
 * El backend guarda los datos del formato dentro del motivo del movimiento:
 *   "[SAL-20261007-0001] Uso interno · Destino: X · Recibe: Y · Entrega: Z · motivo"
 * Aquí se parsean de vuelta para rearmar la HOJA de salida sin idas extra.
 */

/* ── Lectura del motivo del movimiento ──────────────────────────── */
export function parsearMotivoSalida(motivo) {
  const txt = String(motivo ?? "").trim();
  const folio = (txt.match(/\[(SAL-[^\]]+)\]/) || [])[1] || null;
  const sinFolio = txt.replace(/^\[[^\]]+\]\s*Uso interno\s*·?\s*/, "");
  const partes = sinFolio.split("·").map(s => s.trim()).filter(Boolean);
  const tomar = (pref) => {
    const i = partes.findIndex(p => p.toLowerCase().startsWith(pref.toLowerCase()));
    if (i < 0) return "";
    const v = partes[i].slice(pref.length).trim();
    partes.splice(i, 1);
    return v;
  };
  const ruta          = tomar("Ruta:");
  tomar("Destino:");            // formato antiguo (compatibilidad)
  tomar("Hora:");
  const prioridad     = tomar("Prioridad:");
  const recibe        = tomar("Recibe:");
  const entrega       = tomar("Entrega:");
  const puesto        = tomar("Puesto:");
  const sucSol        = tomar("SucSol:");
  const numEmp        = tomar("NumEmp:");
  const justificacion = tomar("Justificación:");
  // Lo que sobre sin etiqueta se trata como motivo libre.
  const texto = justificacion || partes.join(" · ");
  return { folio, ruta, prioridad, destino: ruta, recibe, entrega, puesto, sucSol, numEmp, texto };
}

/**
 * Agrupa los movimientos (uno por renglón/insumo) en UN registro por folio,
 * con forma de solicitud para poder mezclarlos en la misma tabla:
 * folio_solicitud, nombre_empleado, nombre_departamento, nombre_sucursal,
 * prioridad, estatus, total_insumos, total_piezas, insumos_nombres, fecha.
 * Devuelve la lista ordenada por fecha descendente.
 */
export function agruparSalidas(rows = []) {
  const mapa = new Map();
  rows.forEach(m => {
    const p = parsearMotivoSalida(m.motivo);
    const anio = String(m.fecha ?? "").slice(0, 4) || String(new Date().getFullYear());
    const folio = p.folio || `SAL-${anio}-${m.id_movimiento}`;
    if (!mapa.has(folio)) {
      const registró = m.nombre_empleado || "";
      mapa.set(folio, {
        es_salida:       true,
        folio,
        folio_solicitud: folio,
        id_salida:       folio,
        fecha:           m.fecha,
        destino:         p.destino || m.nombre_sucursal_destino || "",
        recibe:          p.recibe,
        entrega:         p.entrega,
        puesto:          p.puesto,
        sucSol:          p.sucSol,
        numEmp:          p.numEmp,
        motivoTexto:     p.texto,
        nombre_sucursal: m.nombre_sucursal_destino || p.destino || "",
        // En la columna "Empleado / Área": quién se lleva el material;
        // debajo se aclara quién lo registró.
        nombre_empleado:     p.entrega || p.recibe || registró,
        nombre_departamento: registró ? `Registró: ${registró}` : "Salida manual",
        registrado_por:      registró,
        // "—" para que la columna de prioridad muestre un guion neutro en vez
        // de un punto gris sin texto (una salida manual no tiene prioridad).
        prioridad:           p.prioridad || "—",
        estatus:             "Entregado",
        total_insumos:       0,
        total_piezas:        0,
        insumos_nombres:     "",
        rows:                [],
      });
    }
    const g = mapa.get(folio);
    g.rows.push(m);
    g.total_piezas += Number(m.cantidad) || 0;
    if (new Date(m.fecha) > new Date(g.fecha)) g.fecha = m.fecha;
  });
  const lista = [...mapa.values()];
  lista.forEach(g => {
    g.total_insumos   = g.rows.length;
    g.insumos_nombres = g.rows.map(r => r.nombre_insumo).filter(Boolean).join(", ");
  });
  return lista.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

/**
 * ¿Pasa la salida los filtros activos del Historial?
 * Los filtros que una salida no puede cumplir (prioridad/área) la excluyen
 * mientras estén activos; búsqueda, usuario y sí aplican.
 */
export function coincideFiltrosSalida(g, f = {}) {
  const q = String(f.busqueda ?? "").trim().toLowerCase();
  if (q) {
    const heno = [g.folio, g.entrega, g.recibe, g.destino, g.motivoTexto,
      g.nombre_empleado, g.registrado_por, g.insumos_nombres]
      .filter(Boolean).join(" ").toLowerCase();
    if (!heno.includes(q)) return false;
  }
  if (f.estatus   && f.estatus   !== "Todos" && f.estatus   !== "Entregado") return false;
  if (f.prioridad && f.prioridad !== "Todos" && g.prioridad !== f.prioridad) return false;
  if (f.area      && f.area      !== "Todos") return false;
  if (f.usuario   && f.usuario   !== "Todos"
      && g.nombre_empleado !== f.usuario && g.registrado_por !== f.usuario) return false;
  if (f.sucursal  && f.sucursal  !== "Todos" && (g.nombre_sucursal || "") !== f.sucursal) return false;
  return true;
}


/* ── Hoja de impresión (mismo payload que al registrar la salida) ─ */
export function abrirHojaSalida(g) {
  try {
    // Payload con la MISMA forma que espera ModalSalidaView (y la hoja
    // /print/salida): mapea los nombres del historial (entrega/recibe/
    // motivoTexto) a solicitante/responsable/motivo.
    const payload = {
      folio:     g.folio,
      fecha:     g.fecha,
      rows:      (g.rows ?? []).map(r => ({
        id_movimiento: r.id_movimiento,
        nombre_insumo:  r.nombre_insumo,
        descripcion:    r.descripcion,
        marca:          r.marca,
        modelo:         r.modelo,
        imagen_url:     r.imagen_url,
        cantidad:       r.cantidad,
        stock_anterior: r.stock_anterior,
        stock_nuevo:    r.stock_nuevo,
      })),
      destino:        g.destino     || "",
      responsable:    g.recibe      || "",
      motivo:         g.motivoTexto || "",
      solicitante:    g.entrega     || "",
      solicitante_puesto:   g.puesto || "",
      solicitante_sucursal: g.sucSol || "",
      solicitante_num:      g.numEmp || "",
      registrado_por: g.registrado_por || "",
    };
    // Guarda el payload para reimprimir desde /print/salida.
    sessionStorage.setItem("print_salida_datos", JSON.stringify(payload));
    // Abre la HOJA de impresión en una PESTAÑA NUEVA (con el formato
    // solicitado) en vez de reemplazar la pestaña actual. El payload ya
    // quedó en sessionStorage, que el navegador copia a la pestaña nueva.
    const win = window.open("/print/salida", "_blank");
    if (!win) {
      // El navegador bloqueó el popup: como respaldo abrimos en la misma pestaña.
      window.location.href = "/print/salida";
    }
    return true;
  } catch {
    return false;
  }
}

/* ── Descargas paginadas (el backend limita a 200/500 por petición) ─ */
async function traerEnBloques(urlBase, { bloque = 200, maxPaginas = 60 } = {}) {
  let out = [];
  for (let page = 1; page <= maxPaginas; page++) {
    const sep = urlBase.includes("?") ? "&" : "?";
    const r = await apiFetch(`${urlBase}${sep}page=${page}&limit=${bloque}`);
    const d = await r.json().catch(() => null);
    if (!d) break;
    const chunk = Array.isArray(d) ? d
      : Array.isArray(d.data) ? d.data
      : Array.isArray(d.rows) ? d.rows : [];
    out = out.concat(chunk);
    const total = Number(d.total);
    if (chunk.length < bloque || (Number.isFinite(total) && out.length >= total)) break;
  }
  return out;
}

/** Historial ADMIN: todas las salidas MANUALES (sin solicitud; esas ya
 *  aparecen como SOL- en el historial, aquí no se duplican). */
export async function traerSalidasManualesAdmin() {
  const rows = await traerEnBloques("/api/solicitudes/movimientos?tipo=Salida", { bloque: 500 });
  return rows.filter(m => !m.id_solicitud);
}

/** Historial SUCURSAL: salidas MANUALES destinadas a mi sucursal (las que
 *  vienen de una solicitud ya aparecen como folio SOL- en "Mis Solicitudes",
 *  aquí no se duplican). */
export async function traerSalidasMiSucursal() {
  const rows = await traerEnBloques("/api/solicitudes/movimientos/mis-salidas", { bloque: 500 });
  return rows.filter(m => !m.id_solicitud);
}

/** Solicitudes del Admin con sus filtros (ese endpoint acepta hasta 2000). */
export async function traerSolicitudesAdmin(qs) {
  const r = await apiFetch(`/api/solicitudes?${qs}`);
  const d = await r.json().catch(() => ({}));
  return Array.isArray(d?.data) ? d.data : [];
}

/** Solicitudes de un empleado (bloques de 200: ese endpoint recorta a 200 y
 *  además NO aplica estatus/prioridad/búsqueda, así que esos filtros se
 *  aplican en cliente sobre la lista combinada). */
export function traerSolicitudesEmpleado(idEmpleado) {
  return traerEnBloques(`/api/solicitudes/empleado/${idEmpleado}?page=1&limit=200`, { bloque: 200 });
}
