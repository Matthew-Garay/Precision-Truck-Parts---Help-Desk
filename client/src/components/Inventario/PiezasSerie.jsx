/**
 * PiezasSerie.jsx — Equipos controlados pieza por pieza con número de serie (fase 4).
 *
 *   <PiezasSerie insumo T onCambio />   sección del detalle del insumo (solo admin):
 *       - sin control: botón para activarlo capturando una serie por pieza en stock;
 *       - con control: lista de piezas (en almacén / dónde salió), corregir serie o
 *         estado, y quitar el control si ninguna pieza se ha movido.
 *   <ElegirSeries idInsumo seleccion onChange T />   en una salida interna: marcar
 *       qué piezas salen (la cantidad es el número de piezas marcadas).
 *
 * Reglas (las valida el servidor, services/unidad.js): stock = piezas en almacén;
 * las entradas traen series; las solicitudes aceptadas toman las más antiguas.
 *
 * @module client/components/Inventario/PiezasSerie
 */
import { useEffect, useMemo, useState } from "react";
import { apiFetch, textoError, textoExcepcion } from "../../services/api-client.js";
import { useToast } from "../Feedback.jsx";
import { fechaCorta } from "../../utils/fechas.js";

const ESTADOS = ["Excelente", "Bueno", "Regular", "Malo", "Dañado"];
/** "A1\nA2, A3" → ["A1","A2","A3"] (renglones o comas). */
export const leerSeries = (texto) => String(texto ?? "").split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);

function usePiezas(idInsumo, activo = true) {
  const [piezas, setPiezas] = useState(null);
  const [error, setError] = useState("");
  const cargar = async () => {
    if (!idInsumo) return;
    try {
      const r = await apiFetch(`/api/solicitudes/insumos/${Number(idInsumo)}/unidades`);
      const d = await r.json().catch(() => []);
      if (!r.ok) throw new Error(textoError(d, r.status, "No se pudieron cargar las piezas"));
      setPiezas(Array.isArray(d) ? d : []); setError("");
    } catch (e) { setError(textoExcepcion(e, "No se pudieron cargar las piezas")); setPiezas([]); }
  };
  useEffect(() => { if (activo) cargar(); }, [idInsumo, activo]); // eslint-disable-line react-hooks/exhaustive-deps
  return { piezas, error, cargar };
}

export default function PiezasSerie({ insumo, T, onCambio }) {
  const toast = useToast();
  const controlado = Number(insumo?.control_serie) === 1;
  const { piezas, error, cargar } = usePiezas(insumo?.id_insumo, controlado);
  const [capturando, setCapturando] = useState(false);
  const [texto, setTexto] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [filtro, setFiltro] = useState("almacen");
  const [editando, setEditando] = useState(null);   // { id, valor } de la serie que se corrige
  const stock = Number(insumo?.stock) || 0;
  const series = leerSeries(texto);

  const llamar = async (url, opciones, ok) => {
    setGuardando(true);
    try {
      const r = await apiFetch(url, opciones);
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast.error(textoError(d, r.status, "No se pudo guardar")); return false; }
      toast.success(ok); return true;
    } catch (e) { toast.error(textoExcepcion(e)); return false; }
    finally { setGuardando(false); }
  };

  const activar = async () => {
    if (series.length !== stock) { toast.error(`Hay ${stock} pieza(s) en stock: captura ${stock} número(s) de serie (llevas ${series.length}).`); return; }
    if (await llamar(`/api/solicitudes/insumos/${insumo.id_insumo}/unidades/activar`, { method: "POST", body: { series } }, "Control por pieza activado")) {
      setCapturando(false); setTexto(""); onCambio?.({ ...insumo, control_serie: 1 });
    }
  };
  const desactivar = async () => {
    if (await llamar(`/api/solicitudes/insumos/${insumo.id_insumo}/unidades/desactivar`, { method: "POST" }, "Control por pieza quitado"))
      onCambio?.({ ...insumo, control_serie: 0 });
  };
  const corregir = async (p, cambio) => {
    if (await llamar(`/api/solicitudes/insumos/${insumo.id_insumo}/unidades/${p.id_unidad}`, { method: "PATCH", body: cambio }, "Pieza actualizada")) cargar();
  };

  const caja = { border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 8 };
  const titulo = { margin: 0, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: T.textMuted };
  const boton = (fondo, color = "#fff") => ({ padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, border: "none", cursor: guardando ? "wait" : "pointer", background: fondo, color, opacity: guardando ? 0.6 : 1 });

  if (!controlado) {
    return (
      <div style={caja}>
        <p style={titulo}>Piezas con número de serie</p>
        {!capturando ? (
          <>
            <p style={{ margin: 0, fontSize: 12, color: T.textMuted, lineHeight: 1.5 }}>
              Este insumo se controla por cantidad. Para equipos como laptops o impresoras puedes controlarlo
              pieza por pieza: cada entrada pedirá las series y cada salida, elegir cuáles salen.
            </p>
            <button type="button" onClick={() => setCapturando(true)} disabled={guardando} style={{ ...boton("transparent", T.orange), border: `1px solid ${T.orange}`, alignSelf: "flex-start" }}>
              Controlar pieza por pieza
            </button>
          </>
        ) : (
          <>
            <label style={{ fontSize: 12, color: T.text }}>
              Escribe la serie de cada una de las <b>{stock}</b> pieza{stock !== 1 ? "s" : ""} en stock (una por renglón):
              <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={Math.min(8, Math.max(3, stock))} autoFocus
                placeholder={"5CD1234ABC\n5CD1234ABD"}
                style={{ marginTop: 6, width: "100%", boxSizing: "border-box", padding: 8, borderRadius: 6, fontFamily: "monospace", fontSize: 12, border: `1px solid ${T.border}`, background: T.bg, color: T.text, resize: "vertical" }} />
            </label>
            <span style={{ fontSize: 11, fontWeight: 700, color: series.length === stock ? "#16a34a" : "#d97706" }}>
              {series.length} de {stock} capturada{stock !== 1 ? "s" : ""}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={activar} disabled={guardando} style={boton(T.orange)}>Activar</button>
              <button type="button" onClick={() => { setCapturando(false); setTexto(""); }} disabled={guardando} style={{ ...boton("transparent", T.textMuted), border: `1px solid ${T.border}` }}>Cancelar</button>
            </div>
          </>
        )}
      </div>
    );
  }

  const lista = (piezas ?? []).filter(p => filtro === "todas" || (filtro === "almacen" ? Number(p.en_almacen) === 1 : Number(p.en_almacen) === 0));
  const nAlmacen = (piezas ?? []).filter(p => Number(p.en_almacen) === 1).length;
  return (
    <div style={caja}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <p style={titulo}>Piezas con número de serie · {nAlmacen} en almacén</p>
        <div style={{ display: "flex", gap: 4 }}>
          {[["almacen", "En almacén"], ["salieron", "Salieron"], ["todas", "Todas"]].map(([k, l]) => (
            <button key={k} type="button" onClick={() => setFiltro(k)}
              style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
                border: `1px solid ${filtro === k ? T.orange : T.border}`, background: filtro === k ? `${T.orange}18` : "transparent", color: filtro === k ? T.orange : T.textMuted }}>{l}</button>
          ))}
        </div>
      </div>
      {error && <p role="alert" style={{ margin: 0, fontSize: 12, color: "#dc2626" }}>{error}</p>}
      {piezas === null ? <p style={{ margin: 0, fontSize: 12, color: T.textMuted }}>Cargando…</p> : lista.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: T.textMuted }}>No hay piezas en esta vista.</p>
      ) : (
        <div style={{ maxHeight: 220, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <tbody>
              {lista.map(p => (
                <tr key={p.id_unidad} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: "5px 4px", fontFamily: "monospace", fontWeight: 700, color: T.text }}>
                    {editando?.id === p.id_unidad ? (
                      <form onSubmit={async e => { e.preventDefault(); const v = editando.valor.trim(); if (v && v !== p.num_serie) await corregir(p, { num_serie: v }); setEditando(null); }}
                        style={{ display: "flex", gap: 4 }}>
                        <input autoFocus value={editando.valor} maxLength={100} aria-label="Número de serie correcto"
                          onChange={e => setEditando({ id: p.id_unidad, valor: e.target.value })}
                          onKeyDown={e => { if (e.key === "Escape") setEditando(null); }}
                          style={{ width: 130, fontFamily: "monospace", fontSize: 12, padding: "2px 4px", borderRadius: 4, border: `1px solid ${T.orange}`, background: T.bg, color: T.text }} />
                        <button type="submit" disabled={guardando} style={{ fontSize: 11, border: "none", background: T.orange, color: "#fff", borderRadius: 4, padding: "2px 6px", cursor: "pointer" }}>Guardar</button>
                        <button type="button" onClick={() => setEditando(null)} style={{ fontSize: 11, border: "none", background: "transparent", color: T.textMuted, cursor: "pointer" }}>Cancelar</button>
                      </form>
                    ) : p.num_serie}
                  </td>
                  <td style={{ padding: "5px 4px" }}>
                    {Number(p.en_almacen) === 1 ? (
                      <select value={p.estado} disabled={guardando} onChange={e => corregir(p, { estado: e.target.value })}
                        style={{ fontSize: 11, padding: "2px 4px", borderRadius: 4, border: `1px solid ${T.border}`, background: T.bg, color: T.text }}>
                        {ESTADOS.map(e => <option key={e}>{e}</option>)}
                      </select>
                    ) : <span style={{ color: T.textMuted }}>{p.estado}</span>}
                  </td>
                  <td style={{ padding: "5px 4px", color: T.textMuted }}>
                    {Number(p.en_almacen) === 1
                      ? <span style={{ color: "#16a34a", fontWeight: 700 }}>En almacén</span>
                      : <>Salió {fechaCorta(p.fecha_salida)} · {p.folio_salida || p.folio_solicitud || ""}{p.destino ? ` → ${p.destino}` : ""}</>}
                  </td>
                  <td style={{ padding: "5px 4px", textAlign: "right" }}>
                    {Number(p.en_almacen) === 1 && editando?.id !== p.id_unidad && (
                      <button type="button" disabled={guardando} title="Corregir número de serie"
                        onClick={() => setEditando({ id: p.id_unidad, valor: p.num_serie })}
                        style={{ fontSize: 11, border: "none", background: "transparent", color: T.orange, cursor: "pointer", fontWeight: 700 }}>Corregir</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ margin: 0, fontSize: 11, color: T.textFaint, lineHeight: 1.45 }}>
        Las entradas piden las series de lo que llega y las salidas internas, elegir cuáles salen. Al aceptar una
        solicitud salen las piezas con más tiempo en almacén.
        {" "}<button type="button" onClick={desactivar} disabled={guardando}
          style={{ fontSize: 11, border: "none", background: "transparent", color: T.textMuted, textDecoration: "underline", cursor: "pointer", padding: 0 }}>
          Quitar el control por pieza
        </button> (solo si ninguna pieza se ha movido).
      </p>
    </div>
  );
}

/** Lista de piezas en almacén para marcar cuáles salen en una salida interna. */
export function ElegirSeries({ idInsumo, seleccion = [], onChange, T }) {
  const { piezas, error } = usePiezas(idInsumo, true);
  const [q, setQ] = useState("");
  const disponibles = useMemo(() => (piezas ?? []).filter(p => Number(p.en_almacen) === 1), [piezas]);
  const visibles = disponibles.filter(p => !q.trim() || p.num_serie.toLowerCase().includes(q.trim().toLowerCase()));
  const marcada = (s) => seleccion.includes(s);
  const alternar = (s) => onChange(marcada(s) ? seleccion.filter(x => x !== s) : [...seleccion, s]);
  return (
    <div style={{ border: `1px dashed ${T.border}`, borderRadius: 8, padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: T.textMuted }}>¿QUÉ PIEZAS SALEN? · {seleccion.length} marcada{seleccion.length !== 1 ? "s" : ""}</span>
        {disponibles.length > 6 && (
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar serie…"
            style={{ flex: "1 1 120px", height: 24, fontSize: 11, padding: "0 6px", borderRadius: 4, border: `1px solid ${T.border}`, background: T.bg, color: T.text }} />
        )}
      </div>
      {error && <span style={{ fontSize: 11, color: "#dc2626" }}>{error}</span>}
      {piezas === null ? <span style={{ fontSize: 11, color: T.textMuted }}>Cargando piezas…</span> : disponibles.length === 0 ? (
        <span style={{ fontSize: 11, color: "#dc2626" }}>No hay piezas en almacén.</span>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 120, overflowY: "auto" }}>
          {visibles.map(p => (
            <label key={p.id_unidad} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontFamily: "monospace", cursor: "pointer",
              padding: "3px 6px", borderRadius: 4, border: `1px solid ${marcada(p.num_serie) ? T.orange : T.border}`, background: marcada(p.num_serie) ? `${T.orange}14` : "transparent", color: T.text }}>
              <input type="checkbox" checked={marcada(p.num_serie)} onChange={() => alternar(p.num_serie)} />
              {p.num_serie}{p.estado && p.estado !== "Bueno" ? <span style={{ color: T.textMuted }}> ({p.estado})</span> : null}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
