/**
 * mailer.js
 *
 * Configura el transporter SMTP y expone la funcion de envio del correo
 * de recuperacion de contrasena.
 *
 * Funcionamiento general:
 *   - Crea un transporter de Nodemailer usando las variables de entorno SMTP_*.
 *   - Si SMTP_USER no esta definido, la funcion de envio retorna sin hacer nada.
 *     Esto permite usar el sistema en desarrollo sin configurar un servidor de correo.
 *   - El logo de la empresa se carga desde disco una sola vez y se adjunta al
 *     correo como imagen embebida (Content-ID: logoptp) para que aparezca en el
 *     encabezado del mensaje sin depender de una URL externa.
 *
 * Funcion exportada:
 *
 *   enviarCodigoRecuperacion({ to, nombre, codigo })
 *     Envia un correo HTML con el codigo de verificacion de 6 digitos al empleado.
 *     El correo incluye:
 *       - Saludo personalizado con el nombre del empleado.
 *       - El codigo en texto grande y legible.
 *       - Fecha y hora de la solicitud en zona horaria de Hermosillo.
 *       - Instrucciones de 3 pasos para completar el restablecimiento.
 *       - Estilos compatibles con modo oscuro del cliente de correo.
 *     Parametros:
 *       to     - direccion de correo del destinatario
 *       nombre - nombre completo del empleado (se usa el primer nombre y apellido)
 *       codigo - codigo numerico de 6 digitos generado por resetController.js
 *     Retorna: Promise<void>
 *
 * Variables de entorno requeridas para el envio:
 *   SMTP_HOST - servidor SMTP (ej. smtp.gmail.com)
 *   SMTP_PORT - puerto SMTP (587 para TLS, 465 para SSL)
 *   SMTP_USER - usuario de autenticacion SMTP
 *   SMTP_PASS - contrasena de aplicacion SMTP
 *   SMTP_FROM - nombre y direccion del remitente (ej. "HelpDesk" <correo@gmail.com>)
 */
import nodemailer        from "nodemailer";
import fs                from "fs";
import path              from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Busca el logo en la ruta esperada. Si no existe, los correos se envian sin imagen.
function resolverLogo() {
  const candidatos = [
    path.resolve(__dirname, "../../../public/assets/img/logo.png"),
  ];
  for (const ruta of candidatos) {
    if (fs.existsSync(ruta)) return ruta;
  }
  console.warn("[mailer] Logo no encontrado - los correos se enviaran sin imagen");
  return null;
}

const LOGO_PATH = resolverLogo();

// Escapa caracteres especiales HTML para evitar inyeccion en el cuerpo del correo.
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Retorna la fecha y hora actual formateada en zona horaria de Hermosillo (UTC-7).
function getAhoraHermosillo() {
  const now = new Date();
  const opts = { timeZone: "America/Hermosillo" };

  const weekday = new Intl.DateTimeFormat("es-MX", { ...opts, weekday: "long" }).format(now);
  const day     = new Intl.DateTimeFormat("es-MX", { ...opts, day: "numeric" }).format(now);
  const month   = new Intl.DateTimeFormat("es-MX", { ...opts, month: "long" }).format(now);
  const year    = new Intl.DateTimeFormat("es-MX", { ...opts, year: "numeric" }).format(now);

  const h24  = parseInt(new Intl.DateTimeFormat("es-MX", { ...opts, hour: "numeric", hour12: false }).format(now), 10);
  const min  = new Intl.DateTimeFormat("es-MX", { ...opts, minute: "2-digit" }).format(now).padStart(2, "0");
  const h12  = h24 % 12 === 0 ? 12 : h24 % 12;
  const ampm = h24 < 12 ? "a.m." : "p.m.";

  const diaCap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${diaCap}, ${day} de ${month} de ${year} a las ${h12}:${min} ${ampm}`;
}

// ── Configuración del transporte ──────────────────────────────────────
// Nodemailer es genérico: el MISMO código sirve para Gmail, Zoho, Outlook o
// cualquier servidor SMTP; lo único que cambia son las variables del .env.
// Referencia rápida (copia siempre los datos exactos que Zoho muestra en
// Configuración → Cuentas de correo, porque dependen del centro de datos):
//   Zoho Mail → smtp.zoho.com · 465 (SSL) o 587 (TLS)
//               smtppro.zoho.com si la cuenta de pago usa dominio propio
//   Gmail     → smtp.gmail.com · 587 (exige contraseña de aplicación)
//   Outlook   → smtp.office365.com · 587
// En Zoho el usuario es el CORREO COMPLETO y el remitente (SMTP_FROM) debe
// coincidir con esa misma cuenta; si no, Zoho responde "Transmisión no
// permitida" y el correo no sale.
const PUERTOS_SSL = new Set([465, 8465, 994]);

const SMTP_PORT = parseInt(process.env.SMTP_PORT, 10) || 587;
const SMTP_SECURE = process.env.SMTP_SECURE !== undefined
  ? process.env.SMTP_SECURE === "true"
  : PUERTOS_SSL.has(SMTP_PORT);

// Avisos de configuración: fallan en caliente y es más fácil que adivinar
const PASS_PENDIENTE = /^PEGAR_|^TU_CONTRASENA|^X{4,}$/i;

/**
 * smtpConfigurado()
 *   true solo si hay usuario, contraseña REAL (no el valor de ejemplo) y
 *   host. Evita que el arranque anuncie "correos activos" cuando en realidad
 *   el .env todavía trae el placeholder de la contraseña.
 */
export function smtpConfigurado() {
  return Boolean(
    process.env.SMTP_USER &&
    process.env.SMTP_HOST &&
    process.env.SMTP_PASS &&
    !PASS_PENDIENTE.test(process.env.SMTP_PASS.trim())
  );
}

if (process.env.SMTP_USER && !process.env.SMTP_HOST)
  console.warn("[mailer] SMTP_USER definido pero falta SMTP_HOST — revisa el .env");
if (process.env.SMTP_USER && PASS_PENDIENTE.test((process.env.SMTP_PASS ?? "").trim()))
  console.warn("[mailer] SMTP_PASS sigue con el valor de ejemplo: pega la contraseña específica de la aplicación de Zoho en el .env");
else if (process.env.SMTP_USER && !process.env.SMTP_PASS)
  console.warn("[mailer] SMTP_USER definido pero falta SMTP_PASS — en Zoho y Gmail usa una contraseña específica para la aplicación");
if (process.env.SMTP_USER && !process.env.SMTP_FROM)
  console.warn("[mailer] Falta SMTP_FROM — se usará el SMTP_USER como remitente");

// Transporter de Nodemailer. Se crea una sola vez al cargar el modulo.
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   SMTP_PORT,
  secure: SMTP_SECURE,
  auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

/**
 * Envia el correo de recuperacion de contrasena con el codigo de verificacion.
 *
 * @param {object} params
 * @param {string} params.to     - Direccion de correo del destinatario
 * @param {string} params.nombre - Nombre completo del empleado
 * @param {string|number} params.codigo - Codigo de verificacion de 6 digitos
 * @returns {Promise<void>}
 */
export async function enviarCodigoRecuperacion({ to, nombre, codigo }) {
  if (!process.env.SMTP_USER) return;

  const partes   = nombre.trim().split(/\s+/);
  const nombre1  = esc(partes[0] ?? "");
  const apellido = esc(partes[1] ?? "");
  const codigoStr = String(codigo);
  const ahora    = getAhoraHermosillo();

  // El logo tiene el rombo y el texto en NEGRO: SIEMPRE debe ir sobre una
  // placa blanca. El fondo blanco va en el atributo style (además de la clase)
  // porque algunos clientes de correo ignoran las hojas de estilo.
  const logoTag =
    `<img src="cid:logoptp" alt="Precision Truck Parts" width="94" height="60" ` +
    `style="display:block;margin:0 auto;border:0;width:94px;height:60px;background:#ffffff;" />`;

  const html =
    `<!DOCTYPE html>` +
    `<html lang="es" xmlns="http://www.w3.org/1999/xhtml">` +
    `<head>` +
      `<meta charset="UTF-8"/>` +
      `<meta name="viewport" content="width=device-width,initial-scale=1"/>` +
      `<meta http-equiv="X-UA-Compatible" content="IE=edge"/>` +
      // Evita que el cliente de correo invierta los colores al detectado en
      // modo oscuro (Gmail/Outlook en móvil) y vuelva negro el fondo del logo.
      `<meta name="color-scheme" content="light dark"/>` +
      `<meta name="supported-color-schemes" content="light dark"/>` +
      `<title>Codigo de verificacion - Precision Truck Parts</title>` +
      `<style>` +
        `body,table,td,p,a,div{margin:0;padding:0;font-family:Arial,Helvetica,sans-serif!important;}` +
        `body{background-color:#ffffff;}` +
        `@media(prefers-color-scheme:dark){` +
          `.r-outer{background-color:#111111!important;}` +
          `.r-card{background-color:#1C1C1C!important;}` +
          // El encabezado y el logo se mantienen BLANCOS en modo oscuro:
          // el logo es negro y sobre fondo negro desapareceria.
          `.r-hdr,.r-logo{background-color:#FFFFFF!important;}` +
          `.r-body{background-color:#1C1C1C!important;}` +
          `.r-box{background-color:#252525!important;border-color:#333333!important;}` +
          `.r-footer{background-color:#141414!important;border-color:#252525!important;}` +
          `.r-t-main{color:#EEEEEE!important;}` +
          `.r-t-sub{color:#AAAAAA!important;}` +
          `.r-t-foot{color:#666666!important;}` +
        `}` +
      `</style>` +
    `</head>` +
    `<body style="margin:0;padding:0;background:#ffffff;">` +

    `<table class="r-outer" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:0;">` +
      `<tr><td align="center">` +

        `<table class="r-card" role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">` +

          `<tr>` +
            `<td class="r-hdr" align="center" style="background:#ffffff;padding:28px 36px;border-bottom:4px solid #E56B00;">` +
              `<table class="r-logo" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#ffffff;border-collapse:collapse;">` +
                `<tr><td align="center" style="background:#ffffff;padding:0;">` +
                  logoTag +
                `</td></tr>` +
              `</table>` +
            `</td>` +
          `</tr>` +

          `<tr>` +
            `<td class="r-body" style="background:#ffffff;padding:36px 36px 32px 36px;">` +

              `<p class="r-t-main" style="margin:0 0 20px 0;font-size:16px;font-weight:600;color:#111111;text-align:center;">` +
                `Hola, ${nombre1}${apellido ? " " + apellido : ""}!` +
              `</p>` +

              `<p class="r-t-sub" style="margin:0 0 24px 0;font-size:13px;line-height:1.75;color:#444444;text-align:left;">` +
                `Hemos recibido una solicitud para restablecer la contrasena de tu cuenta en Precision Truck Parts, Parts and Accesories, S.A de C.V. - HelpDesk. Para continuar, utiliza el siguiente codigo de verificacion:` +
              `</p>` +

              `<p style="margin:0 0 16px 0;font-size:26px;font-weight:700;color:#111111;text-align:center;letter-spacing:0;">${codigoStr}</p>` +

              `<p class="r-t-sub" style="margin:0 0 8px 0;font-size:12px;color:#888888;text-align:left;line-height:1.6;">` +
                `Codigo valido por 10 minutos` +
              `</p>` +
              `<p class="r-t-sub" style="margin:0 0 28px 0;font-size:12px;color:#888888;text-align:left;line-height:1.6;">` +
                `Solicitado el ${ahora}` +
              `</p>` +

              `<table class="r-box" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f9f9fa;border:1px solid #e5e7eb;border-radius:8px;">` +
                `<tr>` +
                  `<td style="padding:20px 24px;">` +
                    `<p style="margin:0 0 12px 0;font-size:11px;font-weight:700;color:#999999;text-transform:uppercase;letter-spacing:0.6px;">Instrucciones</p>` +
                    `<p style="margin:0 0 6px 0;font-size:13px;color:#444444;line-height:1.6;">1. &nbsp;Regresa a la pantalla de inicio de sesion.</p>` +
                    `<p style="margin:0 0 6px 0;font-size:13px;color:#444444;line-height:1.6;">2. &nbsp;Introduce el codigo en el campo de verificacion.</p>` +
                    `<p style="margin:0;font-size:13px;color:#444444;line-height:1.6;">3. &nbsp;Define tu nueva contrasena.</p>` +
                  `</td>` +
                `</tr>` +
              `</table>` +

            `</td>` +
          `</tr>` +

          `<tr>` +
            `<td class="r-footer" style="background:#f9f9fa;border-top:1px solid #eeeeee;padding:24px 36px;text-align:center;">` +
              `<p class="r-t-foot" style="margin:0 0 4px 0;font-size:11px;color:#888888;line-height:1.7;text-align:left;">` +
                `Este correo fue generado de forma automatica por el sistema. Por favor no respondas directamente a esta direccion.` +
              `</p>` +
              `<p class="r-t-foot" style="margin:0;font-size:11px;color:#aaaaaa;">Precision Truck Parts, Parts and Accesories, S.A de C.V. 2026.</p>` +
            `</td>` +
          `</tr>` +

        `</table>` +

      `</td></tr>` +
    `</table>` +

    `</body></html>`;

  await transporter.sendMail({
    // Sin SMTP_FROM se usa la misma cuenta de salida: es lo que exigen
    // Zoho y Gmail (el remitente debe coincidir con el usuario autenticado).
    from:    process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "=?UTF-8?Q?C=C3=B3digo_de_verificaci=C3=B3n?=",
    html,
    attachments: LOGO_PATH ? [{
      filename: "logo.png",
      path:     LOGO_PATH,
      cid:      "logoptp",
    }] : [],
  });
}
