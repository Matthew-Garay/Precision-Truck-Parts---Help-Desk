/**
 * zohoController.js — Login con Zoho (Sign in using Zoho, OIDC Server-based).
 *
 * Flujo:
 *   1. GET /api/auth/zoho/login    → genera `state` antifalsificación (cookie
 *      httpOnly 10 min) y redirige al authorization endpoint de Zoho
 *      (scopes `openid email profile`).
 *   2. Zoho autentica y redirige a ZOHO_REDIRECT_URI con `code`.
 *   3. GET /api/auth/zoho/callback → valida `state`, intercambia `code` por
 *      tokens (el secret solo vive aquí), decodifica el `id_token`, extrae el
 *      email, lo empata con `empleado` (debe existir y estar activo, sin
 *      auto-altas), emite el MISMO JWT interno de 12h del login normal y
 *      redirige al frontend con la sesión lista.
 *
 * Env requeridas: ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_ACCOUNTS_URL,
 * ZOHO_REDIRECT_URI, ZOHO_SCOPES (opcional), APP_URL, JWT_SECRET
 */
import crypto from "crypto";
import jwt from "jsonwebtoken";
import Empleado from "../Models/Empleado.js";
import { validarEmailCorporativo } from "../Middlewares/validate.js";

const isProd = () => process.env.NODE_ENV === "production";
const errDetalle = (err) => (isProd() ? {} : { detalle: err?.message });

const zohoCfg = (req) => {
  const accountsUrl = (process.env.ZOHO_ACCOUNTS_URL || "https://accounts.zoho.com").replace(/\/+$/, "");
  // Redirect URI dinámico: responde al host real del navegador (misma LAN) y
  // acepta el valor fijo solo como respaldo. Zoho exige que el redirect_uri
  // enviado coincida LETRA POR LETRA con uno registrado en el API Console,
  // así que `resolverRedirectUri` filtra contra ZOHO_REDIRECT_URIS.
  const registradas = String(process.env.ZOHO_REDIRECT_URIS || process.env.ZOHO_REDIRECT_URI || "")
    .split(",").map(s => s.trim().replace(/\/+$/, "")).filter(Boolean);
  return {
    clientId:     process.env.ZOHO_CLIENT_ID     || "",
    clientSecret: process.env.ZOHO_CLIENT_SECRET || "",
    accountsUrl,
    redirectUri:  resolverRedirectUri(req, registradas),
    redirectUris: registradas,
    scopes:       process.env.ZOHO_SCOPES        || "openid,email,profile",
    appUrl:       resolverAppUrl(req),
  };
};

/**
 * Resuelve la URL pública del frontend.
 * SIEMPRE devuelve la canónica del .env (APP_URL → puerto 5173 en dev).
 * No se usa el Host del request porque en el callback el Host es el del
 * backend (:3001) y redirigir ahí rompe con `Cannot GET /login/zoho`.
 */
function resolverAppUrl(_req) {
  return (process.env.APP_URL || "http://192.168.31.124:5173").replace(/\/+$/, "");
}

/**
 * Elige el redirect_uri del backend que corresponde al host del navegador.
 * Solo devuelve URIs registradas en ZOHO_REDIRECT_URIS (filtro anti-spoofing):
 * si el host no tiene URI registrada, cae al primer valor registrado.
 */
function resolverRedirectUri(req, registradas) {
  const respaldo = registradas[0] || "";
  try {
    const host = String(req?.headers?.["x-forwarded-host"] || req?.headers?.host || "").split(",")[0].trim().split(":")[0];
    const candidata = registradas.find(u => {
      try { return new URL(u).hostname === host; } catch { return false; }
    });
    return candidata || respaldo;
  } catch {
    return respaldo;
  }
}

export const zohoHabilitado = () => {
  const cId  = process.env.ZOHO_CLIENT_ID || "";
  const cSec = process.env.ZOHO_CLIENT_SECRET || "";
  const uris = String(process.env.ZOHO_REDIRECT_URIS || process.env.ZOHO_REDIRECT_URI || "").trim();
  return Boolean(cId && cSec && uris);
};

/** GET /api/auth/zoho/login — inicia el flujo: state + redirect a Zoho. */
export const zohoLogin = (req, res) => {
  const c = zohoCfg(req);
  if (!zohoHabilitado())
    return res.status(503).json({ error: "Login con Zoho no configurado" });

  const state = crypto.randomBytes(24).toString("hex");
  res.cookie("zoho_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure:   isProd(),
    maxAge:   10 * 60 * 1000,
    path:     "/api/auth/zoho",
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id:     c.clientId,
    redirect_uri:  c.redirectUri,
    scope:         c.scopes.split(",").map(s => s.trim()).filter(Boolean).join(" "),
    state,
    access_type:   "offline",
    prompt:        "consent",
  });

  return res.redirect(302, `${c.accountsUrl}/oauth/v2/auth?${params.toString()}`);
};

/** Decodifica el payload (base64url) de un JWT sin verificar firma. */
function decodificarPayload(idToken) {
  const partes = String(idToken || "").split(".");
  if (partes.length < 2) throw new Error("id_token malformado");
  const b64 = partes[1].replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
}

/**
 * GET /api/auth/zoho/callback — Zoho redirige aquí con ?code=...&state=...
 * Pública (Zoho no envía Authorization). Intercambia el code, valida el
 * id_token, empata el email con `empleado` y emite el JWT interno.
 */
export const zohoCallback = async (req, res) => {
  const c = zohoCfg(req);
  if (!zohoHabilitado())
    return res.status(503).json({ error: "Login con Zoho no configurado" });

  try {
    const { code, state, error } = req.query;
    if (error) return redirigirError(res, `Zoho denegó el acceso (${error})`);

    const stateCookie = req.cookies?.zoho_oauth_state;
    res.clearCookie("zoho_oauth_state", { path: "/api/auth/zoho" });
    if (!state || !stateCookie || state !== stateCookie)
      return redirigirError(res, "Sesión OAuth inválida, intenta de nuevo");
    if (!code) return redirigirError(res, "Zoho no devolvió código de autorización");

    // 1) code → tokens (el secret solo existe en este servidor)
    const tokenRes = await fetch(`${c.accountsUrl}/oauth/v2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type:    "authorization_code",
        client_id:     c.clientId,
        client_secret: c.clientSecret,
        redirect_uri:  c.redirectUri,
        code:          String(code),
      }).toString(),
    });
    const tokens = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !tokens.id_token) {
      const msg = tokens.error || `Zoho respondió ${tokenRes.status}`;
      return redirigirError(res, `No se pudo validar con Zoho (${msg})`);
    }

    // 2) id_token → claims OIDC
    let claims;
    try {
      claims = decodificarPayload(tokens.id_token);
    } catch {
      return redirigirError(res, "Respuesta de Zoho inválida");
    }
    if (claims.aud !== c.clientId && claims.azp !== c.clientId)
      return redirigirError(res, "Token de Zoho no emitido para esta app");
    if (claims.exp && Date.now() / 1000 > claims.exp)
      return redirigirError(res, "Token de Zoho expirado, intenta de nuevo");

    const email = String(claims.email || "").trim().toLowerCase();
    if (!email) return redirigirError(res, "Zoho no compartió tu correo");

    // 3) Política corporativa (misma barrera que el login normal)
    const errEmail = validarEmailCorporativo(email);
    if (errEmail) return redirigirError(res, errEmail);

    // 4) El empleado debe existir y estar activo (sin auto-alta)
    const empleado = await Empleado.findByEmail(email);
    if (!empleado)
      return redirigirError(res, "Tu correo no está registrado, contacta al administrador");
    if (empleado.estatus?.toLowerCase() !== "activo")
      return redirigirError(res, "Cuenta desactivada, contacta al administrador");

    // 5) Mismo JWT interno + historial que el login normal
    await Empleado.cerrarSesionesHuerfanas(empleado.id_empleado);
    const id_acceso = await Empleado.registrarEntrada(empleado.id_empleado);
    const token = jwt.sign(
      { id_empleado: empleado.id_empleado, id_rol: empleado.id_rol, ver: empleado.token_version ?? 0 },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    const usuario = {
      id_empleado:     empleado.id_empleado,
      num_empleado:    empleado.num_empleado,
      nombre:          empleado.nombre,
      ap_paterno:      empleado.ap_paterno,
      ap_materno:      empleado.ap_materno || "",
      email:           empleado.email,
      foto:            empleado.foto || null,
      id_rol:          empleado.id_rol,
      rol:             empleado.id_rol === 1 ? "admin" : "usuario",
      departamento:    empleado.nombre_departamento,
      id_departamento: empleado.id_departamento,
      id_sucursal:     empleado.id_sucursal || null,
      sucursal:        empleado.nombre_sucursal || null,
      nombre_sucursal: empleado.nombre_sucursal || null,
    };

    // 6) Al frontend con la sesión lista (fragmento, no query: no queda en logs)
    const frag = new URLSearchParams({
      token,
      id_acceso: String(id_acceso),
      usuario:   JSON.stringify(usuario),
    }).toString();
    return res.redirect(302, `${c.appUrl}/login/zoho#${frag}`);
  } catch (err) {
    console.error("[Zoho callback]", err);
    if (errDetalle(err).detalle)
      return res.status(500).json({ error: "Error del servidor", ...errDetalle(err) });
    return redirigirError(res, "Error interno al validar con Zoho");
  }
};

/**
 * Redirige al frontend con el mensaje de error en query (con JWT limpio).
 * La pantalla de error está en el frontend, no en el backend.
 */
const redirigirError = (res, mensaje) => {
  const c = zohoCfg();
  // Redirect a la URL canónica del frontend (APP_URL, que apunta al Vite)
  return res.redirect(302, `${c.appUrl}/login?zoho_error=${encodeURIComponent(mensaje)}`);
};
