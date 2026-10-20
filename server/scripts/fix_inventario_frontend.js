// scripts/fix_inventario_frontend.js
import fs from "fs";
import path from "path";

const filePath = path.resolve(
  "D:",
  "Proyecto de Residencias-Matthew Garay",
  "PrecisionTrucks_HelpDesk",
  "client",
  "src",
  "pages",
  "Admin",
  "Inventario.jsx"
);

let content = fs.readFileSync(filePath, "utf8");

let changes = [];

// 1. Remove duplicated option
const dup = '<li><strong style={{ color: T.text }}>Inhabilitar/Habilitar:</strong> baja lÃ³gica â€” se oculta de Salidas y solicitudes conservando su historial.</li>\n                <li><strong style={{ color: T.text }}>Inhabilitar/Habilitar:</strong> baja lÃ³gica Ã¢â‚¬â€ se oculta de Salidas y solicitudes conservando su historial.</li>';
const unique = '<li><strong style={{ color: T.text }}>Inhabilitar/Habilitar:</strong> baja lÃ³gica â€” se oculta de Salidas y solicitudes conservando su historial.</li>';
if (content.includes(dup)) {
  content = content.replace(dup, unique);
  changes.push("Eliminada opción duplicada");
}

// 2. Add Visible Publico button
const btnActivo = '                {Number(gestionar.activo ?? 1) === 0 ? "Habilitar" : "Inhabilitar"}\n              </button>';
const btnVisible = '                {Number(gestionar.activo ?? 1) === 0 ? "Habilitar" : "Inhabilitar"}\n              </button>\n              <button type="button"\n                onClick={() => { setConfirmar({ tipo: "visible_publico", row: gestionar, busy: false }); setGestionar(null); }}\n                style={{ padding: "6px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, border: "none", color: "#fff",\n                  background: Number(gestionar.visible_publico ?? 1) === 0 ? "#0d9488" : "#0284c7", cursor: "pointer" }}>\n                {Number(gestionar.visible_publico ?? 1) === 0 ? "Hacer visible" : "Ocultar pÃºblico"}\n              </button>';
if (content.includes(btnActivo)) {
  content = content.replace(btnActivo, btnVisible);
  changes.push("Botón visible público añadido");
} else {
  changes.push("No se encontró el botón activo");
}

// 3. Update confirm dialog header
const headerOld = '{confirmar.tipo === "eliminar"\n                ? <Trash2 size={16} style={{ color: "#dc2626" }} />\n                : <Ban size={16} style={{ color: "#d97706" }} />}';
const headerNew = '{confirmar.tipo === "eliminar"\n                ? <Trash2 size={16} style={{ color: "#dc2626" }} />\n                : confirmar.tipo === "visible_publico"\n                ? <Eye size={16} style={{ color: "#0284c7" }} />\n                : <Ban size={16} style={{ color: "#d97706" }} />}';
if (content.includes(headerOld)) {
  content = content.replace(headerOld, headerNew);
  changes.push("Header del confirm dialog actualizado");
} else {
  changes.push("No se encontró el header del confirm dialog");
}

// 4. Update confirm dialog message
const msgActivo = '              ) : Number(confirmar.row.activo ?? 1) === 0 ? (\n                <>Â¿Habilitar <strong style={{ color: T.text }}>"{confirmar.row.nombre}"</strong>? VolverÃ¡ a aparecer en Salidas y solicitudes.</>;';
const msgVisible = '              ) : confirmar.tipo === "visible_publico" ? (\n                <>Â¿Hacer <strong style={{ color: T.text }}>"{confirmar.row.nombre}"</strong> visible pÃºblico? AparecerÃ¡ en el catÃ¡logo pÃºblico.</>;\n              ) : Number(confirmar.row.activo ?? 1) === 0 ? (\n                <>Â¿Habilitar <strong style={{ color: T.text }}>"{confirmar.row.nombre}"</strong>? VolverÃ¡ a aparecer en Salidas y solicitudes.</>;';
if (content.includes(msgActivo)) {
  content = content.replace(msgActivo, msgVisible);
  changes.push("Mensaje del confirm dialog actualizado");
} else {
  changes.push("No se encontró el mensaje del confirm dialog");
}

// 5. Update confirm button style
const btnStyleOld = 'background: confirmar.tipo === "eliminar" ? "#dc2626" : "#d97706",';
const btnStyleNew = 'background: confirmar.tipo === "eliminar" ? "#dc2626" : confirmar.tipo === "visible_publico" ? "#0284c7" : "#d97706",';
if (content.includes(btnStyleOld)) {
  content = content.replace(btnStyleOld, btnStyleNew);
  changes.push("Estilo del botón actualizado");
} else {
  changes.push("No se encontró el estilo del botón");
}

fs.writeFileSync(filePath, content);
console.log("Cambios aplicados:");
changes.forEach(c => console.log(" -", c));
