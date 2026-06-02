import nodemailer from "nodemailer";
import fs         from "fs";
import path       from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Logo embebido en base64 para que se vea en cualquier cliente de correo
let LOGO_B64 = "";
try {
  const logoPath = path.resolve(__dirname, "../../../public/assets/img/logo negro.png");
  LOGO_B64 = fs.readFileSync(logoPath).toString("base64");
} catch { /* si no encuentra el logo, el correo se envía sin él */ }

const LOGO_SRC = LOGO_B64
  ? `data:image/png;base64,${LOGO_B64}`
  : "";

// Escapa caracteres HTML para evitar XSS en el cuerpo del correo
const escHtml = (str) => String(str ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT) || 587,
  secure: parseInt(process.env.SMTP_PORT) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

// ── Plantilla base ────────────────────────────────────────────
const wrap = (body) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#1D1D1B 0%,#2d2d2b 100%);padding:0;">
            <!-- Banda naranja superior -->
            <div style="height:4px;background:linear-gradient(90deg,#F47920,#ffb347,#F47920);"></div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:24px 32px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-right:16px;border-right:2px solid rgba(244,121,32,0.4);">
                        ${LOGO_SRC
                          ? `<img src="${LOGO_SRC}" alt="Precision Truck Parts" style="height:48px;width:auto;display:block;filter:brightness(0) invert(1);"/>`
                          : `<p style="color:#F47920;font-size:18px;font-weight:900;margin:0;">PTP</p>`
                        }
                      </td>
                      <td style="padding-left:16px;">
                        <p style="color:#F47920;font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 3px;">Precision Truck Parts</p>
                        <p style="color:#ffffff;font-size:16px;font-weight:900;margin:0;letter-spacing:-0.02em;">HelpDesk</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CUERPO -->
        <tr>
          <td style="padding:32px 32px 28px;">
            ${body}
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="color:#94a3b8;font-size:10px;margin:0;">© 2026 <strong style="color:#F47920;">Precision Truck Parts and Accessories</strong></p>
                  <p style="color:#cbd5e1;font-size:10px;margin:4px 0 0;">Este correo fue generado automáticamente, no respondas a este mensaje.</p>
                </td>
                <td align="right">
                  <p style="color:#cbd5e1;font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0;">Sistema HelpDesk</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ── Notificación de cambio de estatus de ticket ───────────────
export async function enviarNotificacionTicket({ to, nombre, folio, titulo, estatus, comentario }) {
  if (!process.env.SMTP_USER) return;

  const colorEstatus = estatus === "Resuelto" ? "#16a34a" : estatus === "No Resuelto" ? "#dc2626" : "#ea580c";
  const bgEstatus    = estatus === "Resuelto" ? "#dcfce7" : estatus === "No Resuelto" ? "#fee2e2"  : "#ffedd5";
  const iconEstatus  = estatus === "Resuelto" ? "✅" : estatus === "No Resuelto" ? "❌" : "🔄";

  const body = `
    <p style="color:#1D1D1B;font-size:16px;font-weight:700;margin:0 0 4px;">Hola, ${escHtml(nombre)} 👋</p>
    <p style="color:#64748b;font-size:13px;margin:0 0 24px;">Tu ticket ha sido actualizado en el sistema HelpDesk.</p>

    <!-- Tarjeta ticket -->
    <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:20px;">
      <div style="background:linear-gradient(90deg,#F47920,#ffb347);height:3px;"></div>
      <div style="padding:20px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <p style="color:#9ca3af;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 3px;">Folio</p>
              <p style="color:#F47920;font-family:monospace;font-size:18px;font-weight:900;margin:0;">${escHtml(folio)}</p>
            </td>
            <td align="right">
              <span style="display:inline-block;background:${bgEstatus};color:${colorEstatus};border:1.5px solid ${colorEstatus}50;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;">
                ${iconEstatus} ${escHtml(estatus)}
              </span>
            </td>
          </tr>
        </table>
        <div style="height:1px;background:#e2e8f0;margin:14px 0;"></div>
        <p style="color:#9ca3af;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 4px;">Título</p>
        <p style="color:#1D1D1B;font-size:13px;font-weight:600;margin:0;">${escHtml(titulo)}</p>
      </div>
    </div>

    ${comentario ? `
    <div style="border-left:3px solid #F47920;padding:12px 16px;background:#fff7ed;border-radius:0 10px 10px 0;margin-bottom:20px;">
      <p style="color:#9ca3af;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 5px;">💬 Comentario del técnico</p>
      <p style="color:#374151;font-size:13px;line-height:1.6;margin:0;">${escHtml(comentario)}</p>
    </div>` : ""}

    <p style="color:#94a3b8;font-size:11px;margin:0;line-height:1.6;">Ingresa al sistema para ver el detalle completo y calificar la atención recibida.</p>`;

  await transporter.sendMail({
    from:    process.env.SMTP_FROM,
    to,
    subject: `${iconEstatus} Ticket ${folio} — ${estatus} | Precision Truck Parts HelpDesk`,
    html:    wrap(body),
  });
}

// ── Código de recuperación de contraseña ─────────────────────
export async function enviarCodigoRecuperacion({ to, nombre, codigo }) {
  if (!process.env.SMTP_USER) return;

  // Separar el código en dígitos para mostrarlos en cajas individuales
  const digitos = String(codigo).split("").map(d => `
    <td style="padding:0 4px;">
      <div style="width:40px;height:52px;background:#ffffff;border:2px solid #F47920;border-radius:10px;text-align:center;line-height:52px;font-size:26px;font-weight:900;color:#1D1D1B;box-shadow:0 2px 8px rgba(244,121,32,0.2);">
        ${d}
      </div>
    </td>`).join("");

  const body = `
    <p style="color:#1D1D1B;font-size:16px;font-weight:700;margin:0 0 4px;">Hola, ${escHtml(nombre)} 👋</p>
    <p style="color:#64748b;font-size:13px;margin:0 0 28px;">Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente código:</p>

    <!-- Código en cajas -->
    <div style="text-align:center;margin-bottom:28px;">
      <table cellpadding="0" cellspacing="0" style="display:inline-table;">
        <tr>${digitos}</tr>
      </table>
    </div>

    <!-- Info expiración -->
    <div style="background:#fff7ed;border:1.5px solid #fed7aa;border-radius:10px;padding:14px 20px;margin-bottom:24px;text-align:center;">
      <p style="color:#ea580c;font-size:12px;font-weight:700;margin:0;">⏱ Este código expira en <strong>15 minutos</strong></p>
    </div>

    <!-- Divisor -->
    <div style="height:1px;background:#e2e8f0;margin:0 0 20px;"></div>

    <!-- Advertencia -->
    <div style="display:flex;align-items:flex-start;gap:10px;">
      <p style="color:#94a3b8;font-size:11px;margin:0;line-height:1.7;">
        🔒 <strong style="color:#64748b;">¿No solicitaste este cambio?</strong><br>
        Puedes ignorar este correo de forma segura. Tu contraseña no cambiará hasta que uses este código.
      </p>
    </div>`;

  await transporter.sendMail({
    from:    process.env.SMTP_FROM,
    to,
    subject: "🔐 Código de recuperación — Precision Truck Parts HelpDesk",
    html:    wrap(body),
  });
}
