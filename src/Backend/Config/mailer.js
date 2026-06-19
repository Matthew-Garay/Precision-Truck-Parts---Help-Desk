/**
 * mailer.js
 *
 * Configura el servicio de envio de correos electronicos mediante nodemailer
 * y expone dos funciones para los dos tipos de notificacion del sistema.
 *
 * Variables de entorno requeridas:
 *   SMTP_HOST - servidor SMTP (ej. smtp.gmail.com)
 *   SMTP_PORT - puerto SMTP (587 para TLS, 465 para SSL)
 *   SMTP_USER - usuario / direccion de autenticacion SMTP
 *   SMTP_PASS - contrasena o token de aplicacion SMTP
 *   SMTP_FROM - direccion remitente que aparecera en el correo
 *
 * Si SMTP_USER no esta configurado las funciones retornan sin enviar nada,
 * lo que permite ejecutar el sistema en desarrollo sin servidor de correo.
 *
 * El logo de la empresa se lee del disco de forma diferida (lazy) la primera vez
 * que se necesita y se cachea en memoria para las llamadas siguientes.
 *
 * Funciones exportadas:
 *   enviarNotificacionTicket  - notifica al empleado cuando su ticket cambia de estatus
 *   enviarCodigoRecuperacion  - envia el codigo de 6 digitos para restablecer contrasena
 */
import nodemailer from "nodemailer";
import fs         from "fs";
import path       from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Logo embebido en base64 — se lee de forma lazy (primera llamada)
let LOGO_B64 = null;
async function getLogoB64() {
  if (LOGO_B64 !== null) return LOGO_B64;
  try {
    const logoPath = path.resolve(__dirname, "../../../public/assets/img/log.png");
    const buf = await fs.promises.readFile(logoPath);
    LOGO_B64 = buf.toString("base64");
  } catch {
    LOGO_B64 = "";
  }
  return LOGO_B64;
}

const escHtml = (str) => String(str ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

// Hora local del servidor en zona Hermosillo (sin dependencia de API externa)
function getAhoraHermosillo() {
  const now  = new Date();
  const zona = new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Hermosillo",
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  }).formatToParts(now);
  const p = Object.fromEntries(zona.map(({ type, value }) => [type, value]));
  return `${p.day} de ${p.month} de ${p.year} a las ${p.hour}:${p.minute} ${p.dayPeriod.toLowerCase()}`;
}

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT) || 587,
  secure: parseInt(process.env.SMTP_PORT) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

if (process.env.SMTP_USER) {
  transporter.verify().then(() => {
    console.log("✅ Conexión SMTP verificada correctamente");
  }).catch(err => {
    console.error("⚠️  SMTP no disponible:", err.message);
  });
}

// ── Plantilla base ────────────────────────────────────────────
const wrap = (body, logoSrc) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
        style="max-width:520px;width:100%;background:#ffffff;
               border:1px solid #E5E7EB;
               box-shadow:0 2px 10px rgba(0,0,0,0.07);">

        <tr><td style="height:5px;background:linear-gradient(90deg,#F47920,#CC5200);"></td></tr>

        <tr>
          <td style="background:#1D1D1B;padding:24px 32px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:16px;border-right:2px solid rgba(244,121,32,0.5);vertical-align:middle;">
                  ${logoSrc
                    ? `<img src="${logoSrc}" alt="Precision Truck Parts" style="height:44px;width:auto;display:block;"/>`
                    : `<span style="color:#F47920;font-size:16px;font-weight:900;">PTP</span>`
                  }
                </td>
                <td style="padding-left:16px;vertical-align:middle;">
                  <p style="color:#F47920;font-size:9px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 3px;">Precision Truck Parts</p>
                  <p style="color:#ffffff;font-size:16px;font-weight:900;margin:0;">HelpDesk</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr><td style="padding:28px 32px;">${body}</td></tr>

        <tr>
          <td style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:14px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="color:#9CA3AF;font-size:10px;margin:0;">© 2026 <strong style="color:#F47920;">Precision Truck Parts and Accessories</strong></p>
                  <p style="color:#D1D5DB;font-size:10px;margin:3px 0 0;">Este correo fue generado automáticamente, no responda a este mensaje.</p>
                </td>
                <td align="right">
                  <p style="color:#D1D5DB;font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0;">Sistema HelpDesk</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr><td style="height:4px;background:linear-gradient(90deg,#F47920,#CC5200);"></td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ── Notificación de cambio de estatus de ticket ───────────────
export async function enviarNotificacionTicket({ to, nombre, folio, titulo, estatus, comentario }) {
  if (!process.env.SMTP_USER) return;

  const logoB64  = await getLogoB64();
  const logoSrc  = logoB64 ? `data:image/png;base64,${logoB64}` : "";

  const colorEstatus = estatus === "Resuelto" ? "#16a34a" : estatus === "No Resuelto" ? "#dc2626" : "#ea580c";
  const bgEstatus    = estatus === "Resuelto" ? "#dcfce7" : estatus === "No Resuelto" ? "#fee2e2"  : "#ffedd5";
  const labelEstatus = estatus === "Resuelto" ? "Resuelto" : estatus === "No Resuelto" ? "No Resuelto" : "En proceso";

  const body = `
    <p style="color:#1D1D1B;font-size:15px;font-weight:700;margin:0 0 4px;">Estimado(a) ${escHtml(nombre)},</p>
    <p style="color:#6B7280;font-size:13px;margin:0 0 24px;">Su ticket ha sido actualizado en el sistema HelpDesk.</p>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#F9FAFB;border:1px solid #E5E7EB;margin-bottom:20px;">
      <tr><td style="height:3px;background:linear-gradient(90deg,#F47920,#CC5200);"></td></tr>
      <tr>
        <td style="padding:18px 22px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="color:#9CA3AF;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 3px;">Folio</p>
                <p style="color:#F47920;font-family:monospace;font-size:17px;font-weight:900;margin:0;">${escHtml(folio)}</p>
              </td>
              <td align="right">
                <span style="display:inline-block;background:${bgEstatus};color:${colorEstatus};
                             border:1px solid ${colorEstatus};padding:4px 14px;
                             font-size:11px;font-weight:700;">
                  ${labelEstatus}
                </span>
              </td>
            </tr>
          </table>
          <div style="height:1px;background:#E5E7EB;margin:14px 0;"></div>
          <p style="color:#9CA3AF;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 4px;">Titulo</p>
          <p style="color:#1D1D1B;font-size:13px;font-weight:600;margin:0;">${escHtml(titulo)}</p>
        </td>
      </tr>
    </table>

    ${comentario ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="border-left:4px solid #F47920;padding:12px 16px;background:#FFF7ED;">
          <p style="color:#9CA3AF;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 5px;">Comentario del tecnico</p>
          <p style="color:#374151;font-size:13px;line-height:1.6;margin:0;">${escHtml(comentario)}</p>
        </td>
      </tr>
    </table>` : ""}

    <p style="color:#9CA3AF;font-size:11px;margin:0;line-height:1.6;">Ingrese al sistema para ver el detalle completo y calificar la atención recibida.</p>`;

  await transporter.sendMail({
    from:    process.env.SMTP_FROM,
    to,
    subject: `Ticket ${folio} - ${estatus} | Precision Truck Parts HelpDesk`,
    html:    wrap(body, logoSrc),
  });
}

// ── Código de recuperación de contraseña ─────────────────────
export async function enviarCodigoRecuperacion({ to, nombre, codigo }) {
  if (!process.env.SMTP_USER) return;

  const logoB64      = await getLogoB64();
  const logoSrc      = logoB64 ? `data:image/png;base64,${logoB64}` : "";
  const digitos      = String(codigo).split("");
  const partes       = nombre.trim().split(/\s+/);
  const primerNombre = escHtml(partes[0] ?? "");
  const apellido     = escHtml(partes.length > 1 ? partes[partes.length > 2 ? partes.length - 2 : 1] : "");
  const ahora        = getAhoraHermosillo();

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Recuperación de contraseña</title>
</head>
<body>
  <div style="background-color:#FFFFFF;color:#03124A;font-family:Avenir,'Avenir Next LT Pro',Montserrat,Corbel,'URW Gothic',source-sans-pro,sans-serif;font-size:16px;font-weight:400;letter-spacing:0.15px;line-height:1.5;margin:0;padding:32px 0;min-height:100%;width:100%;">

    <table align="center" width="100%" style="margin:0 auto;max-width:600px;background-color:#FFFFFF;" role="presentation" cellspacing="0" cellpadding="0" border="0">
      <tbody>
        <tr style="width:100%">
          <td>

            <table width="100%" cellpadding="0" cellspacing="0" border="0"
              style="border-bottom:3px solid #F97316;">
              <tr>
                <td style="padding:20px 24px;vertical-align:middle;">
                  <div style="color:#262626;font-size:18px;font-weight:800;line-height:1.3;">
                    Código de recuperación<br/>de contraseña
                  </div>
                  <div style="color:#9CA3AF;font-size:11px;margin-top:4px;letter-spacing:0.08em;text-transform:uppercase;">HelpDesk &middot; Precision Truck Parts</div>
                </td>
                <td style="padding:20px 24px;vertical-align:middle;text-align:right;width:160px;">
                  <img alt="Precision Truck Parts" src="cid:logoptp" height="52"
                    style="height:52px;width:auto;outline:none;border:none;text-decoration:none;vertical-align:middle;display:inline-block;max-width:100%;"/>
                </td>
              </tr>
            </table>

            <div style="font-size:15px;color:#4B5563;font-weight:normal;text-align:left;padding:12px 24px 20px 24px;line-height:1.6;">
              Hola <strong style="color:#111827;">${primerNombre} ${apellido}</strong>, hemos recibido una petición para restablecer
              la contraseña de tu cuenta. Usa el siguiente código para continuar.
            </div>

            <div style="padding:0 24px 8px 24px;">
              <div style="background-color:#111827;padding:20px 20px;border-left:4px solid #F97316;">
                <table align="center" width="100%" cellpadding="0" border="0" style="table-layout:fixed;border-collapse:collapse;">
                  <tbody style="width:100%">
                    <tr style="width:100%">
                      <td style="box-sizing:content-box;vertical-align:middle;padding-left:0;padding-right:14px;width:56px;">
                        <div style="width:52px;height:52px;border-radius:52px;background-color:#F97316;text-align:center;line-height:52px;font-size:18px;font-weight:900;color:#ffffff;">
                          ${primerNombre.charAt(0).toUpperCase()}${apellido.charAt(0).toUpperCase()}
                        </div>
                      </td>
                      <td style="box-sizing:content-box;vertical-align:middle;padding-left:0;padding-right:0;">
                        <div style="color:#ffffff;font-weight:700;font-size:17px;">${primerNombre} ${apellido}</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style="padding:16px 24px;">
              <hr style="width:100%;border:none;border-top:1px solid #EEEEEE;margin:0;"/>
            </div>

            <div style="padding:8px 24px;">
              <h3 style="font-weight:bold;text-align:left;margin:0;font-size:18px;padding:0 0 6px 0;color:#111827;">Código de confirmación</h3>
              <p style="font-size:13px;color:#6B7280;margin:0 0 16px 0;">Ingresa estos 6 dígitos en la pantalla de recuperación.</p>

              <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 8px auto;border-collapse:separate;border-spacing:0;">
                <tr>
                  ${digitos.map((d, i) => `
                  <td style="padding:0 ${i === 2 ? '8px' : '3px'} 0 ${i === 3 ? '8px' : '3px'};">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="
                          width:48px;height:60px;
                          background-color:#111827;
                          border-bottom:3px solid #F97316;
                          text-align:center;vertical-align:middle;
                          font-size:26px;font-weight:800;
                          color:#FFFFFF;
                          font-family:'Courier New',monospace;
                        ">${d}</td>
                      </tr>
                    </table>
                  </td>`).join("")}
                </tr>
              </table>
              <p style="text-align:center;font-family:'Courier New',monospace;font-size:16px;font-weight:900;letter-spacing:0.5em;color:#111827;background:#F3F4F6;padding:10px 0;margin:0 0 16px 0;user-select:all;">${String(codigo)}</p>

              <div style="padding:8px 0 0 0;"><hr style="width:100%;border:none;border-top:1px solid #EEEEEE;margin:0;"/></div>
            </div>

            <div style="padding:8px 24px 0 24px;">
              <div style="background-color:#FFFBEB;border:1px solid #FDE68A;border-left:4px solid #F59E0B;padding:14px 18px;font-size:14px;color:#92400E;">
                Válido por <strong>10 minutos</strong> &mdash; Solicitado el <strong>${ahora}</strong>.
              </div>
              <div style="padding:16px 0;"><hr style="width:100%;border:none;border-top:1px solid #EEEEEE;margin:0;"/></div>
            </div>

            <div style="padding:8px 24px 0 24px;">
              <h3 style="font-weight:bold;text-align:left;margin:0;font-size:18px;padding:0 0 14px 0;color:#111827;">Cómo usarlo</h3>
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
                ${[
                  ["1", "Regresa a la pantalla de recuperación de contraseña."],
                  ["2", "Ingresa el código de 6 dígitos en el campo indicado."],
                  ["3", "Establece tu nueva contraseña y confirma el cambio."],
                ].map(([n, t]) => `
                <tr>
                  <td style="vertical-align:top;padding-bottom:14px;padding-right:14px;width:32px;">
                    <div style="width:28px;height:28px;background-color:#F97316;border-radius:50%;text-align:center;line-height:28px;font-size:12px;font-weight:800;color:#ffffff;">${n}</div>
                  </td>
                  <td style="vertical-align:middle;padding-bottom:14px;border-bottom:1px solid #F3F4F6;">
                    <span style="font-size:14px;color:#374151;line-height:1.6;">${t}</span>
                  </td>
                </tr>`).join("")}
              </table>
              <div style="padding:0 0 16px 0;"><hr style="width:100%;border:none;border-top:1px solid #EEEEEE;margin:0;"/></div>
            </div>

            <div style="padding:8px 24px 0 24px;">
              <div style="background-color:#F9FAFB;border:1px solid #E5E7EB;padding:14px 18px;font-size:13px;color:#6B7280;line-height:1.6;">
                La seguridad de tu cuenta es nuestra prioridad. Si no realizaste esta solicitud,
                por favor ignora este mensaje o contacta a soporte técnico.
              </div>
              <div style="padding:16px 0;"><hr style="width:100%;border:none;border-top:1px solid #EEEEEE;margin:0;"/></div>
            </div>

            <div style="font-size:13px;font-weight:normal;text-align:left;padding:16px 24px 24px 24px;color:#6B7280;">
              &copy; 2026 <span style="color:#F97316;font-weight:600;">Precision Truck Parts and Accessories</span>. No respondas a este correo.
            </div>

          </td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from:    process.env.SMTP_FROM,
    to,
    subject: "Codigo de recuperacion de contraseña",
    html,
    attachments: logoB64 ? [{
      filename:    "logo.png",
      content:     logoB64,
      encoding:    "base64",
      cid:         "logoptp",
    }] : [],
  });
}
