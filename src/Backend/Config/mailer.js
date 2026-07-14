import nodemailer        from "nodemailer";
import fs                from "fs";
import path              from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Logo embebido ─────────────────────────────────────────────
function cargarLogoBase64() {
  const candidatos = [
    path.resolve(__dirname, "../../../public/assets/img/log.png"),
    path.resolve(__dirname, "../../../public/assets/img/logo.png"),
    path.resolve(__dirname, "../../../public/assets/img/logo negro.png"),
  ];
  for (const ruta of candidatos) {
    if (fs.existsSync(ruta)) {
      const b64 = fs.readFileSync(ruta).toString("base64");
      const ext  = path.extname(ruta).slice(1);
      console.log(`[mailer] Logo OK: ${path.basename(ruta)} (${b64.length} chars)`);
      return `data:image/${ext};base64,${b64}`;
    }
  }
  console.warn("[mailer] Logo no encontrado");
  return null;
}

const LOGO_B64 = cargarLogoBase64();

// ── Helpers ───────────────────────────────────────────────────
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function getAhoraHermosillo() {
  const zona = new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Hermosillo",
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  }).formatToParts(new Date());
  const p = Object.fromEntries(zona.map(({ type, value }) => [type, value]));
  return `${p.day} de ${p.month} de ${p.year} a las ${p.hour}:${p.minute} ${p.dayPeriod?.toLowerCase()}`;
}

// ── Transporter ───────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT) || 587,
  secure: parseInt(process.env.SMTP_PORT) === 465,
  auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

if (process.env.SMTP_USER) {
  transporter.verify()
    .then(() => console.log("✅ SMTP verificado"))
    .catch(e  => console.error("⚠️  SMTP no disponible:", e.message));
}

// ── Plantilla ─────────────────────────────────────────────────
const emailTemplate = (body) => `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>Precision Truck Parts - HelpDesk</title>
  <style>
    body,table,td,p,a,span,div { font-family:Arial,Helvetica,sans-serif !important; }
    @media (prefers-color-scheme:dark){
      .bg-outer  { background-color:#111111 !important; }
      .bg-card   { background-color:#1C1C1C !important; border-color:#2A2A2A !important; }
      .bg-hdr    { background-color:#0D0D0D !important; border-color:#F47920 !important; }
      .bg-body   { background-color:#1C1C1C !important; }
      .bg-footer { background-color:#141414 !important; border-color:#252525 !important; }
      .t-main    { color:#EEEEEE !important; }
      .t-sub     { color:#999999 !important; }
      .t-footer  { color:#555555 !important; }
      .t-footer-b{ color:#777777 !important; }
      .bg-warn   { background-color:#1F1800 !important; border-color:#4A3000 !important; }
      .t-warn    { color:#F5C842 !important; }
      .t-warn-s  { color:#C49A20 !important; }
      .bg-sec    { background-color:#1C1C1C !important; border-color:#2A2A2A !important; }
      .t-sec     { color:#666666 !important; }
      .t-sec-b   { color:#AAAAAA !important; }
      .code-d    { background-color:#252525 !important; border-color:#383838 !important; color:#FFFFFF !important; }
      .step-row  { border-color:#2A2A2A !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#E5E5E5;">

<table class="bg-outer" role="presentation" width="100%" cellpadding="0" cellspacing="0"
  style="background:#E5E5E5;padding:40px 16px;">
  <tr><td align="center">

    <table class="bg-card" role="presentation" width="600" cellpadding="0" cellspacing="0"
      style="max-width:600px;width:100%;background:#FFFFFF;border:1px solid #CCCCCC;">

      <!-- Franja naranja top -->
      <tr><td style="height:5px;background:#F47920;font-size:0;line-height:0;">&nbsp;</td></tr>

      <!-- HEADER -->
      <tr>
        <td class="bg-hdr" style="background:#161616;padding:20px 36px;border-bottom:2px solid #F47920;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:middle;width:1%;white-space:nowrap;">
                ${LOGO_B64
                  ? `<img src="${LOGO_B64}" alt="Precision Truck Parts" width="110"
                       style="display:block;border:0;height:auto;max-height:46px;"/>`
                  : `<span style="color:#F47920;font-size:20px;font-weight:900;letter-spacing:0.04em;">PTP</span>`
                }
              </td>
              <td style="vertical-align:middle;width:1px;padding:0 18px;">
                <div style="width:1px;height:34px;background:#3A3A3A;"></div>
              </td>
              <td style="vertical-align:middle;">
                <p style="margin:0;font-size:14px;font-weight:700;line-height:1;color:#FFFFFF;">
                  <span style="color:#F47920;">Precision Truck Parts</span>&nbsp;<span style="color:#555555;">-</span>&nbsp;<span style="color:#FFFFFF;">HelpDesk</span>
                </p>
              </td>
              <td align="right" style="vertical-align:middle;white-space:nowrap;padding-left:12px;">
                <span style="display:inline-block;background:#F47920;color:#111111;
                  font-size:8px;font-weight:900;letter-spacing:0.16em;text-transform:uppercase;
                  padding:5px 12px;">RECUPERACI&Oacute;N DE CONTRASE&Ntilde;A</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td class="bg-body" style="background:#FFFFFF;padding:36px;">
          ${body}
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td class="bg-footer" style="background:#F5F5F5;border-top:1px solid #E0E0E0;padding:18px 36px;">
          <p class="t-footer-b" style="margin:0 0 5px 0;color:#222222;font-size:11px;font-weight:700;">
            Precision Truck Parts and Accessories &mdash; HelpDesk &copy; 2026
          </p>
          <p class="t-footer" style="margin:0;color:#888888;font-size:10px;line-height:1.6;">
            Este mensaje fue generado de forma autom&aacute;tica por el sistema HelpDesk.
            Si no esperabas este correo, puedes ignorarlo con seguridad.
            Por favor no respondas directamente a este mensaje.
          </p>
        </td>
      </tr>

      <!-- Franja naranja bottom -->
      <tr><td style="height:4px;background:#F47920;font-size:0;line-height:0;">&nbsp;</td></tr>

    </table>

  </td></tr>
</table>

</body>
</html>`;

// ── Correo: código de recuperación ───────────────────────────
export async function enviarCodigoRecuperacion({ to, nombre, codigo }) {
  if (!process.env.SMTP_USER) return;

  const partes   = nombre.trim().split(/\s+/);
  const nombre1  = esc(partes[0] ?? "");
  const apellido = esc(partes.length > 1 ? partes[partes.length > 2 ? partes.length - 2 : 1] : "");
  const digitos  = String(codigo).split("");
  const ahora    = getAhoraHermosillo();

  const celda = (d) =>
    `<td style="padding:0 5px;">
      <div class="code-d" style="width:48px;height:60px;background:#F7F7F7;border:1px solid #DDDDDD;
        border-bottom:3px solid #F47920;text-align:center;line-height:60px;
        font-size:28px;font-weight:700;color:#111111;
        font-family:'Courier New',Courier,monospace;">${d}</div>
    </td>`;

  const body = `
    <!-- Saludo -->
    <h1 class="t-main" style="margin:0 0 10px 0;color:#111111;font-size:22px;font-weight:700;line-height:1.3;">
      Hola, ${nombre1} ${apellido}
    </h1>

    <p class="t-sub" style="margin:0 0 28px 0;color:#555555;font-size:14px;font-weight:400;line-height:1.75;">
      Recibimos una solicitud para restablecer la contrase&ntilde;a de tu cuenta en el sistema
      HelpDesk de Precision Truck Parts.
      Usa el c&oacute;digo de verificaci&oacute;n que aparece a continuaci&oacute;n para continuar.
    </p>

    <!-- Label código -->
    <p class="t-sub" style="margin:0 0 14px 0;color:#888888;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;">
      C&oacute;digo de verificaci&oacute;n &mdash; 6 d&iacute;gitos
    </p>

    <!-- Dígitos -->
    <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:0 auto 10px auto;">
      <tr>
        ${digitos.slice(0, 3).map(celda).join("")}
        <td style="padding:0 10px;vertical-align:middle;">
          <div style="width:12px;height:3px;background:#F47920;"></div>
        </td>
        ${digitos.slice(3).map(celda).join("")}
      </tr>
    </table>

    <!-- Código texto -->
    <p style="text-align:center;font-family:'Courier New',Courier,monospace;
      font-size:22px;font-weight:900;letter-spacing:0.55em;color:#F47920;margin:0 0 30px 0;">
      ${String(codigo)}
    </p>

    <!-- Expiración -->
    <table class="bg-warn" role="presentation" cellpadding="0" cellspacing="0" width="100%"
      style="background:#FFFBEB;border:1px solid #FDE68A;border-left:4px solid #F47920;margin-bottom:28px;">
      <tr>
        <td style="padding:13px 18px;">
          <p class="t-warn" style="margin:0 0 3px 0;color:#92400E;font-size:13px;font-weight:700;">
            C&oacute;digo v&aacute;lido por 10 minutos
          </p>
          <p class="t-warn-s" style="margin:0;color:#B45309;font-size:12px;line-height:1.5;">
            Solicitado el <strong style="color:#78350F;">${ahora}</strong>
          </p>
        </td>
      </tr>
    </table>

    <!-- Cómo usarlo -->
    <p class="t-main" style="margin:0 0 14px 0;color:#111111;font-size:13px;font-weight:700;letter-spacing:0.03em;">
      C&oacute;mo usar tu c&oacute;digo
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
      ${[
        ["1", "Regresa a la pantalla de recuperaci&oacute;n de contrase&ntilde;a."],
        ["2", "Ingresa el c&oacute;digo de 6 d&iacute;gitos en el campo indicado."],
        ["3", "Crea tu nueva contrase&ntilde;a y confirma el cambio."],
      ].map(([n, txt], i, arr) => `
      <tr>
        <td style="vertical-align:top;padding-right:14px;padding-bottom:${i < arr.length - 1 ? "12px" : "0"};width:32px;">
          <div style="width:26px;height:26px;background:#F47920;border-radius:50%;
            text-align:center;line-height:26px;font-size:11px;font-weight:900;color:#FFFFFF;">${n}</div>
        </td>
        <td class="step-row" style="vertical-align:middle;padding-bottom:${i < arr.length - 1 ? "12px" : "0"};
          ${i < arr.length - 1 ? "border-bottom:1px solid #EEEEEE;" : ""}">
          <p class="t-sub" style="margin:0;color:#555555;font-size:13px;line-height:1.65;">${txt}</p>
        </td>
      </tr>`).join("")}
    </table>

    <!-- Seguridad -->
    <table class="bg-sec" role="presentation" cellpadding="0" cellspacing="0" width="100%"
      style="background:#F7F7F7;border:1px solid #E5E5E5;">
      <tr>
        <td style="padding:13px 18px;">
          <p class="t-sec" style="margin:0;color:#777777;font-size:12px;line-height:1.7;">
            <strong class="t-sec-b" style="color:#333333;">Aviso de seguridad:</strong>
            Si no realizaste esta solicitud, ignora este mensaje. Tu contrase&ntilde;a no ser&aacute; modificada.
            Si crees que tu cuenta est&aacute; en riesgo, contacta al administrador del sistema.
          </p>
        </td>
      </tr>
    </table>`;

  await transporter.sendMail({
    from:    process.env.SMTP_FROM,
    to,
    subject: "=?UTF-8?Q?C=C3=B3digo_de_recuperaci=C3=B3n?=",
    html:    emailTemplate(body),
  });
}
