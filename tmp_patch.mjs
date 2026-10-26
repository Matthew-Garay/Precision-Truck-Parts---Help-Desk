import fs from "fs";

let content = fs.readFileSync("server/services/insumo.js", "utf8");

// Find the position after "_tieneVisiblePublico = Number(cnt) > 0;"
// and add the _tieneActivoCheck function

const oldPattern = "Insumo._tieneVisiblePublico = Number(cnt) > 0;\n    } catch {";
const newBlock = `Insumo._tieneVisiblePublico = Number(cnt) > 0;
    } catch {
      Insumo._tieneVisiblePublico = true;
    }
    return Insumo._tieneVisiblePublico;
  },

  // Nueva función: verificar si la columna `activo` existe
  // Si la columna no existe, las consultas siguen funcionando: se asume todo activo (=1).
  _tieneActivoCheck: async () => {
    if (Insumo._tieneActivo !== null) return Insumo._tieneActivo;
    try {
      const [[{ cnt }]] = await pool.query(
        \`SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'insumo' AND COLUMN_NAME = 'activo'\`
      );
      Insumo._tieneActivo = Number(cnt) > 0;
    } catch {
      Insumo._tieneActivo = true;
    }
    return Insumo._tieneActivo;
  },

`;

if (content.includes(oldPattern)) {
  content = content.replace(oldPattern, newBlock);
  fs.writeFileSync("server/services/insumo.js", content);
  console.log("✅ File updated successfully");
} else {
  console.log("❌ Pattern not found - trying alternative search");
  // Try finding just the line
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("Insumo._tieneVisiblePublico = Number(cnt) > 0;")) {
      console.log(`Found at line ${i + 1}: ${lines[i]}`);
      // Show surrounding lines
      for (let j = Math.max(0, i - 2); j < Math.min(lines.length, i + 5); j++) {
        console.log((j + 1) + ": " + lines[j]);
      }
      break;
    }
  }
}