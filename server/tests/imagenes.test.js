/** imagenes.test.js — Compresión de fotos y miniaturas (utils/imagenes.js). */
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import sharp from "sharp";
import { optimizar, crearMiniatura, rutaMiniatura, LADO_MAX, LADO_MINI } from "../utils/imagenes.js";

// Sin caché de sharp: en Windows deja los archivos abiertos y no se pueden borrar.
sharp.cache(false);

const dir = path.join(os.tmpdir(), `helpdesk-img-test-${process.pid}`);
/** Foto "de celular": 3000×2000 con ruido (no se comprime sola) y EXIF girado. */
async function fotoGrande(nombre, formato = "jpeg") {
  const w = 3000, h = 2000, px = Buffer.alloc(w * h * 3);
  for (let i = 0; i < px.length; i++) px[i] = (i * 7919 + (i >> 5)) % 251;
  const ruta = path.join(dir, nombre);
  let img = sharp(px, { raw: { width: w, height: h, channels: 3 } });
  img = formato === "png" ? img.png() : img.jpeg({ quality: 98 }).withMetadata({ orientation: 6 });
  await img.toFile(ruta);
  return ruta;
}

describe("compresión de imágenes", () => {
  before(() => fs.mkdirSync(dir, { recursive: true }));
  after(() => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* Windows: se borra en la siguiente limpieza de temporales */ } });

  test("una foto grande baja a 1200 px, pesa menos y conserva su formato", async () => {
    const ruta = await fotoGrande("foto.jpg");
    const r = await optimizar(ruta);
    assert.ok(r.despues < r.antes * 0.8, JSON.stringify(r));
    const m = await sharp(ruta).metadata();
    assert.equal(m.format, "jpeg");
    assert.equal(Math.max(m.width, m.height), LADO_MAX);
    // EXIF orientación 6 (girada 90°): se aplica, así que queda vertical.
    assert.ok(m.height > m.width, `${m.width}x${m.height}`);
  });

  test("si no ahorra al menos 20 % el archivo no se toca", async () => {
    const ruta = path.join(dir, "chica.jpg");
    await sharp({ create: { width: 200, height: 200, channels: 3, background: "#f47920" } }).jpeg({ quality: 70 }).toFile(ruta);
    const antes = fs.readFileSync(ruta);
    const r = await optimizar(ruta);
    assert.equal(r.despues, r.antes);
    assert.ok(fs.readFileSync(ruta).equals(antes));
  });

  test("la miniatura es WebP de 128 px en la carpeta min/", async () => {
    const ruta = await fotoGrande("otra.png", "png");
    const bytes = await crearMiniatura(ruta);
    const mini = rutaMiniatura(ruta);
    assert.equal(mini, path.join(dir, "min", "otra.webp"));
    const m = await sharp(mini).metadata();
    assert.equal(m.format, "webp");
    assert.equal(Math.max(m.width, m.height), LADO_MINI);
    assert.ok(bytes < 30 * 1024, `${bytes} bytes`);
  });
});
