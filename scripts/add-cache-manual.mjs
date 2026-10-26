import fs from 'fs';
const p = 'D:/Proyecto de Residencias-Matthew Garay/PrecisionTrucks_HelpDesk/server/services/manual.js';
let c = fs.readFileSync(p, 'utf8');

// Add cache.del after crear return (specific: followed by blank line then actualizar)
c = c.replace(
  '    return result.insertId;\n  },\n\n  actualizar:',
  '    cache.del("manual:all");\n    return result.insertId;\n  },\n\n  actualizar:'
);

// Add cache.del after actualizar return (specific: followed by blank line then getRuta)
c = c.replace(
  '    return result.affectedRows > 0;\n  },\n\n  getRuta:',
  '    cache.del("manual:all");\n    return result.affectedRows > 0;\n  },\n\n  getRuta:'
);

// Add cache.del after eliminar return (specific: followed by };)
c = c.replace(
  '    return result.affectedRows > 0;\n  },\n};',
  '    cache.del("manual:all");\n    return result.affectedRows > 0;\n  },\n};'
);

fs.writeFileSync(p, c, 'utf8');
console.log('Done: manual.js cache invalidation added');