import fs from 'fs';
const p = 'D:/Proyecto de Residencias-Matthew Garay/PrecisionTrucks_HelpDesk/server/services/manual.js';
let lines = fs.readFileSync(p, 'utf8').split('\n');
// Iterate backwards to insert before return statements
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].includes('return result.insertId;')) {
    lines.splice(i, 0, '    cache.del("manual:all");');
  }
  if (lines[i].includes('return result.affectedRows > 0;')) {
    lines.splice(i, 0, '    cache.del("manual:all");');
  }
}
fs.writeFileSync(p, lines.join('\n'), 'utf8');
console.log('Done: manual.js cache invalidation added');