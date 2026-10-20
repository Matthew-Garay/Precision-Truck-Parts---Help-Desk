import pool from './server/config/db.js';
import Insumo from './server/services/insumo.js';

const ID = 88;

async function main() {
  const [[antes]] = await pool.query('SELECT visible_publico FROM insumo WHERE id_insumo = ?', [ID]);
  console.log('Inicial visible_publico:', antes.visible_publico);

  const ok0 = await Insumo.cambiarVisiblePublico(ID, false);
  console.log('cambiarVisiblePublico(false) ->', ok0);
  const [[despues0]] = await pool.query('SELECT visible_publico FROM insumo WHERE id_insumo = ?', [ID]);
  console.log('Despues de ocultar:', despues0.visible_publico);

  const ok1 = await Insumo.cambiarVisiblePublico(ID, true);
  console.log('cambiarVisiblePublico(true) ->', ok1);
  const [[despues1]] = await pool.query('SELECT visible_publico FROM insumo WHERE id_insumo = ?', [ID]);
  console.log('Despues de mostrar:', despues1.visible_publico);

  const okN = await Insumo.cambiarVisiblePublico(999999, false);
  console.log('cambiarVisiblePublico(id inexistente, false) ->', okN);

  console.log(ok0 && despues0.visible_publico === 0 && ok1 && despues1.visible_publico === 1 && !okN
    ? 'TEST OK: servicio visible_publico funciona correctamente'
    : 'TEST FALLO');
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
