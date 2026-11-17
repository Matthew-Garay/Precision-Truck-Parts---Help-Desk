/**
 * tipografia.js
 *
 * Escala tipográfica ÚNICA de todo el frontend (estándar 2026-11-15,
 * reducida 1 px por nivel a petición del usuario).
 * Antes convivían 18 tamaños distintos (de 5 a 24 px) sin criterio: una
 * misma pantalla mezclaba hasta 13 tamaños. Toda pantalla nueva o modificada
 * debe usar estos tokens en lugar de números sueltos.
 *
 *   Token        px   Uso
 *   etiqueta      9   rótulos en MAYÚSCULAS, encabezados de tabla, chips, contadores
 *   secundario   10   fechas, correos, ayudas, metadatos, texto de apoyo
 *   cuerpo       11   texto general, celdas de tabla, campos de formulario
 *   enfasis      12   nombres destacados, botones principales, títulos de tarjeta
 *   subtitulo    13   títulos de modal y de sección
 *   titulo       16   título de página
 *   kpi          18   cifras grandes de indicadores (KPI, reloj, stock destacado)
 *
 * En estilos en línea:  style={{ fontSize: FS.cuerpo }}
 * En clases Tailwind:   text-[9px] · text-[9px] · text-[10px] · text-[11px] ·
 *                       text-[12px] · text-[16px] · text-[18px]
 *
 * Excepciones intencionales: hojas de impresión (components/print, pages/print),
 * los íconos "PDF" dibujados con texto y el campo del código de verificación.
 *
 * @module client/utils/tipografia
 * @exports FS
 * @exports FS_TAILWIND
 */
export const FS = Object.freeze({
  etiqueta:   9,
  secundario: 10,
  cuerpo:     11,
  enfasis:    12,
  subtitulo:  13,
  titulo:     16,
  kpi:        18,
});

/** Equivalencias en clases de Tailwind (mismos valores). */
export const FS_TAILWIND = Object.freeze({
  etiqueta:   "text-[9px]",
  secundario: "text-[9px]",
  cuerpo:     "text-[10px]",
  enfasis:    "text-[11px]",
  subtitulo:  "text-[12px]",
  titulo:     "text-[16px]",
  kpi:        "text-[18px]",
});
