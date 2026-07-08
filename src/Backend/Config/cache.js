/**
 * cache.js
 *
 * Caché en memoria ligero con TTL por clave y límite máximo de entradas (LRU).
 * Evita recalcular métricas, catálogos y listas de empleados
 * en cada petición HTTP. Las entradas expiran automáticamente.
 *
 * API:
 *   cache.get(key)               → valor o undefined si expiró / no existe
 *   cache.set(key, value, ttlMs) → guarda con tiempo de vida en ms
 *   cache.del(key)               → invalida una clave específica
 *   cache.delByPrefix(prefix)    → invalida todas las claves que empiezan con prefix
 */

const MAX_ENTRIES = 500; // límite máximo para evitar crecimiento ilimitado en memoria
const _store = new Map();

/** Elimina la entrada más antigua del store (política LRU simple). */
function evictOldest() {
  const firstKey = _store.keys().next().value;
  if (firstKey !== undefined) _store.delete(firstKey);
}

export const cache = {
  get(key) {
    const entry = _store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.exp) { _store.delete(key); return undefined; }
    // Mover al final para mantener orden LRU
    _store.delete(key);
    _store.set(key, entry);
    return entry.val;
  },

  set(key, value, ttlMs = 60_000) {
    if (_store.has(key)) _store.delete(key); // reinserta al final
    else if (_store.size >= MAX_ENTRIES) evictOldest();
    _store.set(key, { val: value, exp: Date.now() + ttlMs });
  },

  del(key) {
    _store.delete(key);
  },

  delByPrefix(prefix) {
    for (const k of _store.keys()) {
      if (k.startsWith(prefix)) _store.delete(k);
    }
  },
};
