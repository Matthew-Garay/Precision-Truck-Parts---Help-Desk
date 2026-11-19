/**
 * ModalEmpleado.jsx — Alta y edición de un empleado (pantalla Personal).
 * Separado de pages/Admin/Personal.jsx para que la pantalla sea más fácil de mantener.
 */
import { useState, useEffect } from "react";
import { emailCorporativoValido, DOMINIOS_PERMITIDOS } from '../../utils/email.js';
import { evaluarPassword, passwordSeguro } from '../../utils/password.js';
import { X, Eye, EyeOff } from "lucide-react";
import { FS } from '../../utils/tipografia.js';
import LogoModal from '../LogoModal.jsx';

export const ORANGE = "#F47920";

const FORM_VACIO = {
  num_empleado: "", nombre: "", ap_paterno: "", ap_materno: "",
  email: "", password_nueva: "", id_rol: "", id_departamento: "",
  id_sucursal: "", estatus: "Activo",
};

// ── Tokens helper ─────────────────────────────────────────────────
export function useTokens(T, isDark) {
  return {
    surface:    isDark ? "#161B22" : "#ffffff",
    surfaceAlt: isDark ? "#1a2030" : "#f8fafc",
    border:     isDark ? "rgba(255,255,255,0.07)" : "#e8ecf0",
    textMain:   T?.text ?? (isDark ? "#e2e8f0" : "#1a202c"),
    textMuted:  T?.textMuted ?? (isDark ? "#8b949e" : "#64748b"),
    textFaint:  T?.textFaint ?? (isDark ? "rgba(255,255,255,0.30)" : "#a0aec0"),
    inputBg:    isDark ? "rgba(255,255,255,0.04)" : "#f8fafc",
  };
}

// ── Field label ───────────────────────────────────────────────────
export function Field({ label, htmlFor, required, children, textFaint }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label htmlFor={htmlFor} style={{ fontSize: FS.etiqueta, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: textFaint }}>
        {label}{required && <span style={{ color: ORANGE, marginLeft: "2px" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Modal Empleado (crear / editar) ───────────────────────────────
export function ModalEmpleado({ T, isDark, modo, empleado, departamentos, roles, sucursales, onGuardar, onCerrar }) {
  const isEdit = modo === "editar";
  const tk = useTokens(T, isDark);
  const [form, setForm] = useState({ ...FORM_VACIO, ...(isEdit ? { ...empleado, password_nueva: "", num_empleado: empleado.num_empleado ?? "", id_sucursal: empleado.id_sucursal != null ? String(empleado.id_sucursal) : "", id_rol: String(empleado.id_rol ?? ""), id_departamento: String(empleado.id_departamento ?? "") } : {}) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
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
    fontSize: FS.cuerpo, color: tk.textMain, outline: "none",
    width: "100%", boxSizing: "border-box",
    colorScheme: isDark ? "dark" : "light",
    transition: "border-color 0.12s, box-shadow 0.12s",
  };
  const borderFocus = "#2563eb";
  const onFocus = e => { e.target.style.borderColor = borderFocus; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.10)"; e.target.style.background = isDark ? "rgba(255,255,255,0.07)" : "#fff"; };
  const onBlur = e => { e.target.style.borderColor = tk.border; e.target.style.boxShadow = "none"; e.target.style.background = tk.inputBg; };
  const validarPassword = p => passwordSeguro(p);
  const guardar = async () => {
    if (!form.nombre.trim()) return setError("El nombre es requerido.");
    if (!form.ap_paterno.trim()) return setError("El apellido paterno es requerido.");
    const emailErr = emailCorporativoValido(form.email);
    if (emailErr) return setError(emailErr);
    const pass = form.password_nueva.trim();
    if (!isEdit && !pass) return setError("La contraseña es requerida.");
    if (pass) {
      const passErr = validarPassword(pass);
      if (passErr) return setError(passErr);
    }
    if (!form.id_rol) return setError("Selecciona un rol.");
    if (!form.id_departamento) return setError("Selecciona un área.");
    setSaving(true); setError("");
    try {
      await onGuardar(form, modo, empleado?.id_empleado);
    } catch (err) {
      setError(err.message || "Error al guardar.");
      setSaving(false);
    }
  };
  const selectStyle = { ...inp, cursor: "pointer" };
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
          width: "95%", maxWidth: "520px",
          background: tk.surface, border: `1px solid ${tk.border}`,
          borderRadius: "10px", display: "flex", flexDirection: "column",
          maxHeight: "92vh", overflow: "hidden",
          boxShadow: isDark
            ? "0 16px 40px rgba(0,0,0,0.50), 0 1px 0 rgba(255,255,255,0.04) inset"
            : "0 16px 40px rgba(15,23,42,0.12), 0 1px 3px rgba(15,23,42,0.06)",
        }}
      >
        <div style={{ height: "2px", flexShrink: 0, background: ORANGE, borderRadius: "10px 10px 0 0" }} />
        <div style={{ padding: "14px 18px 12px", borderBottom: `1px solid ${tk.border}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexShrink: 0 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: FS.etiqueta, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: ORANGE }}>
              {isEdit ? "Editar empleado" : "Nuevo empleado"}
            </p>
            <h2 style={{ margin: "3px 0 0", fontSize: FS.subtitulo, fontWeight: 700, color: tk.textMain, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              {isEdit ? `${empleado.nombre} ${empleado.ap_paterno}` : "Agregar al personal"}
            </h2>
            <p style={{ margin: "3px 0 0", fontSize: FS.secundario, color: tk.textMuted }}>
              {isEdit ? "Modifica los campos que necesites" : "Completa los datos del nuevo empleado"}
            </p>
          </div>
          <LogoModal style={{ marginLeft: "auto", marginRight: 8, alignSelf: "center" }} />
          <button onClick={onCerrar} aria-label="Cerrar"
            style={{ width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `1px solid ${tk.border}`, borderRadius: "6px", cursor: "pointer", color: tk.textFaint, transition: "all 0.12s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = tk.textMuted; e.currentTarget.style.color = tk.textMain; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = tk.border; e.currentTarget.style.color = tk.textFaint; }}>
            <X size={12} strokeWidth={2} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
            <Field htmlFor="fe-email" label="Correo electrónico" required textFaint={tk.textFaint}>
              <input id="fe-email" type="email" value={form.email}
                onChange={e => set("email", e.target.value)}
                placeholder="usuario@dominio.com.mx" style={inp} onFocus={onFocus} onBlur={onBlur} />
              <p style={{ fontSize: FS.secundario, color: tk.textFaint, marginTop: 4, lineHeight: 1.4 }}>
                Dominios permitidos: {DOMINIOS_PERMITIDOS.map(d => `@${d}`).join(", ")}
              </p>
            </Field>
            <Field htmlFor="fe-pass" label={isEdit ? "Nueva contraseña (opcional)" : "Contraseña"} required={!isEdit} textFaint={tk.textFaint}>
              <div style={{ position: "relative" }}>
                <input id="fe-pass" type={showPass ? "text" : "password"} value={form.password_nueva}
                  onChange={e => set("password_nueva", e.target.value)}
                  placeholder={isEdit ? "Dejar vacío para no cambiar" : "Mín. 8 chars, mayúscula, número y símbolo"}
                  style={{ ...inp, paddingRight: "34px" }} onFocus={onFocus} onBlur={onBlur} />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, color: tk.textMuted }}
                >
                  {showPass ? <EyeOff width="16" height="16" /> : <Eye width="16" height="16" />}
                </button>
              </div>
              {/* `pass` solo existe dentro de handleSubmit: aquí se lee del formulario */}
              {form.password_nueva?.trim() && passEval && (
                <p style={{ fontSize: FS.secundario, margin: "4px 0 0", color: passEval.valido ? "#16a34a" : "#dc2626" }}>
                  {passEval.mensaje}
                </p>
              )}
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Field htmlFor="fe-depto" label="Área" required textFaint={tk.textFaint}>
                <select id="fe-depto" value={form.id_departamento} onChange={e => set("id_departamento", e.target.value)} style={selectStyle}>
                  <option value="">Selecciona un área</option>
                  {departamentos.map(d => (
                    <option key={d.id_departamento} value={String(d.id_departamento)}>{d.nombre_departamento}</option>
                  ))}
                </select>
              </Field>
              <Field htmlFor="fe-suc" label="Sucursal" required textFaint={tk.textFaint}>
                <select id="fe-suc" value={form.id_sucursal} onChange={e => set("id_sucursal", e.target.value)} style={selectStyle}>
                  <option value="">Selecciona una sucursal</option>
                  {sucursales.map(s => (
                    <option key={s.id_sucursal} value={String(s.id_sucursal)}>{s.nombre_sucursal}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Field htmlFor="fe-rol" label="Rol" required textFaint={tk.textFaint}>
                <select id="fe-rol" value={form.id_rol} onChange={e => set("id_rol", e.target.value)} style={selectStyle}>
                  <option value="">Selecciona un rol</option>
                  {roles.map(r => (
                    <option key={r.id_rol} value={String(r.id_rol)}>{r.nombre_rol}</option>
                  ))}
                </select>
              </Field>
              <Field htmlFor="fe-estatus" label="Estatus" required textFaint={tk.textFaint}>
                <select id="fe-estatus" value={form.estatus} onChange={e => set("estatus", e.target.value)} style={selectStyle}>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </Field>
            </div>
            {error && (
              <p role="alert" style={{ margin: 0, padding: "8px 12px", borderRadius: "6px", fontSize: FS.cuerpo, fontWeight: 500, color: "#dc2626", background: isDark ? "rgba(220,38,38,0.10)" : "#fef2f2", border: `1px solid ${isDark ? "rgba(220,38,38,0.25)" : "#fecaca"}` }}>
                {error}
              </p>
            )}
          </div>
        </div>
        <div style={{ padding: "10px 18px", borderTop: `1px solid ${tk.border}`, background: tk.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px", flexShrink: 0 }}>
          <button type="button" onClick={onCerrar} disabled={saving}
            style={{ padding: "6px 16px", borderRadius: "6px", fontSize: FS.cuerpo, fontWeight: 600, background: "transparent", border: `1px solid ${tk.border}`, color: tk.textMuted, cursor: "pointer", transition: "all 0.12s", opacity: saving ? 0.5 : 1 }}
            onMouseEnter={e => { if (!saving) { e.currentTarget.style.borderColor = tk.textMuted; e.currentTarget.style.color = tk.textMain; } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = tk.border; e.currentTarget.style.color = tk.textMuted; }}
          >
            Cancelar
          </button>
          <button type="button" onClick={guardar} disabled={saving}
            style={{ padding: "6px 18px", borderRadius: "6px", fontSize: FS.cuerpo, fontWeight: 700, background: saving ? `${ORANGE}99` : ORANGE, border: "none", color: "#fff", cursor: saving ? "not-allowed" : "pointer", transition: "opacity 0.12s" }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear empleado"}
          </button>
        </div>
      </div>
    </div>
  );
}
