// scripts/update_inventario_frontend.js - Part 2
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

// 4. Actualizar el header del confirm dialog
const oldConfirmHeader = `{confirmar.tipo === "eliminar"
                ? <Trash2 size={16} style={{ color: "#dc2626" }} />
                : <Ban size={16} style={{ color: "#d97706" }} />}`;
const newConfirmHeader = `{confirmar.tipo === "eliminar"
                ? <Trash2 size={16} style={{ color: "#dc2626" }} />
                : confirmar.tipo === "visible_publico"
                ? <Eye size={16} style={{ color: "#0284c7" }} />
                : <Ban size={16} style={{ color: "#d97706" }} />}`;
if (content.includes(oldConfirmHeader)) {
  content = content.replace(oldConfirmHeader, newConfirmHeader);
}

// 5. Agregar el mensaje visible_publico en el confirm dialog
const oldConfirmMessage = `              ) : Number(confirmar.row.activo ?? 1) === 0 ? (\n                <>\\u2026 Habilitar <strong style={{ color: T.text }}>"{confirmar.row.nombre}"</strong>? Volver\\u00e1 aparecer en Salidas y solicitudes.</>;`;
const newConfirmMessage = `              ) : confirmar.tipo === "visible_publico" ? (\n                <>\\u2026 Hacer <strong style={{ color: T.text }}>"{confirmar.row.nombre}"</strong> visible p\\u00fablico? Aparecer\\u00e1 en el catalogo p\\u00fablico.</>;
              ) : Number(confirmar.row.activo ?? 1) === 0 ? (\n                <>\\u2026 Habilitar <strong style={{ color: T.text }}>"{confirmar.row.nombre}"</strong>? Volver\\u00e1 aparecer en Salidas y solicitudes.</>;`;
if (content.includes(oldConfirmMessage)) {
  content = content.replace(oldConfirmMessage, newConfirmMessage);
}

// 6. Agregar estilo para el boton visible_publico
const oldConfirmButton = `              <button type="button" disabled={confirmar.busy} onClick={ejecutarConfirmado}
                style={{ padding: "6px 18px", borderRadius: 6, fontSize: 12, fontWeight: 700, border: "none", color: "#fff",
                  background: confirmar.tipo === "eliminar" ? "#dc2626" : "#d97706",
                  cursor: confirmar.busy ? "not-allowed" : "pointer", opacity: confirmar.busy ? 0.6 : 1 }}>`;
const newConfirmButton = `              <button type="button" disabled={confirmar.busy} onClick={ejecutarConfirmado}
                style={{ padding: "6px 18px", borderRadius: 6, fontSize: 12, fontWeight: 700, border: "none", color: "#fff",
                  background: confirmar.tipo === "eliminar" ? "#dc2626" : confirmar.tipo === "visible_publico" ? "#0284c7" : "#d97706",
                  cursor: confirmar.busy ? "not-allowed" : "pointer", opacity: confirmar.busy ? 0.6 : 1 }}>`;
if (content.includes(oldConfirmButton)) {
  content = content.replace(oldConfirmButton, newConfirmButton);
}

fs.writeFileSync(filePath, content);
console.log("Part 2 completada.");
