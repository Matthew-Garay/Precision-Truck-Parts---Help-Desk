/**
 * video.js — Conversión y miniatura de videos de evidencias con ffmpeg.
 *
 * El binario viene del paquete `ffmpeg-static` (se puede sustituir con la
 * variable FFMPEG_PATH). Dos reglas que protegen la subida:
 *
 *   optimizarVideo(ruta)   convierte a MP4 H.264 + AAC, máximo 1280 px por lado,
 *                          con "faststart" para que reproduzca mientras carga.
 *                          Hace que .mov (HEVC de iPhone), .avi o .webm
 *                          reproduzcan en cualquier navegador. Si ffmpeg falla
 *                          o tarda más de 150 s, se CONSERVA el original: el
 *                          envío nunca se pierde por la conversión.
 *   crearPoster(ruta, jpg) guarda un fotograma para mostrar en la lista sin
 *                          cargar el video entero.
 *
 * @module server/utils/video
 */
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import ffmpegStatic from "ffmpeg-static";

const RUTA_FFMPEG = process.env.FFMPEG_PATH || ffmpegStatic;
const TIMEOUT_MS = 150_000;

/** Ejecuta ffmpeg con tiempo límite. Rechaza si sale con error o se pasa del tiempo. */
function correr(args) {
  return new Promise((resolve, reject) => {
    const p = spawn(RUTA_FFMPEG, ["-hide_banner", "-loglevel", "error", ...args], { windowsHide: true });
    let stderr = "";
    p.stderr.on("data", (d) => { stderr = (stderr + d).slice(-500); });
    const reloj = setTimeout(() => { p.kill("SIGKILL"); reject(new Error("ffmpeg: tiempo agotado")); }, TIMEOUT_MS);
    p.on("error", (e) => { clearTimeout(reloj); reject(e); });
    p.on("close", (code) => {
      clearTimeout(reloj);
      code === 0 ? resolve() : reject(new Error(stderr.trim() || `ffmpeg salió con código ${code}`));
    });
  });
}

const borrar = (ruta) => { try { fs.unlinkSync(ruta); } catch { /* ya no existe */ } };

/**
 * Devuelve la ruta final del video (puede ser la misma si no convenía cambiarlo)
 * o null si la conversión no se pudo hacer; en ese caso el original queda intacto.
 */
export async function optimizarVideo(ruta) {
  const dir = path.dirname(ruta);
  const base = path.parse(ruta).name;
  const destino = path.join(dir, `${base}.mp4`);
  const tmp = path.join(dir, `${base}_conv.mp4`);
  try {
    await correr([
      "-y", "-i", ruta,
      "-map_metadata", "-1",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "28", "-pix_fmt", "yuv420p",
      "-vf", "scale='min(1280,iw)':'min(1280,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
      "-c:a", "aac", "-b:a", "96k",
      "-movflags", "+faststart",
      tmp,
    ]);
  } catch {
    borrar(tmp);
    return null;
  }
  const nuevo = fs.statSync(tmp).size;
  const viejo = fs.statSync(ruta).size;
  // Un MP4 que ya pesa menos que la conversión se deja como está.
  if (path.extname(ruta).toLowerCase() === ".mp4" && nuevo >= viejo) {
    borrar(tmp);
    return ruta;
  }
  if (destino === ruta) borrar(ruta);
  fs.renameSync(tmp, destino);
  if (destino !== ruta) borrar(ruta);
  return destino;
}

/** Fotograma a 0,5 s (o al inicio si el video es muy corto). Devuelve true si se creó. */
export async function crearPoster(rutaVideo, rutaJpg) {
  fs.mkdirSync(path.dirname(rutaJpg), { recursive: true });
  for (const inicio of ["0.5", "0"]) {
    try {
      await correr(["-y", "-ss", inicio, "-i", rutaVideo, "-frames:v", "1",
        "-vf", "scale=480:-2", "-q:v", "4", rutaJpg]);
      if (fs.existsSync(rutaJpg)) return true;
    } catch { /* se intenta desde el inicio */ }
  }
  return false;
}
