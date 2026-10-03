/**
 * ConfiguracionPerfilShared.jsx
 *
 * Vista de configuracion de perfil compartida entre el administrador
 * y el usuario. Se instancia desde Admin/ConfiguracionPerfil.jsx
 * y Usuario/ConfiguracionPerfil.jsx pasando el prop rol adecuado.
 *
 * Secciones:
 *   - Banner de perfil con foto editable, nombre, correo y departamento.
 *   - Datos personales: nombre, apellidos y correo electronico.
 *   - Cambiar contrasena: campo de contrasena actual (de solo lectura,
 *     leido desde sessionStorage), nueva contrasena y confirmacion.
 *   - Historial de accesos: tabla paginada con fecha de entrada, salida
 *     y duracion de cada sesion. Los admins pueden filtrar por mes y anio.
 *     Boton para exportar el historial como PDF via generarPDFAccesos.
 *
 * La foto se edita mediante el flujo: seleccionar archivo -> ModalRecorte
 * para ajustar encuadre -> procesarYSubirFoto para subir al servidor.
 *
 * Los datos del empleado y el historial de accesos se recargan automaticamente
 * cada 30 segundos con setInterval.
 *
 * Props:
 *   T                   - tokens del tema activo
 *   usuario             - objeto del usuario de sesion
 *   onUsuarioActualizado - callback(usuarioActualizado) para propagar cambios
 *                          al componente raiz del dashboard
 *   rol                 - "Administrador" o "Usuario" (default: "Usuario")
 */
import { useState, useEffect } from "react";
import { User } from "lucide-react";
import API, { apiFetch } from "../Config/api";
import { emailCorporativoValido, DOMINIOS_PERMITIDOS } from "../Config/email.js";
import { evaluarPassword, passwordSeguro } from "../Config/password.js";
import { EyeBtn, ModalRecorte, usePerfilStyles, procesarYSubirFoto, generarPDFAccesos } from "./PerfilShared";

export default function ConfiguracionPerfilShared({ T, usuario, onUsuarioActualizado, rol = "Usuario" }) {
  const isDark = T.isDark;
  const { card, hdr, inp } = usePerfilStyles(T, isDark);

  const [nombre,     setNombre]     = useState(usuario.nombre     || "");
  const [apPaterno,  setApPaterno]  = useState(usuario.ap_paterno || "");
  const [apMaterno,  setApMaterno]  = useState(usuario.ap_materno || "");
  const [email,      setEmail]      = useState(usuario.email      || "");
  const [passActual, setPassActual] = useState(() => {
    try { return sessionStorage.getItem("_pwd") || ""; } catch { return ""; }
  });
  const [passNueva,  setPassNueva]  = useState("");
  const [passConf,   setPassConf]   = useState("");
  const [showNueva, setShowNueva] = useState(false);
  const [showConf,  setShowConf]  = useState(false);

  // Política de contraseña: se evalúa en vivo con cada tecla
  const evaluacion = evaluarPassword(passNueva);

  const fotoUrl = f => f ? `/storage/${f}` : null;
  const [foto,         setFoto]         = useState(fotoUrl(usuario.foto));
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [cropSrc,      setCropSrc]      = useState(null);

  const [accesos,    setAccesos]    = useState([]);
  const [perfil,     setPerfil]     = useState(usuario);
  const [mesFiltro,  setMesFiltro]  = useState("Todos");
  const [anioFiltro, setAnioFiltro] = useState("Todos");
  const [msg,        setMsg]        = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [modalReporte, setModalReporte] = useState(false);
  const [rptDesde,     setRptDesde]     = useState("");
  const [rptHasta,     setRptHasta]     = useState("");

  const [emailEditado, setEmailEditado] = useState(false);

  useEffect(() => {
    setNombre(usuario.nombre       || "");
    setApPaterno(usuario.ap_paterno || "");
    setApMaterno(usuario.ap_materno || "");
    setEmail(usuario.email         || "");
    setEmailEditado(false);
  }, [usuario.id_empleado]);

  const esAdmin = rol === "Administrador";

  const MESES_NOMBRE = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  const aniosDisponibles = ["Todos", ...Array.from(
    new Set(accesos.filter(a => a.fecha_entrada).map(a => new Date(a.fecha_entrada).getFullYear().toString()))
  ).sort((a, b) => b - a)];

  const mesesDisponibles = ["Todos", ...MESES_NOMBRE.filter((_, i) =>
    accesos.some(a => a.fecha_entrada && new Date(a.fecha_entrada).getMonth() === i &&
      (anioFiltro === "Todos" || new Date(a.fecha_entrada).getFullYear().toString() === anioFiltro))
  )];

  const accesosFiltrados = accesos.filter(a => {
    if (!a.fecha_entrada) return true;
    const d = new Date(a.fecha_entrada);
    if (anioFiltro !== "Todos" && d.getFullYear().toString() !== anioFiltro) return false;
    if (mesFiltro  !== "Todos" && MESES_NOMBRE[d.getMonth()] !== mesFiltro)  return false;
    return true;
  });

  const duraciones  = accesosFiltrados.filter(a => a.fecha_entrada && a.fecha_salida)
    .map(a => Math.round((new Date(a.fecha_salida) - new Date(a.fecha_entrada)) / 60000));
  const durPromedio = duraciones.length > 0 ? Math.round(duraciones.reduce((s, d) => s + d, 0) / duraciones.length) : 0;
  const durMax      = duraciones.length > 0 ? Math.max(...duraciones) : 0;
  const fmtMin      = m => m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
  const fmtDT       = d => d
    ? `${new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" })} ${new Date(d).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`
    : "-";

  useEffect(() => {
    if (!usuario?.id_empleado) return;
    const cargar = () => {
      apiFetch(`/api/auth/accesos/${usuario.id_empleado}`)
        .then(r => r.json())
        .then(data => {
          const rows = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
          setAccesos(prev => JSON.stringify(prev) === JSON.stringify(rows) ? prev : rows);
        }).catch(() => {});
      apiFetch(`/api/auth/empleados/${usuario.id_empleado}`)
        .then(r => r.json())
        .then(emp => {
          if (!emp?.id_empleado) return;
          setPerfil(prev => {
            const next = { ...prev, num_empleado: emp.num_empleado, nombre: emp.nombre, ap_paterno: emp.ap_paterno, ap_materno: emp.ap_materno || "", email: emp.email, departamento: emp.nombre_departamento, nombre_sucursal: emp.nombre_sucursal || null };
            if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
            setNombre(emp.nombre       || "");
            setApPaterno(emp.ap_paterno || "");
            setApMaterno(emp.ap_materno || "");
            if (!emailEditado) setEmail(emp.email || "");
            return next;
          });
        }).catch(() => {});
    };
    cargar();
    const id = setInterval(cargar, 30000);
    return () => clearInterval(id);
  }, [usuario?.id_empleado]);

  const guardar = async () => {
    if (passNueva && passNueva !== passConf) return setMsg({ tipo: "err", texto: "Las contraseñas no coinciden" });
    // Misma política que valida el backend (8 caracteres, mayúscula, número y símbolo)
    const passErr = passwordSeguro(passNueva);
    if (passErr) return setMsg({ tipo: "err", texto: `La contraseña debe cumplir: ${passErr.toLowerCase()}` });
    const emailErr = emailCorporativoValido(email);
    if (emailErr) return setMsg({ tipo: "err", texto: emailErr });
    setLoading(true); setMsg(null);
    try {
      const res  = await apiFetch(`/api/auth/perfil/${usuario.id_empleado}`, {
        method: "PUT",
        body: { nombre, ap_paterno: apPaterno, ap_materno: apMaterno, email, password_actual: passActual || undefined, password_nueva: passNueva || undefined },
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ tipo: "err", texto: data.error || "Error al guardar" }); return; }
      setMsg({ tipo: "ok", texto: "Datos actualizados correctamente" });
      setEmailEditado(false);
      if (passNueva) {
        sessionStorage.setItem("_pwd", passNueva);
        setPassActual(passNueva);
      }
      setPassNueva(""); setPassConf("");
      setTimeout(() => setMsg(null), 4000);
      const u = JSON.parse(sessionStorage.getItem("usuario") || "{}");
      const actualizado = { ...u, ...data.usuario };
      sessionStorage.setItem("usuario", JSON.stringify(actualizado));
      onUsuarioActualizado?.(actualizado);
    } catch { setMsg({ tipo: "err", texto: "Error de conexión" }); }
    finally { setLoading(false); }
  };

  const nombreCompleto = [usuario.nombre, usuario.ap_paterno, usuario.ap_materno].filter(Boolean).join(" ");
  const iniciales      = [usuario.nombre, usuario.ap_paterno].filter(Boolean).map(p => p[0].toUpperCase()).join("");

  return (
    <>
    <div className="overflow-y-auto" style={{ background: T.bg }}>
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">

        {/* -- BANNER PERFIL -- */}
        <div className="rounded-2xl overflow-hidden" style={card}>
          <div className="px-5 py-5 flex items-center gap-4"
            style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}` }}>
            <div className="relative flex-shrink-0">
              <div className="flex items-center justify-center rounded-2xl font-black overflow-hidden"
                style={{ width: "72px", height: "72px", background: isDark ? "#1e2330" : T.surfaceAlt, border: `2px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}`, color: isDark ? "rgba(255,255,255,0.7)" : T.textMuted, fontSize: "24px" }}>
                {foto ? <img src={foto} alt="perfil" className="w-full h-full object-cover" /> : (iniciales || <User size={28} style={{ color: isDark ? "rgba(255,255,255,0.4)" : T.textFaint }} />)}
              </div>
              <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all hover:brightness-110 active:scale-95"
                style={{ background: T.orange, boxShadow: "0 2px 8px rgba(244,121,32,0.5)", border: `2px solid ${isDark ? "#141720" : T.surface}` }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                </svg>
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => setCropSrc(ev.target.result);
                  reader.readAsDataURL(file);
                  e.target.value = "";
                }} />
              </label>
              {subiendoFoto && (
                <div className="absolute inset-0 rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-base leading-tight" style={{ color: T.text }}>{nombreCompleto || "-"}</p>
              <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>{perfil.email || usuario.email || "-"}</p>
              <p className="text-[11px] mt-0.5" style={{ color: T.textFaint }}>{perfil.departamento || usuario.departamento || "-"}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-0" style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : T.border}` }}>
            {[{ label: "Número", val: perfil.num_empleado || "-" }, { label: "Departamento", val: perfil.departamento || "-" }, { label: "Sucursal", val: perfil.nombre_sucursal || "-" }]
              .map(({ label, val }, i) => (
                <div key={label} className="px-4 py-3" style={{ borderRight: i < 2 ? `1px solid ${isDark ? "rgba(255,255,255,0.06)" : T.border}` : "none" }}>
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: T.textFaint }}>{label}</p>
                  <p className="text-[12px] font-bold truncate mt-0.5" style={{ color: T.text }}>{val}</p>
                </div>
              ))}
          </div>
        </div>

        {/* -- DATOS PERSONALES -- */}
        <div className="rounded-xl overflow-hidden" style={card}>
          <div className="px-5 py-3 flex items-center gap-2" style={hdr}>
            <div className="w-1 h-3.5 rounded-full" style={{ background: T.orange }} />
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Datos Personales</p>
          </div>
          <div className="px-5 py-5 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[{ label: "Nombre", val: nombre, set: setNombre }, { label: "Apellido Paterno", val: apPaterno, set: setApPaterno }, { label: "Apellido Materno", val: apMaterno, set: setApMaterno }]
                .map(({ label, val, set }) => (
                  <div key={label} className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>{label}</span>
                    <input style={{ ...inp, fontSize: "14px", lineHeight: "1.35" }} value={val} onChange={e => set(e.target.value)}
                      onFocus={e => e.target.style.borderColor = T.orange} onBlur={e => e.target.style.borderColor = T.border} />
                  </div>
                ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>Correo Electrónico</span>
              <input style={{ ...inp, fontSize: "14px", lineHeight: "1.35" }} type="email" value={email} onChange={e => { setEmail(e.target.value); setEmailEditado(true); }}
                onFocus={e => e.target.style.borderColor = T.orange} onBlur={e => e.target.style.borderColor = T.border} />
              <span className="text-[11px] leading-tight" style={{ color: T.textFaint }}>
                Dominios permitidos: {DOMINIOS_PERMITIDOS.map(d => `@${d}`).join(", ")}
              </span>
            </div>
          </div>
        </div>

        {/* -- CAMBIAR CONTRASEÑA -- */}
        <div style={{
          borderRadius: "10px", overflow: "hidden",
          background: isDark ? "#161B22" : "#ffffff",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "#e8ecf0"}`,
          boxShadow: isDark ? "0 16px 40px rgba(0,0,0,0.50), 0 1px 0 rgba(255,255,255,0.04) inset" : "0 16px 40px rgba(15,23,42,0.12), 0 1px 3px rgba(15,23,42,0.06)",
        }}>
          {/* Línea acento naranja */}
          <div style={{ height: "2px", background: "#F47920", borderRadius: "10px 10px 0 0" }} />

          {/* Header */}
          <div style={{
            padding: "14px 18px 12px",
            background: isDark ? "#161B22" : "#ffffff",
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "#e8ecf0"}`,
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <div style={{ width: "4px", height: "16px", borderRadius: "99px", background: "#F47920", flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "#F47920" }}>
              Cambiar Contraseña
            </p>
          </div>

          {/* Body */}
          <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* Contraseña Actual */}
            <div style={{ display: "grid", gridTemplateColumns: "14px 140px 1fr", alignItems: "baseline", gap: "10px", padding: "8px 0", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"}` }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isDark ? "rgba(255,255,255,0.22)" : "#c0c9d6"} strokeWidth="2" style={{ marginTop: "1px" }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span style={{ fontSize: "0.9rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: isDark ? "rgba(255,255,255,0.30)" : "#a0aec0" }}>Contraseña Actual</span>
              <input
                style={{ ...inp, fontSize: "14px", color: T.text, WebkitTextFillColor: T.text, caretColor: T.text, opacity: 1 }}
                type="text" value={passActual || ""} disabled readOnly
                autoComplete="off" spellCheck={false} placeholder="Contraseña actual"
              />
            </div>

            {/* Nueva Contraseña */}
            <div style={{ display: "grid", gridTemplateColumns: "14px 140px 1fr", alignItems: "baseline", gap: "10px", padding: "8px 0", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"}` }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isDark ? "rgba(255,255,255,0.22)" : "#c0c9d6"} strokeWidth="2" style={{ marginTop: "1px" }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span style={{ fontSize: "0.9rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: isDark ? "rgba(255,255,255,0.30)" : "#a0aec0" }}>Nueva Contraseña</span>
              <div style={{ position: "relative" }}>
                <input
                  style={{ ...inp, paddingRight: "36px", fontSize: "14px", color: T.text, WebkitTextFillColor: T.text, caretColor: T.text }}
                  type={showNueva ? "text" : "password"} value={passNueva} onChange={e => setPassNueva(e.target.value)}
                  autoComplete="new-password" placeholder="••••••••"
                  onFocus={e => e.target.style.borderColor = "#F47920"}
                  onBlur={e => e.target.style.borderColor = T.border}
                />
                <EyeBtn show={showNueva} onToggle={() => setShowNueva(s => !s)} textFaint={T.textFaint} />
              </div>
            </div>

            {/* Seguridad de la contraseña — se evalúa mientras escribe */}
            {!evaluacion.vacia && (
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "6px", padding: "2px 0 6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ flex: 1, height: "4px", borderRadius: "99px", background: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${evaluacion.pct}%`, background: evaluacion.color, borderRadius: "99px", transition: "width 0.2s, background 0.2s" }} />
                  </div>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: evaluacion.color, whiteSpace: "nowrap" }}>{evaluacion.etiqueta}</span>
                </div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "2px 10px" }}>
                  {evaluacion.reglas.map(r => (
                    <li key={r.id} style={{
                      display: "flex", alignItems: "center", gap: "5px", fontSize: "0.72rem",
                      color: r.ok ? "#16a34a" : (isDark ? "rgba(255,255,255,0.35)" : "#94a3b8"),
                    }}>
                      {r.ok
                        ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>}
                      {r.texto}
                    </li>
                  ))}
                </ul>
                {evaluacion.cumple && (
                  <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, color: "#16a34a" }}>
                    Contraseña segura — cumple la política
                  </p>
                )}
              </div>
            )}

            {/* Confirmar Contraseña */}
            <div style={{ display: "grid", gridTemplateColumns: "14px 140px 1fr", alignItems: "baseline", gap: "10px", padding: "8px 0", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"}` }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isDark ? "rgba(255,255,255,0.22)" : "#c0c9d6"} strokeWidth="2" style={{ marginTop: "1px" }}><polyline points="20 6 9 17 4 12"/></svg>
              <span style={{ fontSize: "0.9rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: isDark ? "rgba(255,255,255,0.30)" : "#a0aec0" }}>Confirmar</span>
              <div style={{ position: "relative" }}>
                <input
                  style={{ ...inp, paddingRight: "36px", fontSize: "14px", color: T.text, WebkitTextFillColor: T.text, caretColor: T.text }}
                  type={showConf ? "text" : "password"} value={passConf} onChange={e => setPassConf(e.target.value)}
                  autoComplete="new-password" placeholder="••••••••"
                  onFocus={e => e.target.style.borderColor = "#F47920"}
                  onBlur={e => e.target.style.borderColor = T.border}
                />
                <EyeBtn show={showConf} onToggle={() => setShowConf(s => !s)} textFaint={T.textFaint} />
              </div>
            </div>

            {/* Aviso en vivo si la confirmación no coincide */}
            {passConf && passConf !== passNueva && (
              <p role="alert" style={{
                gridColumn: "1 / -1", margin: "0 0 4px", fontSize: "0.75rem", fontWeight: 600,
                color: "#dc2626", display: "flex", alignItems: "center", gap: "5px",
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Las contraseñas no coinciden
              </p>
            )}

            {/* Mensaje feedback */}
            {msg && (
              <div style={{
                padding: "8px 12px", borderRadius: "7px", fontSize: "0.85rem", fontWeight: 600,
                display: "flex", alignItems: "center", gap: "6px",
                background: msg.tipo === "ok" ? (isDark ? "rgba(22,163,74,0.15)" : "#dcfce7") : (isDark ? "rgba(220,38,38,0.15)" : "#fee2e2"),
                color: msg.tipo === "ok" ? "#16a34a" : "#dc2626",
                border: `1px solid ${msg.tipo === "ok" ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}`,
              }}>
                {msg.tipo === "ok"
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
                {msg.texto}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: "10px 18px",
            borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "#e8ecf0"}`,
            background: isDark ? "#1a2030" : "#f8fafc",
            display: "flex", justifyContent: "flex-end",
          }}>
            <button
              onClick={guardar} disabled={loading}
              style={{
                padding: "6px 18px", borderRadius: "6px",
                fontSize: "1rem", fontWeight: 600,
                background: `linear-gradient(135deg, #F47920, #d97400)`,
                border: "none", color: "#fff", cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                boxShadow: "0 2px 10px rgba(244,121,32,0.35)",
                display: "flex", alignItems: "center", gap: "6px",
                transition: "all 0.12s",
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.filter = "brightness(1.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.filter = ""; }}
            >
              {loading
                ? <><svg style={{ animation: "spin 1s linear infinite" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Guardando...</>
                : "Guardar Cambios"}
            </button>
          </div>
        </div>

        {/* -- HISTORIAL DE ACCESOS -- */}
        <div className="rounded-xl overflow-hidden" style={card}>
          <div className="px-5 py-3 flex flex-wrap items-center gap-2" style={hdr}>
            <div className="w-1 h-3.5 rounded-full" style={{ background: T.orange }} />
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Historial de Accesos</p>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: isDark ? "rgba(255,255,255,0.06)" : T.surfaceAlt, color: T.textMuted }}>
              {`Últimos ${accesos.length}`}
            </span>
            <div className="ml-auto">
              <button onClick={() => setModalReporte(true)}
                disabled={accesos.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: `linear-gradient(135deg,${T.orange},#d97400)`, color: "#fff", boxShadow: "0 2px 8px rgba(244,121,32,0.3)" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path d="M14 2v6h6"/></svg>
                Generar Reporte
              </button>
            </div>
          </div>

          {accesos.length > 0 && (
            <div className="grid grid-cols-4 gap-0" style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : T.border}` }}>
              {[{ label: "Sesiones", val: accesosFiltrados.length, color: T.orange },
                { label: "Cerradas", val: accesosFiltrados.filter(a => a.fecha_salida).length, color: "#16a34a" },
                { label: "Prom. dur.", val: fmtMin(durPromedio), color: "#3b82f6" },
                { label: "Más larga",  val: fmtMin(durMax),      color: "#8b5cf6" }]
                .map(({ label, val, color }, i) => (
                  <div key={label} className="px-4 py-2.5 flex flex-col gap-0.5"
                    style={{ borderRight: i < 3 ? `1px solid ${isDark ? "rgba(255,255,255,0.06)" : T.border}` : "none" }}>
                    <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: T.textFaint }}>{label}</p>
                    <p className="text-sm font-black" style={{ color }}>{val}</p>
                  </div>
                ))}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: "360px" }}>
              <thead>
                <tr style={{ background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt }}>
                  {["#", "Entrada", "Salida", "Duración"].map(col => (
                    <th key={col} className="text-left px-5 py-2 text-[9px] font-black uppercase tracking-widest"
                      style={{ color: T.textMuted, borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}` }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accesos.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-6 text-center text-xs" style={{ color: T.textFaint }}>Sin registros</td></tr>
                ) : accesos.slice(0, 10).map((a, i) => {
                  const entrada = a.fecha_entrada ? new Date(a.fecha_entrada) : null;
                  const salida  = a.fecha_salida  ? new Date(a.fecha_salida)  : null;
                  const durMin  = entrada && salida ? Math.round((salida - entrada) / 60000) : null;
                  return (
                    <tr key={a.id_acceso} style={{ background: i % 2 === 0 ? (isDark ? "#141720" : T.surface) : (isDark ? "#1a1f2e" : T.surfaceAlt), borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : T.border}` }}>
                      <td className="px-5 py-2.5 text-[10px] font-mono font-bold" style={{ color: T.orange }}>{a.id_acceso}</td>
                      <td className="px-5 py-2.5 text-[10px]" style={{ color: T.text }}>{fmtDT(entrada)}</td>
                      <td className="px-5 py-2.5 text-[10px]" style={{ color: salida ? "#16a34a" : T.textFaint }}>
                        {salida ? fmtDT(salida) : <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: "rgba(244,121,32,0.12)", color: T.orange }}>Activo</span>}
                      </td>
                      <td className="px-5 py-2.5 text-[10px] font-semibold" style={{ color: T.textMuted }}>
                        {durMin === null ? "-" : fmtMin(durMin)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {accesos.length > 10 && (
              <p className="text-center text-[10px] py-2.5 font-semibold" style={{ color: T.textFaint, borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : T.border}` }}>
                Mostrando los últimos 10 de {accesos.length} registros — exporta el PDF para ver el historial completo.
              </p>
            )}
          </div>
        </div>

        <div className="pb-2" />
      </div>
    </div>

    {modalReporte && (
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: isDark ? "rgba(0,0,0,0.55)" : "rgba(15,23,42,0.40)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "16px",
        }}
        onMouseDown={e => { if (e.target === e.currentTarget) { setModalReporte(false); setRptDesde(""); setRptHasta(""); setMesFiltro("Todos"); setAnioFiltro("Todos"); } }}
      >
        <div style={{
          width: "95%", maxWidth: "400px",
          background: isDark ? "#161B22" : "#ffffff",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}`,
          borderRadius: "10px",
          display: "flex", flexDirection: "column",
          maxHeight: "92vh", overflow: "hidden",
          boxShadow: isDark
            ? "0 16px 40px rgba(0,0,0,0.50), 0 1px 0 rgba(255,255,255,0.04) inset"
            : "0 16px 40px rgba(15,23,42,0.12), 0 1px 3px rgba(15,23,42,0.06)",
        }}>
          {/* Línea acento */}
          <div style={{ height: "2px", flexShrink: 0, background: T.orange, borderRadius: "10px 10px 0 0" }} />

          {/* Header */}
          <div style={{
            padding: "14px 18px 12px",
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}`,
            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
            gap: "12px", flexShrink: 0,
          }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: T.orange }}>
                Historial de Accesos
              </p>
              <h2 style={{ margin: "3px 0 0", fontSize: "16px", fontWeight: 700, color: T.text, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                Generar Reporte
              </h2>
              <p style={{ margin: "3px 0 0", fontSize: "12px", color: T.textMuted }}>
                Filtra por período y exporta como PDF
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, paddingTop: "2px" }}>
              <img
                src={isDark ? "/assets/img/logo blanco.png" : "/assets/img/logo negro.png"}
                alt="Precision Trucks"
                style={{ height: "28px", width: "auto", objectFit: "contain", opacity: isDark ? 0.80 : 0.70 }}
              />
              <button
                onClick={() => { setModalReporte(false); setRptDesde(""); setRptHasta(""); setMesFiltro("Todos"); setAnioFiltro("Todos"); }}
                style={{
                  width: "26px", height: "26px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "transparent", border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}`,
                  borderRadius: "6px", cursor: "pointer", color: T.textFaint,
                  transition: "all 0.12s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.textMuted; e.currentTarget.style.color = T.text; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.07)" : T.border; e.currentTarget.style.color = T.textFaint; }}
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <p style={{ margin: 0, fontSize: "11px", color: T.textMuted }}>
              Selecciona el rango de fechas. Si no seleccionas ninguna se incluyen todos los registros.
            </p>

            {esAdmin && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {[{ label: "Año", val: anioFiltro, set: v => { setAnioFiltro(v); setMesFiltro("Todos"); }, opts: aniosDisponibles, placeholder: "Todos los años" },
                    { label: "Mes",  val: mesFiltro,  set: setMesFiltro, opts: mesesDisponibles, placeholder: "Todos los meses" }]
                    .map(({ label, val, set, opts, placeholder }) => (
                      <div key={label} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: T.textFaint }}>{label}</span>
                        <select value={val} onChange={e => set(e.target.value)}
                          style={{ ...inp, cursor: "pointer", colorScheme: isDark ? "dark" : "light",
                            borderColor: val !== "Todos" ? T.orange : T.border,
                            color: val !== "Todos" ? T.orange : T.text }}
                          onFocus={e => e.target.style.borderColor = T.orange}
                          onBlur={e => e.target.style.borderColor = val !== "Todos" ? T.orange : T.border}>
                          {opts.map(o => <option key={o} value={o}>{o === "Todos" ? placeholder : o}</option>)}
                        </select>
                      </div>
                    ))}
                </div>
                <div style={{ height: "1px", background: isDark ? "rgba(255,255,255,0.06)" : T.border }} />
              </>
            )}

            {[{ label: "Desde", val: rptDesde, set: setRptDesde }, { label: "Hasta", val: rptHasta, set: setRptHasta }]
              .map(({ label, val, set }) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: T.textFaint }}>{label}</span>
                  <input type="date" value={val} onChange={e => set(e.target.value)}
                    style={{ ...inp, colorScheme: isDark ? "dark" : "light" }}
                    onFocus={e => e.target.style.borderColor = T.orange}
                    onBlur={e => e.target.style.borderColor = T.border} />
                </div>
              ))}
          </div>

          {/* Footer */}
          <div style={{
            padding: "10px 18px",
            borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}`,
            background: isDark ? "#1a2030" : "#f8fafc",
            display: "flex", alignItems: "center", justifyContent: "flex-end",
            gap: "8px", flexShrink: 0,
          }}>
            <button
              onClick={() => { setModalReporte(false); setRptDesde(""); setRptHasta(""); setMesFiltro("Todos"); setAnioFiltro("Todos"); }}
              style={{
                padding: "6px 16px", borderRadius: "6px",
                fontSize: "12px", fontWeight: 600,
                background: "transparent", border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}`,
                color: T.textMuted, cursor: "pointer", transition: "all 0.12s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.textMuted; e.currentTarget.style.color = T.text; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.07)" : T.border; e.currentTarget.style.color = T.textMuted; }}
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                const accesosFiltrados = accesos.filter(a => {
                  if (!a.fecha_entrada) return true;
                  const d = new Date(a.fecha_entrada);
                  if (anioFiltro !== "Todos" && d.getFullYear().toString() !== anioFiltro) return false;
                  if (mesFiltro  !== "Todos" && MESES_NOMBRE[d.getMonth()] !== mesFiltro)  return false;
                  return true;
                });
                generarPDFAccesos({ usuario, fechaInicio: rptDesde || undefined, fechaFin: rptHasta || undefined });
                setModalReporte(false); setRptDesde(""); setRptHasta(""); setMesFiltro("Todos"); setAnioFiltro("Todos");
              }}
              style={{
                padding: "6px 18px", borderRadius: "6px",
                fontSize: "12px", fontWeight: 700,
                background: T.orange, border: "none", color: "#fff",
                cursor: "pointer", transition: "opacity 0.12s",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >
              Generar PDF
            </button>
          </div>
        </div>
      </div>
    )}

    {cropSrc && (
      <ModalRecorte src={cropSrc} isDark={isDark} T={T}
        onCancelar={() => setCropSrc(null)}
        onConfirmar={async crop => {
          const src = cropSrc;
          setCropSrc(null);
          setSubiendoFoto(true);
          try {
            await procesarYSubirFoto(src, crop, usuario.id_empleado, rutaBD => {
              setFoto(fotoUrl(rutaBD));
              const u = JSON.parse(sessionStorage.getItem("usuario") || "{}");
              const actualizado = { ...u, foto: rutaBD };
              sessionStorage.setItem("usuario", JSON.stringify(actualizado));
              onUsuarioActualizado?.(actualizado);
            });
          } catch (e) { console.error("Error subiendo foto:", e); }
          finally { setSubiendoFoto(false); }
        }}
      />
    )}
    </>
  );
}
