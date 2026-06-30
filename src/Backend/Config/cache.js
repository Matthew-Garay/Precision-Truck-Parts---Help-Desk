/**
 * cache.js
 *
 * Caché en memoria ligero con TTL por clave.
 * Evita recalcular métricas, catálogos y listas de empleados
 * en cada petición HTTP. Las entradas expiran automáticamente.
 *
 * API:
 *   cache.get(key)              → valor o undefined si expiró / no existe
 *   cache.set(key, value, ttlMs) → guarda con tiempo de vida en ms
 *   cache.del(key)              → invalida una clave específica
 *   cache.delByPrefix(prefix)   → invalida todas las claves que empiezan con prefix
 */

const _store = new Map();

export const cache = {
  get(key) {
    const entry = _store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.exp) { _store.delete(key); return undefined; }
    return entry.val;
  },

  set(key, value, ttlMs = 60_000) {
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
