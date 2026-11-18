/**
 * ModalConsumo.jsx
 *
 * Reporte de CONSUMO de insumos para planear compras: qué insumos se usan
 * más, qué áreas consumen más y cómo va el consumo mes a mes. Cuenta todo el
 * material que salió del inventario (salidas internas activas y solicitudes
 * aceptadas); las salidas anuladas no cuentan.
 *
 * "Cobertura" = meses que alcanza el stock actual al ritmo de consumo
 * promedio del periodo. Menos de 1 mes se marca en rojo: hay que comprar.
 *
 * Export default: ModalConsumo
 * Props: T, onClose.
 * Endpoint: GET /api/solicitudes/consumo?fecha_inicio&fecha_fin
 *
 * @module client/components/Inventario/ModalConsumo
 * @requires react
 * @requires lucide-react
 * @requires exceljs
 * @requires file-saver
 * @requires ../Modal.jsx
 * @requires ../../services/api-client.js
 * @exports ModalConsumo (default)
 */
import { useEffect, useMemo, useState } from "react";
import { BarChart3, FileDown } from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import Modal from "../Modal.jsx";
import { apiFetch } from "../../services/api-client.js";
import { fechaCorta, mesAnio } from "../../utils/fechas.js";

const nombreMes = (ym) => mesAnio(ym); // "2026-11" -> "11/2026"
const pad = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Semáforo de cobertura (meses que alcanza el stock).
const colorCobertura = (c) => (c == null ? "#94a3b8" : c < 1 ? "#dc2626" : c < 2 ? "#d97706" : "#16a34a");

export default function ModalConsumo({ T, onClose }) {
  const hoy = new Date();
  const [desde, setDesde] = useState(iso(new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1)));
  const [hasta, setHasta] = useState(iso(hoy));
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [vista, setVista] = useState("insumo"); // insumo | area | mes

  const cargar = async () => {
    if (!desde || !hasta || desde > hasta) { setError("Revisa el rango de fechas."); return; }
    setCargando(true); setError("");
    try {
      const r = await apiFetch(`/api/solicitudes/consumo?fecha_inicio=${desde}&fecha_fin=${hasta}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || `HTTP ${r.status}`);
      setDatos(d);
    } catch (e) {
      setError(e.message || "No se pudo cargar el reporte");
    } finally {
      setCargando(false);
    }
  };
  useEffect(() => { cargar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const maxMes = useMemo(() => Math.max(1, ...(datos?.por_mes ?? []).map(m => m.piezas)), [datos]);
  const maxArea = useMemo(() => Math.max(1, ...(datos?.por_area ?? []).map(a => a.piezas)), [datos]);

  const exportar = async () => {
    if (!datos) return;
    const wb = new ExcelJS.Workbook();
    const encabezado = (ws, cols) => {
      ws.columns = cols;
      ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF47920" } };
    };
    const w0 = wb.addWorksheet("Resumen");
    w0.columns = [{ key: "a", width: 26 }, { key: "b", width: 30 }];
    [["Reporte de consumo de insumos", ""],
     ["Periodo", `${fechaCorta(datos.desde)} al ${fechaCorta(datos.hasta)}`],
     ["Piezas usadas", datos.totales.piezas],
     ["Generado", fechaCorta(new Date())]].forEach(r => w0.addRow({ a: r[0], b: r[1] }));
    w0.getRow(1).font = { bold: true, size: 13 };
    w0.getColumn("a").font = { bold: true };
    const w1 = wb.addWorksheet("Por insumo");
    encabezado(w1, [
      { header: "Insumo", key: "nombre", width: 45 }, { header: "Marca", key: "marca", width: 18 },
      { header: "Modelo", key: "modelo", width: 18 }, { header: "Piezas usadas", key: "piezas", width: 14 },
      { header: "Salidas", key: "operaciones", width: 10 }, { header: "Promedio mensual", key: "promedio_mensual", width: 17 },
      { header: "Stock actual", key: "stock", width: 13 }, { header: "Meses de cobertura", key: "meses_cobertura", width: 18 },
    ]);
    datos.por_insumo.forEach(x => w1.addRow(x));
    const w2 = wb.addWorksheet("Por área");
    encabezado(w2, [{ header: "Área", key: "area", width: 35 }, { header: "Piezas", key: "piezas", width: 12 }, { header: "Salidas", key: "operaciones", width: 12 }]);
    datos.por_area.forEach(x => w2.addRow(x));
    const w3 = wb.addWorksheet("Por mes");
    encabezado(w3, [{ header: "Mes", key: "mes", width: 14 }, { header: "Piezas", key: "piezas", width: 12 }]);
    datos.por_mes.forEach(x => w3.addRow({ ...x, mes: nombreMes(x.mes) }));
    const w4 = wb.addWorksheet("Detalle");
    encabezado(w4, [{ header: "Mes", key: "mes", width: 14 }, { header: "Área", key: "area", width: 30 }, { header: "Insumo", key: "nombre", width: 45 }, { header: "Piezas", key: "piezas", width: 10 }]);
    datos.detalle.forEach(x => w4.addRow({ ...x, mes: nombreMes(x.mes) }));
    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `Consumo_insumos_${fechaCorta(datos.desde).replaceAll("/", "-")}_al_${fechaCorta(datos.hasta).replaceAll("/", "-")}.xlsx`);
  };

  const inp = {
    height: 30, padding: "0 8px", borderRadius: 6, fontSize: 12,
    border: `1px solid ${T.border}`, background: T.bg, color: T.text, colorScheme: T.isDark ? "dark" : "light",
  };
  const th = { textAlign: "left", padding: "6px 8px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: T.textMuted, borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, background: T.surface ?? T.bg };
  const td = { padding: "5px 8px", fontSize: 12, color: T.text, borderBottom: `1px solid ${T.border}` };
  const tab = (k, label) => (
    <button key={k} onClick={() => setVista(k)}
      style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
        border: `1px solid ${vista === k ? T.orange : T.border}`, background: vista === k ? `${T.orange}18` : "transparent",
        color: vista === k ? T.orange : T.textMuted }}>
      {label}
    </button>
  );

  return (
    <Modal T={T} title="Reporte de consumo" subtitle="Planeación de compras" icon={<BarChart3 size={15} />}
      onClose={onClose} cancelLabel="Cerrar" maxWidth="980px">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Rango y acciones */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 8 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 10, fontWeight: 700, color: T.textMuted }}>
            DESDE <input type="date" value={desde} max={hasta} onChange={e => setDesde(e.target.value)} style={inp} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 10, fontWeight: 700, color: T.textMuted }}>
            HASTA <input type="date" value={hasta} min={desde} max={iso(hoy)} onChange={e => setHasta(e.target.value)} style={inp} />
          </label>
          <button onClick={cargar} disabled={cargando}
            style={{ height: 30, padding: "0 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", background: T.orange, color: "#fff", opacity: cargando ? 0.6 : 1 }}>
            {cargando ? "Cargando…" : "Consultar"}
          </button>
          <button onClick={exportar} disabled={!datos || cargando}
            style={{ height: 30, padding: "0 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
              border: `1px solid ${T.border}`, background: "transparent", color: T.text, opacity: !datos ? 0.5 : 1 }}>
            <FileDown size={13} /> Excel
          </button>
        </div>

        {error && <p role="alert" style={{ margin: 0, fontSize: 12, color: "#dc2626" }}>{error}</p>}

        {datos && (
          <>
            {/* Totales */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
              {[
                ["Piezas usadas", datos.totales.piezas],
                ["Salidas", datos.totales.operaciones],
                ["Insumos distintos", datos.totales.insumos],
                ["Por comprar (<1 mes)", datos.por_insumo.filter(x => x.meses_cobertura != null && x.meses_cobertura < 1).length],
              ].map(([l, v]) => (
                <div key={l} style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}` }}>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: T.textMuted }}>{l}</p>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: T.text }}>{v}</p>
                </div>
              ))}
            </div>
            <p style={{ margin: 0, fontSize: 11, color: T.textFaint }}>
              <b>Periodo: {fechaCorta(datos.desde)} al {fechaCorta(datos.hasta)}.</b>{" "}
              Promedio calculado sobre {datos.totales.meses} mes{datos.totales.meses !== 1 ? "es" : ""} (desde el primer mes con consumo del rango).
              Cobertura = meses que alcanza el stock actual a ese ritmo.
            </p>

            <div style={{ display: "flex", gap: 6 }}>
              {tab("insumo", "Por insumo")}{tab("area", "Por área")}{tab("mes", "Por mes")}
            </div>

            <div style={{ maxHeight: "46vh", overflow: "auto", border: `1px solid ${T.border}`, borderRadius: 8 }}>
              {vista === "insumo" && (
                datos.por_insumo.length === 0
                  ? <p style={{ padding: 12, margin: 0, fontSize: 12, color: T.textMuted }}>Sin consumo en este periodo.</p>
                  : <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
                      <thead><tr>
                        <th style={th}>#</th><th style={th}>Insumo</th><th style={{ ...th, textAlign: "right" }}>Piezas</th>
                        <th style={{ ...th, textAlign: "right" }}>Salidas</th><th style={{ ...th, textAlign: "right" }}>Prom./mes</th>
                        <th style={{ ...th, textAlign: "right" }}>Stock</th><th style={{ ...th, textAlign: "right" }}>Cobertura</th>
                      </tr></thead>
                      <tbody>
                        {datos.por_insumo.map((x, i) => (
                          <tr key={x.id_insumo}>
                            <td style={{ ...td, color: T.textMuted }}>{i + 1}</td>
                            <td style={td}>
                              <span style={{ fontWeight: 600 }}>{x.nombre}</span>
                              {x.marca && x.marca !== "N/A" && <span style={{ color: T.textMuted }}> · {x.marca}</span>}
                            </td>
                            <td style={{ ...td, textAlign: "right", fontWeight: 800 }}>{x.piezas}</td>
                            <td style={{ ...td, textAlign: "right" }}>{x.operaciones}</td>
                            <td style={{ ...td, textAlign: "right" }}>{x.promedio_mensual}</td>
                            <td style={{ ...td, textAlign: "right" }}>{x.stock}</td>
                            <td style={{ ...td, textAlign: "right", fontWeight: 800, color: colorCobertura(x.meses_cobertura) }}>
                              {x.meses_cobertura == null ? "—" : `${x.meses_cobertura} m`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
              )}

              {vista === "area" && (
                <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  {datos.por_area.length === 0 && <p style={{ margin: 0, fontSize: 12, color: T.textMuted }}>Sin consumo en este periodo.</p>}
                  {datos.por_area.map(a => (
                    <div key={a.area} style={{ display: "grid", gridTemplateColumns: "minmax(120px, 220px) 1fr 90px", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={a.area}>{a.area}</span>
                      <div style={{ height: 8, borderRadius: 4, background: T.border, overflow: "hidden" }}>
                        <div style={{ width: `${Math.round(a.piezas / maxArea * 100)}%`, height: "100%", background: T.orange }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: T.text, textAlign: "right" }}>{a.piezas} pzas · {a.operaciones}</span>
                    </div>
                  ))}
                </div>
              )}

              {vista === "mes" && (
                <div style={{ padding: 12, display: "flex", alignItems: "flex-end", gap: 8, height: 220, overflowX: "auto" }}>
                  {datos.por_mes.map(m => (
                    <div key={m.mes} style={{ flex: "1 0 48px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: T.text }}>{m.piezas}</span>
                      <div style={{ width: "70%", height: `${Math.max(2, Math.round(m.piezas / maxMes * 150))}px`, background: T.orange, borderRadius: "4px 4px 0 0" }} />
                      <span style={{ fontSize: 10, color: T.textMuted, whiteSpace: "nowrap" }}>{nombreMes(m.mes)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
