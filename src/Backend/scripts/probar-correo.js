/**
 * probar-correo.js
 *
 * Verifica que Zoho SMTP este bien configurado y envia un correo de prueba.
 * Sirve para NO perder tiempo adivinando si un fallo es de red, de puerto,
 * de contrasena o del remitente.
 *
 * Uso:
 *   node --import ./src/Backend/load-env.js src/Backend/scripts/probar-correo.js
 *   node --import ./src/Backend/load-env.js src/Backend/scripts/probar-correo.js tu@correo.com
 *
 * Diagnostica paso a paso:
 *   1. Que las variables SMTP_* existan y no sean el texto de ejemplo.
 *   2. Que el servidor responda (conexion de red).
 *   3. Que las credenciales sean aceptadas.
 *   4. Que el envio real funcione.
 *
 * Nunca imprime la contrasena.
 */
import "../load-env.js";
import nodemailer from "nodemailer";

/** Imprime una linea de resultado con marca OK o FALLA. */
const linea = (etapa, ok, msg) => {
  const marca = ok ? "OK " : "FALLA";
  const color = ok ? 32 : 31;
  console.log(`  [${marca}] ${etapa.padEnd(22)} \x1b[${color}m${msg}\x1b[0m`);
};

console.log("\n=== Prueba de correo · PrecisionTrucks HelpDesk ===\n");

// -- 1. Variables de entorno ----------------------------------------
const cfg = {
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM,
};

const faltan = Object.entries(cfg).filter(([, v]) => !v);
if (faltan.length) {
  linea("variables", false, `Faltan: ${faltan.map(([k]) => k).join(", ")}`);
  console.log("\n  Revisa el archivo .env del proyecto.\n");
  process.exit(1);
}
linea("variables", true, "todas presentes");

// El texto de ejemplo del .env.example NO es una contrasena real.
if (/PEGAR_AQUI|CAMBIAR|CONTRASENA_ESPECIFICA/i.test(cfg.SMTP_PASS)) {
  linea("contrasena", false, "SMTP_PASS sigue siendo el texto de ejemplo");
  console.log(`
  Pasos para obtener la contrasena correcta:

    1. Entra a  https://accounts.zoho.com/home/security-settings
       (o https://accounts.zoho.com.mx/home/security-settings)
    2. Baja hasta "Contrasenas especificas de aplicacion".
    3. Escribe un nombre, por ejemplo "HelpDesk", y dale "Generar nueva".
    4. Zoho mostrara una contrasena de 16 caracteres con ESPACIOS,
       por ejemplo:  ab cd ef gh ij kl mn op qr st
    5. Copiala en SMTP_PASS dentro de .env, sin las comillas.

  Ojo: es una contrasena nueva, NO la contrasena de tu cuenta de Zoho.
  Este paso va en tu navegador, no en este chat.
`);
  process.exit(1);
}
linea("contrasena", true, `configurada (${cfg.SMTP_PASS.length} caracteres)`);
// ---CONT---
// -- 2. Construir el transporter ------------------------------------
const puerto = Number(cfg.SMTP_PORT) || 587;
const seguro = puerto === 465;   // 465 = SSL directo, 587 = STARTTLS

const transporter = nodemailer.createTransport({
  host: cfg.SMTP_HOST,
  port: puerto,
  secure: seguro,
  auth: { user: cfg.SMTP_USER, pass: cfg.SMTP_PASS },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
});

const remitente    = cfg.SMTP_FROM || cfg.SMTP_USER;
const destinatario = process.argv[2] || cfg.SMTP_USER;

console.log(`  Servidor : ${cfg.SMTP_HOST}:${puerto} (${seguro ? "SSL" : "STARTTLS"})`);
console.log(`  Desde    : ${remitente}`);
console.log(`  Hacia    : ${destinatario}\n`);

// -- 3. Verificar conexion y credenciales ---------------------------
try {
  await transporter.verify();
  linea("conexion", true, "el servidor respondio");
  linea("credenciales", true, "usuario y contrasena aceptados");
} catch (err) {
  linea("conexion", false, err.message);
  const m = err.message;

  console.log("\n  Que significa este fallo:\n");
  if (/ECONNREFUSED|timed out|ETIMEDOUT|ENOTFOUND|EAI_AGAIN/i.test(m)) {
    console.log(`  · No se pudo llegar a ${cfg.SMTP_HOST}:${puerto}.`);
    console.log("    Revisa tu conexion a internet y que ningun firewall bloquee el puerto.");
    console.log("    Puedes comprobarlo en el navegador:  https://" + cfg.SMTP_HOST + "\n");
  } else if (/535|534|auth|invalid credentials/i.test(m)) {
    console.log("  · El servidor respondio pero rechazo las credenciales.");
    console.log("    Casi siempre es una de estas dos:");
    console.log("      a) Usaste la contrasena de tu cuenta en vez de la especifica de aplicacion.");
    console.log("      b) La contrasena especifica expiro, o tiene espacios pegados de mas.\n");
  } else if (/DKIM|550|553|554|not authorized|sender/i.test(m)) {
    console.log("  · El remitente no esta autorizado. En Zoho, el campo FROM debe ser una");
    console.log("    direccion que exista como alias dentro de tu cuenta de Zoho.\n");
  }
  process.exit(1);
}

// -- 4. Envio real ---------------------------------------------------
try {
  await transporter.sendMail({
    from: remitente,
    to: destinatario,
    subject: "Prueba de correo · PrecisionTrucks HelpDesk",
    text: "Si lees esto, el correo de PrecisionTrucks HelpDesk funciona correctamente.",
    html: `
      <div style="font-family:Segoe UI,Arial,sans-serif;max-width:520px;margin:auto">
        <div style="background:#111;color:#fff;padding:20px;text-align:center;font-weight:700">
          PrecisionTrucks HelpDesk
        </div>
        <div style="border:1px solid #e5e7eb;border-top:0;padding:28px">
          <p style="margin:0 0 14px;font-size:15px;color:#111">
            <strong>El correo salio correctamente.</strong>
          </p>
          <p style="margin:0;font-size:14px;color:#555;line-height:1.7">
            Si estas leyendo este mensaje, el servidor de Zoho acepto el envio y el
            formulario de recuperacion de contrasena va a funcionar.
          </p>
        </div>
      </div>`,
  });
  linea("envio", true, `mensaje entregado a ${destinatario}`);
  console.log("\n  Revisa la bandeja de entrada y tambien la carpeta de spam.\n");
  process.exit(0);
} catch (err) {
  linea("envio", false, err.message);
  console.log("\n  La conexion funciona pero el envio fue rechazado. Revisa:\n");
  console.log("  · Que SMTP_FROM sea un alias valido de tu cuenta de Zoho.");
  console.log("  · Que la cuenta no haya alcanzado su limite diario de envio.");
  console.log("  · Que tu dominio tenga los registros SPF y DKIM configurados en Zoho.\n");
  process.exit(1);
}