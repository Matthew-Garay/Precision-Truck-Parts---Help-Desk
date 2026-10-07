/**
 * ZohoCallbackPage.jsx
 *
 * Página receptora del login con Zoho. El backend (zohoCallback) redirige aquí
 * con la sesión lista en el FRAGMENTO de la URL:
 *   /login/zoho#token=...&id_acceso=...&usuario={...}
 *
 * Se usa fragmento (#) en vez de query (?) para que el JWT no quede en logs
 * del servidor ni en el historial con query visible. Al montar:
 *   1. Lee el fragmento, valida que traiga token + usuario.
 *   2. Persiste con setUsuario / setIdAcceso / setToken (igual que el login).
 *   3. Llama onLogin para navegar al dashboard según el rol.
 * Si falta algo, muestra el error y ofrece volver al login.
 */
import { useEffect, useState } from "react";
import { setToken } from "../Config/api";
import { setUsuario, setIdAcceso } from "../Config/session";

export default function ZohoCallbackPage({ onLogin }) {
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const frag = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const token     = frag.get("token");
      const idAcceso  = frag.get("id_acceso");
      const usuarioRaw = frag.get("usuario");

      // Limpiar el fragmento de la barra de direcciones (no dejar el JWT visible)
      window.history.replaceState(null, "", window.location.pathname);

      if (!token || !usuarioRaw) {
        setError("No se recibió la sesión de Zoho. Intenta de nuevo.");
        return;
      }
      const usuario = JSON.parse(usuarioRaw);
      if (!usuario?.id_empleado || !usuario?.rol) {
        setError("Sesión de Zoho incompleta. Intenta de nuevo.");
        return;
      }

      setUsuario(usuario);
      if (idAcceso) setIdAcceso(idAcceso);
      setToken(token);
      onLogin?.(usuario, idAcceso ? parseInt(idAcceso, 10) : null, token);
    } catch {
      setError("No se pudo completar el inicio con Zoho.");
    }
    // Solo al montar: el fragmento se consume una vez
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!error) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
        <div className="login-spinner" aria-label="Completando inicio con Zoho" />
        <p style={{ color: "#64748B", fontSize: 13 }}>Completando inicio de sesión con Zoho…</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", border: "1px solid #FECACA", borderRadius: 8, padding: "20px 24px", maxWidth: 420, textAlign: "center" }}>
        <p style={{ color: "#B91C1C", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>No se pudo iniciar con Zoho</p>
        <p style={{ color: "#64748B", fontSize: 12, marginBottom: 16 }}>{error}</p>
        <a href="/login" style={{ color: "#F47920", fontSize: 13, fontWeight: 600 }}>Volver al inicio de sesión</a>
      </div>
    </div>
  );
}
