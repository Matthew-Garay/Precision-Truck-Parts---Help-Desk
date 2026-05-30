import { useState, useRef } from "react";

// -- EyeBtn ----------------------------------------------------
export function EyeBtn({ show, onToggle, textFaint }) {
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

// -- Estilos compartidos ---------------------------------------
export function usePerfilStyles(T, isDark) {
  return {
    card: {
      background: isDark ? "#141720" : T.surface,
      border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}`,
      boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 1px 6px rgba(0,0,0,0.06)",
    },
    hdr: {
      borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}`,
      background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt,
    },
    inp: {
      background: isDark ? "rgba(255,255,255,0.05)" : T.surfaceAlt,
      border: `1px solid ${T.border}`,
      color: T.text,
      borderRadius: "8px",
      padding: "8px 12px",
      fontSize: "13px",
      outline: "none",
      width: "100%",
      transition: "border-color 0.15s",
    },
  };
}

// -- Modal de recorte de foto ----------------------------------
export function ModalRecorte({ src, isDark, T, onCancelar, onConfirmar }) {
  const SIZE = 260;
  const [zoom,   setZoom]   = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imgNat, setImgNat] = useState(null);
  const dragging = useRef(false);
  const lastPos  = useRef({ x: 0, y: 0 });

  const clamp    = (val, min, max) => Math.min(Math.max(val, min), max);
  const clampOff = (ox, oy, nat, z) => ({
    x: clamp(ox, SIZE - nat.w * z, 0),
    y: clamp(oy, SIZE - nat.h * z, 0),
  });

  const onLoad = e => {
    const nat = { w: e.target.naturalWidth, h: e.target.naturalHeight };
    const z   = Math.max(SIZE / nat.w, SIZE / nat.h);
    setImgNat(nat);
    setZoom(z);
    setOffset({ x: (SIZE - nat.w * z) / 2, y: (SIZE - nat.h * z) / 2 });
  };

  const applyZoom = newZ => {
    if (!imgNat) return;
    const minZ = Math.max(SIZE / imgNat.w, SIZE / imgNat.h);
    const z = clamp(newZ, minZ, minZ * 4);
    setZoom(z);
    setOffset(o => clampOff(o.x, o.y, imgNat, z));
  };

  const onMouseDown  = e => { e.preventDefault(); dragging.current = true; lastPos.current = { x: e.clientX, y: e.clientY }; };
  const onTouchStart = e => { dragging.current = true; lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onMove = (cx, cy) => {
    if (!dragging.current || !imgNat) return;
    const dx = cx - lastPos.current.x, dy = cy - lastPos.current.y;
    lastPos.current = { x: cx, y: cy };
    setOffset(o => clampOff(o.x + dx, o.y + dy, imgNat, zoom));
  };

  const confirmar = () => {
    if (!imgNat) return;
    const scale = 1 / zoom;
    onConfirmar({ x: Math.round(-offset.x * scale), y: Math.round(-offset.y * scale), size: Math.round(SIZE * scale) });
  };

  const minZoom = imgNat ? Math.max(SIZE / imgNat.w, SIZE / imgNat.h) : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.8)" }}
      onMouseMove={e => onMove(e.clientX, e.clientY)} onMouseUp={() => { dragging.current = false; }}
      onTouchMove={e => onMove(e.touches[0].clientX, e.touches[0].clientY)} onTouchEnd={() => { dragging.current = false; }}>
      <div className="rounded-2xl flex flex-col gap-4 p-5"
        style={{ background: isDark ? "#141720" : T.surface, border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : T.border}`, width: "320px" }}>
        <p className="text-sm font-black" style={{ color: T.text }}>Ajustar foto de perfil</p>
        <div className="relative mx-auto overflow-hidden rounded-full cursor-grab active:cursor-grabbing select-none"
          style={{ width: SIZE, height: SIZE, background: "#111" }}
          onMouseDown={onMouseDown} onTouchStart={onTouchStart}>
          {imgNat && (
            <img src={src} alt="crop" draggable={false}
              style={{ position: "absolute", left: offset.x, top: offset.y,
                width: imgNat.w * zoom, height: imgNat.h * zoom, pointerEvents: "none" }} />
          )}
          {!imgNat && <img src={src} alt="" onLoad={onLoad} style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} />}
          <div className="absolute inset-0 rounded-full pointer-events-none" style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)" }} />
          <div className="absolute inset-0 rounded-full pointer-events-none" style={{ border: "2px solid rgba(255,255,255,0.5)" }} />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold select-none" style={{ color: T.textFaint }}>−</span>
          <input type="range" min={minZoom} max={minZoom * 4} step={0.001} value={zoom}
            onChange={e => applyZoom(parseFloat(e.target.value))}
            className="flex-1" style={{ accentColor: T.orange }} />
          <span className="text-sm font-bold select-none" style={{ color: T.textFaint }}>+</span>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancelar} className="flex-1 py-2 rounded-xl text-sm font-bold"
            style={{ background: isDark ? "rgba(255,255,255,0.07)" : T.surfaceAlt, color: T.textMuted }}>
            Cancelar
          </button>
          <button onClick={confirmar} className="flex-1 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: `linear-gradient(135deg,${T.orange},#d97400)` }}>
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}

// -- Recortar con canvas y subir foto -------------------------
export function procesarYSubirFoto(src, crop, idEmpleado, onSuccess) {
  const idSeguro = parseInt(idEmpleado, 10);
  if (isNaN(idSeguro)) return Promise.reject(new Error("ID de empleado invalido"));

  // URL completamente estatica — no depende de input del usuario
  const UPLOAD_PATH = `/api/auth/perfil/${idSeguro}/foto`;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const OUT = 400;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = OUT;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, OUT, OUT);
      ctx.drawImage(
        img,
        Math.max(0, crop.x), Math.max(0, crop.y),
        Math.max(1, crop.size), Math.max(1, crop.size),
        0, 0, OUT, OUT
      );
      canvas.toBlob(async blob => {
        if (!blob) { reject(new Error("canvas.toBlob fallo")); return; }
        try {
          const token = sessionStorage.getItem("token");
          const fd = new FormData();
          fd.append("foto", blob, "foto.jpg");
          const res = await fetch(UPLOAD_PATH, {
            method: "POST",
            headers: {
              "x-requested-with": "XMLHttpRequest",
              ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            },
            body: fd,
          });
          const data = await res.json();
          if (res.ok && data.foto) onSuccess(data.foto);
          resolve();
        } catch (e) { reject(e); }
      }, "image/jpeg", 0.9);
    };
    img.onerror = reject;
    img.src = src;
  });
}

// -- Generador de PDF de accesos -------------------------------
export function generarPDFAccesos({ accesos, usuario, mesFiltro = "Todos", anioFiltro = "Todos" }) {
  const origin = window.location.origin;
  const nombreCompleto = [usuario.nombre, usuario.ap_paterno, usuario.ap_materno].filter(Boolean).join(" ");

  const fmtDT = d => d
    ? `${new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" })} ${new Date(d).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`
    : "-";
  const fmtMin = m => m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;

  const duraciones = accesos
    .filter(a => a.fecha_entrada && a.fecha_salida)
    .map(a => Math.round((new Date(a.fecha_salida) - new Date(a.fecha_entrada)) / 60000));
  const durPromedio = duraciones.length > 0 ? Math.round(duraciones.reduce((s, d) => s + d, 0) / duraciones.length) : 0;
  const durMax      = duraciones.length > 0 ? Math.max(...duraciones) : 0;

  const periodoLabel = [mesFiltro !== "Todos" ? mesFiltro : "", anioFiltro !== "Todos" ? anioFiltro : ""].filter(Boolean).join(" ") || "Todos";

  const filas = accesos.map((a, i) => {
    const entrada = a.fecha_entrada ? new Date(a.fecha_entrada) : null;
    const salida  = a.fecha_salida  ? new Date(a.fecha_salida)  : null;
    const durMin  = entrada && salida ? Math.round((salida - entrada) / 60000) : null;
    const dur     = durMin === null ? "-" : fmtMin(durMin);
    return `
      <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f9fafb"}">
        <td style="padding:6px 12px;font-family:monospace;font-weight:700;color:#F47920;font-size:10px">${a.id_acceso}</td>
        <td style="padding:6px 12px;font-size:10px;color:#1D1D1B">${fmtDT(entrada)}</td>
        <td style="padding:6px 12px;font-size:10px;color:${salida ? "#16a34a" : "#ea580c"}">${salida ? fmtDT(salida) : "<span style='font-size:9px;font-weight:700;background:#fff7ed;color:#ea580c;padding:1px 6px;border-radius:10px;border:1px solid #fed7aa'>Activo</span>"}</td>
        <td style="padding:6px 12px;font-size:10px;color:#6b7280;font-weight:600">${dur}</td>
      </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/>
<title>Historial de Accesos - ${nombreCompleto}</title>
<style>
  @page{size:letter portrait;margin:10mm 12mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1D1D1B;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .hdr{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:3px solid #F47920;margin-bottom:12px}
  .hdr-logo{height:48px;object-fit:contain}
  .hdr-center{flex:1;text-align:center}
  .hdr-sub{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.18em;color:#9ca3af}
  .hdr-title{font-size:14px;font-weight:900;color:#1D1D1B;margin-top:2px}
  .hdr-date{font-size:7.5px;color:#9ca3af}
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px}
  .kpi{background:#f8fafc;border:1.5px solid #e5e7eb;border-radius:7px;padding:8px 12px}
  .kpi-lbl{font-size:7px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin-bottom:3px}
  .kpi-val{font-size:20px;font-weight:900;line-height:1}
  .info-box{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px}
  .info-item{background:#f8fafc;border:1.5px solid #e5e7eb;border-radius:7px;padding:8px 12px}
  .info-lbl{font-size:7px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin-bottom:3px}
  .info-val{font-size:13px;font-weight:800;color:#1D1D1B}
  table{width:100%;border-collapse:collapse;border:1.5px solid #e5e7eb;border-radius:8px;overflow:hidden}
  thead tr{background:#f8fafc}
  th{text-align:left;padding:8px 12px;font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.12em;color:#6b7280;border-bottom:1.5px solid #e5e7eb}
  tbody tr{border-bottom:1px solid #f1f5f9}
  .ftr{background:#1D1D1B;border-radius:8px;margin-top:14px;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .ftr-brand{font-size:10px;font-weight:900;color:#F47920}
  .ftr-sub{font-size:7px;color:rgba(255,255,255,0.4);margin-top:2px}
  .ftr-logo{height:22px;object-fit:contain;filter:brightness(0) invert(1);opacity:.5}
  .ftr-date{font-size:7.5px;color:rgba(255,255,255,0.4);text-align:right}
</style></head><body>
<div class="hdr">
  <img src="${origin}/assets/img/logo negro.png" class="hdr-logo" alt="PTP"/>
  <div class="hdr-center">
    <div class="hdr-sub">Precision Truck Parts &amp; Accessories</div>
    <div class="hdr-title">Historial de Accesos al Sistema</div>
  </div>
  <div style="text-align:right">
    <div class="hdr-date">Generado: ${new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}</div>
    <div class="hdr-date">${new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</div>
  </div>
</div>
<div class="info-box">
  <div class="info-item"><div class="info-lbl">Empleado</div><div class="info-val">${nombreCompleto || "-"}</div></div>
  <div class="info-item"><div class="info-lbl">N° Empleado</div><div class="info-val">${usuario.num_empleado || "-"}</div></div>
  <div class="info-item"><div class="info-lbl">Departamento</div><div class="info-val">${usuario.departamento || "-"}</div></div>
  <div class="info-item"><div class="info-lbl">Período</div><div class="info-val" style="color:#F47920">${periodoLabel}</div></div>
</div>
<div class="kpis">
  <div class="kpi"><div class="kpi-lbl">Total sesiones</div><div class="kpi-val" style="color:#F47920">${accesos.length}</div></div>
  <div class="kpi"><div class="kpi-lbl">Sesiones cerradas</div><div class="kpi-val" style="color:#16a34a">${accesos.filter(a => a.fecha_salida).length}</div></div>
  <div class="kpi"><div class="kpi-lbl">Duración promedio</div><div class="kpi-val" style="color:#3b82f6;font-size:14px">${fmtMin(durPromedio)}</div></div>
  <div class="kpi"><div class="kpi-lbl">Sesión más larga</div><div class="kpi-val" style="color:#8b5cf6;font-size:14px">${fmtMin(durMax)}</div></div>
</div>
<table>
  <thead><tr><th>#</th><th>Entrada</th><th>Salida</th><th>Duración</th></tr></thead>
  <tbody>${filas || "<tr><td colspan='4' style='padding:20px;text-align:center;color:#9ca3af;font-size:11px'>Sin registros</td></tr>"}</tbody>
</table>
<div class="ftr">
  <div><div class="ftr-brand">Precision Truck Parts &amp; Accessories</div><div class="ftr-sub">Sistema HelpDesk · Documento de uso interno</div></div>
  <img src="${origin}/assets/img/logo blanco.png" class="ftr-logo" alt="PTP"/>
  <div class="ftr-date">${new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}<br/>${new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</div>
</div>
<script>window.onload=function(){window.print();}<\/script>
</body></html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) { alert("Permite ventanas emergentes para generar el reporte."); return; }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
