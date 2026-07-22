// Carga .env antes de que cualquier módulo ESM use process.env
// Este archivo se pasa con --import para que corra antes de los imports
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../../.env") });
