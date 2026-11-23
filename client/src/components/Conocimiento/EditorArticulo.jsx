/**
 * EditorArticulo.jsx
 *
 * Modal para crear o editar un artículo de la base de conocimiento (admin).
 *   - Barra de formato (negrita, títulos, listas, nota, código, enlace) que
 *     escribe Markdown en el cuadro de texto; no hace falta saber Markdown.
 *   - Imágenes: botón, pegar una captura con Ctrl+V o arrastrarla al texto.
 *   - Pestaña "Vista previa" con el mismo formato que verá el usuario.
 *   - Plantilla "Síntoma / Solución" para empezar rápido.
 *   - Publicar o guardar como borrador (el borrador solo lo ven los administradores).
 *
 * Props:
 *   T           tokens de tema
 *   categorias  [{ id_categoria, nombre_categoria }] (ámbito manual)
 *   articulo    artículo a editar (con contenido) o null para uno nuevo
 *   onClose     cierra sin guardar
 *   onGuardado  (articulo) => void, tras guardar
 *
 * Endpoints: POST/PUT /api/conocimiento/articulos, POST /api/conocimiento/imagenes
 *
 * @module client/components/Conocimiento/EditorArticulo
 * @exports EditorArticulo (default)
 */
import { useRef, useState } from "react";
import {
  BookOpen, Bold, Italic, Heading2, List, ListOrdered, Quote, Code, Link2, ImagePlus, FileText, Loader2,
} from "lucide-react";
import Modal from '../Modal.jsx';
import { apiFetch, textoError, textoExcepcion } from '../../services/api-client.js';
import { renderMarkdown } from '../../utils/markdown.js';
import { EstilosMarkdown } from './VisorArticulo.jsx';
import { RADIUS, SLATE } from '../../utils/design-system.js';
import { FS } from '../../utils/tipografia.js';

const BRAND = "#F47920";
const S = { ...SLATE, 100: "#F1F5F9", 500: "#64748B" };

const PLANTILLA = `## Síntoma
Qué ve el usuario o qué mensaje aparece.

## Solución
1. Primer paso.
2. Segundo paso.
3. Tercer paso.

> **Si no se resuelve:** crea un reporte en la Mesa de Ayuda y menciona este artículo.
`;

export default function EditorArticulo({ T, categorias, articulo, onClose, onGuardado }) {
  const isDark = T.isDark;
  const editando = !!articulo?.id_articulo;
  const [form, setForm] = useState({
    titulo:       articulo?.titulo ?? "",
    resumen:      articulo?.resumen ?? "",
    etiquetas:    articulo?.etiquetas ?? "",
    id_categoria: articulo?.id_categoria ? String(articulo.id_categoria) : "",
    contenido:    articulo?.contenido ?? "",
    publicado:    articulo?.publicado ?? true,
  });
  const [pestana, setPestana] = useState("escribir");
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const textoRef = useRef(null);
  const archivoRef = useRef(null);

  const set = (campo, valor) => { setForm(f => ({ ...f, [campo]: valor })); setErrores(e => ({ ...e, [campo]: undefined })); };

  // ── Insertar formato en la posición del cursor ──────────────────
  const reemplazarSeleccion = (fn) => {
    const ta = textoRef.current;
    const ini = ta?.selectionStart ?? form.contenido.length;
    const fin = ta?.selectionEnd ?? form.contenido.length;
    const { texto, selIni, selFin } = fn(form.contenido, ini, fin);
    set("contenido", texto);
    requestAnimationFrame(() => { if (ta) { ta.focus(); ta.setSelectionRange(selIni, selFin); } });
  };

  /** Envuelve la selección: **así** */
  const envolver = (antes, despues = antes, ejemplo = "texto") => reemplazarSeleccion((t, i, f) => {
    const sel = t.slice(i, f) || ejemplo;
    return { texto: t.slice(0, i) + antes + sel + despues + t.slice(f), selIni: i + antes.length, selFin: i + antes.length + sel.length };
  });

  /** Antepone un prefijo a cada línea seleccionada: "- ", "1. ", "> ", "## " */
  const prefijoLineas = (prefijo, numerada = false) => reemplazarSeleccion((t, i, f) => {
    const inicioLinea = t.lastIndexOf("\n", i - 1) + 1;
    const bloque = t.slice(inicioLinea, f) || "texto";
    const nuevo = bloque.split("\n").map((l, n) => (numerada ? `${n + 1}. ` : prefijo) + l).join("\n");
    return { texto: t.slice(0, inicioLinea) + nuevo + t.slice(Math.max(f, inicioLinea)), selIni: inicioLinea, selFin: inicioLinea + nuevo.length };
  });

  const insertar = (fragmento) => reemplazarSeleccion((t, i, f) => {
    const antes = i > 0 && t[i - 1] !== "\n" ? "\n" : "";
    const txt = antes + fragmento + "\n";
    return { texto: t.slice(0, i) + txt + t.slice(f), selIni: i + txt.length, selFin: i + txt.length };
  });

  const enlace = () => {
    const url = window.prompt("Dirección del enlace (https://…)", "https://");
    if (url && url !== "https://") envolver("[", `](${url.trim()})`, "texto del enlace");
  };

  // ── Imágenes ────────────────────────────────────────────────────
  const subirImagen = async (archivo) => {
    if (!archivo || !archivo.type.startsWith("image/")) return;
    if (archivo.size > 5 * 1024 * 1024) { setErrorGeneral("La imagen supera el límite de 5 MB."); return; }
    setSubiendo(true); setErrorGeneral("");
    try {
      const fd = new FormData();
      fd.append("imagen", archivo);
      const r = await apiFetch("/api/conocimiento/imagenes", { method: "POST", body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setErrorGeneral(textoError(d, r.status, "No se pudo subir la imagen.")); return; }
      const alt = (archivo.name || "captura").replace(/\.[^.]+$/, "").replace(/[[\]]/g, "");
      insertar(`![${alt}](${d.url})`);
    } catch (e) { setErrorGeneral(textoExcepcion(e)); }
    finally { setSubiendo(false); }
  };

  const alPegar = (e) => {
    const img = [...(e.clipboardData?.files ?? [])].find(f => f.type.startsWith("image/"));
    if (img) { e.preventDefault(); subirImagen(img); }
  };
  const alSoltar = (e) => {
    const img = [...(e.dataTransfer?.files ?? [])].find(f => f.type.startsWith("image/"));
    if (img) { e.preventDefault(); subirImagen(img); }
  };

  // ── Guardar ─────────────────────────────────────────────────────
  const guardar = async () => {
    const e = {};
    if (form.titulo.trim().length < 3) e.titulo = "Escribe un título de al menos 3 caracteres";
    if (!form.id_categoria) e.id_categoria = "Elige una categoría";
    if (!form.contenido.trim()) e.contenido = "Escribe el contenido del artículo";
    if (Object.keys(e).length) { setErrores(e); if (e.contenido) setPestana("escribir"); return; }

    setGuardando(true); setErrorGeneral("");
    try {
      const body = { ...form, id_categoria: Number(form.id_categoria) };
      const r = await apiFetch(
        editando ? `/api/conocimiento/articulos/${articulo.id_articulo}` : "/api/conocimiento/articulos",
        { method: editando ? "PUT" : "POST", body }
      );
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (Array.isArray(d.errores)) setErrores(Object.fromEntries(d.errores.map(x => [x.campo, x.mensaje])));
        setErrorGeneral(textoError(d, r.status, "No se pudo guardar el artículo."));
        return;
      }
      onGuardado(d.articulo);
    } catch (err) { setErrorGeneral(textoExcepcion(err)); }
    finally { setGuardando(false); }
  };

  // ── Estilos ─────────────────────────────────────────────────────
  const borde = isDark ? "rgba(255,255,255,0.12)" : S[200];
  const campo = (err) => ({
    width: "100%", padding: "9px 12px", borderRadius: RADIUS.sm, fontSize: FS.cuerpo, fontFamily: "inherit",
    background: isDark ? "rgba(255,255,255,0.04)" : "#fff", color: isDark ? "#e6edf3" : S[700],
    border: `1px solid ${err ? "#ef4444" : borde}`, outline: "none",
  });
  const etiqueta = { display: "block", fontSize: FS.secundario, fontWeight: 700, color: isDark ? "rgba(255,255,255,0.7)" : S[600], marginBottom: 5 };
  const ayuda = { fontSize: FS.etiqueta, color: isDark ? "rgba(255,255,255,0.4)" : S[400], marginTop: 4 };
  const err = (c) => errores[c] && <p role="alert" style={{ color: "#ef4444", fontSize: FS.secundario, marginTop: 4 }}>{errores[c]}</p>;

  const herramientas = [
    { icon: Bold,        label: "Negrita",          fn: () => envolver("**", "**", "texto importante") },
    { icon: Italic,      label: "Cursiva",          fn: () => envolver("*", "*", "texto") },
    { icon: Heading2,    label: "Subtítulo",        fn: () => prefijoLineas("## ") },
    { icon: List,        label: "Lista",            fn: () => prefijoLineas("- ") },
    { icon: ListOrdered, label: "Pasos numerados",  fn: () => prefijoLineas("", true) },
    { icon: Quote,       label: "Nota importante",  fn: () => prefijoLineas("> ") },
    { icon: Code,        label: "Código o comando", fn: () => envolver("`", "`", "ipconfig /all") },
    { icon: Link2,       label: "Enlace",           fn: enlace },
    { icon: ImagePlus,   label: "Imagen",           fn: () => archivoRef.current?.click() },
  ];

  const pestanaBtn = (id, texto) => (
    <button type="button" role="tab" aria-selected={pestana === id} onClick={() => setPestana(id)} style={{
      padding: "6px 12px", fontSize: FS.secundario, fontWeight: 700, cursor: "pointer", background: "none",
      border: "none", borderBottom: `2px solid ${pestana === id ? BRAND : "transparent"}`,
      color: pestana === id ? BRAND : (isDark ? "rgba(255,255,255,0.5)" : S[500]),
    }}>{texto}</button>
  );

  return (
    <Modal
      T={T}
      title={editando ? "Editar artículo" : "Nuevo artículo"}
      subtitle="Base de conocimiento"
      icon={<BookOpen size={16} />}
      onClose={onClose}
      onConfirm={guardar}
      confirmLabel={form.publicado ? (editando ? "Guardar y publicar" : "Publicar") : "Guardar borrador"}
      loading={guardando}
      maxWidth="920px"
      closeOnOverlay={false}
    >
      <EstilosMarkdown />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={etiqueta} htmlFor="kb-titulo">Título *</label>
          <input id="kb-titulo" style={campo(errores.titulo)} value={form.titulo} maxLength={200}
            onChange={e => set("titulo", e.target.value)} placeholder="Ej.: La impresora no imprime" />
          <p style={ayuda}>Escríbelo como lo diría el usuario: así lo encuentra al buscar.</p>
          {err("titulo")}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          <div>
            <label style={etiqueta} htmlFor="kb-cat">Categoría *</label>
            <select id="kb-cat" style={campo(errores.id_categoria)} value={form.id_categoria} onChange={e => set("id_categoria", e.target.value)}>
              <option value="">Elige una categoría…</option>
              {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>)}
            </select>
            {err("id_categoria")}
          </div>
          <div>
            <label style={etiqueta} htmlFor="kb-tags">Palabras clave</label>
            <input id="kb-tags" style={campo(errores.etiquetas)} value={form.etiquetas ?? ""} maxLength={255}
              onChange={e => set("etiquetas", e.target.value)} placeholder="impresora, toner, atasco" />
            <p style={ayuda}>Separadas por coma. Incluye sinónimos que la gente usa.</p>
            {err("etiquetas")}
          </div>
        </div>

        <div>
          <label style={etiqueta} htmlFor="kb-resumen">Resumen</label>
          <input id="kb-resumen" style={campo(errores.resumen)} value={form.resumen ?? ""} maxLength={300}
            onChange={e => set("resumen", e.target.value)} placeholder="Una línea que explique de qué trata" />
          {err("resumen")}
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap", borderBottom: `1px solid ${borde}`, marginBottom: 8 }}>
            <div role="tablist" style={{ display: "flex" }}>
              {pestanaBtn("escribir", "Escribir")}
              {pestanaBtn("vista", "Vista previa")}
            </div>
            {!form.contenido.trim() && (
              <button type="button" onClick={() => set("contenido", PLANTILLA)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: FS.secundario, fontWeight: 700, color: BRAND, background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
                <FileText size={12} /> Usar plantilla Síntoma / Solución
              </button>
            )}
          </div>

          {pestana === "escribir" ? (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                {herramientas.map(({ icon: Icon, label, fn }) => (
                  <button key={label} type="button" onClick={fn} title={label} aria-label={label}
                    disabled={label === "Imagen" && subiendo}
                    style={{ width: 32, height: 30, borderRadius: RADIUS.sm, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: isDark ? "rgba(255,255,255,0.05)" : S[100], border: `1px solid ${borde}`, color: isDark ? "rgba(255,255,255,0.75)" : S[600] }}>
                    {label === "Imagen" && subiendo ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
                  </button>
                ))}
                <input ref={archivoRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden
                  onChange={e => { subirImagen(e.target.files?.[0]); e.target.value = ""; }} />
              </div>
              <textarea
                ref={textoRef} value={form.contenido} onChange={e => set("contenido", e.target.value)}
                onPaste={alPegar} onDrop={alSoltar} onDragOver={e => e.preventDefault()}
                aria-label="Contenido del artículo"
                placeholder={"Explica la solución paso a paso.\nPuedes pegar capturas de pantalla con Ctrl+V."}
                style={{ ...campo(errores.contenido), minHeight: 300, resize: "vertical", fontFamily: "Consolas, 'Courier New', monospace", lineHeight: 1.6 }}
              />
              <p style={ayuda}>Pega capturas con Ctrl+V o arrástralas aquí (máx. 5 MB). Usa la barra para dar formato.</p>
              {err("contenido")}
            </>
          ) : (
            <div style={{ minHeight: 300, maxHeight: 460, overflowY: "auto", padding: "14px 18px", borderRadius: RADIUS.sm, border: `1px solid ${borde}`, background: isDark ? "rgba(255,255,255,0.02)" : "#fff" }}>
              {form.contenido.trim()
                ? <div className="kb-md" style={{ color: isDark ? "#e6edf3" : S[700] }} dangerouslySetInnerHTML={{ __html: renderMarkdown(form.contenido) }} />
                : <p style={{ ...ayuda, fontSize: FS.cuerpo }}>Aún no hay contenido.</p>}
            </div>
          )}
        </div>

        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: "10px 12px", borderRadius: RADIUS.sm, border: `1px solid ${borde}`, background: isDark ? "rgba(255,255,255,0.03)" : S[100] }}>
          <input type="checkbox" checked={form.publicado} onChange={e => set("publicado", e.target.checked)} style={{ marginTop: 2, accentColor: BRAND }} />
          <span>
            <span style={{ display: "block", fontSize: FS.cuerpo, fontWeight: 700, color: isDark ? "#e6edf3" : S[700] }}>Publicado</span>
            <span style={{ display: "block", fontSize: FS.secundario, color: isDark ? "rgba(255,255,255,0.45)" : S[500] }}>
              {form.publicado ? "Todos los empleados lo pueden ver y encontrar." : "Borrador: solo lo ven los administradores."}
            </span>
          </span>
        </label>

        {errorGeneral && <p role="alert" style={{ color: "#ef4444", fontSize: FS.cuerpo, margin: 0 }}>{errorGeneral}</p>}
      </div>
    </Modal>
  );
}
