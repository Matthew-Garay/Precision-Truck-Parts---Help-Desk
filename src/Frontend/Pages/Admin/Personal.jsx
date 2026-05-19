import { useState, useEffect } from "react";
import API from "../../Config/api";

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
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg, border: `2px solid ${fg}44`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      {iniciales
        ? <span style={{ fontSize: size * 0.33, fontWeight: 900, color: fg, letterSpacing: "-0.02em" }}>{iniciales}</span>
        : <span style={{ fontSize: size * 0.33, fontWeight: 900, color: fg }}>?</span>
      }
    </div>
  );
}

function passStrength(p) {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 6)  s++;
  if (p.length >= 10) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s; // 0-5
}

function ModalEmpleado({ T, isDark, modo, empleado, departamentos, roles, onGuardar, onCerrar }) {
  const [form, setForm] = useState({
    num_empleado:    empleado?.num_empleado    || "",
    nombre:          empleado?.nombre          || "",
    ap_paterno:      empleado?.ap_paterno      || "",
    ap_materno:      empleado?.ap_materno      || "",
    email:           empleado?.email           || "",
    id_rol:          empleado?.id_rol          ? String(empleado.id_rol) : "",
    id_departamento: empleado?.id_departamento ? String(empleado.id_departamento) : "",
    estatus:         empleado?.estatus         || "Activo",
    password_nueva:  "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [exito,    setExito]    = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const guardar = async () => {
    if (!form.nombre.trim() || !form.ap_paterno.trim() || !form.email.trim() || !form.id_rol || !form.id_departamento)
      return setError("Completa todos los campos obligatorios");
    if (modo === "crear" && !form.password_nueva.trim())
      return setError("La contraseña es obligatoria al crear un empleado");
    if (form.password_nueva && form.password_nueva.length < 6)
      return setError("La contraseña debe tener al menos 6 caracteres");
    setLoading(true); setError(""); setExito("");
    try {
      await onGuardar(form);
      setExito(modo === "crear" ? "Empleado creado correctamente" : "Cambios guardados correctamente");
    } catch (e) {
      setError(e.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const nombreCompleto = empleado ? `${empleado.nombre} ${empleado.ap_paterno}`.trim() : "";

  const inp = {
    background: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : T.border}`,
    color: T.text, borderRadius: "10px", padding: "9px 12px",
    fontSize: "13px", outline: "none", width: "100%", transition: "border-color .15s, box-shadow .15s",
  };

  const Lbl = ({ children }) => (
    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>{children}</span>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={onCerrar}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: isDark ? "#141720" : "#ffffff",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
          boxShadow: isDark ? "0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)" : "0 25px 80px rgba(0,0,0,0.15)",
        }}
        onClick={e => e.stopPropagation()}>

        {/* ── HEADER con banda naranja ── */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0" style={{
            background: `linear-gradient(135deg, ${T.orange}22 0%, transparent 60%)`,
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9"}`,
          }} />
          <div className="relative px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {modo === "editar" && empleado
                ? <Avatar nombre={nombreCompleto} size={40} isDark={isDark} />
                : (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${T.orange}, #d97400)`, boxShadow: "0 4px 12px rgba(244,121,32,0.4)" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                )
              }
              <div>
                <p className="text-sm font-black" style={{ color: T.text }}>
                  {modo === "crear" ? "Nuevo Empleado" : "Editar Empleado"}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: T.textMuted }}>
                  {modo === "crear" ? "Registrar nuevo miembro del equipo" : nombreCompleto}
                </p>
              </div>
            </div>
            <button onClick={onCerrar}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:brightness-110 active:scale-95 flex-shrink-0"
              style={{ background: isDark ? "rgba(255,255,255,0.07)" : "#f1f5f9", color: T.textMuted, border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}` }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="px-5 py-4 flex flex-col gap-4 max-h-[62vh] overflow-y-auto">

          {/* Número de empleado */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Lbl>N° Empleado</Lbl>
              {modo === "editar" && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                  style={{ background: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9", color: T.textFaint, border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}` }}>
                  Solo lectura
                </span>
              )}
            </div>
            <input
              style={{
                ...inp,
                background: modo === "editar" ? (isDark ? "rgba(255,255,255,0.02)" : "#f1f5f9") : inp.background,
                color: modo === "editar" ? T.textFaint : T.text,
                cursor: modo === "editar" ? "default" : "text",
                borderStyle: modo === "editar" ? "dashed" : "solid",
              }}
              value={form.num_empleado}
              onChange={e => modo === "crear" && set("num_empleado", e.target.value)}
              readOnly={modo === "editar"}
              placeholder="EMP-001"
              onFocus={e => { if (modo === "crear") { e.target.style.borderColor = T.orange; e.target.style.boxShadow = `0 0 0 3px ${T.orange}18`; } }}
              onBlur={e  => { e.target.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : T.border; e.target.style.boxShadow = "none"; }} />
          </div>

          {/* Nombre completo */}
          <div className="flex flex-col gap-1.5">
            <Lbl>Nombre Completo</Lbl>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "nombre",     ph: "Nombre",          lbl: "Nombre"    },
                { key: "ap_paterno", ph: "Ej. García",       lbl: "Ap. Paterno" },
                { key: "ap_materno", ph: "Ej. López (opc.)", lbl: "Ap. Materno" },
              ].map(({ key, ph, lbl }) => (
                <div key={key} className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: T.textFaint }}>{lbl}</span>
                  <input style={inp} value={form[key]} onChange={e => set(key, e.target.value)}
                    placeholder={ph}
                    onFocus={e => { e.target.style.borderColor = T.orange; e.target.style.boxShadow = `0 0 0 3px ${T.orange}18`; }}
                    onBlur={e  => { e.target.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : T.border; e.target.style.boxShadow = "none"; }} />
                </div>
              ))}
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <Lbl>Correo Electrónico</Lbl>
            <input style={inp} type="email" value={form.email} onChange={e => set("email", e.target.value)}
              placeholder="correo@empresa.com"
              onFocus={e => { e.target.style.borderColor = T.orange; e.target.style.boxShadow = `0 0 0 3px ${T.orange}18`; }}
              onBlur={e  => { e.target.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : T.border; e.target.style.boxShadow = "none"; }} />
          </div>

          {/* Rol y Departamento — campos separados */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "id_rol",          opts: roles.map(r => ({ val: r.id_rol, lbl: r.nombre_rol })),                          lbl: "Rol",          ph: "Seleccionar rol"  },
              { key: "id_departamento", opts: departamentos.map(d => ({ val: d.id_departamento, lbl: d.nombre_departamento })), lbl: "Departamento",  ph: "Seleccionar área" },
            ].map(({ key, opts, lbl, ph }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <Lbl>{lbl}</Lbl>
                <select style={{ ...inp, cursor: "pointer", colorScheme: isDark ? "dark" : "light" }}
                  value={form[key]} onChange={e => set(key, e.target.value)}
                  onFocus={e => { e.target.style.borderColor = T.orange; e.target.style.boxShadow = `0 0 0 3px ${T.orange}18`; }}
                  onBlur={e  => { e.target.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : T.border; e.target.style.boxShadow = "none"; }}>
                  <option value="">{ph}</option>
                  {opts.map(o => <option key={o.val} value={o.val}>{o.lbl}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* Estatus — Toggle Switch (solo editar) */}
          {modo === "editar" && (
            <div className="flex flex-col gap-1.5">
              <Lbl>Estatus</Lbl>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}` }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full transition-colors"
                    style={{ background: form.estatus === "Activo" ? "#22c55e" : "#94a3b8", boxShadow: form.estatus === "Activo" ? "0 0 6px #22c55e88" : "none" }} />
                  <span className="text-xs font-bold" style={{ color: form.estatus === "Activo" ? "#16a34a" : "#64748b" }}>
                    {form.estatus === "Activo" ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <button type="button" onClick={() => set("estatus", form.estatus === "Activo" ? "Inactivo" : "Activo")}
                  className="relative flex-shrink-0 transition-all duration-300"
                  style={{
                    width: 44, height: 24, borderRadius: 12,
                    background: form.estatus === "Activo" ? "#16a34a" : (isDark ? "rgba(255,255,255,0.12)" : "#cbd5e1"),
                    border: "none", cursor: "pointer", padding: 0,
                    boxShadow: form.estatus === "Activo" ? "0 0 0 3px rgba(22,163,74,0.2)" : "none",
                    transition: "background .25s, box-shadow .25s",
                  }}>
                  <span style={{
                    position: "absolute", top: 3,
                    left: form.estatus === "Activo" ? 23 : 3,
                    width: 18, height: 18, borderRadius: "50%",
                    background: "#fff",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
                    transition: "left .25s",
                    display: "block",
                  }} />
                </button>
              </div>
            </div>
          )}

          {/* Contraseña */}
          <div className="flex flex-col gap-1.5">
            <Lbl>{modo === "crear" ? "Contraseña" : "Nueva Contraseña (opcional)"}</Lbl>
            <div className="relative">
              <input style={{ ...inp, paddingRight: "40px" }} type={showPass ? "text" : "password"}
                value={form.password_nueva} onChange={e => set("password_nueva", e.target.value)}
                placeholder={modo === "crear" ? "Mínimo 6 caracteres" : "Dejar vacío para no cambiar"}
                onFocus={e => { e.target.style.borderColor = T.orange; e.target.style.boxShadow = `0 0 0 3px ${T.orange}18`; }}
                onBlur={e  => { e.target.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : T.border; e.target.style.boxShadow = "none"; }} />
              <button type="button" onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: showPass ? T.orange : (isDark ? "#64748b" : "#475569"), background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                {showPass
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            {/* Barra de fortaleza */}
            {form.password_nueva && (() => {
              const s = passStrength(form.password_nueva);
              const pct = (s / 5) * 100;
              const color = s <= 1 ? "#ef4444" : s <= 2 ? "#f97316" : s <= 3 ? "#eab308" : s <= 4 ? "#84cc16" : "#22c55e";
              const label = s <= 1 ? "Muy débil" : s <= 2 ? "Débil" : s <= 3 ? "Regular" : s <= 4 ? "Fuerte" : "Muy fuerte";
              return (
                <div className="flex flex-col gap-1 mt-1">
                  <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 9999, transition: "width .3s, background .3s" }} />
                  </div>
                  <span className="text-[10px] font-bold" style={{ color }}>{label}</span>
                </div>
              );
            })()}
          </div>

          {/* Mensajes */}
          {error && (
            <div className="px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2"
              style={{ background: isDark ? "rgba(220,38,38,0.12)" : "#fff1f1", color: "#dc2626", border: "1px solid rgba(220,38,38,0.25)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}
          {exito && (
            <div className="px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2"
              style={{ background: isDark ? "rgba(22,163,74,0.12)" : "#f0fdf4", color: "#16a34a", border: "1px solid rgba(22,163,74,0.25)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              {exito}
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="px-5 py-3 flex gap-2"
          style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9"}`, background: isDark ? "rgba(255,255,255,0.02)" : "#fafbfc" }}>
          <button onClick={onCerrar}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-95 active:scale-95"
            style={{ background: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9", color: T.textMuted, border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}` }}>
            Cancelar
          </button>
          <button onClick={guardar} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95 flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${T.orange}, #d97400)`, boxShadow: "0 4px 14px rgba(244,121,32,0.35)", opacity: loading ? 0.7 : 1 }}>
            {loading
              ? <><svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Guardando...</>
              : modo === "crear" ? "Crear Empleado" : "Guardar Cambios"
            }
          </button>
        </div>

      </div>
    </div>
  );
}

function ModalHistorial({ T, isDark, empleado, onCerrar }) {
  const hoy = new Date();
  const isoHoy  = hoy.toISOString().slice(0, 10);
  const isoLunes = (() => { const d = new Date(hoy); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toISOString().slice(0, 10); })();
  const isoMes  = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`;

  const [accesos,   setAccesos]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [desde,     setDesde]     = useState("");
  const [hasta,     setHasta]     = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos"); // todos | activos | cerrados

  const nombre = `${empleado.nombre} ${empleado.ap_paterno}`.trim();

  useEffect(() => {
    fetch(`${API}/api/auth/accesos/${empleado.id_empleado}`)
      .then(r => r.json())
      .then(d => setAccesos(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [empleado.id_empleado]);

  const fmt = iso => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
  };

  const duracion = (entrada, salida) => {
    if (!salida) return null;
    const mins = Math.round((new Date(salida) - new Date(entrada)) / 60000);
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const aplicarAtajo = (atajo) => {
    if (atajo === "hoy")    { setDesde(isoHoy);  setHasta(isoHoy);  }
    if (atajo === "semana") { setDesde(isoLunes); setHasta(isoHoy);  }
    if (atajo === "mes")    { setDesde(isoMes);   setHasta(isoHoy);  }
    if (atajo === "todo")   { setDesde("");        setHasta("");       }
  };

  const filtrados = accesos.filter(a => {
    if (tipoFiltro === "activos"  && a.fecha_salida)  return false;
    if (tipoFiltro === "cerrados" && !a.fecha_salida) return false;
    if (desde) {
      const entrada = new Date(a.fecha_entrada);
      const d = new Date(desde); d.setHours(0, 0, 0, 0);
      if (entrada < d) return false;
    }
    if (hasta) {
      const entrada = new Date(a.fecha_entrada);
      const h = new Date(hasta); h.setHours(23, 59, 59, 999);
      if (entrada > h) return false;
    }
    return true;
  });

  const exportarCSV = () => {
    const filas = [
      ["Entrada", "Salida", "Duración", "Estado"],
      ...filtrados.map(a => [
        fmt(a.fecha_entrada),
        fmt(a.fecha_salida),
        duracion(a.fecha_entrada, a.fecha_salida) || "—",
        a.fecha_salida ? "Cerrada" : "Activa",
      ]),
    ];
    const csv = filas.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `historial_${empleado.num_empleado || empleado.id_empleado}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const inpDate = {
    background: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
    color: T.text, borderRadius: "8px", padding: "6px 10px",
    fontSize: "12px", outline: "none", colorScheme: isDark ? "dark" : "light",
  };

  const atajos = [
    { id: "hoy",    lbl: "Hoy"    },
    { id: "semana", lbl: "Semana" },
    { id: "mes",    lbl: "Mes"    },
    { id: "todo",   lbl: "Todo"   },
  ];

  const tipoActivo = (t) => tipoFiltro === t;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={onCerrar}>
      <div className="w-full max-w-xl rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: isDark ? "#141720" : "#ffffff",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
          boxShadow: isDark ? "0 25px 80px rgba(0,0,0,0.6)" : "0 25px 80px rgba(0,0,0,0.15)",
          maxHeight: "90vh",
        }}
        onClick={e => e.stopPropagation()}>

        {/* ── HEADER ── */}
        <div className="relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${T.orange}22 0%, transparent 60%)`, borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9"}` }} />
          <div className="relative px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${T.orange}, #d97400)`, boxShadow: "0 4px 12px rgba(244,121,32,0.4)" }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-black" style={{ color: T.text }}>Historial de Accesos</p>
                <p className="text-[11px] mt-0.5" style={{ color: T.textMuted }}>{nombre}</p>
              </div>
            </div>
            <button onClick={onCerrar}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:brightness-110"
              style={{ background: isDark ? "rgba(255,255,255,0.07)" : "#f1f5f9", color: T.textMuted, border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}` }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── FILTROS ── */}
        <div className="px-5 py-3 flex flex-col gap-3 flex-shrink-0"
          style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9"}`, background: isDark ? "rgba(255,255,255,0.015)" : "#fafbfc" }}>

          {/* Atajos rápidos */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest flex-shrink-0" style={{ color: T.textFaint }}>Período</span>
            <div className="flex gap-1.5">
              {atajos.map(a => {
                const activo = a.id === "todo" ? (!desde && !hasta) :
                  a.id === "hoy"    ? (desde === isoHoy  && hasta === isoHoy)  :
                  a.id === "semana" ? (desde === isoLunes && hasta === isoHoy)  :
                  a.id === "mes"    ? (desde === isoMes   && hasta === isoHoy)  : false;
                return (
                  <button key={a.id} onClick={() => aplicarAtajo(a.id)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all hover:brightness-110"
                    style={{
                      background: activo ? `${T.orange}18` : (isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"),
                      color:      activo ? T.orange : T.textMuted,
                      border:    `1px solid ${activo ? `${T.orange}44` : (isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0")}`,
                    }}>
                    {a.lbl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rango personalizado */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-widest flex-shrink-0" style={{ color: T.textFaint }}>Rango</span>
            <div className="flex items-center gap-2">
              <input type="date" style={inpDate} value={desde} onChange={e => setDesde(e.target.value)} />
              <span className="text-[11px]" style={{ color: T.textFaint }}>—</span>
              <input type="date" style={inpDate} value={hasta} onChange={e => setHasta(e.target.value)} />
              {(desde || hasta) && (
                <button onClick={() => { setDesde(""); setHasta(""); }}
                  className="text-[11px] font-bold px-2 py-1 rounded-lg transition-all hover:brightness-110"
                  style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)" }}>
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Tipo de sesión */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest flex-shrink-0" style={{ color: T.textFaint }}>Tipo</span>
            <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}` }}>
              {[
                { id: "todos",    lbl: "Todos"    },
                { id: "activos",  lbl: "Activos"  },
                { id: "cerrados", lbl: "Cerrados" },
              ].map((t, i) => (
                <button key={t.id} onClick={() => setTipoFiltro(t.id)}
                  className="px-3 py-1.5 text-[11px] font-bold transition-all"
                  style={{
                    background: tipoActivo(t.id) ? T.orange : (isDark ? "rgba(255,255,255,0.03)" : "#f8fafc"),
                    color:      tipoActivo(t.id) ? "#fff"   : T.textMuted,
                    borderRight: i < 2 ? `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}` : "none",
                  }}>
                  {t.lbl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── LISTA ── */}
        <div className="px-5 py-3 overflow-y-auto flex flex-col gap-2" style={{ flex: 1, minHeight: 0 }}>
          {loading ? (
            <div className="flex justify-center py-10">
              <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.orange} strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.textFaint} strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <p className="text-sm font-bold" style={{ color: T.textMuted }}>Sin registros</p>
              <p className="text-[11px]" style={{ color: T.textFaint }}>Ajusta el rango o los filtros</p>
            </div>
          ) : filtrados.map((a, i) => {
            const dur = duracion(a.fecha_entrada, a.fecha_salida);
            return (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0"}` }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5"
                  style={{ background: a.fecha_salida ? "#94a3b8" : "#22c55e", boxShadow: a.fecha_salida ? "none" : "0 0 5px #22c55e88" }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold" style={{ color: T.text }}>{fmt(a.fecha_entrada)}</span>
                    {!a.fecha_salida && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                        style={{ background: "rgba(34,197,94,0.12)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.25)" }}>En sesión</span>
                    )}
                  </div>
                  {a.fecha_salida && (
                    <p className="text-[11px] mt-0.5" style={{ color: T.textFaint }}>Salida: {fmt(a.fecha_salida)}</p>
                  )}
                </div>
                {dur && (
                  <span className="text-[11px] font-bold flex-shrink-0 px-2 py-0.5 rounded-lg"
                    style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9", color: T.textMuted }}>
                    {dur}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* ── FOOTER ── */}
        <div className="px-5 py-3 flex items-center justify-between gap-2 flex-shrink-0"
          style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9"}`, background: isDark ? "rgba(255,255,255,0.02)" : "#fafbfc" }}>
          <span className="text-[11px] font-semibold" style={{ color: T.textFaint }}>
            {filtrados.length} registro{filtrados.length !== 1 ? "s" : ""}
          </span>
          <div className="flex gap-2">
            <button onClick={exportarCSV} disabled={filtrados.length === 0}
              className="px-3 py-2 rounded-xl text-[11px] font-bold transition-all hover:brightness-110 active:scale-95 flex items-center gap-1.5"
              style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9", color: T.textMuted, border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`, opacity: filtrados.length === 0 ? 0.4 : 1 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exportar CSV
            </button>
            <button onClick={onCerrar}
              className="px-4 py-2 rounded-xl text-[11px] font-bold transition-all hover:brightness-95"
              style={{ background: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9", color: T.textMuted, border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}` }}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TarjetaEmpleado({ emp, T, isDark, onEditar, onToggleEstatus, onHistorial }) {
  const nombre = `${emp.nombre} ${emp.ap_paterno} ${emp.ap_materno || ""}`.trim();
  const activo = emp.estatus === "Activo";

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200 hover:translate-y-[-2px]"
      style={{
        background: isDark ? "#141720" : T.surface,
        border: `1px solid ${activo ? (isDark ? "rgba(255,255,255,0.07)" : T.border) : (isDark ? "rgba(255,255,255,0.04)" : "#e2e8f0")}`,
        boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.3)" : "0 1px 6px rgba(0,0,0,0.06)",
        opacity: activo ? 1 : 0.55,
      }}>

      <div style={{ height: "2px", background: activo ? `linear-gradient(90deg,${T.orange},#ffb347)` : (isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0") }} />

      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <Avatar nombre={nombre} size={42} isDark={isDark} />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold leading-tight truncate" style={{ color: T.text }}>{nombre}</p>
            <p className="text-[11px] mt-0.5 truncate" style={{ color: T.textMuted }}>{emp.email}</p>
          </div>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
            style={{
              background: activo ? (isDark ? "rgba(22,163,74,0.12)" : "#f0fdf4") : (isDark ? "rgba(255,255,255,0.05)" : "#f8fafc"),
              color: activo ? "#16a34a" : "#94a3b8",
              border: `1px solid ${activo ? "rgba(22,163,74,0.25)" : "rgba(148,163,184,0.25)"}`,
            }}>
            {activo ? "Activo" : "Inactivo"}
          </span>
        </div>

        <div className="flex items-center justify-between px-3 py-2 rounded-xl"
          style={{ background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt }}>
          <span className="text-[11px] font-semibold truncate" style={{ color: T.text }}>
            {emp.nombre_departamento || "Sin departamento"}
          </span>
          <span className="text-[10px] font-mono font-bold flex-shrink-0 ml-2" style={{ color: T.textFaint }}>
            {emp.num_empleado || "—"}
          </span>
        </div>

        <div className="flex gap-2">
          <button onClick={() => onEditar(emp)}
            className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:brightness-110 active:scale-95"
            style={{ background: isDark ? "rgba(255,255,255,0.05)" : T.surfaceAlt, color: T.textMuted, border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}` }}>
            Editar
          </button>
          <button onClick={() => onHistorial(emp)}
            className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:brightness-110 active:scale-95"
            style={{ background: isDark ? "rgba(244,121,32,0.08)" : "#fff7ed", color: T.orange, border: "1px solid rgba(244,121,32,0.2)" }}>
            Historial
          </button>
          <button onClick={() => onToggleEstatus(emp)}
            className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:brightness-110 active:scale-95"
            style={{
              background: activo ? (isDark ? "rgba(220,38,38,0.08)" : "#fef2f2") : (isDark ? "rgba(22,163,74,0.08)" : "#f0fdf4"),
              color: activo ? "#dc2626" : "#16a34a",
              border: `1px solid ${activo ? "rgba(220,38,38,0.2)" : "rgba(22,163,74,0.2)"}`,
            }}>
            {activo ? "Desactivar" : "Activar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Personal({ T }) {
  const isDark = T.bg === "#0b0e14";

  const [empleados,     setEmpleados]     = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [roles,         setRoles]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [busqueda,      setBusqueda]      = useState("");
  const [depFiltro,     setDepFiltro]     = useState("Todos");
  const [rolFiltro,     setRolFiltro]     = useState("Todos");
  const [estatusFiltro, setEstatusFiltro] = useState("Todos");
  const [modal,         setModal]         = useState(null);
  const [modalHistorial, setModalHistorial] = useState(null);

  const cargar = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/api/auth/empleados`).then(r => r.json()),
      fetch(`${API}/api/auth/departamentos`).then(r => r.json()),
      fetch(`${API}/api/auth/roles`).then(r => r.json()),
    ]).then(([emps, deps, rols]) => {
      setEmpleados(Array.isArray(emps) ? emps : []);
      setDepartamentos(Array.isArray(deps) ? deps : []);
      setRoles(Array.isArray(rols) ? rols : []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
    const id = setInterval(cargar, 5000);
    return () => clearInterval(id);
  }, []);

  const filtrados = empleados.filter(e => {
    const nombre = `${e.nombre} ${e.ap_paterno} ${e.ap_materno || ""}`.toLowerCase();
    if (busqueda && !nombre.includes(busqueda.toLowerCase()) && !e.email?.toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (depFiltro !== "Todos" && e.nombre_departamento !== depFiltro) return false;
    if (rolFiltro !== "Todos" && e.nombre_rol !== rolFiltro) return false;
    if (estatusFiltro !== "Todos" && e.estatus !== estatusFiltro) return false;
    return true;
  });

  const activos   = empleados.filter(e => e.estatus === "Activo").length;
  const inactivos = empleados.filter(e => e.estatus !== "Activo").length;

  const guardarEmpleado = async (form) => {
    const esEditar = modal.modo === "editar";
    const url  = esEditar ? `${API}/api/auth/empleados/${modal.empleado.id_empleado}` : `${API}/api/auth/empleados`;
    const body = esEditar
      ? { num_empleado: form.num_empleado, nombre: form.nombre, ap_paterno: form.ap_paterno, ap_materno: form.ap_materno, email: form.email, id_rol: form.id_rol, id_departamento: form.id_departamento, estatus: form.estatus, password_nueva: form.password_nueva || undefined }
      : { num_empleado: form.num_empleado, nombre: form.nombre, ap_paterno: form.ap_paterno, ap_materno: form.ap_materno, email: form.email, password: form.password_nueva, id_rol: form.id_rol, id_departamento: form.id_departamento };
    const res  = await fetch(url, { method: esEditar ? "PUT" : "POST", headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al guardar");
    cargar();
    setTimeout(() => setModal(null), 1200);
  };

  const toggleEstatus = async (emp) => {
    const nuevoEstatus = emp.estatus === "Activo" ? "Inactivo" : "Activo";
    await fetch(`${API}/api/auth/empleados/${emp.id_empleado}`, {
      method: "PUT", headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
      body: JSON.stringify({ estatus: nuevoEstatus }),
    });
    cargar();
  };

  const card = { background: isDark ? "#141720" : T.surface, border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}`, boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.05)" };
  const hdr  = { background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt, borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}` };
  const selStyle = { background: isDark ? "rgba(255,255,255,0.05)" : T.surfaceAlt, border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : T.border}`, color: T.text, borderRadius: "8px", padding: "6px 10px", fontSize: "12px", outline: "none", cursor: "pointer", colorScheme: isDark ? "dark" : "light", maxWidth: "180px", minWidth: "120px", flexShrink: 0 };

  return (
    <div className="absolute inset-0 overflow-y-auto" style={{ background: T.bg }}>
      <div className="max-w-[1400px] mx-auto px-4 py-5 flex flex-col gap-4">

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total empleados", val: empleados.length,     color: "#3b82f6", bgL: "#eff6ff", bgD: "#0f1f3d" },
            { label: "Activos",         val: activos,              color: "#16a34a", bgL: "#f0fdf4", bgD: "#071a0e" },
            { label: "Inactivos",       val: inactivos,            color: "#94a3b8", bgL: "#f8fafc", bgD: "#1a1f2e" },
            { label: "Departamentos",   val: departamentos.length, color: T.orange,  bgL: "#fff7ed", bgD: "#2d1200" },
          ].map((s, i) => (
            <div key={i} className="rounded-xl px-4 py-3"
              style={{ background: isDark ? s.bgD : s.bgL, border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}` }}>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: isDark ? "rgba(255,255,255,0.4)" : T.textMuted }}>{s.label}</p>
              <p className="text-2xl font-black mt-0.5" style={{ color: s.color }}>{s.val}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl overflow-hidden" style={card}>
          <div className="px-4 py-2 flex items-center gap-2" style={hdr}>
            <div className="w-0.5 h-3 rounded-full" style={{ background: T.orange }} />
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Filtros</p>
          </div>
          <div className="px-4 py-3 flex flex-wrap items-center gap-3">

            <div className="relative w-full sm:flex-1" style={{ minWidth: "160px", maxWidth: "300px" }}>
              <input
                className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
                style={{ background: isDark ? "rgba(255,255,255,0.05)" : T.bg, border: `1px solid ${busqueda ? T.orange : T.border}`, color: T.text }}
                placeholder="Buscar por nombre o correo..."
                value={busqueda} onChange={e => setBusqueda(e.target.value)}
                onFocus={e => e.target.style.borderColor = T.orange}
                onBlur={e  => { if (!busqueda) e.target.style.borderColor = T.border; }}
              />
              {busqueda && (
                <button onClick={() => setBusqueda("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold"
                  style={{ color: T.textMuted, background: "none", border: "none", cursor: "pointer" }}>
                  x
                </button>
              )}
            </div>

            <select value={depFiltro} onChange={e => setDepFiltro(e.target.value)} style={selStyle}>
              <option value="Todos">Todas las areas</option>
              {departamentos.map(d => <option key={d.id_departamento} value={d.nombre_departamento}>{d.nombre_departamento}</option>)}
            </select>

            <select value={estatusFiltro} onChange={e => setEstatusFiltro(e.target.value)} style={selStyle}>
              <option value="Todos">Todos los estatus</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>

            {(busqueda || depFiltro !== "Todos" || rolFiltro !== "Todos" || estatusFiltro !== "Todos") && (
              <button onClick={() => { setBusqueda(""); setDepFiltro("Todos"); setRolFiltro("Todos"); setEstatusFiltro("Todos"); }}
                className="px-3 py-2 rounded-lg text-[11px] font-bold transition-all hover:brightness-110"
                style={{ background: "rgba(244,121,32,0.08)", color: T.orange, border: "1px solid rgba(244,121,32,0.2)" }}>
                Limpiar filtros
              </button>
            )}

            <button onClick={() => setModal({ modo: "crear" })}
              className="w-full sm:w-auto sm:ml-auto px-4 py-2.5 rounded-lg text-[12px] font-bold text-white transition-all hover:brightness-110 active:scale-95"
              style={{ background: `linear-gradient(135deg, ${T.orange}, #d97400)`, boxShadow: "0 3px 12px rgba(244,121,32,0.35)", minHeight: "44px" }}>
              Agregar empleado
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.orange} strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-sm font-bold" style={{ color: T.textMuted }}>Sin resultados</p>
            <p className="text-xs" style={{ color: T.textFaint }}>Ajusta los filtros o agrega un nuevo empleado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtrados.map(emp => (
              <TarjetaEmpleado
                key={emp.id_empleado}
                emp={emp}
                T={T}
                isDark={isDark}
                onEditar={e => setModal({ modo: "editar", empleado: e })}
                onToggleEstatus={toggleEstatus}
                onHistorial={e => setModalHistorial(e)}
              />
            ))}
          </div>
        )}

      </div>

      {modalHistorial && (
        <ModalHistorial
          T={T}
          isDark={isDark}
          empleado={modalHistorial}
          onCerrar={() => setModalHistorial(null)}
        />
      )}

      {modal && (
        <ModalEmpleado
          T={T}
          isDark={isDark}
          modo={modal.modo}
          empleado={modal.empleado}
          departamentos={departamentos}
          roles={roles}
          onGuardar={guardarEmpleado}
          onCerrar={() => setModal(null)}
        />
      )}
    </div>
  );
}

