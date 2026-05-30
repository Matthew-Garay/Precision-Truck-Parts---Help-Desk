import nodemailer from "nodemailer";

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

const BRAND_HEADER = `
  <div style="background:#1D1D1B;padding:20px 32px;text-align:center;">
    <p style="color:#F47920;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 4px;">Precision Truck Parts</p>
    <p style="color:#fff;font-size:17px;font-weight:900;margin:0;">HelpDesk</p>
  </div>`;

const BRAND_FOOTER = `
  <div style="background:#f8fafc;padding:14px 32px;border-top:1px solid #e2e8f0;">
    <p style="color:#cbd5e1;font-size:10px;margin:0;text-align:center;">© 2026 Precision Truck Parts and Accessories</p>
  </div>`;

const wrap = (body) => `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    ${BRAND_HEADER}
    <div style="padding:28px 32px;">${body}</div>
    ${BRAND_FOOTER}
  </div>`;

// -- Notificación de cambio de estatus de ticket ---------------
export async function enviarNotificacionTicket({ to, nombre, folio, titulo, estatus, comentario }) {
  if (!process.env.SMTP_USER) return; // SMTP no configurado - silencioso

  const colorEstatus = estatus === "Resuelto" ? "#16a34a" : estatus === "No Resuelto" ? "#dc2626" : "#ea580c";
  const iconEstatus  = estatus === "Resuelto" ? "✅" : estatus === "No Resuelto" ? "❌" : "🔄";

  const body = `
    <p style="color:#1D1D1B;font-size:15px;font-weight:700;margin:0 0 6px;">Hola, ${escHtml(nombre)}</p>
    <p style="color:#64748b;font-size:13px;margin:0 0 20px;">Tu ticket ha sido actualizado.</p>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
      <p style="color:#9ca3af;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px;">Folio</p>
      <p style="color:#F47920;font-family:monospace;font-size:16px;font-weight:900;margin:0 0 12px;">${escHtml(folio)}</p>
      <p style="color:#9ca3af;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px;">Título</p>
      <p style="color:#1D1D1B;font-size:13px;font-weight:600;margin:0 0 12px;">${escHtml(titulo)}</p>
      <p style="color:#9ca3af;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 6px;">Nuevo estatus</p>
      <span style="display:inline-block;background:${colorEstatus}18;color:${colorEstatus};border:1px solid ${colorEstatus}40;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;">
        ${iconEstatus} ${escHtml(estatus)}
      </span>
    </div>

    ${comentario ? `
    <div style="border-left:3px solid #F47920;padding:10px 14px;background:#fff7ed;border-radius:0 8px 8px 0;margin-bottom:20px;">
      <p style="color:#9ca3af;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px;">Comentario del técnico</p>
      <p style="color:#374151;font-size:13px;line-height:1.6;margin:0;">${escHtml(comentario)}</p>
    </div>` : ""}

    <p style="color:#94a3b8;font-size:11px;margin:0;">Ingresa al sistema para ver el detalle completo de tu ticket.</p>`;

  await transporter.sendMail({
    from:    process.env.SMTP_FROM,
    to,
    subject: `${iconEstatus} Ticket ${folio} - ${estatus} | Precision Truck Parts HelpDesk`,
    html:    wrap(body),
  });
}

// -- Código de recuperación de contraseña ---------------------
export async function enviarCodigoRecuperacion({ to, nombre, codigo }) {
  if (!process.env.SMTP_USER) return;

  const body = `
    <p style="color:#1D1D1B;font-size:15px;font-weight:700;margin:0 0 6px;">Hola, ${escHtml(nombre)}</p>
    <p style="color:#64748b;font-size:13px;margin:0 0 28px;">Usa el siguiente código para restablecer tu contraseña:</p>
    <div style="display:inline-block;background:#f8fafc;border:2px dashed #F47920;border-radius:12px;padding:18px 40px;margin-bottom:24px;">
      <span style="font-size:36px;font-weight:900;letter-spacing:0.18em;color:#1D1D1B;">${escHtml(codigo)}</span>
    </div>
    <p style="color:#94a3b8;font-size:11px;margin:0;">Este código expira en <strong>15 minutos</strong>.<br>Si no solicitaste este cambio, ignora este correo.</p>`;

  await transporter.sendMail({
    from:    process.env.SMTP_FROM,
    to,
    subject: "Código de recuperación - Precision Truck Parts HelpDesk",
    html:    wrap(body),
  });
}
