import { useState, useEffect, useCallback } from "react";
import { useAutoRefresh } from "../../Config/useAutoRefresh";
import { apiFetch } from "../../Config/api";
import FiltrosToolbar from "../../Components/FiltrosToolbar";
import { useCardStyles } from "../../Components/Card";
import Modal from "../../Components/Modal";
import { Clock } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL ?? "";

// ── Avatar ────────────────────────────────────────────────────────
function Avatar({ nombre, foto, size = 48, isDark }) {
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

  if (foto) {
    const rel = foto.startsWith("/storage/") ? foto : `/storage/${foto}`;
    const src = foto.startsWith("http") ? foto : `${API_URL}${rel.split("/").map(encodeURIComponent).join("/")}`;
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: `2px solid ${fg}44` }}>
        <img src={src} alt={nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={e => { e.target.style.display = "none"; e.target.parentElement.innerHTML = `<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:${bg};font-size:${size*0.33}px;font-weight:700;color:${fg}">${iniciales||"?"}</span>`; }} />
      </div>
    );
  }

  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, border: `2px solid ${fg}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontSize: size * 0.33, fontWeight: 700, color: fg, letterSpacing: "-0.02em" }}>{iniciales || "?"}</span>
    </div>
  );
}

// ── Password strength ─────────────────────────────────────────────
function passStrength(p) {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 6)  s++;
  if (p.length >= 10) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

// ── Modal Empleado ────────────────────────────────────────────────
function ModalEmpleado({ T, isDark, modo, empleado, departamentos, roles, sucursales, onGuardar, onCerrar }) {
  const ORANGE = "#F7941E";
  const [form, setForm] = useState({
    num_empleado:    empleado?.num_empleado    || "",
    nombre:          empleado?.nombre          || "",
    ap_paterno:      empleado?.ap_paterno      || "",
    ap_materno:      empleado?.ap_materno      || "",
    email:           empleado?.email           || "",
    id_rol:          empleado?.id_rol          ? String(empleado.id_rol) : "",
    id_departamento: empleado?.id_departamento ? String(empleado.id_departamento) : "",
    id_sucursal:     empleado?.id_sucursal     ? String(empleado.id_sucursal) : "",
    estatus:         empleado?.estatus         || "Activo",
    password_nueva:  "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [exito,    setExito]    = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const guardar = async () => {
    if ((modo === "crear" && !form.num_empleado.trim()) || !form.nombre.trim() || !form.ap_paterno.trim() || !form.email.trim() || !form.id_rol || !form.id_departamento)
      return setError("Completa todos los campos obligatorios");
    if (modo === "crear" && !form.password_nueva.trim())
      return setError("La contraseña es obligatoria al crear un empleado");
    if (form.password_nueva && form.password_nueva.trim().length < 8)
      return setError("La contraseña debe tener al menos 8 caracteres");
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
  const iconEmpleado = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#93c5fd" : ORANGE} strokeWidth="2.5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );

  const inp = {
    background: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : T.border}`,
    color: T.text, borderRadius: "8px", padding: "9px 12px",
    fontSize: "13px", outline: "none", width: "100%", transition: "border-color .15s, box-shadow .15s",
  };

  const Lbl = ({ children }) => (
    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: T.textMuted }}>{children}</span>
  );

  return (
    <Modal
      title={modo === "crear" ? "Nuevo Empleado" : "Editar Empleado"}
      subtitle={modo === "crear" ? "Registrar nuevo miembro del equipo" : nombreCompleto}
      icon={iconEmpleado}
      accentColor={ORANGE}
      onClose={onCerrar}
      onConfirm={guardar}
      confirmLabel={loading ? "Guardando…" : modo === "crear" ? "Crear Empleado" : "Guardar Cambios"}
      cancelLabel="Cancelar"
      loading={loading}
      maxWidth="448px"
      noBodyPadding
    >
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14, maxHeight: "62vh", overflowY: "auto" }}>

          {/* N° Empleado */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <Lbl>N° Empleado</Lbl>
            <input
              style={{ ...inp, background: modo === "editar" ? (isDark ? "rgba(255,255,255,0.02)" : "#f1f5f9") : inp.background, color: modo === "editar" ? T.textFaint : T.text, cursor: modo === "editar" ? "default" : "text", borderStyle: modo === "editar" ? "dashed" : "solid" }}
              value={form.num_empleado}
              onChange={e => modo === "crear" && set("num_empleado", e.target.value)}
              readOnly={modo === "editar"}
              placeholder="EMP-001"
              onFocus={e => { if (modo === "crear") { e.target.style.borderColor = "#F7941E"; e.target.style.boxShadow = "0 0 0 3px rgba(247,148,30,0.15)"; } }}
              onBlur={e  => { e.target.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : T.border; e.target.style.boxShadow = "none"; }} />
          </div>

          {/* Nombre */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <Lbl>Nombre Completo</Lbl>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { key: "nombre",     ph: "Nombre",          lbl: "Nombre"    },
                { key: "ap_paterno", ph: "Ej. García",       lbl: "Paterno"   },
                { key: "ap_materno", ph: "Opc.",             lbl: "Materno"   },
              ].map(({ key, ph, lbl }) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: T.textFaint }}>{lbl}</span>
                  <input style={inp} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={ph}
                    onFocus={e => { e.target.style.borderColor = "#F7941E"; e.target.style.boxShadow = "0 0 0 3px rgba(247,148,30,0.15)"; }}
                    onBlur={e  => { e.target.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : T.border; e.target.style.boxShadow = "none"; }} />
                </div>
              ))}
            </div>
          </div>

          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <Lbl>Correo Electrónico</Lbl>
            <input style={inp} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="correo@empresa.com"
              onFocus={e => { e.target.style.borderColor = "#F7941E"; e.target.style.boxShadow = "0 0 0 3px rgba(247,148,30,0.15)"; }}
              onBlur={e  => { e.target.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : T.border; e.target.style.boxShadow = "none"; }} />
          </div>

          {/* Rol y Depto */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { key: "id_rol",          opts: roles.map(r => ({ val: r.id_rol, lbl: r.nombre_rol })),                          lbl: "Rol",         ph: "Seleccionar rol"  },
              { key: "id_departamento", opts: departamentos.map(d => ({ val: d.id_departamento, lbl: d.nombre_departamento })), lbl: "Departamento", ph: "Seleccionar área" },
            ].map(({ key, opts, lbl, ph }) => (
              <div key={key} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <Lbl>{lbl}</Lbl>
                <select style={{ ...inp, cursor: "pointer", colorScheme: isDark ? "dark" : "light" }}
                  value={form[key]} onChange={e => set(key, e.target.value)}
                  onFocus={e => { e.target.style.borderColor = "#F7941E"; e.target.style.boxShadow = "0 0 0 3px rgba(247,148,30,0.15)"; }}
                  onBlur={e  => { e.target.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : T.border; e.target.style.boxShadow = "none"; }}>
                  <option value="">{ph}</option>
                  {opts.map(o => <option key={o.val} value={o.val}>{o.lbl}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* Sucursal */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <Lbl>Sucursal</Lbl>
            <select style={{ ...inp, cursor: "pointer", colorScheme: isDark ? "dark" : "light" }}
              value={form.id_sucursal} onChange={e => set("id_sucursal", e.target.value)}
              onFocus={e => { e.target.style.borderColor = "#F7941E"; e.target.style.boxShadow = "0 0 0 3px rgba(247,148,30,0.15)"; }}
              onBlur={e  => { e.target.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : T.border; e.target.style.boxShadow = "none"; }}>
              <option value="">Sin sucursal</option>
              {sucursales.map(s => <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre_sucursal}</option>)}
            </select>
          </div>

          {/* Estatus toggle (solo editar) */}
          {modo === "editar" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <Lbl>Estatus</Lbl>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 8, background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: form.estatus === "Activo" ? "#22c55e" : "#94a3b8", boxShadow: form.estatus === "Activo" ? "0 0 0 3px rgba(34,197,94,0.2)" : "none" }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: form.estatus === "Activo" ? "#16a34a" : "#64748b" }}>{form.estatus === "Activo" ? "Activo" : "Inactivo"}</span>
                </div>
                <button type="button" onClick={() => set("estatus", form.estatus === "Activo" ? "Inactivo" : "Activo")}
                  style={{ position: "relative", width: 44, height: 24, borderRadius: 12, background: form.estatus === "Activo" ? "#16a34a" : (isDark ? "rgba(255,255,255,0.12)" : "#cbd5e1"), border: "none", cursor: "pointer", padding: 0, transition: "background .25s" }}>
                  <span style={{ position: "absolute", top: 3, left: form.estatus === "Activo" ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.25)", transition: "left .25s", display: "block" }} />
                </button>
              </div>
            </div>
          )}

          {/* Contraseña */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <Lbl>{modo === "crear" ? "Contraseña" : "Nueva Contraseña (opcional)"}</Lbl>
            <div style={{ position: "relative" }}>
              <input style={{ ...inp, paddingRight: "40px" }} type={showPass ? "text" : "password"}
                value={form.password_nueva} onChange={e => set("password_nueva", e.target.value)}
                placeholder={modo === "crear" ? "Mínimo 8 caracteres" : "Dejar vacío para no cambiar"}
                onFocus={e => { e.target.style.borderColor = "#F7941E"; e.target.style.boxShadow = "0 0 0 3px rgba(247,148,30,0.15)"; }}
                onBlur={e  => { e.target.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : T.border; e.target.style.boxShadow = "none"; }} />
              <button type="button" onClick={() => setShowPass(p => !p)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, color: showPass ? "#F7941E" : (isDark ? "#64748b" : "#475569") }}>
                {showPass
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            {form.password_nueva && (() => {
              const s = passStrength(form.password_nueva);
              const color = s <= 1 ? "#ef4444" : s <= 2 ? "#f97316" : s <= 3 ? "#eab308" : s <= 4 ? "#84cc16" : "#22c55e";
              const label = s <= 1 ? "Muy débil" : s <= 2 ? "Débil" : s <= 3 ? "Regular" : s <= 4 ? "Fuerte" : "Muy fuerte";
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
                  <div style={{ height: 3, borderRadius: 9999, background: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0" }}>
                    <div style={{ width: `${(s/5)*100}%`, height: "100%", background: color, borderRadius: 9999, transition: "width .3s" }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color }}>{label}</span>
                </div>
              );
            })()}
          </div>

          {error && (
            <div style={{ padding: "10px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, background: isDark ? "rgba(220,38,38,0.1)" : "#fff1f1", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}
          {exito && (
            <div style={{ padding: "10px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, background: isDark ? "rgba(22,163,74,0.1)" : "#f0fdf4", color: "#16a34a", border: "1px solid rgba(22,163,74,0.2)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              {exito}
            </div>
          )}
        </div>
    </Modal>
  );
}

// ── Modal Historial ───────────────────────────────────────────────
function ModalHistorial({ T, isDark, empleado, onCerrar }) {
  const hoy = new Date();
  const isoHoy   = hoy.toISOString().slice(0, 10);
  const isoLunes = (() => { const d = new Date(hoy); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toISOString().slice(0, 10); })();
  const isoMes   = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`;

  const [accesos,    setAccesos]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [desde,      setDesde]      = useState("");
  const [hasta,      setHasta]      = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");

  const nombre = `${empleado.nombre} ${empleado.ap_paterno}`.trim();

  useEffect(() => {
    apiFetch(`/api/auth/accesos/${empleado.id_empleado}`)
      .then(r => r.json())
      .then(d => setAccesos(Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [empleado.id_empleado]);

  const fmt = iso => !iso ? "-" : new Date(iso).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });

  const duracion = (entrada, salida) => {
    if (!salida) return null;
    const mins = Math.round((new Date(salida) - new Date(entrada)) / 60000);
    return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const aplicarAtajo = (a) => {
    if (a === "hoy")    { setDesde(isoHoy);  setHasta(isoHoy);  }
    if (a === "semana") { setDesde(isoLunes); setHasta(isoHoy);  }
    if (a === "mes")    { setDesde(isoMes);   setHasta(isoHoy);  }
    if (a === "todo")   { setDesde("");        setHasta("");       }
  };

  const filtrados = accesos.filter(a => {
    if (tipoFiltro === "activos"  && a.fecha_salida)  return false;
    if (tipoFiltro === "cerrados" && !a.fecha_salida) return false;
    if (desde) { const d = new Date(desde); d.setHours(0,0,0,0); if (new Date(a.fecha_entrada) < d) return false; }
    if (hasta) { const h = new Date(hasta); h.setHours(23,59,59,999); if (new Date(a.fecha_entrada) > h) return false; }
    return true;
  });

  const exportarCSV = () => {
    const filas = [["Entrada","Salida","Duración","Estado"], ...filtrados.map(a => [fmt(a.fecha_entrada), fmt(a.fecha_salida), duracion(a.fecha_entrada, a.fecha_salida)||"-", a.fecha_salida?"Cerrada":"Activa"])];
    const csv  = filas.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const el   = document.createElement("a");
    el.href = url; el.download = `historial_${empleado.num_empleado||empleado.id_empleado}.csv`;
    el.click(); URL.revokeObjectURL(url);
  };

  const inpDate = { background: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`, color: T.text, borderRadius: "6px", padding: "6px 10px", fontSize: "12px", outline: "none", colorScheme: isDark ? "dark" : "light" };

  return (
    <Modal
      T={T}
      title="Historial de Accesos"
      subtitle={nombre}
      icon={<Clock size={13} aria-hidden="true" style={{ color: "rgba(255,255,255,0.75)" }} />}
      onClose={onCerrar}
      maxWidth="580px"
      noBodyPadding
    >
      {/* Filtros */}
      <div style={{ padding: "12px 18px", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "#e5e7eb"}`, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: T.textFaint }}>Período</span>
          {[{ id:"todo", lbl:"Todo" }, { id:"hoy", lbl:"Hoy" }, { id:"semana", lbl:"Semana" }, { id:"mes", lbl:"Mes" }].map(a => {
            const activo = a.id === "todo" ? (!desde && !hasta) : a.id === "hoy" ? (desde===isoHoy&&hasta===isoHoy) : a.id === "semana" ? (desde===isoLunes&&hasta===isoHoy) : (desde===isoMes&&hasta===isoHoy);
            return (
              <button key={a.id} onClick={() => aplicarAtajo(a.id)}
                style={{ padding: "3px 10px", borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: "pointer", background: activo ? "rgba(247,148,30,0.12)" : (isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"), color: activo ? "#F7941E" : T.textMuted, border: `1px solid ${activo ? "rgba(247,148,30,0.35)" : (isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0")}` }}>
                {a.lbl}
              </button>
            );
          })}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="date" style={inpDate} value={desde} onChange={e => setDesde(e.target.value)} />
            <span style={{ fontSize: 11, color: T.textFaint }}>–</span>
            <input type="date" style={inpDate} value={hasta} onChange={e => setHasta(e.target.value)} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: T.textFaint }}>Tipo</span>
          <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}` }}>
            {[{ id:"todos", lbl:"Todos" }, { id:"activos", lbl:"Activos" }, { id:"cerrados", lbl:"Cerrados" }].map((t, i) => (
              <button key={t.id} onClick={() => setTipoFiltro(t.id)}
                style={{ padding: "4px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", background: tipoFiltro === t.id ? "#F7941E" : (isDark ? "rgba(255,255,255,0.03)" : "#f8fafc"), color: tipoFiltro === t.id ? "#fff" : T.textMuted, border: "none", borderRight: i < 2 ? `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}` : "none" }}>
                {t.lbl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista */}
      <div style={{ maxHeight: "340px", overflowY: "auto", padding: "12px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
            <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F7941E" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 8 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={T.textFaint} strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <p style={{ fontSize: 13, fontWeight: 600, color: T.textMuted, margin: 0 }}>Sin registros</p>
            <p style={{ fontSize: 11, color: T.textFaint, margin: 0 }}>Ajusta el rango o los filtros</p>
          </div>
        ) : filtrados.map((a, i) => {
          const dur = duracion(a.fecha_entrada, a.fecha_salida);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#e5e7eb"}` }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: a.fecha_salida ? "#94a3b8" : "#22c55e", boxShadow: a.fecha_salida ? "none" : "0 0 0 3px rgba(34,197,94,0.2)" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{fmt(a.fecha_entrada)}</span>
                  {!a.fecha_salida && <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "1px 6px", borderRadius: 9999, background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.2)" }}>En sesión</span>}
                </div>
                {a.fecha_salida && <p style={{ fontSize: 11, color: T.textFaint, margin: 0 }}>Salida: {fmt(a.fecha_salida)}</p>}
              </div>
              {dur && <span style={{ fontSize: 11, fontWeight: 600, flexShrink: 0, padding: "2px 8px", borderRadius: 5, background: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9", color: T.textMuted }}>{dur}</span>}
            </div>
          );
        })}
      </div>

      {/* Footer de acciones */}
      <div style={{ padding: "10px 18px", borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "#e5e7eb"}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: T.textFaint }}>{filtrados.length} registro{filtrados.length !== 1 ? "s" : ""}</span>
        <button onClick={exportarCSV} disabled={filtrados.length === 0}
          className="btn-ghost"
          style={{ padding: "5px 12px", fontSize: 11, display: "flex", alignItems: "center", gap: 5, opacity: filtrados.length === 0 ? 0.4 : 1 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Exportar CSV
        </button>
      </div>
    </Modal>
  );
}

// ── Acciones Dropdown ─────────────────────────────────────────────
function AccionesDropdown({ emp, T, isDark, onEditar, onHistorial, onToggleEstatus }) {
  const [open, setOpen] = useState(false);
  const activo = emp.estatus === "Activo";

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen(o => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        style={{
          width: 30, height: 30, borderRadius: 6, cursor: "pointer",
          background: open ? (isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9") : "transparent",
          border: `1px solid ${open ? (isDark ? "rgba(255,255,255,0.12)" : "#d1d5db") : "transparent"}`,
          color: T.textMuted, display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background .15s",
        }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
        </svg>
      </button>
      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 30,
          minWidth: 162, borderRadius: 8, padding: "4px 0",
          background: isDark ? "#1e2330" : "#ffffff",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
          boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.5)" : "0 8px 24px rgba(0,0,0,0.12)",
        }}>
          {[
            {
              label: "Editar",
              color: T.text,
              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
              action: () => { onEditar(emp); setOpen(false); },
            },
            {
              label: "Historial",
              color: T.text,
              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
              action: () => { onHistorial(emp); setOpen(false); },
            },
            {
              label: activo ? "Desactivar" : "Activar",
              color: activo ? "#dc2626" : "#16a34a",
              icon: activo
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
              action: () => { onToggleEstatus(emp); setOpen(false); },
            },
          ].map(item => (
            <button key={item.label} onMouseDown={item.action}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 14px", fontSize: 12, fontWeight: 500, color: item.color, background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
              onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              {item.icon}{item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Ícono de orden ────────────────────────────────────────────────
function SortIcon({ dir }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity: dir ? 1 : 0.3, flexShrink: 0 }}>
      {dir === "asc" ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
    </svg>
  );
}

// ── Lightbox Foto ─────────────────────────────────────────────────
function LightboxFoto({ src, nombre, onCerrar }) {
  return (
    <div
      onClick={onCerrar}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.82)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: 480, width: "100%" }}>
        <img src={src} alt={nombre}
          style={{ width: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: 12, boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }} />
        <button onClick={onCerrar}
          style={{ position: "absolute", top: -14, right: -14, width: 32, height: 32, borderRadius: "50%", background: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        {nombre && <p style={{ textAlign: "center", marginTop: 10, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{nombre}</p>}
      </div>
    </div>
  );
}

// ── Tabla de Empleados ────────────────────────────────────────────
function TablaEmpleados({ empleados, T, isDark, onEditar, onHistorial, onToggleEstatus }) {
  const [lightbox, setLightbox] = useState(null);
  const [sort, setSort] = useState({ col: "nombre", dir: "asc" });

  const toggleSort = col => setSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));

  const sorted = [...empleados].sort((a, b) => {
    const map = {
      nombre:   e => `${e.nombre} ${e.ap_paterno}`,
      id:       e => e.num_empleado || "",
      depto:    e => e.nombre_departamento || "",
      sucursal: e => e.nombre_sucursal || "",
      rol:      e => e.nombre_rol || "",
    };
    const fn = map[sort.col] || (() => "");
    const cmp = fn(a).localeCompare(fn(b), "es");
    return sort.dir === "asc" ? cmp : -cmp;
  });

  const COLS = [
    { key: "nombre",    label: "Empleado",  sortable: true  },
    { key: "id",        label: "ID",        sortable: true  },
    { key: "depto",     label: "Área",      sortable: true  },
    { key: "sucursal",  label: "Sucursal",  sortable: true  },
    { key: "rol",       label: "Rol",       sortable: true  },
    { key: "email",     label: "Correo",    sortable: false },
    { key: "acciones",  label: "",          sortable: false },
  ];

  const thS = {
    padding: "10px 16px",
    fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
    textTransform: "uppercase", whiteSpace: "nowrap",
    color: T.textMuted,
    background: isDark ? "rgba(255,255,255,0.03)" : "#F9FAFB",
    borderBottom: `2px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb"}`,
    userSelect: "none",
  };

  const tdS = {
    padding: "10px 16px",
    fontSize: 11,
    color: T.text,
    borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6"}`,
    verticalAlign: "middle",
  };

  return (
    <div style={{ borderRadius: 10, overflow: "hidden", background: isDark ? "#141720" : "#ffffff", border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "#e5e7eb"}`, boxShadow: isDark ? "0 1px 8px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {COLS.map(col => (
                <th key={col.key}
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
            {sorted.map((emp, i) => {
              const nombre = `${emp.nombre} ${emp.ap_paterno} ${emp.ap_materno || ""}`.trim();
              const activo = emp.estatus === "Activo";
              const rowBg  = i % 2 === 0 ? (isDark ? "transparent" : "#ffffff") : (isDark ? "rgba(255,255,255,0.015)" : "#fafafa");

              const fotoSrc = emp.foto
                ? (emp.foto.startsWith("http") ? emp.foto : `${API_URL}${(emp.foto.startsWith("/storage/") ? emp.foto : `/storage/${emp.foto}`).split("/").map(encodeURIComponent).join("/")}`)
                : null;

              return (
                <tr key={emp.id_empleado}
                  style={{ background: rowBg, opacity: activo ? 1 : 0.55, transition: "background .12s" }}
                  onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "#f0f7ff"}
                  onMouseLeave={e => e.currentTarget.style.background = rowBg}>

                  {/* Empleado */}
                  <td style={tdS}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        onClick={fotoSrc ? () => setLightbox({ src: fotoSrc, nombre }) : undefined}
                        style={{ cursor: fotoSrc ? "zoom-in" : "default", flexShrink: 0 }}>
                        <Avatar nombre={nombre} foto={emp.foto} size={30} isDark={isDark} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, cursor: "default" }}>
                        {/* Dot indicator de estado */}
                        <span style={{
                          width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                          background: activo ? "#22c55e" : "#94a3b8",
                          boxShadow: activo ? "0 0 0 2.5px rgba(34,197,94,0.2)" : "none",
                        }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.text, whiteSpace: "nowrap" }}>{nombre}</span>
                      </div>
                    </div>
                  </td>

                  {/* ID */}
                  <td style={tdS}>
                    <span style={{ fontFamily: "'JetBrains Mono','Courier New',monospace", fontSize: 11, color: T.textMuted, background: isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6", padding: "2px 7px", borderRadius: 4 }}>
                      {emp.num_empleado || "—"}
                    </span>
                  </td>

                  {/* Área */}
                  <td style={{ ...tdS, color: T.textMuted }}>
                    {emp.nombre_departamento || "—"}
                  </td>

                  {/* Sucursal */}
                  <td style={{ ...tdS, color: T.textMuted }}>
                    {emp.nombre_sucursal || "—"}
                  </td>

                  {/* Rol */}
                  <td style={tdS}>
                    {emp.nombre_rol && (
                      <span style={{ fontSize: 11, fontWeight: 600, background: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9", color: T.textMuted, border: `1px solid ${isDark ? "rgba(255,255,255,0.09)" : "#e2e8f0"}`, padding: "2px 8px", borderRadius: 4 }}>
                        {emp.nombre_rol}
                      </span>
                    )}
                  </td>

                  {/* Correo */}
                  <td style={{ ...tdS, color: T.textMuted, maxWidth: 200 }}>
                    <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {emp.email}
                    </span>
                  </td>

                  {/* Acciones ⋯ */}
                  <td style={{ ...tdS, textAlign: "right", width: 52 }}>
                    <AccionesDropdown
                      emp={emp} T={T} isDark={isDark}
                      onEditar={onEditar}
                      onHistorial={onHistorial}
                      onToggleEstatus={onToggleEstatus}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer de tabla */}
      <div style={{ padding: "8px 16px", borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6"}`, background: isDark ? "rgba(255,255,255,0.02)" : "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        <span style={{ fontSize: 11, color: T.textFaint }}>{empleados.length} empleado{empleados.length !== 1 ? "s" : ""}</span>
      </div>
      {lightbox && <LightboxFoto src={lightbox.src} nombre={lightbox.nombre} onCerrar={() => setLightbox(null)} />}
    </div>
  );
}

// ── Personal (página principal) ───────────────────────────────────
export default function Personal({ T }) {
  const isDark = T.isDark;

  const [empleados,     setEmpleados]     = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [roles,         setRoles]         = useState([]);
  const [sucursales,    setSucursales]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filtros,       setFiltros]       = useState({ busqueda: "", departamento: "Todos", estatus: "Todos" });
  const [modal,         setModal]         = useState(null);
  const [modalHistorial, setModalHistorial] = useState(null);

  const cargar = useCallback((mostrarLoading = true) => {
    if (mostrarLoading) setLoading(true);
    Promise.all([
      apiFetch(`/api/auth/empleados`).then(r => r.ok ? r.json() : []),
      apiFetch(`/api/auth/departamentos`).then(r => r.ok ? r.json() : []),
      apiFetch(`/api/auth/roles`).then(r => r.ok ? r.json() : []),
      apiFetch(`/api/auth/sucursales`).then(r => r.ok ? r.json() : []),
    ]).then(([emps, deps, rols, sucs]) => {
      setEmpleados(Array.isArray(emps) ? emps : []);
      setDepartamentos(Array.isArray(deps) ? deps : []);
      setRoles(Array.isArray(rols) ? rols : []);
      setSucursales(Array.isArray(sucs) ? sucs : []);
    }).catch(err => console.error("Error cargando personal:", err))
      .finally(() => { if (mostrarLoading) setLoading(false); });
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useAutoRefresh(() => cargar(false), 30000);

  const filtrados = empleados.filter(e => {
    const nombre = `${e.nombre} ${e.ap_paterno} ${e.ap_materno || ""}`.toLowerCase();
    if (filtros.busqueda && !nombre.includes(filtros.busqueda.toLowerCase()) && !e.email?.toLowerCase().includes(filtros.busqueda.toLowerCase())) return false;
    if (filtros.departamento !== "Todos" && e.nombre_departamento !== filtros.departamento) return false;
    if (filtros.estatus !== "Todos" && e.estatus !== filtros.estatus) return false;
    return true;
  });

  const camposFiltro = [
    { key: "busqueda",     label: "Búsqueda Rápida", type: "search", placeholder: "Nombre o correo..." },
    { key: "departamento", label: "Área",             type: "select", opts: ["Todos", ...departamentos.map(d => d.nombre_departamento)] },
    { key: "estatus",      label: "Estatus",          type: "select", opts: ["Todos", "Activo", "Inactivo"] },
  ];

  const activos   = empleados.filter(e => e.estatus === "Activo").length;
  const inactivos = empleados.filter(e => e.estatus !== "Activo").length;

  const guardarEmpleado = async (form, modo, empleadoId) => {
    const esEditar = modo === "editar";
    const url  = esEditar ? `/api/auth/empleados/${empleadoId}` : `/api/auth/empleados`;
    const pass = form.password_nueva.trim();
    const body = esEditar
      ? { num_empleado: form.num_empleado, nombre: form.nombre.trim(), ap_paterno: form.ap_paterno.trim(), ap_materno: form.ap_materno.trim(), email: form.email.trim(), id_rol: Number(form.id_rol), id_departamento: Number(form.id_departamento), id_sucursal: form.id_sucursal ? Number(form.id_sucursal) : null, estatus: form.estatus, password_nueva: pass || undefined }
      : { num_empleado: form.num_empleado.trim(), nombre: form.nombre.trim(), ap_paterno: form.ap_paterno.trim(), ap_materno: form.ap_materno.trim(), email: form.email.trim(), password: pass, id_rol: Number(form.id_rol), id_departamento: Number(form.id_departamento), id_sucursal: form.id_sucursal ? Number(form.id_sucursal) : null };
    const res  = await apiFetch(url, { method: esEditar ? "PUT" : "POST", body });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al guardar");
    cargar();
    setTimeout(() => setModal(null), 1200);
  };

  const toggleEstatus = async (emp) => {
    const nuevoEstatus = emp.estatus === "Activo" ? "Inactivo" : "Activo";
    try {
      const res = await apiFetch(`/api/auth/empleados/${emp.id_empleado}`, { method: "PUT", body: { estatus: nuevoEstatus } });
      if (!res.ok) { const d = await res.json(); console.error("Error estatus:", d.error); return; }
      cargar();
    } catch (err) { console.error("Error estatus:", err.message); }
  };

  const { card } = useCardStyles(T);

  return (
    <div style={{ background: isDark ? T.bg : "#F9FAFB", height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ maxWidth: 1400, width: "100%", margin: "0 auto", padding: "16px 16px 0", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}
          className="grid-cols-2 sm:grid-cols-4">
          {[
            { label: "Total empleados", val: empleados.length,     color: "#3b82f6", bgL: "#eff6ff", bgD: "#0f1f3d" },
            { label: "Activos",         val: activos,              color: "#16a34a", bgL: "#f0fdf4", bgD: "#071a0e" },
            { label: "Inactivos",       val: inactivos,            color: "#94a3b8", bgL: "#f8fafc", bgD: "#1a1f2e" },
            { label: "Departamentos",   val: departamentos.length, color: "#F7941E", bgL: "#fff7ed", bgD: "#2d1200" },
          ].map(s => (
            <div key={s.label} style={{ borderRadius: 8, padding: "10px 14px", background: isDark ? s.bgD : s.bgL, border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "#e5e7eb"}` }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: isDark ? "rgba(255,255,255,0.4)" : "#6b7280", margin: 0 }}>{s.label}</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: s.color, margin: "2px 0 0" }}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <FiltrosToolbar campos={camposFiltro} valores={filtros} onChange={(k, v) => setFiltros(p => ({ ...p, [k]: v }))} onLimpiar={() => setFiltros({ busqueda: "", departamento: "Todos", estatus: "Todos" })} T={T}>
          <button
            onClick={() => setModal({ modo: "crear" })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: "#F7941E", color: "#fff", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
            onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.08)"}
            onMouseLeave={e => e.currentTarget.style.filter = "none"}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Agregar empleado
          </button>
        </FiltrosToolbar>

        {/* Contenido */}
        <div style={{ marginTop: 10, flex: 1, minHeight: 0, overflowY: "auto", paddingBottom: 24 }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
              <svg className="animate-spin" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F7941E" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            </div>
          ) : filtrados.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 8 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={T.textFaint} strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <p style={{ fontSize: 13, fontWeight: 600, color: T.textMuted, margin: 0 }}>Sin resultados</p>
              <p style={{ fontSize: 12, color: T.textFaint, margin: 0 }}>Ajusta los filtros o agrega un nuevo empleado</p>
            </div>
          ) : (
            <TablaEmpleados
              empleados={filtrados}
              T={T}
              isDark={isDark}
              onEditar={e => setModal({ modo: "editar", empleado: e })}
              onToggleEstatus={toggleEstatus}
              onHistorial={e => setModalHistorial(e)}
            />
          )}
        </div>
      </div>

      {modalHistorial && (
        <ModalHistorial T={T} isDark={isDark} empleado={modalHistorial} onCerrar={() => setModalHistorial(null)} />
      )}
      {modal && (
        <ModalEmpleado T={T} isDark={isDark} modo={modal.modo} empleado={modal.empleado} departamentos={departamentos} roles={roles} sucursales={sucursales} onGuardar={(form) => guardarEmpleado(form, modal.modo, modal.empleado?.id_empleado)} onCerrar={() => setModal(null)} />
      )}
    </div>
  );
}
