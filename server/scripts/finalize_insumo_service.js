// scripts/finalize_insumo_service.js
// Por completo actualiza el servicio insumo.js
import fs from "fs";
import path from "path";

const filePath = path.resolve(
  "D:",
  "Proyecto de Residencias-Matthew Garay",
  "PrecisionTrucks_HelpDesk",
  "server",
  "services",
  "insumo.js"
);

let content = fs.readFileSync(filePath, "utf8");

// --- 1. El check de visible_publico ya está añadido ---
// Solo verificar que exista
if (!content.includes("_tieneVisiblePublicoCheck")) {
  throw new Error("El check de visible_publico no está presente");
}

// --- 2. Actualizar getAll ---
const getAllNew = `getAll: async ({ soloActivos = false } = {}) => {
    const tieneActivo = await Insumo._tieneActivoCheck();
    const tieneVisiblePublico = await Insumo._tieneVisiblePublicoCheck();
    const colActivo = tieneActivo ? "i.activo," : "1 AS activo,";
    const whereActivo = tieneActivo && soloActivos ? "WHERE i.activo = 1" : "";
    const [rows] = await pool.query(
      \`SELECT i.id_insumo, i.num_serie, i.nombre, i.descripcion,
              i.marca, i.modelo, i.stock, i.estado,
              i.id_categoria, i.imagen_url, \${colActivo}
              c.nombre_categoria,
              \${DISPONIBILIDAD_EXPR}
       FROM insumo i
       LEFT JOIN categoria c ON i.id_categoria = c.id_categoria
       WHERE 1=1
         \${tieneActivo && soloActivos ? "AND i.activo = 1" : ""}
         \${tieneVisiblePublico ? "AND i.visible_publico = 1" : ""}
       ORDER BY i.nombre ASC\`
    );
    return rows;
  },`;

const getAllPattern =
  /getAll: async \(\) => \{[\s\S]*?ORDER BY i\.nombre ASC\`[\s\S]*?\);[\s\S]*?\n  \},/m;

if (content.match(getAllPattern)) {
  content = content.replace(getAllPattern, getAllNew);
}

// --- 3. Actualizar getDisponibles ---
const getDisponiblesNew = `getDisponibles: async () => {
    const tieneActivo = await Insumo._tieneActivoCheck();
    const tieneVisiblePublico = await Insumo._tieneVisiblePublicoCheck();
    const colActivo = tieneActivo ? "i.activo," : "1 AS activo,";
    const whereActivo = tieneActivo ? "AND i.activo = 1" : "";
    const [rows] = await pool.query(
      \`SELECT i.id_insumo, i.nombre, i.descripcion, i.marca, i.modelo,
              i.stock, i.estado, i.id_categoria, i.imagen_url, \${colActivo}
              c.nombre_categoria,
              \${DISPONIBILIDAD_EXPR}
       FROM insumo i
       LEFT JOIN categoria c ON i.id_categoria = c.id_categoria
       WHERE i.stock > 0
         \${whereActivo}
         \${tieneVisiblePublico ? "AND i.visible_publico = 1" : ""}
       ORDER BY i.nombre ASC\`
    );
    return rows;
  },`;

const getDisponiblesPattern =
  /getDisponibles: async \(\) => \{[\s\S]*?ORDER BY i\.nombre ASC\`[\s\S]*?\);[\s\S]*?\n  \},/m;

if (content.match(getDisponiblesPattern)) {
  content = content.replace(getDisponiblesPattern, getDisponiblesNew);
}

fs.writeFileSync(filePath, content);
console.log("Servicio insumo.js actualizado correctamente.");
