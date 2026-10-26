const fs = require('fs');
const path = 'D:/Proyecto de Residencias-Matthew Garay/PrecisionTrucks_HelpDesk/server/services/ticket.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix getAll - replace DATE(t.fecha_subido) >= ? with SARGable range
content = content.replace(
  'if (fecha_inicio) { conditions.push("DATE(t.fecha_subido) >= ?");    params.push(fecha_inicio); }',
  'if (fecha_inicio) { conditions.push("t.fecha_subido >= ?");          params.push(fecha_inicio + " 00:00:00"); }'
);
content = content.replace(
  'if (fecha_fin)    { conditions.push("DATE(t.fecha_subido) <= ?"); params.push(fecha_fin); }',
  'if (fecha_fin)    { conditions.push("t.fecha_subido < ?");        params.push(fecha_fin + " 23:59:59"); }'
);

// 2. Fix getAll - remove REGEXP_REPLACE from WHERE (tecnico and usuario filters)
// Replace the tecnico REGEXP_REPLACE condition
content = content.replace(
  'if (tecnico)  { conditions.push("REGEXP_REPLACE(TRIM(CONCAT(r.nombre,\' \',r.ap_paterno,IF(r.ap_materno IS NOT NULL AND r.ap_materno!=\'\',CONCAT(\' \',r.ap_materno),\'\'))), \' +\', \' \') LIKE ?"); params.push(`%${tecnico.replace(/\\\\s+/g, \' \').trim()}%`); }',
  'if (tecnico)  { conditions.push("TRIM(CONCAT(r.nombre,\' \',r.ap_paterno,IF(r.ap_materno IS NOT NULL AND r.ap_materno!=\'\',CONCAT(\' \',r.ap_materno),\'\'))) LIKE ?"); params.push(`%${tecnico.replace(/\\\\s+/g, \' \').trim()}%`); }'
);
content = content.replace(
  'if (usuario)  { conditions.push("REGEXP_REPLACE(TRIM(CONCAT(e.nombre,\' \',e.ap_paterno,IF(e.ap_materno IS NOT NULL AND e.ap_materno!=\'\',CONCAT(\' \',e.ap_materno),\'\'))), \' +\', \' \') LIKE ?"); params.push(`%${usuario.replace(/\\\\s+/g, \' \').trim()}%`); }',
  'if (usuario)  { conditions.push("TRIM(CONCAT(e.nombre,\' \',e.ap_paterno,IF(e.ap_materno IS NOT NULL AND e.ap_materno!=\'\',CONCAT(\' \',e.ap_materno),\'\'))) LIKE ?"); params.push(`%${usuario.replace(/\\\\s+/g, \' \').trim()}%`); }'
);

// 3. Fix getReporte - replace DATE(t.fecha_subido) BETWEEN ? AND ? with SARGable range
content = content.replace(
  'const conditions = ["DATE(t.fecha_subido) BETWEEN ? AND ?"];',
  'const conditions = ["t.fecha_subido >= ? AND t.fecha_subido < ?"];'
);
content = content.replace(
  'const params     = [fecha_inicio, fecha_fin];',
  'const params     = [fecha_inicio + " 00:00:00", fecha_fin + " 23:59:59"];'
);

// 4. Fix getReporte - remove REGEXP_REPLACE from usuario filter
content = content.replace(
  'if (usuario)   { conditions.push("REGEXP_REPLACE(TRIM(CONCAT(e.nombre,\' \',e.ap_paterno,IF(e.ap_materno IS NOT NULL AND e.ap_materno!=\'\',CONCAT(\' \',e.ap_materno),\'\'))), \' +\', \' \') LIKE ?"); params.push(`%${usuario.replace(/\\\\s+/g, \' \').trim()}%`); }',
  'if (usuario)   { conditions.push("TRIM(CONCAT(e.nombre,\' \',e.ap_paterno,IF(e.ap_materno IS NOT NULL AND e.ap_materno!=\'\',CONCAT(\' \',e.ap_materno),\'\'))) LIKE ?"); params.push(`%${usuario.replace(/\\\\s+/g, \' \').trim()}%`); }'
);

// 5. Fix getRendimientoTecnicos - replace DATE(t.fecha_subido) BETWEEN ? AND ? with SARGable range
content = content.replace(
  '      ? `AND DATE(t.fecha_subido) BETWEEN ? AND ?`',
  '      ? `AND t.fecha_subido >= ? AND t.fecha_subido < ?`'
);

// Fix the params for rendimiento - they need to be split into two
content = content.replace(
  'if (fechasValidas) {\n      if (fecha_inicio > fecha_fin)\n        throw Object.assign(new Error("fecha_inicio no puede ser posterior a fecha_fin"), { status: 400 });\n      params.push(fecha_inicio, fecha_fin);\n    }',
  'if (fechasValidas) {\n      if (fecha_inicio > fecha_fin)\n        throw Object.assign(new Error("fecha_inicio no puede ser posterior a fecha_fin"), { status: 400 });\n      params.push(fecha_inicio + " 00:00:00", fecha_fin + " 23:59:59");\n    }'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done: ticket.js fully optimized');