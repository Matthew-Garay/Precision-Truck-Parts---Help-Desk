/** markdown.test.js — Artículos de la base de conocimiento: formato y seguridad. */
import { describe, test, expect } from "vitest";
import { renderMarkdown, textoPlano } from "../src/utils/markdown.js";
import { partesResaltadas, normalizar } from "../src/utils/resaltar.js";

describe("renderMarkdown", () => {
  test("títulos, párrafos, negrita, cursiva y código", () => {
    const html = renderMarkdown("# Paso 1\nAbre **Inicio** y *Configuración*.\nLuego escribe `ipconfig`.");
    expect(html).toContain("<h2>Paso 1</h2>");
    expect(html).toContain("<strong>Inicio</strong>");
    expect(html).toContain("<em>Configuración</em>");
    expect(html).toContain("<code>ipconfig</code>");
    expect(html).toContain("<br>");
  });

  test("listas con viñetas y numeradas, nota y separador", () => {
    const html = renderMarkdown("- uno\n- dos\n\n1. primero\n2. segundo\n\n> **Nota:** importante\n\n---");
    expect(html).toMatch(/<ul><li>uno<\/li><li>dos<\/li><\/ul>/);
    expect(html).toMatch(/<ol><li>primero<\/li><li>segundo<\/li><\/ol>/);
    expect(html).toContain("<blockquote><strong>Nota:</strong> importante</blockquote>");
    expect(html).toContain("<hr>");
  });

  test("el bloque de código no recibe formato", () => {
    const html = renderMarkdown("```\nnet use **Z:** \\\\servidor\n```");
    expect(html).toContain("<pre><code>net use **Z:** \\\\servidor</code></pre>");
  });

  test("imágenes internas y enlaces externos en pestaña nueva", () => {
    const html = renderMarkdown("![captura](/storage/Conocimiento/kb_1.png) [Zoho](https://mail.zoho.com)");
    expect(html).toContain('<img src="/storage/Conocimiento/kb_1.png" alt="captura" loading="lazy">');
    expect(html).toContain('<a href="https://mail.zoho.com" target="_blank" rel="noopener noreferrer">Zoho</a>');
  });

  test("no permite HTML ni enlaces peligrosos", () => {
    const html = renderMarkdown('<script>alert(1)</script><img src=x onerror=alert(1)> [clic](javascript:alert(1)) ![x](data:image/png;base64,AAA)');
    // Se revisa el DOM resultante: el HTML del usuario queda como TEXTO visible.
    const div = document.createElement("div");
    div.innerHTML = html;
    expect(div.querySelectorAll("script, img, a").length).toBe(0);
    const attrs = [...div.querySelectorAll("*")].flatMap(el => [...el.attributes].map(a => a.name));
    expect(attrs.filter(a => a.startsWith("on"))).toEqual([]);
    expect(div.textContent).toContain("<script>alert(1)</script>");
    expect(div.textContent).toContain("clic");
  });

  test("guiones bajos dentro de palabras no se vuelven cursiva", () => {
    expect(renderMarkdown("archivo mi_archivo_final.txt")).not.toContain("<em>");
  });
});

describe("textoPlano", () => {
  test("quita el formato y recorta en palabra completa", () => {
    expect(textoPlano("# Título\n**Abre** [la guía](/x) ![img](/y.png)")).toBe("Título Abre la guía");
    expect(textoPlano("palabra ".repeat(50), 20)).toBe("palabra palabra…");
  });
});

describe("resaltar coincidencias", () => {
  test("ignora acentos y mayúsculas", () => {
    expect(normalizar("Tóner").length).toBe(5);
    expect(partesResaltadas("Cambiar el Tóner", "toner")).toEqual([
      { texto: "Cambiar el ", marca: false },
      { texto: "Tóner", marca: true },
    ]);
  });
  test("sin búsqueda devuelve el texto completo", () => {
    expect(partesResaltadas("hola", "")).toEqual([{ texto: "hola", marca: false }]);
  });
});
