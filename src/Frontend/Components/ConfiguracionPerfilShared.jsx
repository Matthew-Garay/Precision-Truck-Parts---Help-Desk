import { useState, useEffect } from "react";
import { User } from "lucide-react";
import API, { apiFetch } from "../Config/api";
import { EyeBtn, ModalRecorte, usePerfilStyles, procesarYSubirFoto, generarPDFAccesos } from "./PerfilShared";

export default function ConfiguracionPerfilShared({ T, usuario, onUsuarioActualizado, rol = "Usuario" }) {
  const isDark = T.isDark;
  const { card, hdr, inp } = usePerfilStyles(T, isDark);

  const [nombre,     setNombre]     = useState(usuario.nombre     || "");
  const [apPaterno,  setApPaterno]  = useState(usuario.ap_paterno || "");
  const [apMaterno,  setApMaterno]  = useState(usuario.ap_materno || "");
  const [email,      setEmail]      = useState(usuario.email      || "");
  const [passActual, setPassActual] = useState(() => sessionStorage.getItem("pwd_actual") || "");
  const [passNueva,  setPassNueva]  = useState("");
  const [passConf,   setPassConf]   = useState("");

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

  useEffect(() => {
    setNombre(usuario.nombre     || "");
    setApPaterno(usuario.ap_paterno || "");
    setApMaterno(usuario.ap_materno || "");
    setEmail(usuario.email      || "");
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
            const next = { ...prev, num_empleado: emp.num_empleado, nombre: emp.nombre, ap_paterno: emp.ap_paterno, ap_materno: emp.ap_materno || "", email: emp.email, departamento: emp.nombre_departamento };
            if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
            setNombre(emp.nombre || "");
            setApPaterno(emp.ap_paterno || "");
            setApMaterno(emp.ap_materno || "");
            setEmail(emp.email || "");
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
    if (passNueva && passNueva.length < 8)  return setMsg({ tipo: "err", texto: "La contraseña debe tener al menos 8 caracteres" });
    setLoading(true); setMsg(null);
    try {
      const res  = await apiFetch(`/api/auth/perfil/${usuario.id_empleado}`, {
        method: "PUT",
        body: { nombre, ap_paterno: apPaterno, ap_materno: apMaterno, email, password_actual: passActual || undefined, password_nueva: passNueva || undefined },
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ tipo: "err", texto: data.error || "Error al guardar" }); return; }
      setMsg({ tipo: "ok", texto: "Datos actualizados correctamente" });
      if (passNueva) {
        sessionStorage.setItem("pwd_actual", passNueva);
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
              <p className="font-black text-base leading-tight truncate" style={{ color: T.text }}>{nombreCompleto || "-"}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: T.textMuted }}>{usuario.email || "-"}</p>
              <p className="text-[11px] mt-0.5 truncate" style={{ color: T.textFaint }}>{usuario.departamento || "-"}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-0" style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : T.border}` }}>
            {[{ label: "Número", val: perfil.num_empleado || "-" }, { label: "Departamento", val: perfil.departamento || "-" }, { label: "Rol", val: rol }]
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
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Datos Personales</p>
          </div>
          <div className="px-5 py-5 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[{ label: "Nombre", val: nombre, set: setNombre }, { label: "Apellido Paterno", val: apPaterno, set: setApPaterno }, { label: "Apellido Materno", val: apMaterno, set: setApMaterno }]
                .map(({ label, val, set }) => (
                  <div key={label} className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>{label}</span>
                    <input style={inp} value={val} onChange={e => set(e.target.value)}
                      onFocus={e => e.target.style.borderColor = T.orange} onBlur={e => e.target.style.borderColor = T.border} />
                  </div>
                ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>Correo Electrónico</span>
              <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)}
                onFocus={e => e.target.style.borderColor = T.orange} onBlur={e => e.target.style.borderColor = T.border} />
            </div>
          </div>
        </div>

        {/* -- DATOS PERSONALES + CONTRASEÑA + GUARDAR -- */}
        <div className="rounded-xl overflow-hidden" style={card}>
          <div className="px-5 py-3 flex items-center gap-2" style={hdr}>
            <div className="w-1 h-3.5 rounded-full" style={{ background: T.orange }} />
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Cambiar Contraseña</p>
          </div>
          <div className="px-5 pt-4 pb-5 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>Contraseña Actual</span>
              <input
                style={{ ...inp, opacity: 0.55, cursor: "not-allowed", background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt }}
                type="text" value={passActual}
                placeholder="Inicia sesión de nuevo para ver"
                disabled readOnly />
            </div>
            {[
              { label: "Nueva Contraseña",           k: "nueva", val: passNueva, set: setPassNueva },
              { label: "Confirmar Nueva Contraseña", k: "conf",  val: passConf,  set: setPassConf  },
            ].map(({ label, k, val, set }) => (
              <div key={k} className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>{label}</span>
                <input className="[&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                  style={inp} type="password" value={val} onChange={e => set(e.target.value)}
                  autoComplete="new-password" placeholder="••••••••"
                  onFocus={e => e.target.style.borderColor = T.orange}
                  onBlur={e => e.target.style.borderColor = T.border} />
              </div>
            ))}

            {/* Mensaje + Botón en misma fila */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex-1">
                {msg && (
                  <div className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    style={{ background: msg.tipo === "ok" ? (isDark ? "rgba(22,163,74,0.15)" : "#dcfce7") : (isDark ? "rgba(220,38,38,0.15)" : "#fee2e2"), color: msg.tipo === "ok" ? "#16a34a" : "#dc2626", border: `1px solid ${msg.tipo === "ok" ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}` }}>
                    {msg.tipo === "ok"
                      ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
                    {msg.texto}
                  </div>
                )}
              </div>
              <button onClick={guardar} disabled={loading}
                className="flex-shrink-0 px-5 py-2 rounded-lg text-xs font-bold text-white transition-all hover:brightness-110 active:scale-95 flex items-center gap-1.5"
                style={{ background: `linear-gradient(135deg, ${T.orange}, #d97400)`, boxShadow: "0 2px 10px rgba(244,121,32,0.35)", opacity: loading ? 0.7 : 1 }}>
                {loading
                  ? <><svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Guardando...</>
                  : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>

        {/* -- HISTORIAL DE ACCESOS -- */}
        <div className="rounded-xl overflow-hidden" style={card}>
          <div className="px-5 py-3 flex flex-wrap items-center gap-2" style={hdr}>
            <div className="w-1 h-3.5 rounded-full" style={{ background: T.orange }} />
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Historial de Accesos</p>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: isDark ? "rgba(255,255,255,0.06)" : T.surfaceAlt, color: T.textMuted }}>
              {esAdmin ? `${accesosFiltrados.length} de ${accesos.length}` : `Últimos ${accesos.length}`}
            </span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {esAdmin && (
                <>
                  {[{ val: anioFiltro, set: v => { setAnioFiltro(v); setMesFiltro("Todos"); }, opts: aniosDisponibles, placeholder: "Todos los años" },
                    { val: mesFiltro,  set: setMesFiltro, opts: mesesDisponibles, placeholder: "Todos los meses" }]
                    .map(({ val, set, opts, placeholder }, i) => (
                      <select key={i} value={val} onChange={e => set(e.target.value)}
                        className="text-[11px] font-semibold rounded-lg px-2 py-1 outline-none cursor-pointer"
                        style={{ background: val !== "Todos" ? (isDark ? "rgba(244,121,32,0.12)" : "rgba(244,121,32,0.08)") : (isDark ? "rgba(255,255,255,0.06)" : T.surfaceAlt), border: `1px solid ${val !== "Todos" ? T.orange : T.border}`, color: val !== "Todos" ? T.orange : T.text, colorScheme: isDark ? "dark" : "light" }}>
                        {opts.map(o => <option key={o} value={o}>{o === "Todos" ? placeholder : o}</option>)}
                      </select>
                    ))}
                  {(mesFiltro !== "Todos" || anioFiltro !== "Todos") && (
                    <button onClick={() => { setMesFiltro("Todos"); setAnioFiltro("Todos"); }}
                      className="text-[10px] font-bold px-2 py-1 rounded-lg"
                      style={{ background: "rgba(244,121,32,0.08)", color: T.orange, border: "1px solid rgba(244,121,32,0.2)" }}>
                      Limpiar
                    </button>
                  )}
                </>
              )}
              <button onClick={() => generarPDFAccesos({ accesos: esAdmin ? accesosFiltrados : accesos, usuario, mesFiltro: esAdmin ? mesFiltro : undefined, anioFiltro: esAdmin ? anioFiltro : undefined })}
                disabled={(esAdmin ? accesosFiltrados : accesos).length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)", color: "#fff", boxShadow: "0 2px 8px rgba(220,38,38,0.3)" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path d="M14 2v6h6"/></svg>
                Exportar PDF
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
                {accesosFiltrados.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-6 text-center text-xs" style={{ color: T.textFaint }}>
                    {accesos.length === 0 ? "Sin registros" : "Sin resultados para el filtro seleccionado"}
                  </td></tr>
                ) : accesosFiltrados.map((a, i) => {
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
          </div>
        </div>

        <div className="pb-2" />
      </div>
    </div>

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
