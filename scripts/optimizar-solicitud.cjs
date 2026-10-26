const fs = require('fs');
const path = 'D:/Proyecto de Residencias-Matthew Garay/PrecisionTrucks_HelpDesk/server/services/solicitud.js';
let content = fs.readFileSync(path, 'utf8');

// 3. Fix getAll() - replace SQL_CALC_FOUND_ROWS with separate COUNT query
content = content.replace(
  '    const [rows] = await pool.query(\n      `SELECT SQL_CALC_FOUND_ROWS',
  '    const [rows] = await pool.query(\n      `SELECT'
);

content = content.replace(
  '    return { rows, total };\n  },\n\n  getMetricas:',
  `    const [[{ total }]] = await pool.query(
      \`SELECT COUNT(DISTINCT s.id_solicitud) AS total
       FROM solicitud s
       \${whereSQL}\`,
      params
    );
    return { rows, total };
  },

  getMetricas:`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done part 3: getAll() SQL_CALC_FOUND_ROWS removed');