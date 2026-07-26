/**
 * load-env.js
 *
 * Carga las variables de entorno desde el archivo .env antes de que cualquier
 * modulo ESM del servidor las use. Este archivo se pasa con la bandera --import
 * al iniciar Node.js para garantizar que se ejecute antes de los imports.
 *
 * Uso en package.json:
 *   node --import ./src/Backend/load-env.js src/Backend/server.js
 *
 * La ruta del .env se resuelve de forma absoluta relativa a este archivo,
 * lo que garantiza que funcione independientemente del directorio de trabajo
 * desde el que se ejecute el proceso de Node.js.
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../../.env") });
