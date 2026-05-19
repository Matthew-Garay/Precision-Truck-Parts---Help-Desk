import { useState, useEffect, useRef } from "react";
import { User } from "lucide-react";
import API from "../../Config/api";

function EyeBtn({ show, onToggle, textFaint }) {
  return (
    <button type="button" onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2"
      style={{ color: textFaint, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
      {show
        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      }
    </button>
  );
}

function ModalRecorte({ src, isDark, T, onCancelar, onConfirmar }) {
  const SIZE = 260;
  const [zoom,    setZoom]    = useState(1);
  const [offset,  setOffset]  = useState({ x: 0, y: 0 });
  const [imgNat,  setImgNat]  = useState(null); // null = no cargada aún
  const dragging = useRef(false);
  const lastPos  = useRef({ x: 0, y: 0 });

  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  // Limita el offset para que la imagen siempre cubra el área SIZE×SIZE
  const clampOff = (ox, oy, nat, z) => {
    const iw = nat.w * z;
    const ih = nat.h * z;
    return {
      x: clamp(ox, SIZE - iw, 0),
      y: clamp(oy, SIZE - ih, 0),
    };
  };

  const onLoad = e => {
    const nw = e.target.naturalWidth;
    const nh = e.target.naturalHeight;
    const nat = { w: nw, h: nh };
    // zoom mínimo para cubrir SIZE en ambas dimensiones
    const z = Math.max(SIZE / nw, SIZE / nh);
    const ox = (SIZE - nw * z) / 2;
    const oy = (SIZE - nh * z) / 2;
    setImgNat(nat);
    setZoom(z);
    setOffset({ x: ox, y: oy });
  };

  const applyZoom = (newZ) => {
    if (!imgNat) return;
    const minZ = Math.max(SIZE / imgNat.w, SIZE / imgNat.h);
    const z = clamp(newZ, minZ, minZ * 4);
    setZoom(z);
    setOffset(o => clampOff(o.x, o.y, imgNat, z));
  };

  const onMouseDown = e => { e.preventDefault(); dragging.current = true; lastPos.current = { x: e.clientX, y: e.clientY }; };
  const onMouseMove = e => {
    if (!dragging.current || !imgNat) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset(o => clampOff(o.x + dx, o.y + dy, imgNat, zoom));
  };
  const onMouseUp = () => { dragging.current = false; };

  const onTouchStart = e => { dragging.current = true; lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchMove  = e => {
    if (!dragging.current || !imgNat) return;
    const dx = e.touches[0].clientX - lastPos.current.x;
    const dy = e.touches[0].clientY - lastPos.current.y;
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setOffset(o => clampOff(o.x + dx, o.y + dy, imgNat, zoom));
  };

  const confirmar = () => {
    if (!imgNat) return;
    // Convertir offset de pantalla a coordenadas en píxeles naturales
    const scale = 1 / zoom;                      // px naturales por px pantalla
    const sx = Math.round(-offset.x * scale);    // x inicio en imagen natural
    const sy = Math.round(-offset.y * scale);    // y inicio en imagen natural
    const sw = Math.round(SIZE * scale);          // tamaño del recorte en px naturales
    onConfirmar({ x: sx, y: sy, size: sw });
  };

  const minZoom = imgNat ? Math.max(SIZE / imgNat.w, SIZE / imgNat.h) : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.8)" }}
      onMouseMove={onMouseMove} onMouseUp={onMouseUp}
      onTouchMove={onTouchMove} onTouchEnd={onMouseUp}>
      <div className="rounded-2xl flex flex-col gap-4 p-5"
        style={{ background: isDark ? "#141720" : T.surface, border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : T.border}`, width: "320px" }}>

        <p className="text-sm font-black" style={{ color: T.text }}>Ajustar foto de perfil</p>

        {/* Área de recorte */}
        <div className="relative mx-auto overflow-hidden rounded-full cursor-grab active:cursor-grabbing select-none"
          style={{ width: SIZE, height: SIZE, background: "#111" }}
          onMouseDown={onMouseDown} onTouchStart={onTouchStart}>

          {imgNat && (
            <img src={src} alt="crop" draggable={false}
              style={{
                position: "absolute",
                left: offset.x, top: offset.y,
                width:  imgNat.w * zoom,
                height: imgNat.h * zoom,
                pointerEvents: "none", userSelect: "none",
              }} />
          )}

          {/* Imagen oculta solo para disparar onLoad */}
          {!imgNat && (
            <img src={src} alt="" onLoad={onLoad}
              style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} />
          )}

          {/* Borde circular */}
          <div className="absolute inset-0 rounded-full pointer-events-none"
            style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)" }} />
          <div className="absolute inset-0 rounded-full pointer-events-none"
            style={{ border: "2px solid rgba(255,255,255,0.5)" }} />
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold select-none" style={{ color: T.textFaint }}>−</span>
          <input type="range"
            min={minZoom} max={minZoom * 4} step={0.001} value={zoom}
            onChange={e => applyZoom(parseFloat(e.target.value))}
            className="flex-1" style={{ accentColor: T.orange }} />
          <span className="text-sm font-bold select-none" style={{ color: T.textFaint }}>+</span>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancelar}
            className="flex-1 py-2 rounded-xl text-sm font-bold"
            style={{ background: isDark ? "rgba(255,255,255,0.07)" : T.surfaceAlt, color: T.textMuted }}>
            Cancelar
          </button>
          <button onClick={confirmar}
            className="flex-1 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: `linear-gradient(135deg,${T.orange},#d97400)` }}>
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConfiguracionPerfilAdmin({ T, usuario, onUsuarioActualizado }) {
  const isDark = T.bg === "#0b0e14";

  const [nombre,     setNombre]     = useState(usuario.nombre     || "");
  const [apPaterno,  setApPaterno]  = useState(usuario.ap_paterno || "");
  const [apMaterno,  setApMaterno]  = useState(usuario.ap_materno || "");
  const [email,      setEmail]      = useState(usuario.email || "");
  const [passActual, setPassActual] = useState("");
  const [passNueva,  setPassNueva]  = useState("");
  const [passConf,   setPassConf]   = useState("");
  const [showPass,   setShowPass]   = useState({ actual: false, nueva: false, conf: false });
  // foto: BD guarda "Fotos de Perfil/emp_x.jpg", el servidor sirve /fotos/ → solo el filename
  const fotoUrl = (f) => f ? `${API}/fotos/${f.split("/").pop()}` : null;

  const [foto,         setFoto]         = useState(fotoUrl(usuario.foto));
  const [subiendoFoto,  setSubiendoFoto]  = useState(false);
  const [cropSrc,       setCropSrc]       = useState(null);

  // Recortar con canvas y subir
  const procesarYSubir = (src, crop) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const OUT = 400;
      const canvas = document.createElement("canvas");
      canvas.width  = OUT;
      canvas.height = OUT;
      const ctx = canvas.getContext("2d");
      // Fondo blanco (por si la imagen tiene transparencia)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, OUT, OUT);
      // Dibujar el recorte
      const sx   = Math.max(0, crop.x);
      const sy   = Math.max(0, crop.y);
      const sSize = Math.max(1, crop.size);
      ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUT, OUT);
      canvas.toBlob(async (blob) => {
        if (!blob) { reject(new Error("canvas.toBlob fallo")); return; }
        try {
          const fd = new FormData();
          fd.append("foto", blob, "foto.jpg");
          const res  = await fetch(`${API}/api/auth/perfil/${usuario.id_empleado}/foto`, { method: "POST", body: fd });
          const data = await res.json();
          if (res.ok && data.foto) {
            const url = fotoUrl(data.foto);
            setFoto(url);
            const u = JSON.parse(sessionStorage.getItem("usuario") || "{}");
            const actualizado = { ...u, foto: data.foto };
            sessionStorage.setItem("usuario", JSON.stringify(actualizado));
            onUsuarioActualizado?.(actualizado);
          }
          resolve();
        } catch (e) { reject(e); }
      }, "image/jpeg", 0.9);
    };
    img.onerror = reject;
    img.src = src;
  });
  const [accesos,    setAccesos]    = useState([]);
  const [msg,        setMsg]        = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [perfil,    setPerfil]    = useState(usuario);
  const [mesFiltro,  setMesFiltro]  = useState("Todos");
  const [anioFiltro, setAnioFiltro] = useState("Todos");

  const MESES_NOMBRE = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  const aniosDisponibles = ["Todos", ...Array.from(
    new Set(accesos.filter(a => a.fecha_entrada).map(a => new Date(a.fecha_entrada).getFullYear().toString()))
  ).sort((a,b) => b - a)];

  const mesesDisponibles = ["Todos", ...MESES_NOMBRE.filter((_, i) =>
    accesos.some(a => a.fecha_entrada && new Date(a.fecha_entrada).getMonth() === i &&
      (anioFiltro === "Todos" || new Date(a.fecha_entrada).getFullYear().toString() === anioFiltro)
    )
  )];

  const accesosFiltrados = accesos.filter(a => {
    if (!a.fecha_entrada) return true;
    const d = new Date(a.fecha_entrada);
    if (anioFiltro !== "Todos" && d.getFullYear().toString() !== anioFiltro) return false;
    if (mesFiltro  !== "Todos" && MESES_NOMBRE[d.getMonth()] !== mesFiltro)  return false;
    return true;
  });

  const duraciones = accesosFiltrados
    .filter(a => a.fecha_entrada && a.fecha_salida)
    .map(a => Math.round((new Date(a.fecha_salida) - new Date(a.fecha_entrada)) / 60000));
  const durPromedio = duraciones.length > 0 ? Math.round(duraciones.reduce((s,d) => s+d, 0) / duraciones.length) : 0;
  const durMax      = duraciones.length > 0 ? Math.max(...duraciones) : 0;
  const fmtMin = m => m < 60 ? `${m} min` : `${Math.floor(m/60)}h ${m%60}m`;

  useEffect(() => {
    if (!usuario?.id_empleado) return;
    const cargar = () => {
      fetch(`${API}/api/auth/accesos/${usuario.id_empleado}`)
        .then(r => r.json())
        .then(data => {
          const rows = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
          setAccesos(prev => JSON.stringify(prev) === JSON.stringify(rows) ? prev : rows);
        })
        .catch(() => {});
      fetch(`${API}/api/auth/empleados/${usuario.id_empleado}`)
        .then(r => r.json())
        .then(emp => {
          if (!emp?.id_empleado) return;
          setPerfil(prev => {
            const next = { ...prev, num_empleado: emp.num_empleado, nombre: emp.nombre, ap_paterno: emp.ap_paterno, ap_materno: emp.ap_materno || "", email: emp.email, departamento: emp.nombre_departamento };
            return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
          });
        })
        .catch(() => {});
    };
    cargar();
    const id = setInterval(cargar, 30000);
    return () => clearInterval(id);
  }, [usuario?.id_empleado]);

  const card = {
    background: isDark ? "#141720" : T.surface,
    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}`,
    boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 1px 6px rgba(0,0,0,0.06)",
  };
  const hdr = {
    borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}`,
    background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt,
  };
  const inp = {
    background: isDark ? "rgba(255,255,255,0.05)" : T.surfaceAlt,
    border: `1px solid ${T.border}`,
    color: T.text,
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "13px",
    outline: "none",
    width: "100%",
    transition: "border-color 0.15s",
  };

  const nombreCompleto = [usuario.nombre, usuario.ap_paterno, usuario.ap_materno].filter(Boolean).join(" ");
  const iniciales = [usuario.nombre, usuario.ap_paterno].filter(Boolean).map(p => p[0].toUpperCase()).join("");

  const guardar = async () => {
    if (passNueva && passNueva !== passConf) return setMsg({ tipo: "err", texto: "Las contraseñas no coinciden" });
    if (passNueva && passNueva.length < 6)  return setMsg({ tipo: "err", texto: "La contraseña debe tener al menos 6 caracteres" });
    if (passNueva && !passActual)           return setMsg({ tipo: "err", texto: "Ingresa tu contraseña actual" });
    setLoading(true); setMsg(null);
    try {
      const res = await fetch(`${API}/api/auth/perfil/${usuario.id_empleado}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre, ap_paterno: apPaterno, ap_materno: apMaterno, email,
          password_actual: passActual || undefined,
          password_nueva:  passNueva  || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ tipo: "err", texto: data.error || "Error al guardar" }); return; }
      setMsg({ tipo: "ok", texto: "Datos actualizados correctamente" });
      setPassActual(""); setPassNueva(""); setPassConf("");
      const u = JSON.parse(sessionStorage.getItem("usuario") || "{}");
      const actualizado = { ...u, ...data.usuario };
      sessionStorage.setItem("usuario", JSON.stringify(actualizado));
      onUsuarioActualizado?.(actualizado);
    } catch { setMsg({ tipo: "err", texto: "Error de conexión" }); }
    finally { setLoading(false); }
  };

  const fmtDT = d => d
    ? `${new Date(d).toLocaleDateString("es-MX",{day:"2-digit",month:"2-digit",year:"numeric"})} ${new Date(d).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"})}`
    : "—";

  const generarPDFAccesos = () => {
    const origin = window.location.origin;
    const titulo = mesFiltro !== "Todos" || anioFiltro !== "Todos"
      ? `Historial de Accesos — ${mesFiltro !== "Todos" ? mesFiltro + " " : ""}${anioFiltro !== "Todos" ? anioFiltro : ""}`
      : "Historial de Accesos — Todos los registros";

    const filas = accesosFiltrados.map((a, i) => {
      const entrada = a.fecha_entrada ? new Date(a.fecha_entrada) : null;
      const salida  = a.fecha_salida  ? new Date(a.fecha_salida)  : null;
      const durMin  = entrada && salida ? Math.round((salida - entrada) / 60000) : null;
      const dur     = durMin === null ? "—" : fmtMin(durMin);
      const bgRow   = i % 2 === 0 ? "#ffffff" : "#f9fafb";
      return `
        <tr style="background:${bgRow}">
          <td style="padding:6px 12px;font-family:monospace;font-weight:700;color:#F47920;font-size:10px">${a.id_acceso}</td>
          <td style="padding:6px 12px;font-size:10px;color:#1D1D1B">${fmtDT(entrada)}</td>
          <td style="padding:6px 12px;font-size:10px;color:${salida ? "#16a34a" : "#ea580c"}">${salida ? fmtDT(salida) : "<span style='font-size:9px;font-weight:700;background:#fff7ed;color:#ea580c;padding:1px 6px;border-radius:10px;border:1px solid #fed7aa'>Activo</span>"}</td>
          <td style="padding:6px 12px;font-size:10px;color:#6b7280;font-weight:600">${dur}</td>
        </tr>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>${titulo} — ${nombreCompleto}</title>
<style>
  @page { size: letter portrait; margin: 10mm 12mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Arial,sans-serif; background:#fff; color:#1D1D1B; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .hdr { display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:3px solid #F47920; margin-bottom:12px; }
  .hdr-logo { height:48px; object-fit:contain; }
  .hdr-center { flex:1; text-align:center; }
  .hdr-sub  { font-size:8px; font-weight:700; text-transform:uppercase; letter-spacing:.18em; color:#9ca3af; }
  .hdr-title{ font-size:14px; font-weight:900; color:#1D1D1B; margin-top:2px; }
  .hdr-right{ text-align:right; }
  .hdr-date { font-size:7.5px; color:#9ca3af; }
  .kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:12px; }
  .kpi { background:#f8fafc; border:1.5px solid #e5e7eb; border-radius:7px; padding:8px 12px; }
  .kpi-lbl { font-size:7px; font-weight:900; text-transform:uppercase; letter-spacing:.1em; color:#9ca3af; margin-bottom:3px; }
  .kpi-val { font-size:20px; font-weight:900; line-height:1; }
  .kpi-sub { font-size:8px; color:#9ca3af; margin-top:2px; }
  .info-box { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:12px; }
  .info-item{ background:#f8fafc; border:1.5px solid #e5e7eb; border-radius:7px; padding:8px 12px; }
  .info-lbl { font-size:7px; font-weight:900; text-transform:uppercase; letter-spacing:.1em; color:#9ca3af; margin-bottom:3px; }
  .info-val { font-size:13px; font-weight:800; color:#1D1D1B; }
  table { width:100%; border-collapse:collapse; border:1.5px solid #e5e7eb; border-radius:8px; overflow:hidden; }
  thead tr { background:#f8fafc; }
  th { text-align:left; padding:8px 12px; font-size:8px; font-weight:900; text-transform:uppercase; letter-spacing:.12em; color:#6b7280; border-bottom:1.5px solid #e5e7eb; }
  tbody tr { border-bottom:1px solid #f1f5f9; }
  .ftr { background:#1D1D1B; border-radius:8px; margin-top:14px; padding:10px 16px; display:flex; align-items:center; justify-content:space-between; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .ftr-brand { font-size:10px; font-weight:900; color:#F47920; }
  .ftr-sub   { font-size:7px; color:rgba(255,255,255,0.4); margin-top:2px; }
  .ftr-logo  { height:22px; object-fit:contain; filter:brightness(0) invert(1); opacity:.5; }
  .ftr-date  { font-size:7.5px; color:rgba(255,255,255,0.4); text-align:right; }
  .filtro-badge { display:inline-block; background:#fff7ed; color:#F47920; border:1px solid #fed7aa; border-radius:20px; font-size:8px; font-weight:700; padding:2px 8px; margin-left:6px; }
</style>
</head>
<body>
<div class="hdr">
  <img src="${origin}/assets/img/logo negro.png" class="hdr-logo" alt="PTP"/>
  <div class="hdr-center">
    <div class="hdr-sub">Precision Truck Parts &amp; Accessories</div>
    <div class="hdr-title">Historial de Accesos al Sistema${mesFiltro !== "Todos" || anioFiltro !== "Todos" ? `<span class="filtro-badge">${[mesFiltro !== "Todos" ? mesFiltro : "", anioFiltro !== "Todos" ? anioFiltro : ""].filter(Boolean).join(" ")}</span>` : ""}</div>
  </div>
  <div class="hdr-right">
    <div class="hdr-date">Generado: ${new Date().toLocaleDateString("es-MX",{day:"2-digit",month:"long",year:"numeric"})}</div>
    <div class="hdr-date">${new Date().toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"})}</div>
  </div>
</div>
<div class="info-box">
  <div class="info-item"><div class="info-lbl">Empleado</div><div class="info-val">${nombreCompleto || "—"}</div></div>
  <div class="info-item"><div class="info-lbl">N° Empleado</div><div class="info-val">${usuario.num_empleado || "—"}</div></div>
  <div class="info-item"><div class="info-lbl">Departamento</div><div class="info-val">${usuario.departamento || "—"}</div></div>
  <div class="info-item"><div class="info-lbl">Período</div><div class="info-val" style="color:#F47920">${[mesFiltro !== "Todos" ? mesFiltro : "", anioFiltro !== "Todos" ? anioFiltro : ""].filter(Boolean).join(" ") || "Todos"}</div></div>
</div>
<div class="kpis">
  <div class="kpi"><div class="kpi-lbl">Total sesiones</div><div class="kpi-val" style="color:#F47920">${accesosFiltrados.length}</div></div>
  <div class="kpi"><div class="kpi-lbl">Sesiones cerradas</div><div class="kpi-val" style="color:#16a34a">${accesosFiltrados.filter(a => a.fecha_salida).length}</div></div>
  <div class="kpi"><div class="kpi-lbl">Duración promedio</div><div class="kpi-val" style="color:#3b82f6;font-size:14px">${fmtMin(durPromedio)}</div></div>
  <div class="kpi"><div class="kpi-lbl">Sesión más larga</div><div class="kpi-val" style="color:#8b5cf6;font-size:14px">${fmtMin(durMax)}</div></div>
</div>
<table>
  <thead><tr><th>#</th><th>Entrada</th><th>Salida</th><th>Duración</th></tr></thead>
  <tbody>${filas || "<tr><td colspan='4' style='padding:20px;text-align:center;color:#9ca3af;font-size:11px'>Sin registros</td></tr>"}</tbody>
</table>
<div class="ftr">
  <div><div class="ftr-brand">Precision Truck Parts &amp; Accessories</div><div class="ftr-sub">Sistema HelpDesk &bull; Documento de uso interno</div></div>
  <img src="${origin}/assets/img/logo blanco.png" class="ftr-logo" alt="PTP"/>
  <div class="ftr-date">${new Date().toLocaleDateString("es-MX",{day:"2-digit",month:"long",year:"numeric"})}<br/>${new Date().toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"})}</div>
</div>
<script>window.onload=function(){window.print();}<\/script>
</body></html>`;

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) { alert("Permite ventanas emergentes para generar el reporte."); return; }
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  return (
    <>
    <div className="absolute inset-0 overflow-y-auto" style={{ background: T.bg }}>
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">

        {/* ── BANNER PERFIL ── */}
        <div className="rounded-2xl overflow-hidden" style={card}>
          <div className="px-5 py-5 flex items-center gap-4"
            style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}` }}>
            <div className="relative flex-shrink-0">
              <div className="flex items-center justify-center rounded-2xl font-black overflow-hidden"
                style={{ width: "72px", height: "72px", background: isDark ? "#1e2330" : T.surfaceAlt, border: `2px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}`, color: isDark ? "rgba(255,255,255,0.7)" : T.textMuted, fontSize: "24px" }}>
                {foto
                  ? <img src={foto} alt="perfil" className="w-full h-full object-cover" />
                  : (iniciales || <User size={28} style={{ color: isDark ? "rgba(255,255,255,0.4)" : T.textFaint }} />)
                }
              </div>
              <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all hover:brightness-110 active:scale-95"
                style={{ background: T.orange, boxShadow: "0 2px 8px rgba(244,121,32,0.5)", border: `2px solid ${isDark ? "#141720" : T.surface}` }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <input type="file" accept="image/*" className="hidden" onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  // Mostrar modal de recorte
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
              <p className="font-black text-base leading-tight truncate" style={{ color: T.text }}>{nombreCompleto || "—"}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: T.textMuted }}>{usuario.email || "—"}</p>
              <p className="text-[11px] mt-0.5 truncate" style={{ color: T.textFaint }}>{usuario.departamento || "—"}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-0" style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : T.border}` }}>
            {[
              { label: "Número",       val: perfil.num_empleado || "—" },
              { label: "Departamento", val: perfil.departamento  || "—" },
              { label: "Rol",          val: "Administrador" },
            ].map(({ label, val }, i) => (
              <div key={label} className="px-4 py-3"
                style={{ borderRight: i < 2 ? `1px solid ${isDark ? "rgba(255,255,255,0.06)" : T.border}` : "none" }}>
                <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: T.textFaint }}>{label}</p>
                <p className="text-[12px] font-bold truncate mt-0.5" style={{ color: T.text }}>{val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── DATOS PERSONALES ── */}
        <div className="rounded-xl overflow-hidden" style={card}>
          <div className="px-5 py-3 flex items-center gap-2" style={hdr}>
            <div className="w-1 h-3.5 rounded-full" style={{ background: T.orange }} />
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Datos Personales</p>
          </div>
          <div className="px-5 py-5 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[{label:"Nombre",val:nombre,set:setNombre},{label:"Apellido Paterno",val:apPaterno,set:setApPaterno},{label:"Apellido Materno",val:apMaterno,set:setApMaterno}].map(({label,val,set}) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>{label}</span>
                  <input style={inp} value={val} onChange={e => set(e.target.value)}
                    onFocus={e => e.target.style.borderColor = T.orange}
                    onBlur={e  => e.target.style.borderColor = T.border} />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>Correo Electrónico</span>
              <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)}
                onFocus={e => e.target.style.borderColor = T.orange}
                onBlur={e  => e.target.style.borderColor = T.border} />
            </div>
          </div>
        </div>

        {/* ── CAMBIAR CONTRASEÑA ── */}
        <div className="rounded-xl overflow-hidden" style={card}>
          <div className="px-5 py-3 flex items-center gap-2" style={hdr}>
            <div className="w-1 h-3.5 rounded-full" style={{ background: T.orange }} />
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Cambiar Contraseña</p>
          </div>
          <div className="px-5 py-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>Contraseña Actual</span>
              <div className="relative">
                <input
                  className="[&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                  style={{ ...inp, paddingRight: "36px" }}
                  type={showPass.actual ? "text" : "password"}
                  value={passActual}
                  onChange={e => setPassActual(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Ingresa tu contraseña actual"
                  onFocus={e => e.target.style.borderColor = T.orange}
                  onBlur={e  => e.target.style.borderColor = T.border}
                />
                <EyeBtn show={showPass.actual} onToggle={() => setShowPass(p => ({ ...p, actual: !p.actual }))} textFaint={T.textFaint} />
              </div>
            </div>
            {[
              { label: "Nueva Contraseña",          k: "nueva", val: passNueva, set: setPassNueva },
              { label: "Confirmar Nueva Contraseña", k: "conf",  val: passConf,  set: setPassConf  },
            ].map(({ label, k, val, set }) => (
              <div key={k} className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>{label}</span>
                <div className="relative">
                  <input
                    className="[&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                    style={{ ...inp, paddingRight: "36px" }}
                    type={showPass[k] ? "text" : "password"}
                    value={val}
                    onChange={e => set(e.target.value)}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    onFocus={e => e.target.style.borderColor = T.orange}
                    onBlur={e  => e.target.style.borderColor = T.border}
                  />
                  <EyeBtn show={showPass[k]} onToggle={() => setShowPass(p => ({ ...p, [k]: !p[k] }))} textFaint={T.textFaint} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── HISTORIAL DE ACCESOS ── */}
        <div className="rounded-xl overflow-hidden" style={card}>
          <div className="px-5 py-3 flex flex-wrap items-center gap-2" style={hdr}>
            <div className="w-1 h-3.5 rounded-full" style={{ background: T.orange }} />
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Historial de Accesos</p>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: isDark ? "rgba(255,255,255,0.06)" : T.surfaceAlt, color: T.textMuted }}>
              {accesosFiltrados.length} de {accesos.length}
            </span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {/* Filtro Año */}
              <select value={anioFiltro} onChange={e => { setAnioFiltro(e.target.value); setMesFiltro("Todos"); }}
                className="text-[11px] font-semibold rounded-lg px-2 py-1 outline-none cursor-pointer"
                style={{ background: anioFiltro !== "Todos" ? (isDark ? "rgba(244,121,32,0.12)" : "rgba(244,121,32,0.08)") : (isDark ? "rgba(255,255,255,0.06)" : T.surfaceAlt), border: `1px solid ${anioFiltro !== "Todos" ? T.orange : T.border}`, color: anioFiltro !== "Todos" ? T.orange : T.text, colorScheme: isDark ? "dark" : "light" }}>
                {aniosDisponibles.map(a => <option key={a} value={a}>{a === "Todos" ? "Todos los años" : a}</option>)}
              </select>
              {/* Filtro Mes */}
              <select value={mesFiltro} onChange={e => setMesFiltro(e.target.value)}
                className="text-[11px] font-semibold rounded-lg px-2 py-1 outline-none cursor-pointer"
                style={{ background: mesFiltro !== "Todos" ? (isDark ? "rgba(244,121,32,0.12)" : "rgba(244,121,32,0.08)") : (isDark ? "rgba(255,255,255,0.06)" : T.surfaceAlt), border: `1px solid ${mesFiltro !== "Todos" ? T.orange : T.border}`, color: mesFiltro !== "Todos" ? T.orange : T.text, colorScheme: isDark ? "dark" : "light" }}>
                {mesesDisponibles.map(m => <option key={m} value={m}>{m === "Todos" ? "Todos los meses" : m}</option>)}
              </select>
              {/* Limpiar filtros */}
              {(mesFiltro !== "Todos" || anioFiltro !== "Todos") && (
                <button onClick={() => { setMesFiltro("Todos"); setAnioFiltro("Todos"); }}
                  className="text-[10px] font-bold px-2 py-1 rounded-lg transition-all hover:brightness-110"
                  style={{ background: "rgba(244,121,32,0.08)", color: T.orange, border: "1px solid rgba(244,121,32,0.2)" }}>
                  Limpiar
                </button>
              )}
              {/* Exportar PDF */}
              <button onClick={generarPDFAccesos} disabled={accesosFiltrados.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)", color: "#fff", boxShadow: "0 2px 8px rgba(220,38,38,0.3)" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path d="M14 2v6h6"/></svg>
                Exportar PDF
              </button>
            </div>
          </div>

          {/* KPIs rápidos */}
          {accesos.length > 0 && (
            <div className="grid grid-cols-4 gap-0" style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : T.border}` }}>
              {[
                { label: "Sesiones",    val: accesosFiltrados.length,                                  color: T.orange  },
                { label: "Cerradas",    val: accesosFiltrados.filter(a => a.fecha_salida).length,       color: "#16a34a" },
                { label: "Prom. dur.",  val: fmtMin(durPromedio),                                       color: "#3b82f6" },
                { label: "Más larga",   val: fmtMin(durMax),                                            color: "#8b5cf6" },
              ].map(({ label, val, color }, i) => (
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
                      style={{ color: T.textMuted, borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}` }}>
                      {col}
                    </th>
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
                  const dur     = durMin === null ? "—" : fmtMin(durMin);
                  const bgRow   = i%2===0 ? (isDark?"#141720":T.surface) : (isDark?"#1a1f2e":T.surfaceAlt);
                  return (
                    <tr key={a.id_acceso} style={{ background: bgRow, borderBottom: `1px solid ${isDark?"rgba(255,255,255,0.04)":T.border}` }}>
                      <td className="px-5 py-2.5 text-[10px] font-mono font-bold" style={{ color: T.orange }}>{a.id_acceso}</td>
                      <td className="px-5 py-2.5 text-[10px]" style={{ color: T.text }}>{fmtDT(entrada)}</td>
                      <td className="px-5 py-2.5 text-[10px]" style={{ color: salida ? "#16a34a" : T.textFaint }}>
                        {salida ? fmtDT(salida) : <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background:"rgba(244,121,32,0.12)", color:T.orange }}>Activo</span>}
                      </td>
                      <td className="px-5 py-2.5 text-[10px] font-semibold" style={{ color: T.textMuted }}>{dur}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── MENSAJE ── */}
        {msg && (
          <div className="px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2"
            style={{ background: msg.tipo === "ok" ? (isDark ? "rgba(22,163,74,0.15)" : "#dcfce7") : (isDark ? "rgba(220,38,38,0.15)" : "#fee2e2"), color: msg.tipo === "ok" ? "#16a34a" : "#dc2626", border: `1px solid ${msg.tipo === "ok" ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}` }}>
            {msg.tipo === "ok"
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            }
            {msg.texto}
          </div>
        )}

        {/* ── BOTÓN GUARDAR ── */}
        <button onClick={guardar} disabled={loading}
          className="py-3 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95 flex items-center justify-center gap-2"
          style={{ background: `linear-gradient(135deg, ${T.orange}, #d97400)`, boxShadow: "0 4px 14px rgba(244,121,32,0.35)", opacity: loading ? 0.7 : 1 }}>
          {loading
            ? <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Guardando...</>
            : "Guardar Cambios"
          }
        </button>
        <div className="pb-2" />
      </div>
    </div>

    {/* ── MODAL RECORTE ── */}
    {cropSrc && (
      <ModalRecorte
        src={cropSrc}
        isDark={isDark}
        T={T}
        onCancelar={() => setCropSrc(null)}
        onConfirmar={async (crop) => {
          const srcGuardado = cropSrc;
          setCropSrc(null);
          setSubiendoFoto(true);
          try { await procesarYSubir(srcGuardado, crop); }
          catch (e) { console.error("Error subiendo foto:", e); }
          finally { setSubiendoFoto(false); }
        }}
      />
    )}
    </>
  );
}
