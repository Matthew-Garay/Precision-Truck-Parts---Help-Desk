import jwt from "jsonwebtoken";

// SECRET se resuelve en tiempo de ejecución (después de dotenv.config())
function getSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) {
    console.error("JWT_SECRET no definido. El servidor no puede arrancar de forma segura.");
    process.exit(1);
  }
  return s;
}

export function requireAuth(req, res, next) {
  const header = req.headers["authorization"];
  if (!header?.startsWith("Bearer "))
    return res.status(401).json({ error: "No autorizado" });
  try {
    req.usuario = jwt.verify(header.slice(7), getSecret());
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
