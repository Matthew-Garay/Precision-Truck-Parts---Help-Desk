/**
 * inactividad.js — Cierre de sesión por inactividad (computadoras compartidas).
 *
 * La sesión vive en localStorage (se comparte entre pestañas y ventanas de
 * impresión). Para que quien llegue después a la misma computadora no entre
 * con la sesión del anterior, se guarda la hora de la última actividad
 * (mouse, teclado, toque o scroll) en "_ultima_actividad", compartida por
 * todas las pestañas. Si pasan MINUTOS_INACTIVIDAD sin actividad en ninguna
 * pestaña, la sesión se cierra; un minuto antes se muestra un aviso.
 *
 * @module client/utils/inactividad
 */
import { useEffect, useRef, useState } from "react";

export const MINUTOS_INACTIVIDAD = 30;          // usuarios (computadoras compartidas)
export const MINUTOS_INACTIVIDAD_ADMIN = 480;   // administradores: una jornada (dejan el panel abierto)
/** Minutos de inactividad permitidos según el rol guardado en la sesión. */
export const minutosPara = (usuario) => (usuario?.rol === "admin" ? MINUTOS_INACTIVIDAD_ADMIN : MINUTOS_INACTIVIDAD);
const LIMITE_MS   = MINUTOS_INACTIVIDAD * 60 * 1000;
const AVISO_MS    = 60 * 1000;          // aviso 1 minuto antes de cerrar
const CLAVE       = "_ultima_actividad";
const CADA_MS     = 15 * 1000;          // revisión periódica
const GUARDAR_MS  = 20 * 1000;          // no escribir en storage en cada movimiento

const leer = () => {
  try { return Number(localStorage.getItem(CLAVE)) || 0; } catch { return 0; }
};
export const marcarActividad = () => {
  try { localStorage.setItem(CLAVE, String(Date.now())); } catch { /* sin storage */ }
};
export const borrarActividad = () => {
  try { localStorage.removeItem(CLAVE); } catch { /* sin storage */ }
};

/** true si hay una marca de actividad y ya pasó el límite. */
export const vencidaPorInactividad = (ahora = Date.now(), limiteMs = LIMITE_MS) => {
  const ultima = leer();
  return ultima > 0 && ahora - ultima > limiteMs;
};

/**
 * Al abrir la app: si la sesión guardada lleva más de 30 min sin uso, se borra
 * ANTES de mostrar cualquier pantalla (sin parpadeo del panel del anterior).
 */
export function limpiarSesionInactiva() {
  let usuario = null;
  try { usuario = JSON.parse(localStorage.getItem("usuario") || "null"); } catch { /* sin sesión */ }
  if (!vencidaPorInactividad(Date.now(), minutosPara(usuario) * 60 * 1000)) return false;
  try {
    ["_tk", "usuario", "id_acceso", CLAVE].forEach(k => localStorage.removeItem(k));
  } catch { /* sin storage */ }
  return true;
}

const EVENTOS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel"];

/**
 * Vigila la actividad mientras hay sesión.
 * @param {boolean}  activo     hay usuario con sesión
 * @param {Function} onExpirar  se llama al vencer (cerrar sesión)
 * @returns {{ segundosRestantes: number|null, seguir: Function }}
 *   segundosRestantes ≠ null durante el último minuto (para el aviso).
 */
export function useCierreInactividad(activo, onExpirar, minutos = MINUTOS_INACTIVIDAD) {
  const limiteMs = minutos * 60 * 1000;
  const [restante, setRestante] = useState(null);
  const ultimoGuardado = useRef(0);
  const expirarRef = useRef(onExpirar);
  expirarRef.current = onExpirar;

  useEffect(() => {
    if (!activo) { setRestante(null); return; }
    // Al iniciar sesión (o abrir la app con sesión vigente) se arranca el reloj.
    if (!leer()) marcarActividad();

    const registrar = () => {
      const ahora = Date.now();
      if (ahora - ultimoGuardado.current < GUARDAR_MS) return;
      ultimoGuardado.current = ahora;
      marcarActividad();
    };
    const revisar = () => {
      const falta = limiteMs - (Date.now() - leer());
      if (falta <= 0) { setRestante(null); expirarRef.current?.(); return; }
      setRestante(falta <= AVISO_MS ? Math.ceil(falta / 1000) : null);
    };

    EVENTOS.forEach(e => window.addEventListener(e, registrar, { passive: true }));
    const id = setInterval(revisar, CADA_MS);
    // Durante el aviso se revisa cada segundo para la cuenta regresiva.
    const idAviso = setInterval(() => { if (limiteMs - (Date.now() - leer()) <= AVISO_MS) revisar(); }, 1000);
    revisar();
    return () => {
      EVENTOS.forEach(e => window.removeEventListener(e, registrar));
      clearInterval(id);
      clearInterval(idAviso);
    };
  }, [activo, limiteMs]);

  const seguir = () => { ultimoGuardado.current = Date.now(); marcarActividad(); setRestante(null); };
  return { segundosRestantes: restante, seguir };
}
