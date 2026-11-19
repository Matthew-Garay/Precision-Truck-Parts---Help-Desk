/**
 * ModalHistorialAccesos.jsx — Historial de inicios de sesión de un empleado (pantalla Personal).
 * Separado de pages/Admin/Personal.jsx.
 */
import { useState, useEffect } from "react";
import { apiFetch } from '../../services/api-client.js';
import Paginacion from '../Paginacion.jsx';
import { X } from "lucide-react";
import { FS } from '../../utils/tipografia.js';
import LogoModal from '../LogoModal.jsx';
import { fechaHora } from '../../utils/fechas.js';
import { Field, ORANGE, useTokens } from './ModalEmpleado.jsx';

const ESTATUS_COLOR = { Activo: "#16a34a", Inactivo: "#94a3b8" };

// ── Modal Historial ───────────────────────────────────────────────
export function ModalHistorial({ T, isDark, empleado, onCerrar }) {
  const tk = useTokens(T, isDark);
  // Estilo de los filtros de fecha/tipo (antes se usaba `inp` de ModalEmpleado,
  // que no existe en este componente y hacía fallar la ventana).
  const inp = {
    background: tk.inputBg, border: `1px solid ${tk.border}`,
    borderRadius: "6px", padding: "0 10px", height: "34px",
    fontSize: FS.cuerpo, color: tk.textMain, outline: "none",
    boxSizing: "border-box", colorScheme: isDark ? "dark" : "light",
  };
  const [accesos, setAccesos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const nombre = `${empleado.nombre} ${empleado.ap_paterno}`.trim();
  useEffect(() => { setPagina(1); }, [desde, hasta, tipoFiltro, empleado.id_empleado]);
  useEffect(() => {
    apiFetch(`/api/auth/accesos/${empleado.id_empleado}`)
      .then(r => r.json())
      .then(d => setAccesos(Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [empleado.id_empleado]);
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onCerrar(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onCerrar]);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
  const fmt = iso => fechaHora(iso);
  const duracion = (entrada, salida) => {
    if (!entrada) return "-";
    const fin = salida ? new Date(salida) : new Date();
    const ini = new Date(entrada);
    const ms = fin - ini;
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };
  const filtrados = accesos.filter(a => {
    if (desde && a.fecha_entrada < desde) return false;
    if (hasta && a.fecha_entrada > hasta) return false;
    if (tipoFiltro === "con_salida" && !a.fecha_salida) return false;
    if (tipoFiltro === "sin_salida" && a.fecha_salida) return false;
    return true;
  });
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / pageSize));
  const paginaActual = Math.min(pagina, totalPaginas);
  const filasPagina = filtrados.slice((paginaActual - 1) * pageSize, paginaActual * pageSize);
  return (
    <div
      role="presentation"
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: isDark ? "rgba(0,0,0,0.55)" : "rgba(15,23,42,0.40)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onCerrar(); }}
    >
      <div
        role="dialog" aria-modal="true"
        style={{
          width: "95%", maxWidth: "700px",
          background: tk.surface, border: `1px solid ${tk.border}`,
          borderRadius: "10px", display: "flex", flexDirection: "column",
          maxHeight: "92vh", overflow: "hidden",
          boxShadow: isDark
            ? "0 16px 40px rgba(0,0,0,0.50), 0 1px 0 rgba(255,255,255,0.04) inset"
            : "0 16px 40px rgba(15,23,42,0.12), 0 1px 3px rgba(15,23,42,0.06)",
        }}
      >
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${tk.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: FS.subtitulo, fontWeight: 700, color: tk.textMain }}>Historial de accesos</h3>
            <p style={{ margin: "2px 0 0", fontSize: FS.secundario, color: tk.textMuted }}>{nombre}</p>
          </div>
          <LogoModal style={{ marginLeft: "auto", marginRight: 8, alignSelf: "center" }} />
          <button onClick={onCerrar} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: tk.textMuted }}>
            <X width="20" height="20" />
          </button>
        </div>
        <div style={{ padding: "16px 18px", overflowY: "auto", flex: 1, minHeight: 0 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <Field label="Desde" textFaint={tk.textFaint}>
              <input type="date" id="desde" value={desde} onChange={e => setDesde(e.target.value)} style={{ ...inp, width: "140px" }} />
            </Field>
            <Field label="Hasta" textFaint={tk.textFaint}>
              <input type="date" id="hasta" value={hasta} onChange={e => setHasta(e.target.value)} style={{ ...inp, width: "140px" }} />
            </Field>
            <Field label="Tipo" textFaint={tk.textFaint}>
              <select id="tipoFiltro" value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)} style={{ ...inp, width: "150px", cursor: "pointer" }}>
                <option value="todos">Todos</option>
                <option value="con_salida">Con salida</option>
                <option value="sin_salida">Sin salida</option>
              </select>
            </Field>
          </div>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0" }}>
              <svg className="animate-spin" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            </div>
          ) : filtrados.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 8 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={tk.textFaint} strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              <p style={{ fontSize: FS.cuerpo, fontWeight: 600, color: tk.textMuted, margin: 0 }}>Sin registros</p>
            </div>
          ) : (
            <div style={{ borderRadius: 8, border: `1px solid ${tk.border}`, background: tk.surface, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: tk.surfaceAlt, borderBottom: `1px solid ${tk.border}` }}>
                    <th style={{ padding: "10px 14px", fontSize: FS.etiqueta, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: tk.textMuted, textAlign: "left" }}>Fecha entrada</th>
                    <th style={{ padding: "10px 14px", fontSize: FS.etiqueta, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: tk.textMuted, textAlign: "left" }}>Fecha salida</th>
                    <th style={{ padding: "10px 14px", fontSize: FS.etiqueta, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: tk.textMuted, textAlign: "left" }}>Duración</th>
                    <th style={{ padding: "10px 14px", fontSize: FS.etiqueta, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: tk.textMuted, textAlign: "left" }}>Estatus</th>
                  </tr>
                </thead>
                <tbody>
                  {filasPagina.map((a, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6"}`, background: i % 2 === 0 ? tk.surface : tk.surfaceAlt }}>
                      <td style={{ padding: "10px 14px", fontSize: FS.cuerpo, color: tk.textMain }}>{fmt(a.fecha_entrada)}</td>
                      <td style={{ padding: "10px 14px", fontSize: FS.cuerpo, color: tk.textMuted }}>{a.fecha_salida ? fmt(a.fecha_salida) : "—"}</td>
                      <td style={{ padding: "10px 14px", fontSize: FS.cuerpo, color: tk.textMuted }}>{duracion(a.fecha_entrada, a.fecha_salida)}</td>
                      <td style={{ padding: "10px 14px", fontSize: FS.cuerpo, fontWeight: 600, color: a.fecha_salida ? ESTATUS_COLOR.Activo : ESTATUS_COLOR.Inactivo }}>
                        {a.fecha_salida ? "Completada" : "Abierta"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Paginacion
            page={paginaActual}
            onPageChange={setPagina}
            total={filtrados.length}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            T={T}
            cargando={loading}
          />
        </div>
      </div>
    </div>
  );
}
