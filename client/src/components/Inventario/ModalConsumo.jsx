/**
 * ModalConsumo.jsx
 *
 * Reporte de CONSUMO de insumos, agrupado sobre todo POR SUCURSAL: cuánto se
 * usa de cada cosa, cuánto al mes, cada cuánto se pide y para cuánto alcanza
 * el stock. Cuenta el material que salió del inventario (salidas internas
 * activas y solicitudes aceptadas); las salidas anuladas no cuentan.
 *
 * Todo se filtra con un clic: periodo rápido (1/3/6/12 meses) y sucursal.
 * "Alcanza" = meses que dura el stock actual al ritmo de consumo del periodo.
 *
 * Export default: ModalConsumo  ·  export: textoFrecuencia
 * Props: T, onClose.
 * Endpoints: GET /api/solicitudes/consumo, GET /api/solicitudes/consumo/frecuencia
 *
 * @module client/components/Inventario/ModalConsumo
 */
import { useEffect, useMemo, useState } from "react";
import { BarChart3, FileDown, Store, Package, CalendarRange, Repeat, ChevronRight } from "lucide-react";
// ExcelJS y file-saver se cargan solo al exportar (pesan ≈1 MB).
import Modal from "../Modal.jsx";
import { apiFetch } from "../../services/api-client.js";
import { fechaCorta, mesAnio } from "../../utils/fechas.js";

const pad = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const mesCorto = (ym) => { const [y, m] = ym.split("-").map(Number); return `${MESES_CORTOS[m - 1]} ${String(y).slice(2)}`; };
const redondea = (n) => (n >= 10 ? Math.round(n) : Math.round(n * 10) / 10);

/** "cada 5 días" · "cada ~4 semanas" · "cada ~3 meses" */
export function textoFrecuencia(dias) {
  if (dias == null) return "—";
  if (dias < 7) return `cada ${dias} día${dias !== 1 ? "s" : ""}`;
  if (dias < 60) { const s = Math.round(dias / 7); return `cada ~${s} semana${s !== 1 ? "s" : ""}`; }
  const m = Math.round(dias / 30); return `cada ~${m} meses`;
}
const ESTADO_FREC = {
  atrasado: { texto: "Ya toca", color: "#dc2626" },
  pronto:   { texto: "Esta semana", color: "#d97706" },
  al_dia:   { texto: "Al día", color: "#16a34a" },
};
/** Semáforo de cobertura (meses que alcanza el stock). */
function alcance(c) {
  if (c == null) return { texto: "—", color: "#94a3b8" };
  if (c < 1) return { texto: c < 0.25 ? "Comprar ya" : `${Math.max(1, Math.round(c * 4.3))} sem`, color: "#dc2626" };
  return { texto: `${redondea(c)} mes${c >= 1.05 ? "es" : ""}`, color: c < 2 ? "#d97706" : "#16a34a" };
}
const PERIODOS = [[1, "1 mes"], [3, "3 meses"], [6, "6 meses"], [12, "1 año"]];
const TODAS = "__todas__";

export default function ModalConsumo({ T, onClose }) {
  const hoy = new Date();
  const desdeMeses = (n) => iso(new Date(hoy.getFullYear(), hoy.getMonth() - (n - 1), 1));
  const [periodo, setPeriodo] = useState(6);          // meses, o 0 = personalizado
  const [desde, setDesde] = useState(desdeMeses(6));
  const [hasta, setHasta] = useState(iso(hoy));
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [vista, setVista] = useState("sucursal");     // sucursal | insumo | mes | frecuencia
  const [sucursal, setSucursal] = useState(TODAS);
  const [busca, setBusca] = useState("");
  const [frec, setFrec] = useState(null);
  const [cargandoFrec, setCargandoFrec] = useState(false);

  // Carga automática al cambiar el periodo (sin botón "Consultar").
  useEffect(() => {
    if (!desde || !hasta || desde > hasta) { setError("Revisa el rango de fechas."); return; }
    let vivo = true;
    setCargando(true); setError(""); setFrec(null);
    apiFetch(`/api/solicitudes/consumo?fecha_inicio=${desde}&fecha_fin=${hasta}`)
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d?.error || `HTTP ${r.status}`); if (vivo) setDatos(d); })
      .catch(e => vivo && setError(e.message || "No se pudo cargar el reporte"))
      .finally(() => vivo && setCargando(false));
    return () => { vivo = false; };
  }, [desde, hasta]);

  useEffect(() => {
    if (vista !== "frecuencia" || frec || !datos) return;
    setCargandoFrec(true);
    apiFetch(`/api/solicitudes/consumo/frecuencia?agrupar=sucursal&fecha_inicio=${desde}&fecha_fin=${hasta}`)
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d?.error || `HTTP ${r.status}`); setFrec(d); })
      .catch(e => setError(e.message || "No se pudo calcular la frecuencia"))
      .finally(() => setCargandoFrec(false));
  }, [vista, frec, datos, desde, hasta]);

  const elegirPeriodo = (n) => { setPeriodo(n); if (n) { setDesde(desdeMeses(n)); setHasta(iso(hoy)); } };

  // ── Datos según la sucursal elegida ──────────────────────────────────
  const meses = datos?.totales?.meses || 1;
  const vistaDatos = useMemo(() => {
    if (!datos) return null;
    const global = new Map(datos.por_insumo.map(x => [x.id_insumo, x]));
    const filas = sucursal === TODAS ? datos.detalle : datos.detalle.filter(d => d.sucursal === sucursal);
    const porInsumo = new Map(), porMes = new Map(datos.por_mes.map(m => [m.mes, 0]));
    for (const d of filas) {
      const g = global.get(d.id_insumo) || {};
      const x = porInsumo.get(d.id_insumo) || { id_insumo: d.id_insumo, nombre: d.nombre, marca: g.marca, stock: g.stock ?? 0, cobertura: g.meses_cobertura, piezas: 0 };
      x.piezas += d.piezas; porInsumo.set(d.id_insumo, x);
      porMes.set(d.mes, (porMes.get(d.mes) || 0) + d.piezas);
    }
    const insumos = [...porInsumo.values()].map(x => ({ ...x, alMes: x.piezas / meses }))
      .sort((a, b) => b.piezas - a.piezas || String(a.nombre).localeCompare(String(b.nombre)));
    const piezas = insumos.reduce((a, x) => a + x.piezas, 0);
    return {
      insumos, piezas,
      porMes: [...porMes.entries()].map(([mes, p]) => ({ mes, piezas: p })),
      porComprar: insumos.filter(x => x.cobertura != null && x.cobertura < 1).length,
    };
  }, [datos, sucursal, meses]);

  const sucursales = datos?.por_sucursal ?? [];
  const totalGlobal = datos?.totales?.piezas || 0;
  const q = busca.trim().toLowerCase();
  const insumosVisibles = (vistaDatos?.insumos ?? []).filter(x => !q || `${x.nombre} ${x.marca ?? ""}`.toLowerCase().includes(q));
  const filasFrec = (frec?.filas ?? []).filter(x => x.cada_dias != null
    && (sucursal === TODAS || x.grupo === sucursal)
    && (!q || `${x.grupo} ${x.nombre} ${x.marca ?? ""}`.toLowerCase().includes(q)));
  const maxIns = Math.max(1, ...(vistaDatos?.insumos ?? []).map(x => x.piezas));
  const maxMes = Math.max(1, ...(vistaDatos?.porMes ?? []).map(m => m.piezas));

  const exportar = async () => {
    if (!datos) return;
    const [{ default: ExcelJS }, { saveAs }] = await Promise.all([import("exceljs"), import("file-saver")]);
    const wb = new ExcelJS.Workbook();
    const hoja = (nombre, cols, filas) => {
      const ws = wb.addWorksheet(nombre);
      ws.columns = cols;
      ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF47920" } };
      filas.forEach(f => ws.addRow(f));
    };
    hoja("Por sucursal", [{ header: "Sucursal", key: "sucursal", width: 32 }, { header: "Piezas", key: "piezas", width: 10 },
      { header: "Al mes", key: "alMes", width: 10 }, { header: "Salidas", key: "operaciones", width: 10 }, { header: "Lo que más usa", key: "top", width: 60 }],
      sucursales.map(s => ({ ...s, alMes: redondea(s.piezas / meses), top: s.insumos.slice(0, 5).map(i => `${i.nombre} (${i.piezas})`).join(", ") })));
    hoja("Por insumo", [{ header: "Insumo", key: "nombre", width: 45 }, { header: "Marca", key: "marca", width: 18 },
      { header: "Piezas", key: "piezas", width: 10 }, { header: "Al mes", key: "promedio_mensual", width: 10 },
      { header: "Stock", key: "stock", width: 10 }, { header: "Alcanza (meses)", key: "meses_cobertura", width: 16 }], datos.por_insumo);
    hoja("Por mes", [{ header: "Mes", key: "mes", width: 12 }, { header: "Piezas", key: "piezas", width: 10 }],
      datos.por_mes.map(x => ({ ...x, mes: mesAnio(x.mes) })));
    hoja("Detalle", [{ header: "Mes", key: "mes", width: 12 }, { header: "Sucursal", key: "sucursal", width: 30 }, { header: "Área", key: "area", width: 28 },
      { header: "Insumo", key: "nombre", width: 45 }, { header: "Piezas", key: "piezas", width: 10 }],
      datos.detalle.map(x => ({ ...x, mes: mesAnio(x.mes) })));
    if (frec?.filas?.length) {
      hoja("Cada cuánto", [{ header: "Sucursal", key: "grupo", width: 30 }, { header: "Insumo", key: "nombre", width: 42 },
        { header: "Frecuencia", key: "texto", width: 18 }, { header: "Piezas por vez", key: "piezas_por_entrega", width: 14 },
        { header: "Última", key: "ultima", width: 12 }, { header: "Próxima", key: "proxima", width: 12 }],
        frec.filas.map(x => ({ ...x, texto: x.cada_dias == null ? "1 sola vez" : textoFrecuencia(x.cada_dias), ultima: fechaCorta(x.ultima), proxima: fechaCorta(x.proxima, "") })));
    }
    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `Consumo_${fechaCorta(datos.desde).replaceAll("/", "-")}_al_${fechaCorta(datos.hasta).replaceAll("/", "-")}.xlsx`);
  };

  // ── Estilos ──────────────────────────────────────────────────────────
  const chip = (activo) => ({
    padding: "5px 11px", borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
    border: `1px solid ${activo ? T.orange : T.border}`, background: activo ? T.orange : "transparent", color: activo ? "#fff" : T.textMuted,
  });
  const inp = { height: 30, padding: "0 8px", borderRadius: 6, fontSize: 12, border: `1px solid ${T.border}`, background: T.bg, color: T.text, colorScheme: T.isDark ? "dark" : "light" };
  const tarjeta = { border: `1px solid ${T.border}`, borderRadius: 10, background: T.surface ?? T.bg };
  const TABS = [["sucursal", "Sucursales", Store], ["insumo", "Insumos", Package], ["mes", "Por mes", CalendarRange], ["frecuencia", "Cada cuánto", Repeat]];
  const vacio = (txt) => <p style={{ padding: 16, margin: 0, fontSize: 12, color: T.textMuted, textAlign: "center" }}>{txt}</p>;
  const barra = (pct, color = T.orange) => (
    <div style={{ height: 6, borderRadius: 3, background: T.border, overflow: "hidden" }}>
      <div style={{ width: `${Math.max(2, pct)}%`, height: "100%", background: color, borderRadius: 3, transition: "width .3s" }} />
    </div>
  );

  return (
    <Modal T={T} title="Consumo de insumos" subtitle="Qué se usa, dónde y cada cuánto" icon={<BarChart3 size={15} />}
      onClose={onClose} cancelLabel="Cerrar" maxWidth="1000px">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Periodo */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
          {PERIODOS.map(([n, l]) => <button key={n} onClick={() => elegirPeriodo(n)} style={chip(periodo === n)}>{l}</button>)}
          <button onClick={() => setPeriodo(0)} style={chip(periodo === 0)}>Fechas…</button>
          {periodo === 0 && (
            <>
              <input type="date" aria-label="Desde" value={desde} max={hasta} onChange={e => setDesde(e.target.value)} style={inp} />
              <input type="date" aria-label="Hasta" value={hasta} min={desde} max={iso(hoy)} onChange={e => setHasta(e.target.value)} style={inp} />
            </>
          )}
          <span style={{ flex: 1 }} />
          {cargando && <span style={{ fontSize: 11, color: T.textMuted }}>Cargando…</span>}
          <button onClick={exportar} disabled={!datos || cargando} title="Descargar en Excel"
            style={{ ...chip(false), display: "flex", alignItems: "center", gap: 4, color: T.text, opacity: !datos ? 0.5 : 1 }}>
            <FileDown size={13} /> Excel
          </button>
        </div>

        {error && <p role="alert" style={{ margin: 0, fontSize: 12, color: "#dc2626" }}>{error}</p>}

        {datos && vistaDatos && (
          <>
            {/* Sucursal: filtra todo el reporte */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
              <button onClick={() => setSucursal(TODAS)} style={chip(sucursal === TODAS)}>Todas · {totalGlobal}</button>
              {sucursales.map(s => (
                <button key={s.sucursal} onClick={() => setSucursal(s.sucursal)} style={chip(sucursal === s.sucursal)}>
                  {s.sucursal} · {s.piezas}
                </button>
              ))}
            </div>

            {/* Cifras clave */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
              {[
                ["Piezas usadas", vistaDatos.piezas, T.text, `${fechaCorta(datos.desde)} al ${fechaCorta(datos.hasta)}`],
                ["Al mes", redondea(vistaDatos.piezas / meses), T.orange, `Promedio de ${meses} mes${meses !== 1 ? "es" : ""}`],
                ["Insumos distintos", vistaDatos.insumos.length, T.text, ""],
                ["Por comprar", vistaDatos.porComprar, vistaDatos.porComprar ? "#dc2626" : "#16a34a", "Stock para menos de 1 mes"],
              ].map(([l, v, c, tip]) => (
                <div key={l} title={tip} style={{ ...tarjeta, padding: "8px 12px" }}>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: T.textMuted }}>{l}</p>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: c, lineHeight: 1.2 }}>{v}</p>
                </div>
              ))}
            </div>

            {/* Pestañas */}
            <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${T.border}`, overflowX: "auto" }}>
              {TABS.map(([k, l, Icon]) => (
                <button key={k} onClick={() => setVista(k)}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                    background: "transparent", border: "none", borderBottom: `2px solid ${vista === k ? T.orange : "transparent"}`,
                    color: vista === k ? T.orange : T.textMuted, marginBottom: -1 }}>
                  <Icon size={13} /> {l}
                </button>
              ))}
              {(vista === "insumo" || vista === "frecuencia") && (
                <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar insumo…"
                  style={{ ...inp, height: 28, margin: "0 0 4px auto", flex: "0 1 200px" }} />
              )}
            </div>

            <div style={{ maxHeight: "48vh", overflow: "auto" }}>
              {/* ── Sucursales: una tarjeta por sucursal ── */}
              {vista === "sucursal" && (sucursales.length === 0 ? vacio("Sin consumo en este periodo.") : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 10 }}>
                  {sucursales.filter(s => sucursal === TODAS || s.sucursal === sucursal).map(s => {
                    const pct = Math.round(s.piezas / Math.max(1, totalGlobal) * 100);
                    return (
                      <button key={s.sucursal} onClick={() => { setSucursal(s.sucursal); setVista("insumo"); }}
                        title="Ver los insumos de esta sucursal"
                        style={{ ...tarjeta, padding: 12, textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: 8, color: T.text }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Store size={14} style={{ color: T.orange, flexShrink: 0 }} />
                          <span style={{ fontSize: 13, fontWeight: 800, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.sucursal}</span>
                          <ChevronRight size={14} style={{ color: T.textFaint }} />
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                          <span style={{ fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{s.piezas}</span>
                          <span style={{ fontSize: 11, color: T.textMuted }}>piezas · <b style={{ color: T.orange }}>{redondea(s.piezas / meses)}/mes</b></span>
                          <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 800, color: T.textMuted }}>{pct}%</span>
                        </div>
                        {barra(pct)}
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          {s.insumos.slice(0, 4).map(i => (
                            <div key={i.id_insumo} style={{ display: "flex", gap: 6, fontSize: 11 }}>
                              <span style={{ flex: 1, color: T.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.nombre}</span>
                              <b>{i.piezas}</b>
                            </div>
                          ))}
                          {s.insumos.length > 4 && <span style={{ fontSize: 10, color: T.textFaint }}>+{s.insumos.length - 4} más</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* ── Insumos: cuánto se usa y para cuánto alcanza ── */}
              {vista === "insumo" && (insumosVisibles.length === 0 ? vacio("Sin consumo en este periodo.") : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {insumosVisibles.map(x => {
                    const a = alcance(x.cobertura);
                    return (
                      <div key={x.id_insumo} style={{ ...tarjeta, padding: "8px 12px", display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "4px 12px", alignItems: "center" }}>
                        <div style={{ minWidth: 0 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{x.nombre}</span>
                          {x.marca && <span style={{ fontSize: 11, color: T.textFaint }}> · {x.marca}</span>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: T.textMuted, whiteSpace: "nowrap" }}>
                          <span title="Piezas usadas en el periodo"><b style={{ fontSize: 15, color: T.text }}>{x.piezas}</b> usadas</span>
                          <span title="Promedio al mes"><b style={{ fontSize: 13, color: T.orange }}>{redondea(x.alMes)}</b>/mes</span>
                          <span title="Stock actual (todas las sucursales)">stock <b style={{ color: T.text }}>{x.stock}</b></span>
                          <span title="Para cuánto alcanza el stock al ritmo de consumo general"
                            style={{ padding: "2px 8px", borderRadius: 99, fontWeight: 800, color: a.color, background: `${a.color}18`, minWidth: 64, textAlign: "center" }}>
                            {a.texto}
                          </span>
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>{barra(x.piezas / maxIns * 100)}</div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* ── Por mes ── */}
              {vista === "mes" && (
                <div style={{ padding: "8px 4px", display: "flex", alignItems: "flex-end", gap: 6, height: 230, overflowX: "auto" }}>
                  {vistaDatos.porMes.map(m => (
                    <div key={m.mes} title={`${mesAnio(m.mes)}: ${m.piezas} piezas`}
                      style={{ flex: "1 0 40px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: T.text }}>{m.piezas || ""}</span>
                      <div style={{ width: "70%", height: `${Math.max(3, Math.round(m.piezas / maxMes * 160))}px`, background: m.piezas ? T.orange : T.border, borderRadius: "5px 5px 0 0", transition: "height .3s" }} />
                      <span style={{ fontSize: 10, color: T.textMuted, whiteSpace: "nowrap" }}>{mesCorto(m.mes)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Cada cuánto se pide cada insumo en cada sucursal ── */}
              {vista === "frecuencia" && (cargandoFrec && !frec ? vacio("Calculando…") : filasFrec.length === 0
                ? vacio("Aún no hay insumos pedidos 2 o más veces en este periodo.")
                : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {filasFrec.map(x => {
                      const e = ESTADO_FREC[x.estado];
                      return (
                        <div key={`${x.grupo}-${x.id_insumo}`} style={{ ...tarjeta, padding: "8px 12px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 12px" }}
                          title={`Entregas: ${x.historial.map(h => `${fechaCorta(h.dia)} (${h.piezas})`).join(", ")}`}>
                          <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{x.nombre}</div>
                            <div style={{ fontSize: 11, color: T.textFaint }}>{x.grupo}</div>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 900, color: T.orange, whiteSpace: "nowrap" }}>{textoFrecuencia(x.cada_dias)}</span>
                          <span style={{ fontSize: 11, color: T.textMuted, whiteSpace: "nowrap" }}><b style={{ color: T.text }}>{x.piezas_por_entrega}</b> por vez</span>
                          <span style={{ fontSize: 11, color: T.textMuted, whiteSpace: "nowrap" }} title={`Última: ${fechaCorta(x.ultima)}`}>
                            próxima <b style={{ color: T.text }}>{fechaCorta(x.proxima)}</b>
                          </span>
                          {e && <span style={{ fontSize: 10, fontWeight: 800, color: e.color, background: `${e.color}18`, padding: "2px 8px", borderRadius: 99, whiteSpace: "nowrap" }}>{e.texto}</span>}
                        </div>
                      );
                    })}
                  </div>
                ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
