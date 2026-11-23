/**
 * TablaEmpleados.jsx — Tabla de empleados con orden por columna y menú de acciones
 * (editar, historial, activar/desactivar, eliminar). Separado de pages/Admin/Personal.jsx.
 */
import { useState, useEffect } from "react";
import Paginacion from '../Paginacion.jsx';
import { FS } from '../../utils/tipografia.js';
import { useTokens } from './ModalEmpleado.jsx';

/** Pone en mayúscula la primera letra de CADA palabra ("ana karen" → "Ana Karen",
 *  "MIGUEL JOVANY" → "Miguel Jovany", "díaz-de león" → "Díaz-De León").
 *  Antes solo se capitalizaba la primera letra de cada campo completo, por eso
 *  "Ana Karen" se mostraba como "Ana karen". */
const titulo = (s) => String(s ?? "")
  .trim().replace(/\s+/g, " ").toLocaleLowerCase("es-MX")
  .replace(/(^|[\s\-'])(\p{L})/gu, (_, sep, letra) => sep + letra.toLocaleUpperCase("es-MX"));

const nombreFormateado = (nombre, apPaterno, apMaterno) =>
  [nombre, apPaterno, apMaterno].filter(Boolean).map(titulo).join(" ");

/** Texto sin acentos y en minúsculas, para búsquedas y orden ("Peñaloza" = "penaloza"). */
export const normalizar = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const LIMIT = 25;

// ── Avatar ────────────────────────────────────────────────────────
function Avatar({ nombre, size = 48, isDark }) {
  const partes = (nombre || "").split(" ").filter(Boolean);
  const iniciales = partes.slice(0, 2).map(p => p[0]?.toUpperCase() || "").join("");
  const colores = [
    ["#3b82f6","#1e3a5f"], ["#8b5cf6","#2e1a5f"], ["#ec4899","#5f1a3a"],
    ["#14b8a6","#0a3d38"], ["#f59e0b","#5f3a00"], ["#ef4444","#5f1a1a"],
    ["#22c55e","#0a3d1a"], ["#F47920","#5f2e00"],
  ];
  const idx = (partes[0]?.charCodeAt(0) || 0) % colores.length;
  const [light, dark] = colores[idx];
  const bg = isDark ? dark : light + "22";
  const fg = isDark ? light : light;

  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, border: `2px solid ${fg}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontSize: size * 0.33, fontWeight: 700, color: fg, letterSpacing: "-0.02em" }}>{iniciales || "?"}</span>
    </div>
  );
}

// ── Ícono de orden ────────────────────────────────────────────────
function SortIcon({ dir }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity: dir ? 1 : 0.3, flexShrink: 0 }}>
      {dir === "asc" ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
    </svg>
  );
}

// ── AccionesDropdown ──────────────────────────────────────────────
function AccionesDropdown({ emp, T, isDark, onEditar, onHistorial, onToggleEstatus, onEliminar }) {
  const tk = useTokens(T, isDark);
  const [open, setOpen] = useState(false);
  const activo = emp.estatus === "Activo";
  const btnStyle = {
    width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 14px",
    fontSize: FS.cuerpo, fontWeight: 500, color: tk.textMain, background: "transparent", border: "none",
    cursor: "pointer", textAlign: "left",
  };
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "transparent", border: `1px solid ${tk.border}`, color: tk.textMuted,
          borderRadius: 6, padding: "4px 10px", fontSize: FS.secundario, cursor: "pointer",
        }}
      >
        ⋮
      </button>
      {open && (
        <div
          style={{
            position: "absolute", right: 0, top: "110%",
            background: tk.surface, border: `1px solid ${tk.border}`,
            borderRadius: 8, boxShadow: isDark ? "0 16px 40px rgba(0,0,0,0.50)" : "0 16px 40px rgba(15,23,42,0.12)",
            minWidth: "160px", zIndex: 50,
          }}
          onMouseLeave={() => setOpen(false)}
        >
          <button onClick={() => { onEditar(emp); setOpen(false); }} style={{ ...btnStyle }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            Editar
          </button>
          <button onClick={() => { onHistorial(emp); setOpen(false); }} style={{ ...btnStyle }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            Historial
          </button>
          <button onClick={() => { onToggleEstatus(emp); setOpen(false); }} style={{ ...btnStyle, color: activo ? "#dc2626" : "#16a34a" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12H4" /><line x1="20" y1="12" x2="20" y2="12" /><line x1="4" y1="12" x2="4" y2="12" /></svg>
            {activo ? "Desactivar" : "Activar"}
          </button>
          <button onClick={() => { onEliminar(emp); setOpen(false); }} style={{ ...btnStyle, color: "#dc2626", borderTop: `1px solid ${tk.border}` }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

// ── Tabla de Empleados ────────────────────────────────────────────
export function TablaEmpleados({ empleados, filtrosKey, T, isDark, onEditar, onHistorial, onToggleEstatus, onEliminar }) {
  const [sort, setSort] = useState({ col: "nombre", dir: "asc" });
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(LIMIT);
  // Regresa a la página 1 al cambiar orden, filtros o tamaño de página. NO se
  // usa empleados.length: el auto-refresco de 30 s no debe mover la página.
  useEffect(() => { setPagina(1); }, [sort.col, sort.dir, filtrosKey, pageSize]);
  const toggleSort = col => setSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));
  const sorted = [...empleados].sort((a, b) => {
    const map = {
      nombre:   e => normalizar(`${e.nombre} ${e.ap_paterno} ${e.ap_materno || ""}`),
      id:       e => e.num_empleado || "",
      depto:    e => normalizar(e.nombre_departamento),
      area:     e => normalizar(e.nombre_area),
      sucursal: e => normalizar(e.nombre_sucursal),
      rol:      e => normalizar(e.nombre_rol),
    };
    const fn = map[sort.col] || (() => "");
    const va = fn(a), vb = fn(b);
    // Los vacíos (sin número de empleado, sin sucursal…) siempre al final.
    if (!va && vb) return 1;
    if (va && !vb) return -1;
    // numeric: true ordena "990" antes que "1000" (número de empleado).
    const cmp = va.localeCompare(vb, "es", { numeric: true, sensitivity: "base" });
    return sort.dir === "asc" ? cmp : -cmp;
  });
  const totalPaginas = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginaActual = Math.min(pagina, totalPaginas);
  const filasPagina = sorted.slice((paginaActual - 1) * pageSize, paginaActual * pageSize);
  const COLS = [
    { key: "nombre", label: "Empleado", sortable: true },
    { key: "id", label: "ID", sortable: true },
    { key: "depto", label: "Puesto", sortable: true },
    { key: "area", label: "Área", sortable: true },
    { key: "sucursal", label: "Sucursal", sortable: true },
    { key: "rol", label: "Rol", sortable: true },
    { key: "email", label: "Correo", sortable: false },
    { key: "acciones", label: "", sortable: false },
  ];
  // Columnas que se ocultan en teléfono
  const OPC_MOVIL = new Set(["id", "area", "sucursal", "rol", "email"]);
  const thS = {
    padding: "10px 10px",
    fontSize: FS.etiqueta, fontWeight: 700, letterSpacing: "0.07em",
    textTransform: "uppercase", whiteSpace: "nowrap",
    color: T.textMuted,
    background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt,
    borderBottom: `2px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}`,
    boxShadow: `inset 0 -2px 0 ${isDark ? "rgba(255,255,255,0.08)" : T.border}`,
    userSelect: "none",
    position: "sticky", top: 0, zIndex: 2,
  };
  const tdS = {
    padding: "8px 10px",
    fontSize: FS.cuerpo,
    color: T.textMain,
    borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6"}`,
    verticalAlign: "middle",
  };
  return (
    <div style={{ borderRadius: 10, overflow: "hidden", background: T.surface, border: `1px solid ${T.border}`, boxShadow: isDark ? "0 1px 8px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      {/* Teléfono: solo Empleado, Puesto y acciones; el correo va bajo el nombre. */}
      <style>{`
        .emp-movil { display: none; }
        @media (max-width: 640px) {
          .tabla-emp .emp-opc { display: none !important; }
          .tabla-emp .emp-movil { display: block; }
          .tabla-emp .emp-nombre { white-space: normal !important; }
          .tabla-emp th, .tabla-emp td { padding-left: 6px !important; padding-right: 6px !important; }
          .tabla-emp .emp-avatar { display: none !important; }
        }`}</style>
      <div style={{ overflowX: "auto", overflowY: "auto", flexGrow: 1, flexShrink: 1, minHeight: 0 }}>
        <table className="tabla-emp" style={{ width: "100%", borderCollapse: "collapse", minWidth: 0 }}>
          <thead>
            <tr>
              {COLS.map(col => (
                <th key={col.key} className={OPC_MOVIL.has(col.key) ? "emp-opc" : undefined}
                  style={{ ...thS, textAlign: col.key === "acciones" ? "right" : "left", cursor: col.sortable ? "pointer" : "default" }}
                  onClick={() => col.sortable && toggleSort(col.key)}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    {col.label}
                    {col.sortable && <SortIcon dir={sort.col === col.key ? sort.dir : null} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filasPagina.map((emp, i) => {
              const nombre = nombreFormateado(emp.nombre, emp.ap_paterno, emp.ap_materno);
              const activo = emp.estatus === "Activo";
              const rowBg = i % 2 === 0 ? (isDark ? "transparent" : T.surface) : (isDark ? "rgba(255,255,255,0.015)" : T.surfaceAlt);
              return (
                <tr key={emp.id_empleado}
                  style={{ background: rowBg, opacity: activo ? 1 : 0.55, transition: "background .12s" }}
                  onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "#f0f7ff"}
                  onMouseLeave={e => e.currentTarget.style.background = rowBg}>
                  <td style={tdS}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="emp-avatar" style={{ display: "contents" }}><Avatar nombre={nombre} size={30} isDark={isDark} /></span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: activo ? "#22c55e" : "#94a3b8", boxShadow: activo ? "0 0 0 2.5px rgba(34,197,94,0.2)" : "none" }} />
                        <div style={{ minWidth: 0 }}>
                          <span className="emp-nombre" style={{ fontSize: FS.cuerpo, fontWeight: 600, color: T.textMain, whiteSpace: "nowrap" }}>{nombre}</span>
                          <span className="emp-movil" style={{ fontSize: FS.etiqueta, color: T.textFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "46vw" }}>{emp.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="emp-opc" style={tdS}>
                    <span style={{ fontFamily: "'JetBrains Mono','Courier New',monospace", fontSize: FS.secundario, color: T.textMuted, background: isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6", padding: "2px 7px", borderRadius: 4 }}>
                      {emp.num_empleado || "—"}
                    </span>
                  </td>
                  <td style={{ ...tdS, color: T.textMuted }}>
                    {emp.nombre_departamento || "—"}
                    {/* En teléfono el área va bajo el puesto */}
                    <span className="emp-movil" style={{ fontSize: FS.etiqueta, color: T.textFaint }}>{emp.nombre_area || "Sin área"}</span>
                  </td>
                  <td className="emp-opc" style={{ ...tdS, color: emp.nombre_area ? T.textMuted : "#d97706" }}>
                    {emp.nombre_area || "Sin área"}
                  </td>
                  <td className="emp-opc" style={{ ...tdS, color: T.textMuted }}>{emp.nombre_sucursal || "—"}</td>
                  <td className="emp-opc" style={tdS}>
                    {emp.nombre_rol && (
                      <span style={{ fontSize: FS.secundario, fontWeight: 600, background: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9", color: T.textMuted, border: `1px solid ${isDark ? "rgba(255,255,255,0.09)" : "#e2e8f0"}`, padding: "2px 8px", borderRadius: 4 }}>
                        {emp.nombre_rol}
                      </span>
                    )}
                  </td>
                  <td className="emp-opc" style={{ ...tdS, color: T.textMuted, maxWidth: 190 }}>
                    <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {emp.email}
                    </span>
                  </td>
                  <td style={{ ...tdS, textAlign: "right", width: 52 }}>
                    <AccionesDropdown
                      emp={emp} T={T} isDark={isDark}
                      onEditar={onEditar}
                      onHistorial={onHistorial}
                      onToggleEstatus={onToggleEstatus}
                      onEliminar={onEliminar}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Paginacion
        page={paginaActual}
        onPageChange={setPagina}
        total={sorted.length}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        T={T}
      />
    </div>
  );
}
