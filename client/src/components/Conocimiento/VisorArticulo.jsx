/**
 * VisorArticulo.jsx
 *
 * Panel lateral que muestra un artículo de la base de conocimiento: título,
 * categoría, fecha, contenido formateado (Markdown seguro) y la pregunta
 * "¿Te sirvió?". Si el usuario responde que no, se le ofrece crear un reporte.
 *
 * Props:
 *   id              id_articulo a mostrar
 *   T               tokens de tema
 *   onClose         cierra el panel
 *   onEditar        (opcional, admin) abre el editor con el artículo cargado
 *   onCrearReporte  (opcional, usuario) navega a Nuevo Reporte
 *
 * Endpoints: GET /api/conocimiento/articulos/:id, POST /api/conocimiento/articulos/:id/voto
 *
 * @module client/components/Conocimiento/VisorArticulo
 * @exports VisorArticulo (default)
 * @exports CSS_MARKDOWN
 */
import { useEffect, useState } from "react";
import { X, BookOpen, Tag, Clock, Eye, ThumbsUp, ThumbsDown, Pencil, Send, AlertCircle } from "lucide-react";
import { apiFetch, textoError, textoExcepcion } from '../../services/api-client.js';
import { renderMarkdown } from '../../utils/markdown.js';
import { RADIUS, SLATE } from '../../utils/design-system.js';
import { FS } from '../../utils/tipografia.js';
import { fechaCorta } from '../../utils/fechas.js';
import LogoModal from '../LogoModal.jsx';

const BRAND = "#F47920";
// SLATE solo define 200-900 sin 100/500/800: se completan aquí.
const S = { ...SLATE, 100: "#F1F5F9", 500: "#64748B", 800: "#1E293B" };

/** Estilos del cuerpo del artículo (también los usa la vista previa del editor). */
export const CSS_MARKDOWN = `
/* Un poco más grande que el cuerpo de la app (FS.cuerpo = 11 px): es texto para leer. */
.kb-md { font-size: 13px; line-height: 1.7; word-wrap: break-word; }
.kb-md > :first-child { margin-top: 0; }
.kb-md h2 { font-size: 17px; font-weight: 800; margin: 26px 0 10px; }
.kb-md h3 { font-size: 15px; font-weight: 700; margin: 22px 0 8px; }
.kb-md h4 { font-size: 13px; font-weight: 700; margin: 18px 0 6px; }
.kb-md p  { margin: 0 0 12px; }
.kb-md ul, .kb-md ol { margin: 0 0 14px; padding-left: 24px; }
.kb-md ul { list-style: disc; } .kb-md ol { list-style: decimal; }
.kb-md li { margin: 4px 0; padding-left: 2px; }
.kb-md a  { color: ${BRAND}; text-decoration: underline; text-underline-offset: 2px; }
.kb-md img { display: block; max-width: 100%; height: auto; margin: 12px 0; border-radius: 8px; border: 1px solid rgba(127,127,127,0.25); }
.kb-md code { font-family: Consolas, 'Courier New', monospace; font-size: 0.9em; padding: 1px 6px; border-radius: 4px; background: rgba(127,127,127,0.15); }
.kb-md pre { margin: 0 0 14px; padding: 12px 14px; border-radius: 8px; overflow-x: auto; background: #0f172a; color: #e2e8f0; }
.kb-md pre code { padding: 0; background: none; color: inherit; font-size: 12px; }
.kb-md blockquote { margin: 0 0 14px; padding: 10px 14px; border-left: 4px solid ${BRAND}; border-radius: 0 8px 8px 0; background: rgba(244,121,32,0.08); }
.kb-md hr { border: none; border-top: 1px solid rgba(127,127,127,0.25); margin: 22px 0; }
`;

export function EstilosMarkdown() {
  return <style>{CSS_MARKDOWN}</style>;
}

function Chip({ icon: Icon, children, isDark, color }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: FS.etiqueta, fontWeight: 700, padding: "3px 8px", borderRadius: 99,
      background: color ? `${color}14` : (isDark ? "rgba(255,255,255,0.06)" : S[100]),
      color: color ?? (isDark ? "rgba(255,255,255,0.55)" : S[500]),
      border: `1px solid ${color ? `${color}33` : (isDark ? "rgba(255,255,255,0.10)" : S[200])}`,
    }}>
      {Icon && <Icon size={10} />} {children}
    </span>
  );
}

export default function VisorArticulo({ id, T, onClose, onEditar, onCrearReporte }) {
  const isDark = T.isDark;
  const [art, setArt] = useState(null);
  const [error, setError] = useState("");
  const [votando, setVotando] = useState(false);
  const [errorVoto, setErrorVoto] = useState("");

  useEffect(() => {
    let vigente = true;
    setArt(null); setError("");
    apiFetch(`/api/conocimiento/articulos/${Number(id)}`)
      .then(async r => {
        const d = await r.json().catch(() => ({}));
        if (!vigente) return;
        if (!r.ok) setError(textoError(d, r.status, "No se pudo abrir el artículo."));
        else setArt(d);
      })
      .catch(e => vigente && setError(textoExcepcion(e)));
    return () => { vigente = false; };
  }, [id]);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const votar = async (util) => {
    setVotando(true); setErrorVoto("");
    try {
      const r = await apiFetch(`/api/conocimiento/articulos/${art.id_articulo}/voto`, { method: "POST", body: { util } });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) setErrorVoto(textoError(d, r.status, "No se pudo guardar tu respuesta."));
      else setArt(a => ({ ...a, ...d }));
    } catch (e) { setErrorVoto(textoExcepcion(e)); }
    finally { setVotando(false); }
  };

  const fondo = isDark ? "#0f1117" : "#f8fafc";
  const surf = isDark ? "#141720" : "#fff";
  const borde = isDark ? "rgba(255,255,255,0.08)" : S[200];
  const texto = isDark ? "#e6edf3" : S[700];
  const tenue = isDark ? "rgba(255,255,255,0.45)" : S[500];

  const botonVoto = (util) => {
    const activo = art?.mi_voto === util;
    const color = util ? "#16a34a" : "#dc2626";
    const Icon = util ? ThumbsUp : ThumbsDown;
    return (
      <button
        type="button" disabled={votando} onClick={() => votar(util)}
        aria-pressed={activo}
        style={{
          height: 36, padding: "0 16px", borderRadius: RADIUS.sm, cursor: votando ? "wait" : "pointer",
          display: "inline-flex", alignItems: "center", gap: 6, fontSize: FS.cuerpo, fontWeight: 700,
          background: activo ? color : "transparent", color: activo ? "#fff" : color,
          border: `1.5px solid ${color}`,
        }}
      >
        <Icon size={14} /> {util ? "Sí" : "No"}
      </button>
    );
  };

  return (
    <>
      <EstilosMarkdown />
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.50)" }} />
      <div role="dialog" aria-modal="true" aria-label={art?.titulo ?? "Artículo"} style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 301, width: "min(860px,100vw)",
        display: "flex", flexDirection: "column", background: fondo,
        boxShadow: "-4px 0 32px rgba(0,0,0,0.18)", animation: "kbSlideIn .2s cubic-bezier(.16,1,.3,1)",
      }}>
        <style>{`@keyframes kbSlideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

        {/* Barra superior */}
        <div style={{ height: 54, padding: "0 16px 0 20px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10, background: "#1e293b" }}>
          <BookOpen size={15} color="rgba(255,255,255,0.6)" />
          <span style={{ flex: 1, color: "#fff", fontWeight: 600, fontSize: FS.enfasis, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {art?.titulo ?? "Artículo"}
          </span>
          {onEditar && art && (
            <button type="button" onClick={() => onEditar(art)} style={{ height: 30, padding: "0 12px", borderRadius: RADIUS.sm, display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.85)", fontSize: FS.cuerpo, fontWeight: 500, cursor: "pointer" }}>
              <Pencil size={12} /> Editar
            </button>
          )}
          <LogoModal claro alto={18} style={{ marginRight: 4 }} />
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ width: 30, height: 30, borderRadius: RADIUS.sm, background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px 16px 40px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            {error ? (
              <div style={{ display: "flex", gap: 10, alignItems: "center", padding: 16, borderRadius: 10, background: surf, border: `1px solid ${borde}`, color: "#dc2626", fontSize: FS.cuerpo }}>
                <AlertCircle size={18} /> {error}
              </div>
            ) : !art ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
                <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              </div>
            ) : (
              <>
                <article style={{ background: surf, border: `1px solid ${borde}`, borderRadius: 12, padding: "24px clamp(16px, 4vw, 36px) 28px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                    {!art.publicado && <Chip isDark={isDark} color="#d97706">Borrador — solo lo ven los administradores</Chip>}
                    {art.nombre_categoria && <Chip icon={Tag} isDark={isDark} color={BRAND}>{art.nombre_categoria}</Chip>}
                    <Chip icon={Clock} isDark={isDark}>Actualizado {fechaCorta(art.fecha_cambio)}</Chip>
                    <Chip icon={Eye} isDark={isDark}>{art.vistas} {art.vistas === 1 ? "lectura" : "lecturas"}</Chip>
                  </div>
                  <h1 style={{ fontSize: FS.titulo, fontWeight: 800, lineHeight: 1.25, color: isDark ? "#fff" : S[900], margin: "0 0 8px" }}>{art.titulo}</h1>
                  {art.resumen && <p style={{ fontSize: FS.subtitulo, color: tenue, margin: "0 0 20px" }}>{art.resumen}</p>}
                  <div className="kb-md" style={{ color: texto }} dangerouslySetInnerHTML={{ __html: renderMarkdown(art.contenido) }} />
                  {(art.autor || art.editor) && (
                    <p style={{ marginTop: 24, paddingTop: 12, borderTop: `1px solid ${borde}`, fontSize: FS.secundario, color: tenue }}>
                      {art.autor ? `Escrito por ${art.autor}` : ""}{art.editor && art.editor !== art.autor ? ` · Última edición: ${art.editor}` : ""}
                    </p>
                  )}
                </article>

                {/* ¿Te sirvió? */}
                <div style={{ marginTop: 16, padding: "16px 20px", borderRadius: 12, background: surf, border: `1px solid ${borde}`, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
                  <span style={{ flex: "1 1 220px", fontSize: FS.enfasis, fontWeight: 700, color: texto }}>
                    {art.mi_voto === true ? "¡Qué bien! Gracias por avisarnos." : art.mi_voto === false ? "Gracias. Vamos a mejorar este artículo." : "¿Te sirvió este artículo?"}
                  </span>
                  {botonVoto(true)}
                  {botonVoto(false)}
                  {art.mi_voto === false && onCrearReporte && (
                    <button type="button" onClick={onCrearReporte} style={{ flexBasis: "100%", height: 40, borderRadius: RADIUS.sm, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: `linear-gradient(135deg,${BRAND},#d97400)`, color: "#fff", fontSize: FS.cuerpo, fontWeight: 700 }}>
                      <Send size={14} /> No se resolvió: crear un reporte a Soporte
                    </button>
                  )}
                  {errorVoto && <span style={{ flexBasis: "100%", color: "#dc2626", fontSize: FS.secundario }}>{errorVoto}</span>}
                  {onEditar && (
                    <span style={{ flexBasis: "100%", fontSize: FS.secundario, color: tenue }}>
                      Respuestas: {art.votos_util} útil · {art.votos_no_util} no útil
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
