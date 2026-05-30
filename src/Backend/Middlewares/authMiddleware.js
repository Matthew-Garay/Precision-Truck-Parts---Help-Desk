import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  console.error("JWT_SECRET no definido. El servidor no puede arrancar de forma segura.");
  process.exit(1);
}

export function requireAuth(req, res, next) {
  const header = req.headers["authorization"];
  if (!header?.startsWith("Bearer "))
    return res.status(401).json({ error: "No autorizado" });
  try {
    req.usuario = jwt.verify(header.slice(7), SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

export function requireAdmin(req, res, next) {
  if (req.usuario?.id_rol !== 1)
    return res.status(403).json({ error: "Acceso restringido a administradores" });
  next();
}
