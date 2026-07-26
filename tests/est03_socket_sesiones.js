/**
 * PT-EST-03 — Múltiples sesiones simultáneas (Socket.io)
 *
 * Uso: node tests/est03_socket_sesiones.js
 * No necesita argumentos. Hace login automáticamente.
 */

import { io } from "socket.io-client";

const BASE_URL   = "http://192.168.1.167:3001";
const API        = `${BASE_URL}/api`;
const NUM_ADMINS = 5;
const TIMEOUT_MS = 8000;

// Credenciales hardcodeadas — admin y un usuario normal
const ADMIN   = { email: "1911.garay.perez@gmail.com", password: "Admin123." };
const USUARIO = { email: "al.martinez@precisiontrucks.com", password: "@Refividrio.1", id_empleado: 10 };

// ── Login ─────────────────────────────────────────────────────
async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!data.token) throw new Error(`Login fallido para ${email}: ${JSON.stringify(data)}`);
  return data.token;
}

// ── Conectar un socket como admin ─────────────────────────────
function conectarAdmin(n, token) {
  return new Promise((resolve) => {
    const socket = io(BASE_URL, {
      auth: { token },
      transports: ["websocket"],
    });
    const resultado = { n, conectado: false, recibio: false, folio: null, socket };

    socket.on("connect", () => { resultado.conectado = true; });
    socket.on("ticket:nuevo", (data) => { resultado.recibio = true; resultado.folio = data.folio_ticket; });
    socket.on("connect_error", (err) => { resultado.error = err.message; });

    // Resolver después de 800ms para dar tiempo a que conecte
    setTimeout(() => resolve(resultado), 800);
  });
}

// ── Crear ticket como usuario ─────────────────────────────────
async function crearTicket(token) {
  const res = await fetch(`${API}/tickets`, {
    method: "POST",
    headers: {
      "Content-Type":      "application/json",
      Authorization:       `Bearer ${token}`,
      "x-requested-with": "XMLHttpRequest",
    },
    body: JSON.stringify({
      titulo:       "Ticket prueba estrés Socket.io",
      descripcion:  "Prueba de múltiples sesiones simultáneas en tiempo real",
      prioridad:    "Media",
      id_categoria: 1,
      id_empleado:  USUARIO.id_empleado,
    }),
  });
  return res.json();
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log("\n🔐  Haciendo login...");

  const tokenAdmin   = await login(ADMIN.email, ADMIN.password);
  console.log("   ✅  Admin autenticado");

  const tokenUsuario = await login(USUARIO.email, USUARIO.password);
  console.log("   ✅  Usuario autenticado\n");

  console.log(`🔥  PT-EST-03 — ${NUM_ADMINS} sesiones admin simultáneas + evento Socket.io\n`);

  // 1. Conectar los 5 admins en paralelo
  console.log(`   Conectando ${NUM_ADMINS} sesiones de admin simultáneas...`);
  const sesiones = await Promise.all(
    Array.from({ length: NUM_ADMINS }, (_, i) => conectarAdmin(i + 1, tokenAdmin))
  );

  const conectados = sesiones.filter(s => s.conectado).length;
  console.log(`   ✅  Sesiones conectadas: ${conectados}/${NUM_ADMINS}\n`);

  // 2. Crear ticket como usuario
  console.log("   Creando ticket como usuario (María Juana López)...");
  const ticket = await crearTicket(tokenUsuario);

  if (!ticket.ok) {
    console.error("   ❌  No se pudo crear el ticket:", ticket.error || JSON.stringify(ticket));
    sesiones.forEach(s => s.socket.disconnect());
    process.exit(1);
  }
  console.log(`   ✅  Ticket creado: ${ticket.folio_ticket}`);

  // 3. Esperar que el evento llegue a todos los sockets
  console.log(`\n   Esperando evento ticket:nuevo (${TIMEOUT_MS / 1000}s)...`);
  await new Promise(r => setTimeout(r, TIMEOUT_MS));

  // 4. Resultados por sesión
  console.log("\n   Sesión   Conectado      Recibió ticket:nuevo");
  console.log("   ─────────────────────────────────────────────");
  sesiones.forEach(s => {
    const con = s.conectado ? "✅  Sí" : "❌  No";
    const rec = s.recibio   ? `✅  Sí  (${s.folio})` : "❌  No";
    console.log(`     ${s.n}       ${con}          ${rec}`);
  });

  const recibieron = sesiones.filter(s => s.recibio).length;
  console.log("   ─────────────────────────────────────────────");
  console.log(`   Sesiones que recibieron el evento: ${recibieron}/${NUM_ADMINS}`);

  if (recibieron === NUM_ADMINS) {
    console.log("\n   ✅  RESULTADO: Todas las sesiones recibieron ticket:nuevo en tiempo real\n");
  } else {
    console.log(`\n   ❌  RESULTADO: Solo ${recibieron} de ${NUM_ADMINS} sesiones recibieron el evento\n`);
  }

  sesiones.forEach(s => s.socket.disconnect());
  process.exit(0);
}

main().catch(err => { console.error("\n❌  Error fatal:", err.message); process.exit(1); });
