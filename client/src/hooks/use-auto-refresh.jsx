import React, { useState, useEffect } from "react";

const FILTROS_INIT = {
  estatus: "",
  departamento: "",
  sucursal: "",
};

function nombreFormateado(nombre, apellidoP, apellidoM) {
  const partes = [nombre, apellidoP, apellidoM]
    .filter(Boolean)
    .map(p => String(p).trim().toLowerCase())
    .map(p => p.charAt(0).toUpperCase() + p.slice(1));
  return partes.join(" ");
}

function SortIcon({ dir }) {
  if (!dir) return <span style={{ opacity: 0.3, fontSize: 10 }}>↕</span>;
  return <span style={{ fontSize: 10 }}>{dir === "asc" ? "▲" : "▼"}</span>;
}

function TablaEmpleados({ empleados, T, isDark, onEditar, onHistorial, onToggleEstatus }) {
  const [sort, setSort] = useState({ col: "nombre", dir: "asc" });
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => { setPagina(1); }, [sort.col, sort.dir, empleados.length]);

  const toggleSort = col => setSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));

  const sorted = [...empleados].sort((a, b) => {
    const map = {
      nombre: e => `${e.nombre} ${e.ap_paterno}`,
      id: e => e.num_empleado || "",
      depto: e => e.nombre_departamento || "",
      sucursal: e => e.nombre_sucursal || "",
      rol: e => e.nombre_rol || "",
    };
    const fn = map[sort.col] || (() => "");
    const cmp = fn(a).localeCompare(fn(b), "es");
    return sort.dir === "asc" ? cmp : -cmp;
  });

  const totalPaginas = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginaActual = Math.min(pagina, totalPaginas);
  const filasPagina = sorted.slice((paginaActual - 1) * pageSize, paginaActual * pageSize);

  const COLS = [
    { key: "nombre", label: "Empleado", sortable: true },
    { key: "id", label: "ID", sortable: true },
    { key: "depto", label: "Área", sortable: true },
    { key: "sucursal", label: "Sucursal", sortable: true },
    { key: "rol", label: "Rol", sortable: true },
    { key: "email", label: "Correo", sortable: false },
    { key: "acciones", label: "", sortable: false },
  ];

  const thS = {
    padding: "10px 16px",
    fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
    textTransform: "uppercase", whiteSpace: "nowrap", color: T.textMuted,
    background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt,
    borderBottom: `2px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}`,
    boxShadow: `inset 0 -2px 0 ${isDark ? "rgba(255,255,255,0.08)" : T.border}`,
    userSelect: "none", position: "sticky", top: 0, zIndex: 2,
  };

  const tdS = {
    padding: "10px 16px",
    fontSize: 11,
    color: T.textMain,
    borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6"}`,
    verticalAlign: "middle", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  };

  return (
    <div style={{ borderRadius: 10, overflow: "hidden", background: T.surface, border: `1px solid ${T.border}`, boxShadow: isDark ? "0 1px 8px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div style={{ overflowX: "auto", maxHeight: 420, overflowY: "auto", flexGrow: 1, flexShrink: 1, minHeight: 0 }}>
        <table className="w-full border-collapse min-w-[0]" style={{ width: "100%", borderCollapse: "collapse", minWidth: 0, tableLayout: "auto" }}>
          <thead>
            <tr>
              {COLS.map(col => (
                <th key={col.key}
                  style={{ ...thS, textAlign: col.key === "acciones" ? "right" : "left", cursor: col.sortable ? "pointer" : "default" }}
                >
                  <span className="flex items-center gap-2 overflow-hidden truncate">
                    {col.label}
                    {col.sortable && <SortIcon dir={sort.col === col.key ? sort.dir : null} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="table-row-group">
            {filasPagina.map((emp, i) => {
              const nombre = nombreFormateado(emp.nombre, emp.ap_paterno, emp.ap_materno);
              const activo = emp.estatus === "Activo";
              const rowBg = i % 2 === 0 ? (isDark ? "transparent" : T.surface) : (isDark ? "rgba(255,255,255,0.015)" : T.surfaceAlt);
              return (
                <tr key={emp.id_empleado}
                  style={{ background: rowBg, opacity: activo ? 1 : 0.55, transition: "background .12s" }}
                  onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "#f0f7ff"}
                  onMouseLeave={e => e.currentTarget.style.background = rowBg}
                >
                  <td style={{ ...tdS, padding: "0.75rem 1rem", verticalAlign: "middle", minWidth: "150px", maxWidth: "260px" }}>
                    <div className="flex items-center gap-3 min-w-[0] flex-[1] overflow-hidden">
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: T.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        {nombre.charAt(0)}
                      </div>
                      <div className="flex items-center gap-2 min-w-[0] flex-[1] overflow-hidden">
                        <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: activo ? "#22c55e" : "#94a3b8", boxShadow: activo ? "0 0 0 2.5px rgba(34,197,94,0.2)" : "none" }} />
                        <span className="truncate" style={{ fontSize: 13, fontWeight: 600, color: T.textMain, minWidth: 0, flex: 1 }}>{nombre}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...tdS, overflow: "hidden", textOverflow: "ellipsis" }}>
                    <span style={{ fontFamily: "'JetBrains Mono','Courier New',monospace", fontSize: 11, color: T.textMuted, background: isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6", padding: "2px 7px", borderRadius: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.num_empleado || "—"}</span>
                  </td>
                  <td style={{ ...tdS, color: T.textMuted }}><span className="truncate block">{emp.nombre_departamento || "—"}</span></td>
                  <td style={{ ...tdS, color: T.textMuted, overflow: "hidden", textOverflow: "ellipsis" }}>{emp.nombre_sucursal || "—"}</td>
                  <td style={tdS}>{emp.nombre_rol && (<span style={{ fontSize: 11, fontWeight: 600, background: isDark ? "rgba(255,255,255,0.06)" : " #f1f5f9", color: T.textMuted, border: `1px solid ${isDark ? "rgba(255,255,255,0.09)" : " #e2e8f0" }`, padding: "2px 8px", borderRadius: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.nombre_rol}</span>)}
                  </td>
                  <td style={{ ...tdS, padding: "0.75rem 1rem", color: T.textMuted, overflow: "hidden", textOverflow: "ellipsis" }}><span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.email}</span></td>
                  <td style={{ ...tdS, textAlign: "right", width: 52 }}>
                    <button onClick={() => onEditar(emp)} style={{ padding: "6px 12px", background: T.primary, color: "#fff", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>Editar</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { TablaEmpleados, SortIcon, nombreFormateado, FILTROS_INIT };

function useAutoRefresh(callback, interval = 5000, deps = []) {
  useEffect(() => {
    if (typeof callback !== "function") return;
    const id = setInterval(callback, interval);
    return () => clearInterval(id);
  }, [callback, interval, ...deps]);
}

export { useAutoRefresh };

