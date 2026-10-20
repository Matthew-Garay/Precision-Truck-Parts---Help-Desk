// scripts/update_inventario_frontend.js - Part 1
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

// 1. Actualizar el estado de confirmar para incluir visible_publico
const oldConfirmarType = `const [confirmar,  setConfirmar]  = useState(null); // { tipo: "eliminar"|\"activo\", row, busy }`;
const newConfirmarType = `const [confirmar,  setConfirmar]  = useState(null); // { tipo: "eliminar"|\"activo\"|\"visible_publico\", row, busy }`;
if (content.includes(oldConfirmarType)) {
  content = content.replace(oldConfirmarType, newConfirmarType);
}

// 2. Agregar la opcion "Visible PÃºblico" en el panel de gestionar
const oldPanelOption = `                <li><strong style={{ color: T.text }}>Eliminar:</strong> borra el insumo (solo es posible si no tiene solicitudes ni movimientos).</li>`;
const newPanelOption = `                <li><strong style={{ color: T.text }}>Inhabilitar/Habilitar:</strong> baja lÃ³gica â€” se oculta de Salidas y solicitudes conservando su historial.</li>
                <li><strong style={{ color: T.text }}>Visible PÃºblico:</strong> controla si el insumo aparece en el catalogo pÃºblico (inventario, reportes). 0 = oculto, 1 = visible.</li>`;
if (content.includes(oldPanelOption)) {
  content = content.replace(oldPanelOption, newPanelOption);
}

// 3. Agregar el botÃ´n "Visible PÃºblico" en el panel de gestionar
const oldBtnActivo = `              <button type="button"
                onClick={() => { setConfirmar({ tipo: "activo", row: gestionar, busy: false }); setGestionar(null); }}
                style={{ padding: "6px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, border: "none", color: "#fff",
                  background: Number(gestionar.activo ?? 1) === 0 ? "#16a34a" : "#d97706", cursor: "pointer" }}>
                {Number(gestionar.activo ?? 1) === 0 ? "Habilitar" : "Inhabilitar"}
              </button>`;
const newBtnActivo = `              <button type="button"
                onClick={() => { setConfirmar({ tipo: "activo", row: gestionar, busy: false }); setGestionar(null); }}
                style={{ padding: "6px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, border: "none", color: "#fff",
                  background: Number(gestionar.activo ?? 1) === 0 ? "#16a34a" : "#d97706", cursor: "pointer" }}>
                {Number(gestionar.activo ?? 1) === 0 ? "Habilitar" : "Inhabilitar"}
              </button>
              <button type="button"
                onClick={() => { setConfirmar({ tipo: "visible_publico", row: gestionar, busy: false }); setGestionar(null); }}
                style={{ padding: "6px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, border: "none", color: "#fff",
                  background: Number(gestionar.visible_publico ?? 1) === 0 ? "#0d9488" : "#0284c7", cursor: "pointer" }}>
                {Number(gestionar.visible_publico ?? 1) === 0 ? "Hacer visible" : "Ocultar pÃºblico"}
              </button>`;
if (content.includes(oldBtnActivo)) {
  content = content.replace(oldBtnActivo, newBtnActivo);
}

fs.writeFileSync(filePath, content);
console.log("Part 1 completada.");
