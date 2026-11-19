/**
 * setup.js — Preparación de las pruebas del cliente.
 *
 * Node 22+ trae su propio `localStorage` global (experimental) que, sin
 * configurar, vale undefined y tapa el del navegador simulado (jsdom).
 * Aquí se pone un almacenamiento en memoria equivalente al del navegador.
 */
class Almacen {
  #d = new Map();
  get length() { return this.#d.size; }
  key(i) { return [...this.#d.keys()][i] ?? null; }
  getItem(k) { return this.#d.has(String(k)) ? this.#d.get(String(k)) : null; }
  setItem(k, v) { this.#d.set(String(k), String(v)); }
  removeItem(k) { this.#d.delete(String(k)); }
  clear() { this.#d.clear(); }
}
for (const nombre of ["localStorage", "sessionStorage"]) {
  const valor = new Almacen();
  Object.defineProperty(globalThis, nombre, { value: valor, configurable: true, writable: true });
  if (typeof window !== "undefined")
    Object.defineProperty(window, nombre, { value: valor, configurable: true, writable: true });
}
