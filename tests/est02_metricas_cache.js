/**
 * PT-EST-02 — Carga en endpoint de métricas (con caché)
 *
 * Uso: node tests/est02_metricas_cache.js
 * No necesita argumentos. Hace login automáticamente.
 */

const BASE_URL   = "http://192.168.1.167:3001/api";
const TOTAL_REQS = 50;

// ── 1. Login automático ───────────────────────────────────────
async function obtenerToken() {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email:    "1911.garay.perez@gmail.com",
      password: "Admin123.",
    }),
  });
  const data = await res.json();
  if (!data.token) throw new Error("Login fallido: " + JSON.stringify(data));
  return data.token;
}

// ── 2. Una petición a /tickets/metricas ───────────────────────
async function peticion(n, token) {
  const inicio = Date.now();
  const res = await fetch(`${BASE_URL}/tickets/metricas`, {
    headers: {
      Authorization:       `Bearer ${token}`,
      "x-requested-with": "XMLHttpRequest",
    },
  });
  return { n, status: res.status, ms: Date.now() - inicio };
}

// ── 3. Main ───────────────────────────────────────────────────
async function main() {
  console.log("\n🔐  Haciendo login como admin...");
  const token = await obtenerToken();
  console.log("✅  Token obtenido\n");

  console.log(`🔥  PT-EST-02 — Carga en /tickets/metricas (${TOTAL_REQS} peticiones)\n`);
  console.log("   #    Status   Tiempo     Nota");
  console.log("   ──────────────────────────────────────────");

  const resultados = [];

  for (let i = 1; i <= TOTAL_REQS; i++) {
    const r = await peticion(i, token);
    resultados.push(r);

    const nota = i === 1
      ? "← primera (sin caché)"
      : r.ms <= 30 ? "✅ caché hit" : "";

    const num    = String(i).padStart(3);
    const tiempo = String(r.ms).padStart(6) + " ms";
    console.log(`   ${num}   ${r.status}      ${tiempo}   ${nota}`);
  }

  // ── Resumen ──────────────────────────────────────────────────
  const tiempos   = resultados.map(r => r.ms);
  const primera   = tiempos[0];
  const resto     = tiempos.slice(1);
  const promResto = Math.round(resto.reduce((a, b) => a + b, 0) / resto.length);
  const minResto  = Math.min(...resto);
  const maxResto  = Math.max(...resto);
  const errores   = resultados.filter(r => r.status !== 200).length;
  const reduccion = primera > 0 ? Math.round((1 - promResto / primera) * 100) : 0;

  console.log("   ──────────────────────────────────────────");
  console.log(`   Primera petición (sin caché) : ${primera} ms`);
  console.log(`   Promedio peticiones 2-${TOTAL_REQS}     : ${promResto} ms`);
  console.log(`   Mínimo / Máximo (con caché)  : ${minResto} ms / ${maxResto} ms`);
  console.log(`   Reducción de tiempo          : ${reduccion}%`);
  console.log(`   Errores (status ≠ 200)       : ${errores}`);
  console.log("   ──────────────────────────────────────────");

  if (errores === 0) {
    console.log("\n   ✅  RESULTADO: Servidor respondió 200 en las 50 peticiones");
  } else {
    console.log(`\n   ❌  RESULTADO: ${errores} peticiones fallaron`);
  }

  if (reduccion >= 50) {
    console.log(`   ✅  CACHÉ: ${reduccion}% más rápido desde la petición 2 en adelante\n`);
  } else {
    console.log(`   ⚠️   CACHÉ: Solo ${reduccion}% de mejora — puede que el caché ya estuviera activo\n`);
  }
}

main().catch(err => {
  console.error("\n❌  Error:", err.message);
  process.exit(1);
});
