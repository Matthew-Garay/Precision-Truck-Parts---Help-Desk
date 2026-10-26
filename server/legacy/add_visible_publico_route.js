// scripts/add_visible_publico_route.js
import fs from "fs";
import path from "path";

const filePath = path.resolve(
  "D:",
  "Proyecto de Residencias-Matthew Garay",
  "PrecisionTrucks_HelpDesk",
  "server",
  "routes",
  "solicitudes-routes.js"
);

let content = fs.readFileSync(filePath, "utf8");

const routeLine = `router.patch("/insumos/:id/visible-publico",  requireAdmin, cambiarVisiblePublico);`;

// Insert after the cambiarActivoInsumo route
const target = `router.patch("/insumos/:id/activo", requireAdmin, cambiarActivoInsumo);`;

if (!content.includes(routeLine)) {
  if (!content.includes(target)) {
    throw new Error("Linea de destino no encontrada en el archivo");
  }
  content = content.replace(target, target + "\n" + routeLine);
  fs.writeFileSync(filePath, content);
  console.log("Ruta visible-publico añadida correctamente.");
} else {
  console.log("La ruta ya existe.");
}

