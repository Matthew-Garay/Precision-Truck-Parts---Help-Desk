
import React, { useState, useEffect, useCallback } from "react";
import { useAutoRefresh } from "../../Config/useAutoRefresh";
import { apiFetch } from "../../Config/api";
import { emailCorporativoValido, DOMINIOS_PERMITIDOS } from "../../Config/email.js";
import { evaluarPassword, passwordSeguro } from "../../Config/password.js";
import FiltrosToolbar from "../../Components/FiltrosToolbar";
import { X, Eye, EyeOff } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL ?? "";
const ORANGE  = "#F47920";

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

// ── Tokens helper ─────────────────────────────────────────────────
function useTokens(T, isDark) {
  return {
    surface:    isDark ? "#161B22" : "#ffffff",
    surfaceAlt: isDark ? "#1a2030" : "#f8fafc",
    border:     isDark ? "rgba(255,255,255,0.07)" : "#e8ecf0",
    textMain:   T?.text      ?? (isDark ? "#e2e8f0" : "#1a202c"),
    textMuted:  T?.textMuted ?? (isDark ? "#8b949e" : "#64748b"),
    textFaint:  T?.textFaint ?? (isDark ? "rgba(255,255,255,0.30)" : "#a0aec0"),
    inputBg:    isDark ? "rgba(255,255,255,0.04)" : "#f8fafc",
  };
}

// ── Field label ───────────────────────────────────────────────────
function Field({ label, htmlFor, required, children, textFaint }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label htmlFor={htmlFor} style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: textFaint }}>
        {label}{required && <span style={{ color: ORANGE, marginLeft: "2px" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const FORM_VACIO = {
  num_empleado: "", nombre: "", ap_paterno: "", ap_materno: "",
  email: "", password_nueva: "", id_rol: "", id_departamento: "",
  id_sucursal: "", estatus: "Activo",
};

// ── Modal Empleado (crear / editar) ───────────────────────────────
function ModalEmpleado({ T, isDark, modo, empleado, departamentos, roles, sucursales, onGuardar, onCerrar }) {
  const isEdit = modo === "editar";
  const tk = useTokens(T, isDark);
  const [form,   setForm]   = useState({ ...FORM_VACIO, ...(isEdit ? { ...empleado, password_nueva: "", id_sucursal: empleado.id_sucursal != null ? String(empleado.id_sucursal) : "", id_rol: String(empleado.id_rol ?? ""), id_departamento: String(empleado.id_departamento ?? "") } : {}) });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const [showPass, setShowPass] = useState(false);

  // Política de contraseña compartida (misma que valida el backend)
  const passEval = evaluarPassword(form.password_nueva);

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onCerrar(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onCerrar]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const inp = {
    background: tk.inputBg, border: `1px solid ${tk.border}`,
    borderRadius: "6px", padding: "0 10px", height: "34px",
    fontSize: "13px", color: tk.textMain, outline: "none",
    width: "100%", boxSizing: "border-box",
    colorScheme: isDark ? "dark" : "light",
    transition: "border-color 0.12s, box-shadow 0.12s",
  };
  const borderFocus = "#2563eb";
  const onFocus = e => { e.target.style.borderColor = borderFocus; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.10)"; e.target.style.background = isDark ? "rgba(255,255,255,0.07)" : "#fff"; };
  const onBlur  = e => { e.target.style.borderColor = tk.border; e.target.style.boxShadow = "none"; e.target.style.background = tk.inputBg; };

  const validarPassword = p => passwordSeguro(p);

  const guardar = async () => {
    if (!form.nombre.trim())     return setError("El nombre es requerido.");
    if (!form.ap_paterno.trim()) return setError("El apellido paterno es requerido.");
    const emailErr = emailCorporativoValido(form.email);
    if (emailErr)                return setError(emailErr);
    const pass = form.password_nueva.trim();
    if (!isEdit && !pass)        return setError("La contraseña es requerida.");
    if (pass) {
      const passErr = validarPassword(pass);
      if (passErr) return setError(passErr);
    }
    if (!form.id_rol)            return setError("Selecciona un rol.");
    if (!form.id_departamento)   return setError("Selecciona un área.");
    setSaving(true); setError("");
    try {
      await onGuardar(form, modo, empleado?.id_empleado);
    } catch (err) {
      setError(err.message || "Error al guardar.");
      setSaving(false);
    }
  };

  return (
    <div
      role="presentation"
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: isDark ? "rgba(0,0,0,0.55)" : "rgba(15,23,42,0.40)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px", animation: "miF 0.15s ease",
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onCerrar(); }}
    >
      <style>{`@keyframes miF{from{opacity:0}to{opacity:1}} @keyframes miS{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div
        role="dialog" aria-modal="true"
        style={{
          width: "95%", maxWidth: "520px",
          background: tk.surface, border: `1px solid ${tk.border}`,
          borderRadius: "10px", display: "flex", flexDirection: "column",
          maxHeight: "92vh", overflow: "hidden",
          boxShadow: isDark
            ? "0 16px 40px rgba(0,0,0,0.50), 0 1px 0 rgba(255,255,255,0.04) inset"
            : "0 16px 40px rgba(15,23,42,0.12), 0 1px 3px rgba(15,23,42,0.06)",
          animation: "miS 0.18s ease",
        }}
      >
        {/* Línea acento */}
        <div style={{ height: "2px", flexShrink: 0, background: ORANGE, borderRadius: "10px 10px 0 0" }} />

        {/* Header */}
        <div style={{ padding: "14px 18px 12px", borderBottom: `1px solid ${tk.border}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexShrink: 0 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: ORANGE }}>
              {isEdit ? "Editar empleado" : "Nuevo empleado"}
            </p>
            <h2 style={{ margin: "3px 0 0", fontSize: "16px", fontWeight: 700, color: tk.textMain, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              {isEdit ? `${empleado.nombre} ${empleado.ap_paterno}` : "Agregar al personal"}
            </h2>
            <p style={{ margin: "3px 0 0", fontSize: "12px", color: tk.textMuted }}>
              {isEdit ? "Modifica los campos que necesites" : "Completa los datos del nuevo empleado"}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, paddingTop: "2px" }}>
            <img src={isDark ? "/assets/img/logo blanco.png" : "/assets/img/logo negro.png"} alt="Precision Trucks"
              style={{ height: "28px", width: "auto", objectFit: "contain", opacity: isDark ? 0.80 : 0.70 }} />
            <button onClick={onCerrar} aria-label="Cerrar"
              style={{ width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `1px solid ${tk.border}`, borderRadius: "6px", cursor: "pointer", color: tk.textFaint, transition: "all 0.12s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = tk.textMuted; e.currentTarget.style.color = tk.textMain; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = tk.border; e.currentTarget.style.color = tk.textFaint; }}>
              <X size={12} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

            {/* Nombre + Apellido paterno */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Field htmlFor="fe-nombre" label="Nombre" required textFaint={tk.textFaint}>
                <input id="fe-nombre" type="text" value={form.nombre}
                  onChange={e => set("nombre", e.target.value)}
                  placeholder="Ej. Juan" style={inp} onFocus={onFocus} onBlur={onBlur} />
              </Field>
              <Field htmlFor="fe-apPat" label="Apellido paterno" required textFaint={tk.textFaint}>
                <input id="fe-apPat" type="text" value={form.ap_paterno}
                  onChange={e => set("ap_paterno", e.target.value)}
                  placeholder="Ej. García" style={inp} onFocus={onFocus} onBlur={onBlur} />
              </Field>
            </div>

            {/* Apellido materno + Num empleado */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Field htmlFor="fe-apMat" label="Apellido materno" textFaint={tk.textFaint}>
                <input id="fe-apMat" type="text" value={form.ap_materno}
                  onChange={e => set("ap_materno", e.target.value)}
                  placeholder="Ej. López" style={inp} onFocus={onFocus} onBlur={onBlur} />
              </Field>
              <Field htmlFor="fe-num" label="N.º empleado" textFaint={tk.textFaint}>
                <input id="fe-num" type="text" value={form.num_empleado}
                  onChange={e => set("num_empleado", e.target.value)}
                  placeholder="Ej. EMP-001" style={inp} onFocus={onFocus} onBlur={onBlur} />
              </Field>
            </div>

            {/* Correo */}
            <Field htmlFor="fe-email" label="Correo electrónico" required textFaint={tk.textFaint}>
              <input id="fe-email" type="email" value={form.email}
                onChange={e => set("email", e.target.value)}
                placeholder="usuario@dominio.com.mx" style={inp} onFocus={onFocus} onBlur={onBlur} />
              <p style={{ fontSize: 10, color: tk.textFaint, marginTop: 4, lineHeight: 1.4 }}>
                Dominios permitidos: {DOMINIOS_PERMITIDOS.map(d => `@${d}`).join(", ")}
              </p>
            </Field>

            {/* Contraseña */}
            <Field htmlFor="fe-pass" label={isEdit ? "Nueva contraseña (opcional)" : "Contraseña"} required={!isEdit} textFaint={tk.textFaint}>
              <div style={{ position: "relative" }}>
                <input id="fe-pass" type={showPass ? "text" : "password"} value={form.password_nueva}
                  onChange={e => set("password_nueva", e.target.value)}
                  placeholder={isEdit ? "Dejar vacío para no cambiar" : "Mín. 8 chars, mayúscula, número y símbolo"}
                  style={{ ...inp, paddingRight: "34px" }} onFocus={onFocus} onBlur={onBlur} />
                {/* Ver la contraseña que está escribiendo el admin */}
                <button type="button" onClick={() => setShowPass(v => !v)}
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                  title={showPass ? "Ocultar" : "Mostrar"}
                  style={{
                    position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", padding: 0,
                    display: "flex", alignItems: "center", color: tk.textFaint,
                  }}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {/* Seguridad: barra + checklist en vivo */}
              {!passEval.vacia && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                    <div style={{ flex: 1, height: 3, borderRadius: 99, background: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${passEval.pct}%`, background: passEval.color, borderRadius: 99, transition: "width 0.2s, background 0.2s" }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: passEval.color, flexShrink: 0 }}>{passEval.etiqueta}</span>
                  </div>
                  <ul style={{ listStyle: "none", margin: "6px 0 0", padding: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 8px" }}>
                    {passEval.reglas.map(r => (
                      <li key={r.id} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: 9.5, color: r.ok ? "#16a34a" : tk.textFaint }}>
                        {r.ok
                          ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          : <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>}
                        {r.texto}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Field>

            <div style={{ height: "1px", background: tk.border }} />

            {/* Rol + Área */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Field htmlFor="fe-rol" label="Rol" required textFaint={tk.textFaint}>
                <select id="fe-rol" value={form.id_rol} onChange={e => set("id_rol", e.target.value)}
                  style={{ ...inp, cursor: "pointer" }} onFocus={onFocus} onBlur={onBlur}>
                  <option value="">Seleccionar…</option>
                  {roles.map(r => <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>)}
                </select>
              </Field>
              <Field htmlFor="fe-depto" label="Área" required textFaint={tk.textFaint}>
                <select id="fe-depto" value={form.id_departamento} onChange={e => set("id_departamento", e.target.value)}
                  style={{ ...inp, cursor: "pointer" }} onFocus={onFocus} onBlur={onBlur}>
                  <option value="">Seleccionar…</option>
                  {departamentos.map(d => <option key={d.id_departamento} value={d.id_departamento}>{d.nombre_departamento}</option>)}
                </select>
              </Field>
            </div>

            {/* Sucursal + Estatus */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Field htmlFor="fe-suc" label="Sucursal" textFaint={tk.textFaint}>
                <select id="fe-suc" value={form.id_sucursal} onChange={e => set("id_sucursal", e.target.value)}
                  style={{ ...inp, cursor: "pointer" }} onFocus={onFocus} onBlur={onBlur}>
                  <option value="">Sin asignar</option>
                  {sucursales.map(s => <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre_sucursal}</option>)}
                </select>
              </Field>
              {isEdit && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: tk.textFaint }}>Estatus</span>
                  <div style={{ display: "flex", borderRadius: "6px", overflow: "hidden", border: `1px solid ${tk.border}`, height: "34px" }}>
                    {[
                      { val: "Activo",   color: "#16a34a", bg: "rgba(22,163,74,0.12)",  border: "rgba(22,163,74,0.35)",  dot: "#22c55e",  label: "Activo"   },
                      { val: "Inactivo", color: "#94a3b8", bg: "rgba(148,163,184,0.10)", border: "rgba(148,163,184,0.30)", dot: "#94a3b8", label: "Inactivo" },
                    ].map((opt, i) => {
                      const sel = form.estatus === opt.val;
                      return (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => set("estatus", opt.val)}
                          style={{
                            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                            fontSize: "12px", fontWeight: sel ? 700 : 500, cursor: "pointer",
                            background: sel ? opt.bg : (isDark ? "rgba(255,255,255,0.03)" : "#f8fafc"),
                            color: sel ? opt.color : tk.textMuted,
                            border: "none",
                            borderRight: i === 0 ? `1px solid ${tk.border}` : "none",
                            outline: sel ? `1.5px solid ${opt.border}` : "none",
                            outlineOffset: "-1.5px",
                            transition: "all 0.15s",
                          }}
                        >
                          <span style={{
                            width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                            background: sel ? opt.dot : tk.textFaint,
                            boxShadow: sel && opt.val === "Activo" ? "0 0 0 2.5px rgba(34,197,94,0.25)" : "none",
                            transition: "background 0.15s",
                          }} />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <p role="alert" style={{ margin: 0, padding: "8px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, color: "#dc2626", background: isDark ? "rgba(220,38,38,0.10)" : "#fef2f2", border: `1px solid ${isDark ? "rgba(220,38,38,0.25)" : "#fecaca"}` }}>
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "10px 18px", borderTop: `1px solid ${tk.border}`, background: tk.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px", flexShrink: 0 }}>
          <button type="button" onClick={onCerrar} disabled={saving}
            style={{ padding: "6px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, background: "transparent", border: `1px solid ${tk.border}`, color: tk.textMuted, cursor: "pointer", transition: "all 0.12s", opacity: saving ? 0.5 : 1 }}
            onMouseEnter={e => { if (!saving) { e.currentTarget.style.borderColor = tk.textMuted; e.currentTarget.style.color = tk.textMain; }}}
            onMouseLeave={e => { e.currentTarget.style.borderColor = tk.border; e.currentTarget.style.color = tk.textMuted; }}>
            Cancelar
          </button>
          <button type="button" onClick={guardar} disabled={saving}
            style={{ padding: "6px 18px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, background: saving ? `${ORANGE}99` : ORANGE, border: "none", color: "#fff", cursor: saving ? "not-allowed" : "pointer", transition: "opacity 0.12s" }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
            {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear empleado"}
          </button>
        </div>
      </div>
    </div>
  );
}
// ── Modal Historial ───────────────────────────────────────────────
function ModalHistorial({ T, isDark, empleado, onCerrar }) {
  const ORANGE = "#F47920";
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

  const fmt = iso => !iso ? "-" : new Date(iso).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });

  const duracion = (entrada, salida) => {
    if (!salida) return null;
    const mins = Math.round((new Date(salida) - new Date(entrada)) / 60000);
    return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const aplicarAtajo = (a) => {
    if (a === "hoy")    { setDesde(isoHoy);   setHasta(isoHoy);  }
    if (a === "semana") { setDesde(isoLunes);  setHasta(isoHoy);  }
    if (a === "mes")    { setDesde(isoMes);    setHasta(isoHoy);  }
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

  const exportarPDF = () => {
    const token = localStorage.getItem("_tk") ?? "";
    const params = new URLSearchParams({ token });
    if (desde) params.set("desde", desde);
    if (hasta)  params.set("hasta",  hasta);
    window.open(`/print/historial/${empleado.id_empleado}?${params}`, "_blank");
  };
  const tk = {
    surface:    isDark ? "#161B22" : "#ffffff",
    surfaceAlt: isDark ? "#1a2030" : "#f8fafc",
    border:     isDark ? "rgba(255,255,255,0.07)" : "#e8ecf0",
    textMain:   T?.text     ?? (isDark ? "#e2e8f0" : "#1a202c"),
    textMuted:  T?.textMuted ?? (isDark ? "#8b949e" : "#64748b"),
    textFaint:  T?.textFaint ?? (isDark ? "rgba(255,255,255,0.30)" : "#a0aec0"),
  };

  const inpDate = {
    background: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
    border: `1px solid ${tk.border}`,
    color: tk.textMain, borderRadius: "6px", padding: "6px 10px",
    fontSize: "12px", outline: "none", colorScheme: isDark ? "dark" : "light",
  };

  return (
    <div
      role="presentation"
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: isDark ? "rgba(0,0,0,0.55)" : "rgba(15,23,42,0.40)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        animation: "miF 0.15s ease",
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onCerrar(); }}
    >
      <style>{`
        @keyframes miF { from{opacity:0} to{opacity:1} }
        @keyframes miS { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        style={{
          width: "95%", maxWidth: "580px",
          background: tk.surface,
          border: `1px solid ${tk.border}`,
          borderRadius: "10px",
          display: "flex", flexDirection: "column",
          maxHeight: "92vh", overflow: "hidden",
          boxShadow: isDark
            ? "0 16px 40px rgba(0,0,0,0.50), 0 1px 0 rgba(255,255,255,0.04) inset"
            : "0 16px 40px rgba(15,23,42,0.12), 0 1px 3px rgba(15,23,42,0.06)",
          animation: "miS 0.18s ease",
        }}
      >
        {/* Línea acento */}
        <div style={{ height: "2px", flexShrink: 0, background: ORANGE, borderRadius: "10px 10px 0 0" }} />

        {/* Header */}
        <div style={{
          padding: "14px 18px 12px",
          borderBottom: `1px solid ${tk.border}`,
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          gap: "12px", flexShrink: 0,
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: ORANGE }}>
              Empleado
            </p>
            <h2 style={{ margin: "3px 0 0", fontSize: "16px", fontWeight: 700, color: tk.textMain, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              Historial de Accesos
            </h2>
            <p style={{ margin: "3px 0 0", fontSize: "12px", color: tk.textMuted }}>{nombre}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, paddingTop: "2px" }}>
            <img
              src={isDark ? "/assets/img/logo blanco.png" : "/assets/img/logo negro.png"}
              alt="Precision Trucks"
              style={{ height: "28px", width: "auto", objectFit: "contain", opacity: isDark ? 0.80 : 0.70 }}
            />
            <button
              onClick={onCerrar}
              aria-label="Cerrar"
              style={{
                width: "26px", height: "26px",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "transparent", border: `1px solid ${tk.border}`,
                borderRadius: "6px", cursor: "pointer", color: tk.textFaint,
                transition: "all 0.12s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = tk.textMuted; e.currentTarget.style.color = tk.textMain; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = tk.border; e.currentTarget.style.color = tk.textFaint; }}
            >
              <X size={12} strokeWidth={2} />
            </button>
          </div>
        </div>
        {/* Filtros */}
        <div style={{ padding: "12px 18px", borderBottom: `1px solid ${tk.border}`, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: tk.textFaint }}>Período</span>
            {[{ id:"todo", lbl:"Todo" }, { id:"hoy", lbl:"Hoy" }, { id:"semana", lbl:"Semana" }, { id:"mes", lbl:"Mes" }].map(a => {
              const activo = a.id === "todo" ? (!desde && !hasta) : a.id === "hoy" ? (desde===isoHoy&&hasta===isoHoy) : a.id === "semana" ? (desde===isoLunes&&hasta===isoHoy) : (desde===isoMes&&hasta===isoHoy);
              return (
                <button key={a.id} onClick={() => aplicarAtajo(a.id)}
                  style={{ padding: "3px 10px", borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: "pointer", background: activo ? "rgba(244,121,32,0.12)" : (isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"), color: activo ? ORANGE : tk.textMuted, border: `1px solid ${activo ? "rgba(244,121,32,0.35)" : tk.border}` }}>
                  {a.lbl}
                </button>
              );
            })}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="date" style={inpDate} value={desde} onChange={e => setDesde(e.target.value)} />
              <span style={{ fontSize: 11, color: tk.textFaint }}>–</span>
              <input type="date" style={inpDate} value={hasta} onChange={e => setHasta(e.target.value)} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: tk.textFaint }}>Tipo</span>
            <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", border: `1px solid ${tk.border}` }}>
              {[{ id:"todos", lbl:"Todos" }, { id:"activos", lbl:"Activos" }, { id:"cerrados", lbl:"Cerrados" }].map((t, i) => (
                <button key={t.id} onClick={() => setTipoFiltro(t.id)}
                  style={{ padding: "4px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", background: tipoFiltro === t.id ? ORANGE : (isDark ? "rgba(255,255,255,0.03)" : "#f8fafc"), color: tipoFiltro === t.id ? "#fff" : tk.textMuted, border: "none", borderRight: i < 2 ? `1px solid ${tk.border}` : "none" }}>
                  {t.lbl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
              <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            </div>
          ) : filtrados.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 8 }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={tk.textFaint} strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <p style={{ fontSize: 13, fontWeight: 600, color: tk.textMuted, margin: 0 }}>Sin registros</p>
              <p style={{ fontSize: 11, color: tk.textFaint, margin: 0 }}>Ajusta el rango o los filtros</p>
            </div>
          ) : filtrados.map((a, i) => {
            const dur = duracion(a.fecha_entrada, a.fecha_salida);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", border: `1px solid ${tk.border}` }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: a.fecha_salida ? "#94a3b8" : "#22c55e", boxShadow: a.fecha_salida ? "none" : "0 0 0 3px rgba(34,197,94,0.2)" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: tk.textMain }}>{fmt(a.fecha_entrada)}</span>
                    {!a.fecha_salida && <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "1px 6px", borderRadius: 9999, background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.2)" }}>En sesión</span>}
                  </div>
                  {a.fecha_salida && <p style={{ fontSize: 11, color: tk.textFaint, margin: 0 }}>Salida: {fmt(a.fecha_salida)}</p>}
                </div>
                {dur && <span style={{ fontSize: 11, fontWeight: 600, flexShrink: 0, padding: "2px 8px", borderRadius: 5, background: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9", color: tk.textMuted }}>{dur}</span>}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "10px 18px", borderTop: `1px solid ${tk.border}`, background: tk.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: tk.textFaint }}>{filtrados.length} registro{filtrados.length !== 1 ? "s" : ""}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={exportarCSV} disabled={filtrados.length === 0}
              style={{ padding: "5px 12px", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 5, opacity: filtrados.length === 0 ? 0.4 : 1, background: "transparent", border: `1px solid ${tk.border}`, borderRadius: 6, cursor: filtrados.length === 0 ? "not-allowed" : "pointer", color: tk.textMuted, transition: "all 0.12s" }}
              onMouseEnter={e => { if (filtrados.length > 0) { e.currentTarget.style.borderColor = tk.textMuted; e.currentTarget.style.color = tk.textMain; }}}
              onMouseLeave={e => { e.currentTarget.style.borderColor = tk.border; e.currentTarget.style.color = tk.textMuted; }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exportar CSV
            </button>
            <button onClick={exportarPDF} disabled={filtrados.length === 0}
              style={{ padding: "5px 12px", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 5, opacity: filtrados.length === 0 ? 0.4 : 1, background: filtrados.length === 0 ? `${ORANGE}60` : ORANGE, border: "none", borderRadius: 6, cursor: filtrados.length === 0 ? "not-allowed" : "pointer", color: "#fff", transition: "opacity 0.12s" }}
              onMouseEnter={e => { if (filtrados.length > 0) e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Exportar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
// ── Acciones Dropdown ─────────────────────────────────────────────
function AccionesDropdown({ emp, T, isDark, onEditar, onHistorial }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, right: 0, openUp: false });
  const btnRef = React.useRef(null);

  const handleOpen = () => {
    if (open) { setOpen(false); return; }
    const rect = btnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuH = 80; // altura aprox del menú
    const openUp = spaceBelow < menuH + 8;
    setPos({
      top:   openUp ? rect.top - menuH - 4 : rect.bottom + 4,
      right: window.innerWidth - rect.right,
      openUp,
    });
    setOpen(true);
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        ref={btnRef}
        onClick={handleOpen}
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
          position: "fixed", top: pos.top, right: pos.right, zIndex: 9999,
          minWidth: 162, borderRadius: 8, padding: "4px 0",
          background: isDark ? "#1e2330" : "#ffffff",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
          boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.5)" : "0 8px 24px rgba(0,0,0,0.12)",
        }}>
          {[
            {
              label: "Editar",
              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
              action: () => { onEditar(emp); setOpen(false); },
            },
            {
              label: "Historial",
              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
              action: () => { onHistorial(emp); setOpen(false); },
            },
          ].map(item => (
            <button key={item.label} onMouseDown={item.action}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 14px", fontSize: 12, fontWeight: 500, color: T.text, background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
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
function LightboxFoto({ src, nombre, onCerrar, isDark }) {
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

  const border = isDark ? "rgba(255,255,255,0.07)" : "#e8ecf0";

  return (
    <div
      role="presentation"
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: isDark ? "rgba(0,0,0,0.80)" : "rgba(15,23,42,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
        animation: "lbFade 0.15s ease",
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
    >
      <style>{`@keyframes lbFade{from{opacity:0}to{opacity:1}} @keyframes lbSlide{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "relative", maxWidth: 520, width: "100%",
          background: isDark ? "#161B22" : "#ffffff",
          border: `1px solid ${border}`,
          borderRadius: "10px", overflow: "hidden",
          boxShadow: isDark
            ? "0 16px 40px rgba(0,0,0,0.60), 0 1px 0 rgba(255,255,255,0.04) inset"
            : "0 16px 40px rgba(15,23,42,0.18)",
          animation: "lbSlide 0.18s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banda acento */}
        <div style={{ height: "2px", background: ORANGE, borderRadius: "10px 10px 0 0" }} />
        {/* Header */}
        <div style={{
          padding: "12px 16px",
          borderBottom: `1px solid ${border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: ORANGE }}>Empleado</p>
            {nombre && <p style={{ margin: "2px 0 0", fontSize: "13px", fontWeight: 700, color: isDark ? "#e2e8f0" : "#1a202c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nombre}</p>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            <img
              src={isDark ? "/assets/img/logo blanco.png" : "/assets/img/logo negro.png"}
              alt="Precision Trucks"
              style={{ height: "26px", width: "auto", objectFit: "contain", opacity: isDark ? 0.80 : 0.70 }}
            />
            <button
              onClick={onCerrar}
              style={{ width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `1px solid ${border}`, borderRadius: "6px", cursor: "pointer", color: isDark ? "rgba(255,255,255,0.30)" : "#a0aec0", transition: "all 0.12s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = isDark ? "#8b949e" : "#64748b"; e.currentTarget.style.color = isDark ? "#e2e8f0" : "#1a202c"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.30)" : "#a0aec0"; }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        {/* Imagen */}
        <div style={{ padding: "16px", background: isDark ? "#0d1117" : "#f8fafc" }}>
          <img
            src={src} alt={nombre}
            style={{ width: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: "6px", display: "block" }}
          />
        </div>
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
    { key: "nombre",   label: "Empleado",  sortable: true  },
    { key: "id",       label: "ID",        sortable: true  },
    { key: "depto",    label: "Área",      sortable: true  },
    { key: "sucursal", label: "Sucursal",  sortable: true  },
    { key: "rol",      label: "Rol",       sortable: true  },
    { key: "email",    label: "Correo",    sortable: false },
    { key: "acciones", label: "",          sortable: false },
  ];

  const thS = {
    padding: "10px 16px",
    fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
    textTransform: "uppercase", whiteSpace: "nowrap",
    color: T.textMuted,
    background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt,
    borderBottom: `2px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}`,
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
    <div style={{ borderRadius: 10, overflow: "hidden", background: T.surface, border: `1px solid ${T.border}`, boxShadow: isDark ? "0 1px 8px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
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
              const rowBg  = i % 2 === 0 ? (isDark ? "transparent" : T.surface) : (isDark ? "rgba(255,255,255,0.015)" : T.surfaceAlt);
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
                      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: activo ? "#22c55e" : "#94a3b8", boxShadow: activo ? "0 0 0 2.5px rgba(34,197,94,0.2)" : "none" }} />
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
                  <td style={{ ...tdS, color: T.textMuted }}>{emp.nombre_departamento || "—"}</td>

                  {/* Sucursal */}
                  <td style={{ ...tdS, color: T.textMuted }}>{emp.nombre_sucursal || "—"}</td>

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

                  {/* Acciones */}
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

      {/* Footer tabla */}
      <div style={{ padding: "8px 16px", borderTop: `1px solid ${T.border}`, background: isDark ? "rgba(255,255,255,0.02)" : T.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        <span style={{ fontSize: 11, color: T.textFaint }}>{empleados.length} empleado{empleados.length !== 1 ? "s" : ""}</span>
      </div>
      {lightbox && <LightboxFoto src={lightbox.src} nombre={lightbox.nombre} onCerrar={() => setLightbox(null)} isDark={isDark} />}
    </div>
  );
}
// ── Personal (página principal) ───────────────────────────────────
export default function Personal({ T }) {
  const isDark = T.isDark;

  const [empleados,      setEmpleados]      = useState([]);
  const [departamentos,  setDepartamentos]  = useState([]);
  const [roles,          setRoles]          = useState([]);
  const [sucursales,     setSucursales]     = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [filtros,        setFiltros]        = useState({ busqueda: "", departamento: "Todos", sucursal: "Todos", estatus: "Todos" });
  const [modal,          setModal]          = useState(null);
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
    if (filtros.departamento !== "Todos" && String(e.id_departamento) !== filtros.departamento) return false;
    if (filtros.sucursal !== "Todos" && String(e.id_sucursal) !== filtros.sucursal) return false;
    if (filtros.estatus !== "Todos" && e.estatus !== filtros.estatus) return false;
    return true;
  });

  const camposFiltro = [
    { key: "busqueda",     label: "Búsqueda Rápida", type: "search", placeholder: "Nombre o correo..." },
    { key: "departamento", label: "Área",      type: "select", opts: [{ value: "Todos", label: "Todos" }, ...departamentos.map(d => ({ value: String(d.id_departamento), label: d.nombre_departamento }))] },
    { key: "sucursal",     label: "Sucursal",  type: "select", minWidth: "130px", opts: [{ value: "Todos", label: "Todas" }, ...sucursales.map(s => ({ value: String(s.id_sucursal), label: s.nombre_sucursal }))] },
    { key: "estatus",      label: "Estatus",   type: "select", opts: ["Todos", "Activo", "Inactivo"] },
  ];

  const activos   = empleados.filter(e => e.estatus === "Activo").length;
  const inactivos = empleados.filter(e => e.estatus !== "Activo").length;

  const guardarEmpleado = async (form, modo, empleadoId) => {
    const esEditar = modo === "editar";
    const url  = esEditar ? `/api/auth/empleados/${empleadoId}` : `/api/auth/empleados`;
    const pass = form.password_nueva.trim();
    const numEmp = form.num_empleado.trim();
    const body = esEditar
      ? { ...(numEmp ? { num_empleado: numEmp } : {}), nombre: form.nombre.trim(), ap_paterno: form.ap_paterno.trim(), ap_materno: form.ap_materno.trim(), email: form.email.trim(), id_rol: Number(form.id_rol), id_departamento: Number(form.id_departamento), id_sucursal: form.id_sucursal !== "" ? Number(form.id_sucursal) : null, estatus: form.estatus, ...(pass ? { password_nueva: pass } : {}) }
      : { num_empleado: numEmp, nombre: form.nombre.trim(), ap_paterno: form.ap_paterno.trim(), ap_materno: form.ap_materno.trim(), email: form.email.trim(), password: pass, id_rol: Number(form.id_rol), id_departamento: Number(form.id_departamento), id_sucursal: form.id_sucursal ? Number(form.id_sucursal) : null };
    const res  = await apiFetch(url, { method: esEditar ? "PUT" : "POST", body });
    const data = await res.json();
    if (!res.ok) throw new Error((data.errores?.[0]?.mensaje) || data.error || "Error al guardar");
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

  return (
    <div style={{ background: T.bg, height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ maxWidth: 1400, width: "100%", margin: "0 auto", padding: "16px 16px 0", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 14 }}>
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
        <FiltrosToolbar
          campos={camposFiltro}
          valores={filtros}
          onChange={(k, v) => setFiltros(p => ({ ...p, [k]: v }))}
          onLimpiar={() => setFiltros({ busqueda: "", departamento: "Todos", sucursal: "Todos", estatus: "Todos" })}
          T={T}>
          <button
            onClick={() => setModal({ modo: "crear" })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: ORANGE, color: "#fff", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
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
              <svg className="animate-spin" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
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
        <ModalEmpleado
          T={T} isDark={isDark}
          modo={modal.modo}
          empleado={modal.empleado}
          departamentos={departamentos}
          roles={roles}
          sucursales={sucursales}
          onGuardar={(form) => guardarEmpleado(form, modal.modo, modal.empleado?.id_empleado)}
          onCerrar={() => setModal(null)}
        />
      )}
    </div>
  );
}

