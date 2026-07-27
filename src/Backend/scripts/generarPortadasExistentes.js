// node --import ./src/Backend/load-env.js src/Backend/scripts/generarPortadasExistentes.js
import fs   from "fs";
import path from "path";
import { generarPortada, PORTADAS_DIR } from "../utils/generarPortada.js";
import { fileURLToPath } from "url";

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const MANUALES_DIR = path.resolve(__dirname, "../../../storage/Manuales");

const pdfs = (await fs.promises.readdir(MANUALES_DIR)).filter(f => f.toLowerCase().endsWith(".pdf"));
console.log(`Generando portadas para ${pdfs.length} PDFs...`);

for (const pdf of pdfs) {
  const absPath   = path.join(MANUALES_DIR, pdf);
  const nombreBase = path.basename(pdf, ".pdf");
  process.stdout.write(`  ${pdf} ... `);
  const result = await generarPortada(absPath, nombreBase);
  console.log(result ? "✓" : "✗ error");
}
console.log("Listo.");
