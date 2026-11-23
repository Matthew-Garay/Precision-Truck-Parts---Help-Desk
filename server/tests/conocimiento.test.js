/**
 * conocimiento.test.js — Base de conocimiento: buscador, texto de PDF y API.
 *
 *   1. Buscador (funciones puras): acentos, palabras incompletas, orden por
 *      relevancia, palabras vacías, fragmento y número de página.
 *   2. Extracción de texto de un PDF real de 2 páginas.
 *   3. API contra la base de prueba: borradores invisibles para el usuario,
 *      búsqueda, vistas, votos, validación y el indexado de manuales PDF.
 */
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import fs   from "fs";
import os   from "os";
import path from "path";
import { prepararBD, cerrarBD, respuesta, reqAdmin } from "./_bd-prueba.js";
import { normalizar, terminos, prepararDocumento, buscar, fragmento } from "../utils/busqueda-conocimiento.js";
import { extraerTextoPdf } from "../utils/texto-pdf.js";
import { schemaArticulo } from "../middlewares/validate.js";

/** PDF mínimo válido con una línea de texto por página (Helvetica). */
function pdfDePrueba(paginas) {
  const objs = [];
  const kids = paginas.map((_, i) => `${4 + i * 2} 0 R`).join(" ");
  objs.push("<< /Type /Catalog /Pages 2 0 R >>");
  objs.push(`<< /Type /Pages /Kids [${kids}] /Count ${paginas.length} >>`);
  objs.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  for (const [i, txt] of paginas.entries()) {
    const stream = `BT /F1 18 Tf 72 720 Td (${txt}) Tj ET`;
    objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + i * 2} 0 R >>`);
    objs.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  }
  let pdf = "%PDF-1.4\n";
  const offs = [];
  objs.forEach((o, i) => { offs.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (const o of offs) pdf += `${String(o).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}

// ── 1. Buscador ────────────────────────────────────────────────────
describe("buscador de conocimiento", () => {
  const docs = [
    { tipo: "articulo", id: 1, titulo: "La impresora no imprime", resumen: "Pasos básicos", etiquetas: "toner, papel",
      nombre_categoria: "Hardware", cuerpo: "Revisa que el **tóner** esté instalado y que haya papel en la bandeja." },
    { tipo: "articulo", id: 2, titulo: "Configurar el correo en Outlook", resumen: "", etiquetas: "email",
      nombre_categoria: "Software", cuerpo: "Abre Outlook y agrega la cuenta. Si la impresora falla consulta otro artículo." },
    { tipo: "pdf", id: 7, titulo: "Manual de red", resumen: "", etiquetas: "",
      nombre_categoria: "Redes", cuerpo: "Introducción general\fConexión inalámbrica: reinicia el módem WiFi y espera dos minutos." },
  ].map(prepararDocumento);

  test("normalizar conserva el largo y quita acentos y signos", () => {
    const s = "¡Tóner AÑO-2026!";
    assert.equal(normalizar(s).length, s.length);
    assert.equal(normalizar(s), " toner ano 2026 ");
  });

  test("términos sin palabras vacías ni repetidos", () => {
    assert.deepEqual(terminos("La impresora de la oficina no imprime, la IMPRESORA"), ["impresora", "oficina", "imprime"]);
    assert.deepEqual(terminos("de la el"), []);
  });

  test("ignora acentos y encuentra palabras incompletas", () => {
    assert.equal(buscar(docs, "TONER")[0].id, 1);
    assert.equal(buscar(docs, "impre")[0].id, 1);
    assert.equal(buscar(docs, "conexion inalambrica")[0].id, 7);
  });

  test("el título pesa más que una mención en el cuerpo", () => {
    const r = buscar(docs, "impresora");
    assert.deepEqual(r.map(x => x.id), [1, 2]);
    assert.ok(r[0].puntos > r[1].puntos);
  });

  test("con 3+ términos basta la mayoría; sin coincidencias no devuelve nada", () => {
    assert.equal(buscar(docs, "impresora papel recepcion")[0].id, 1);
    assert.deepEqual(buscar(docs, "nomina vacaciones"), []);
    assert.deepEqual(buscar(docs, ""), []);
  });

  test("los PDF dicen en qué página está la coincidencia", () => {
    const [r] = buscar(docs, "módem");
    assert.equal(r.tipo, "pdf");
    assert.equal(r.pagina, 2);
    assert.match(r.fragmento, /módem WiFi/);
    assert.equal(r.cuerpo, undefined, "no se envía el texto completo");
    assert.equal(r._n, undefined);
  });

  test("el fragmento corta en palabra completa y marca los recortes", () => {
    const largo = "palabra ".repeat(60) + "objetivo " + "relleno ".repeat(60);
    const f = fragmento(largo, normalizar(largo), ["objetivo"], 80);
    assert.match(f.texto, /^… /);
    assert.match(f.texto, / …$/);
    assert.match(f.texto, /objetivo/);
    assert.doesNotMatch(f.texto, /…\s*\S*[a-z]…/);
  });

  test("el Markdown no ensucia la búsqueda con URLs", () => {
    const [d] = [prepararDocumento({ tipo: "articulo", id: 9, titulo: "x", cuerpo: "Mira [la guía](/storage/Conocimiento/kb_1.png)" })];
    assert.deepEqual(buscar([d], "storage"), []);
    assert.equal(buscar([d], "guía").length, 1);
  });
});

// ── 2. Texto de PDF ────────────────────────────────────────────────
describe("extracción de texto de PDF", () => {
  test("devuelve el texto con las páginas separadas por \\f", async () => {
    const ruta = path.join(os.tmpdir(), `kb-prueba-${process.pid}.pdf`);
    fs.writeFileSync(ruta, pdfDePrueba(["Primera pagina del manual", "Reiniciar el servidor de impresion"]));
    try {
      const txt = await extraerTextoPdf(ruta);
      const paginas = txt.split("\f");
      assert.equal(paginas.length, 2);
      assert.match(paginas[0], /Primera pagina/);
      assert.match(paginas[1], /servidor de impresion/);
    } finally { fs.unlinkSync(ruta); }
  });

  test("un archivo que no es PDF lanza error", async () => {
    const ruta = path.join(os.tmpdir(), `kb-roto-${process.pid}.pdf`);
    fs.writeFileSync(ruta, "esto no es un pdf");
    try { await assert.rejects(extraerTextoPdf(ruta)); }
    finally { fs.unlinkSync(ruta); }
  });
});

// ── 3. API ─────────────────────────────────────────────────────────
describe("API de la base de conocimiento", () => {
  let pool, kb, Conocimiento;
  const CAT = 1;
  const reqUsuario = (extra = {}) => ({ usuario: { id_empleado: 3, id_rol: 2 }, params: {}, query: {}, body: {}, headers: {}, ...extra });
  const llamar = async (fn, req) => { const r = respuesta(); await fn(req, r); return r; };
  const articulo = (extra = {}) => ({
    titulo: "Cómo cambiar el tóner", resumen: "Paso a paso", etiquetas: "impresora, toner",
    contenido: "1. Abre la tapa frontal.\n2. Retira el **cartucho** usado.", id_categoria: CAT, publicado: true, ...extra,
  });

  before(async () => {
    await prepararBD();
    pool = (await import("../config/db.js")).default;
    kb   = await import("../controllers/conocimiento-controller.js");
    Conocimiento = (await import("../services/conocimiento.js")).default;
    await pool.query("INSERT INTO categoria_ambito (id_categoria, ambito) VALUES (?, 'manual')", [CAT]);
  });
  after(cerrarBD);

  test("validación: título corto, contenido vacío y categoría faltante", () => {
    const r = schemaArticulo.safeParse({ titulo: "ab", contenido: null });
    assert.equal(r.success, false);
    const campos = r.error.issues.map(i => i.path[0]);
    assert.ok(campos.includes("titulo") && campos.includes("contenido") && campos.includes("id_categoria"));
    assert.equal(schemaArticulo.parse(articulo({ publicado: undefined })).publicado, true, "publicado por defecto");
  });

  let idBorrador, idPublicado;
  test("el borrador solo lo ve el administrador", async () => {
    let r = await llamar(kb.crearArticulo, reqAdmin({ body: articulo({ titulo: "Borrador de VPN", contenido: "Instalar FortiClient", publicado: false }) }));
    assert.equal(r.statusCode, 201, JSON.stringify(r.body));
    idBorrador = r.body.articulo.id_articulo;
    assert.equal(r.body.articulo.publicado, false);
    assert.equal(r.body.articulo.autor, "Admin Uno");

    r = await llamar(kb.obtenerArticulo, reqUsuario({ params: { id: String(idBorrador) } }));
    assert.equal(r.statusCode, 404);
    r = await llamar(kb.buscarConocimiento, reqUsuario({ queryValidado: { q: "forticlient", tipo: "todos", limite: 30 } }));
    assert.equal(r.body.resultados.length, 0);
    r = await llamar(kb.buscarConocimiento, reqAdmin({ queryValidado: { q: "forticlient", tipo: "todos", limite: 30 } }));
    assert.equal(r.body.resultados.length, 1);
  });

  test("publicar lo hace visible y buscable sin acentos", async () => {
    let r = await llamar(kb.crearArticulo, reqAdmin({ body: articulo() }));
    idPublicado = r.body.articulo.id_articulo;
    r = await llamar(kb.buscarConocimiento, reqUsuario({ queryValidado: { q: "cartucho toner", tipo: "todos", limite: 30 } }));
    assert.equal(r.body.resultados[0].id, idPublicado);
    assert.equal(r.body.resultados[0].tipo, "articulo");
    r = await llamar(kb.listarConocimiento, reqUsuario({ queryValidado: { tipo: "articulo" } }));
    assert.deepEqual(r.body.map(d => d.id), [idPublicado], "la lista del usuario no trae borradores");
    assert.equal(r.body[0].cuerpo, undefined, "la lista no manda el contenido");
  });

  test("editar cambia el índice al momento", async () => {
    let r = await llamar(kb.actualizarArticulo, reqAdmin({ params: { id: String(idBorrador) }, body: articulo({ titulo: "Conectar la VPN", contenido: "Instalar FortiClient", publicado: true }) }));
    assert.equal(r.statusCode, 200);
    r = await llamar(kb.buscarConocimiento, reqUsuario({ queryValidado: { q: "vpn", tipo: "todos", limite: 30 } }));
    assert.equal(r.body.resultados[0].id, idBorrador);
  });

  test("las vistas cuentan solo las lecturas de usuarios", async () => {
    let r = await llamar(kb.obtenerArticulo, reqUsuario({ params: { id: String(idPublicado) } }));
    assert.equal(r.statusCode, 200);
    assert.equal(r.body.vistas, 1);
    assert.match(r.body.contenido, /cartucho/);
    r = await llamar(kb.obtenerArticulo, reqAdmin({ params: { id: String(idPublicado) } }));
    assert.equal(r.body.vistas, 1);
  });

  test("un voto por empleado; puede cambiarlo", async () => {
    let r = await llamar(kb.votarArticulo, reqUsuario({ params: { id: String(idPublicado) }, body: { util: true } }));
    assert.deepEqual(r.body, { votos_util: 1, votos_no_util: 0, mi_voto: true });
    r = await llamar(kb.votarArticulo, reqUsuario({ params: { id: String(idPublicado) }, body: { util: false } }));
    assert.deepEqual(r.body, { votos_util: 0, votos_no_util: 1, mi_voto: false });
    r = await llamar(kb.obtenerArticulo, reqUsuario({ params: { id: String(idPublicado) } }));
    assert.equal(r.body.mi_voto, false);
  });

  test("categoría inexistente responde 400, no 500", async () => {
    const r = await llamar(kb.crearArticulo, reqAdmin({ body: articulo({ id_categoria: 999 }) }));
    assert.equal(r.statusCode, 400);
    assert.match(r.body.error, /categoría/);
  });

  test("los manuales PDF se indexan y se buscan por dentro, con página", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kb-manuales-"));
    fs.writeFileSync(path.join(dir, "Manual_red.pdf"), pdfDePrueba(["Indice", "Reiniciar el modem del router"]));
    await pool.query(
      "INSERT INTO manual (nombre, ruta_pdf, id_categoria) VALUES ('Manual de red', '/storage/Manuales/Manual_red.pdf', ?)", [CAT]);
    try {
      assert.equal(await Conocimiento.indexarPendientes(dir), 1);
      assert.equal(await Conocimiento.indexarPendientes(dir), 0, "no se vuelve a extraer");
      const r = await llamar(kb.buscarConocimiento, reqUsuario({ queryValidado: { q: "router", tipo: "pdf", limite: 30 } }));
      assert.equal(r.body.resultados.length, 1);
      assert.equal(r.body.resultados[0].pagina, 2);
      assert.equal(r.body.resultados[0].url, "/storage/Manuales/Manual_red.pdf");
      assert.equal(r.body.resultados[0].texto_indexado, "si");
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });

  test("eliminar quita el artículo y sus votos", async () => {
    let r = await llamar(kb.eliminarArticulo, reqAdmin({ params: { id: String(idPublicado) } }));
    assert.equal(r.statusCode, 200);
    r = await llamar(kb.obtenerArticulo, reqAdmin({ params: { id: String(idPublicado) } }));
    assert.equal(r.statusCode, 404);
    const [[{ n }]] = await pool.query("SELECT COUNT(*) n FROM articulo_voto WHERE id_articulo = ?", [idPublicado]);
    assert.equal(n, 0);
  });
});
