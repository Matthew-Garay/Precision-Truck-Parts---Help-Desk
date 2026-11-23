/**
 * markdown.js
 *
 * Convierte el Markdown de los artículos de la base de conocimiento en HTML
 * SEGURO. Es un subconjunto pequeño y predecible (lo que un técnico necesita
 * para escribir una guía), sin dependencias nuevas:
 *
 *   # Título / ## Subtítulo / ### Sección
 *   **negrita**  *cursiva*  `código`  [enlace](url)  ![imagen](url)
 *   - lista  /  1. lista numerada  /  > nota  /  --- separador
 *   ```bloque de código```
 *
 * Seguridad (doble barrera):
 *   1. Todo el texto se escapa ANTES de aplicar formato, y los enlaces solo
 *      aceptan http(s), mailto o rutas internas (/...). "javascript:" se descarta.
 *   2. El resultado pasa por DOMPurify con una lista cerrada de etiquetas.
 *
 * @module client/utils/markdown
 * @requires dompurify
 * @exports renderMarkdown
 * @exports textoPlano
 */
import DOMPurify from "dompurify";

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapar = (s) => String(s).replace(/[&<>"']/g, c => ESC[c]);

/** URL permitida o null. Recibe la URL ya escapada. */
function urlSegura(url) {
  const u = url.trim().replace(/&amp;/g, "&");
  if (/^(https?:\/\/|mailto:)/i.test(u) || /^\/(?!\/)/.test(u) || u.startsWith("#")) return escapar(u);
  return null;
}

/** Formato dentro de una línea. `s` ya viene escapado. */
function enLinea(s) {
  const codigos = [];
  // El código va aparte para que su contenido no reciba formato.
  s = s.replace(/`([^`]+)`/g, (_, c) => `\uE000${codigos.push(c) - 1}\uE000`);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, url) => {
    const u = urlSegura(url);
    return u ? `<img src="${u}" alt="${alt}" loading="lazy">` : alt;
  });
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, txt, url) => {
    const u = urlSegura(url);
    if (!u) return txt;
    const externo = /^(https?:)?\/\//i.test(u);
    return `<a href="${u}"${externo ? ' target="_blank" rel="noopener noreferrer"' : ""}>${txt}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, "$1<em>$2</em>");
  s = s.replace(/(^|[^\w])_([^_\s][^_]*?)_(?!\w)/g, "$1<em>$2</em>");
  return s.replace(/\uE000(\d+)\uE000/g, (_, i) => `<code>${codigos[i]}</code>`);
}

/** Markdown → HTML sin sanitizar (uso interno; usar renderMarkdown). */
function aHtml(md) {
  const lineas = String(md ?? "").replace(/\r\n?/g, "\n").split("\n");
  const out = [];
  let parrafo = [];
  let lista = null; // { tipo: "ul"|"ol", items: [] }
  let cita = [];

  const cerrarParrafo = () => { if (parrafo.length) { out.push(`<p>${parrafo.map(enLinea).join("<br>")}</p>`); parrafo = []; } };
  const cerrarLista = () => { if (lista) { out.push(`<${lista.tipo}>${lista.items.map(i => `<li>${enLinea(i)}</li>`).join("")}</${lista.tipo}>`); lista = null; } };
  const cerrarCita = () => { if (cita.length) { out.push(`<blockquote>${cita.map(enLinea).join("<br>")}</blockquote>`); cita = []; } };
  const cerrarTodo = () => { cerrarParrafo(); cerrarLista(); cerrarCita(); };

  for (let i = 0; i < lineas.length; i++) {
    const cruda = lineas[i];
    if (/^\s*```/.test(cruda)) {
      cerrarTodo();
      const cod = [];
      while (++i < lineas.length && !/^\s*```/.test(lineas[i])) cod.push(lineas[i]);
      out.push(`<pre><code>${escapar(cod.join("\n"))}</code></pre>`);
      continue;
    }
    const l = escapar(cruda);
    let m;
    if (!l.trim()) { cerrarTodo(); continue; }
    if ((m = l.match(/^\s*(#{1,3})\s+(.+)$/))) {
      cerrarTodo();
      // # → h2: el h1 es el título del artículo.
      const n = m[1].length + 1;
      out.push(`<h${n}>${enLinea(m[2].replace(/\s+#+\s*$/, ""))}</h${n}>`);
    } else if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(l)) {
      cerrarTodo(); out.push("<hr>");
    } else if ((m = l.match(/^\s*&gt;\s?(.*)$/))) {
      cerrarParrafo(); cerrarLista(); cita.push(m[1]);
    } else if ((m = l.match(/^\s*[-*+]\s+(.+)$/))) {
      cerrarParrafo(); cerrarCita();
      if (lista?.tipo !== "ul") { cerrarLista(); lista = { tipo: "ul", items: [] }; }
      lista.items.push(m[1]);
    } else if ((m = l.match(/^\s*\d+[.)]\s+(.+)$/))) {
      cerrarParrafo(); cerrarCita();
      if (lista?.tipo !== "ol") { cerrarLista(); lista = { tipo: "ol", items: [] }; }
      lista.items.push(m[1]);
    } else {
      cerrarLista(); cerrarCita(); parrafo.push(l.trim());
    }
  }
  cerrarTodo();
  return out.join("\n");
}

const PERMITIDO = {
  ALLOWED_TAGS: ["h2", "h3", "h4", "p", "br", "strong", "em", "code", "pre", "ul", "ol", "li", "blockquote", "hr", "a", "img"],
  ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "loading"],
  ALLOW_DATA_ATTR: false,
};

/** Markdown → HTML listo para dangerouslySetInnerHTML. */
export function renderMarkdown(md) {
  return DOMPurify.sanitize(aHtml(md), PERMITIDO);
}

/** Texto sin formato (para resúmenes automáticos y vistas previas cortas). */
export function textoPlano(md, max = 200) {
  const t = String(md ?? "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s*(#{1,3}|>|[-*+]|\d+[.)])\s+/gm, "")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return t.length > max ? t.slice(0, max).replace(/\s\S*$/, "") + "…" : t;
}
