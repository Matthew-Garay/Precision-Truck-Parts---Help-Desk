/**
 * PerfilShared.jsx
 *
 * Utilidades compartidas entre las vistas de perfil del administrador
 * y del usuario. Centraliza logica reutilizable para evitar duplicacion.
 *
 * Exportaciones:
 *
 * EyeBtn
 *   Boton de ojo para alternar la visibilidad de un campo de contrasena.
 *   Recibe show (boolean), onToggle (funcion) y textFaint (color).
 *
 * usePerfilStyles(T, isDark)
 *   Hook que retorna un objeto con estilos inline precalculados para
 *   los bloques card, hdr (header de seccion) e inp (input de formulario)
 *   adaptados al tema activo.
 *
 * ModalRecorte
 *   Modal de recorte circular de foto de perfil con soporte para arrastrar
 *   y hacer zoom mediante un slider. Usa canvas del navegador para calcular
 *   las coordenadas del recorte sin librerias externas.
 *   Props: src, isDark, T, onCancelar, onConfirmar(crop)
 *   donde crop = { x, y, size } en pixeles de la imagen original.
 *
 * procesarYSubirFoto(src, crop, idEmpleado, onSuccess)
 *   Recorta la imagen en un canvas 400x400, la codifica como JPEG
 *   y la sube al endpoint POST /api/auth/perfil/{id}/foto.
 *   Llama a onSuccess(rutaBD) si la subida fue exitosa.
 *
 * generarPDFAccesos({ accesos, usuario, mesFiltro, anioFiltro })
 *   Genera y abre una nueva ventana con el reporte HTML del historial
 *   de accesos formateado para impresion. Incluye KPIs de sesiones,
 *   duracion promedio y duracion maxima. Si el navegador bloquea la
 *   ventana emergente muestra un aviso temporal en pantalla.
 */
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
      fontSize: "14px",
      lineHeight: "1.35",
      fontFamily: "inherit",
      fontWeight: 500,
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
          const token = sessionStorage.getItem("_tk");
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
export function generarPDFAccesos({ usuario, fechaInicio, fechaFin }) {
  const token = sessionStorage.getItem("_tk");
  const params = new URLSearchParams();
  if (token)      params.set("token", token);
  if (fechaInicio) params.set("desde", fechaInicio);
  if (fechaFin)    params.set("hasta", fechaFin);

  const url = `/print/historial/${usuario.id_empleado}?${params.toString()}`;
  const win = window.open(url, "_blank", "width=1200,height=800");
  if (!win) {
    const aviso = document.createElement("div");
    aviso.style.cssText = "position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9999;background:#1D1D1B;color:#fff;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:700;border-left:4px solid #F47920;box-shadow:0 4px 20px rgba(0,0,0,0.4);";
    aviso.textContent = "El navegador bloqueó la ventana emergente. Permite las ventanas emergentes e intenta de nuevo.";
    document.body.appendChild(aviso);
    setTimeout(() => aviso.remove(), 5000);
  }
}
