/**
 * optimizar-imagenes.js — Comprime las fotos de insumos y las imágenes fijas
 * del sistema sin pérdida visible de calidad, y crea las miniaturas.
 *
 *   storage/Insumos/*            lado mayor ≤ 1200 px (el detalle las muestra a
 *                                ~500 px: sobra nitidez), JPEG/WebP calidad 90,
 *                                PNG sin pérdida (nivel 9). Se respeta la
 *                                orientación de las fotos de celular (EXIF).
 *   storage/Insumos/min/*.webp   miniatura de 128 px para listas y tablas
 *                                (se muestran a 22–64 px).
 *   client/public/assets/img/    fondo del login (≤ 2560 px, WebP 92) y logos
 *                                (≤ 600 px, PNG sin pérdida).
 *
 * Un archivo SOLO se reemplaza si el resultado pesa al menos 20 % menos; mismo nombre y
 * formato, así que la base de datos no cambia. Es seguro correrlo varias veces.
 * Haz un respaldo antes (Backups/imagenes_originales_*).
 *
 * Uso:  node server/scripts/optimizar-imagenes.js            (todo)
 *       node server/scripts/optimizar-imagenes.js --insumos  (solo insumos)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { optimizar, crearMiniatura } from "../utils/imagenes.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const INSUMOS = path.join(RAIZ, "storage/Insumos");
const PUBLICAS = path.join(RAIZ, "client/public/assets/img");
const kb = (n) => `${Math.round(n / 1024)} KB`;

async function insumos() {
  const archivos = fs.readdirSync(INSUMOS).filter(f => /\.(jpe?g|png|webp|avif|heic|heif)$/i.test(f));
  let antes = 0, despues = 0, mini = 0, cambiados = 0, errores = 0;
  for (const f of archivos) {
    const ruta = path.join(INSUMOS, f);
    try {
      const r = await optimizar(ruta);
      antes += r.antes; despues += r.despues; if (r.despues < r.antes) cambiados++;
      mini += await crearMiniatura(ruta);
    } catch (e) { errores++; console.warn(`  no se pudo procesar ${f}: ${e.message}`); }
  }
  console.log(`Fotos de insumos: ${archivos.length} (${cambiados} reducidas) · ${kb(antes)} → ${kb(despues)} · miniaturas ${kb(mini)}${errores ? ` · ${errores} con error` : ""}`);
}

async function publicas() {
  const tareas = [
    ["Fondo Precision Trucks.webp", { ladoMax: 2560, calidad: 92 }],
    ["logo.png", { ladoMax: 600 }],
    ["logo negro.png", { ladoMax: 600 }],
    ["logo blanco.png", { ladoMax: 600 }],
    ["log.png", { ladoMax: 600 }],
  ];
  for (const [f, op] of tareas) {
    const ruta = path.join(PUBLICAS, f);
    if (!fs.existsSync(ruta)) continue;
    const r = await optimizar(ruta, op);
    console.log(`${f.padEnd(30)} ${kb(r.antes)} → ${kb(r.despues)}`);
  }
}

if (process.argv[1]?.endsWith("optimizar-imagenes.js")) {
  await insumos();
  if (!process.argv.includes("--insumos")) await publicas();
}
