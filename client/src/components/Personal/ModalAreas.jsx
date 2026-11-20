/**
 * ModalAreas.jsx — Asignar cada puesto a su área (Personal → "Áreas").
 *
 * La tabla `departamento` guarda PUESTOS; las áreas los agrupan para los
 * reportes "Por área" y "Cada cuánto" del consumo de insumos. Un puesto sin
 * área aparece en esos reportes con su propio nombre.
 *
 * @module client/components/Personal/ModalAreas
 */
import { useEffect, useMemo, useState } from "react";
import { Layers } from "lucide-react";
import Modal from "../Modal.jsx";
import { apiFetch, textoError, textoExcepcion } from "../../services/api-client.js";
import { useToast } from "../Feedback.jsx";

export default function ModalAreas({ T, onClose }) {
  const toast = useToast();
  const [puestos, setPuestos] = useState(null);
  const [areas, setAreas] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [soloSinArea, setSoloSinArea] = useState(false);
  const [nueva, setNueva] = useState("");
  const [guardando, setGuardando] = useState(null);

  const cargar = async () => {
    try {
      const [rp, ra] = await Promise.all([apiFetch("/api/auth/departamentos"), apiFetch("/api/auth/areas")]);
      const [dp, da] = [await rp.json(), await ra.json()];
      if (!rp.ok || !ra.ok) throw new Error(textoError(rp.ok ? da : dp, rp.ok ? ra.status : rp.status, "No se pudieron cargar las áreas"));
      setPuestos(dp); setAreas(da);
    } catch (e) { toast.error(textoExcepcion(e, "No se pudieron cargar las áreas")); setPuestos([]); }
  };
  useEffect(() => { cargar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const asignar = async (p, id_area) => {
    setGuardando(p.id_departamento);
    try {
      const r = await apiFetch(`/api/auth/departamentos/${p.id_departamento}/area`, { method: "PATCH", body: { id_area: id_area || null } });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast.error(textoError(d, r.status, "No se pudo asignar")); return; }
      const area = areas.find(a => String(a.id_area) === String(id_area));
      setPuestos(ps => ps.map(x => x.id_departamento === p.id_departamento ? { ...x, id_area: id_area ? Number(id_area) : null, nombre_area: area?.nombre_area ?? null } : x));
    } catch (e) { toast.error(textoExcepcion(e)); }
    finally { setGuardando(null); }
  };

  const crear = async (e) => {
    e.preventDefault();
    const nombre = nueva.trim();
    if (!nombre) return;
    try {
      const r = await apiFetch("/api/auth/areas", { method: "POST", body: { nombre_area: nombre } });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast.error(textoError(d, r.status, "No se pudo crear el área")); return; }
      setAreas(a => [...a, { id_area: d.id_area, nombre_area: d.nombre_area, puestos: 0 }].sort((x, y) => x.nombre_area.localeCompare(y.nombre_area)));
      setNueva("");
      toast.success(`Área "${d.nombre_area}" creada`);
    } catch (e2) { toast.error(textoExcepcion(e2)); }
  };

  const lista = useMemo(() => (puestos ?? []).filter(p =>
    (!soloSinArea || !p.id_area) &&
    (!filtro.trim() || `${p.nombre_departamento} ${p.nombre_area ?? ""}`.toLowerCase().includes(filtro.trim().toLowerCase()))
  ), [puestos, filtro, soloSinArea]);
  const sinArea = (puestos ?? []).filter(p => !p.id_area).length;

  const inp = { height: 30, padding: "0 8px", borderRadius: 6, fontSize: 12, border: `1px solid ${T.border}`, background: T.bg, color: T.text };
  return (
    <Modal T={T} title="Áreas de los puestos" subtitle="Para los reportes por área" icon={<Layers size={15} />}
      onClose={onClose} cancelLabel="Cerrar" maxWidth="720px">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <p style={{ margin: 0, fontSize: 12, color: T.textMuted, lineHeight: 1.5 }}>
          Cada puesto pertenece a un área (por ejemplo, Contralor y Asistente de Contraloría → Contraloría).
          Los reportes de consumo "Por área" y "Cada cuánto" usan esta asignación. Los cambios se guardan al elegir.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <input value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="Buscar puesto o área…" style={{ ...inp, flex: "1 1 180px" }} />
          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: T.text, cursor: "pointer" }}>
            <input type="checkbox" checked={soloSinArea} onChange={e => setSoloSinArea(e.target.checked)} />
            Solo sin área ({sinArea})
          </label>
          <form onSubmit={crear} style={{ display: "flex", gap: 6 }}>
            <input value={nueva} onChange={e => setNueva(e.target.value)} placeholder="Nueva área…" maxLength={100} style={{ ...inp, width: 150 }} />
            <button type="submit" disabled={!nueva.trim()} style={{ ...inp, background: T.orange, color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", opacity: nueva.trim() ? 1 : 0.5 }}>Crear</button>
          </form>
        </div>
        <div style={{ maxHeight: "50vh", overflowY: "auto", border: `1px solid ${T.border}`, borderRadius: 8 }}>
          {puestos === null ? <p style={{ padding: 12, margin: 0, fontSize: 12, color: T.textMuted }}>Cargando…</p> : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <tbody>
                {lista.map(p => (
                  <tr key={p.id_departamento} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: "6px 10px", color: T.text, fontWeight: 600 }}>{p.nombre_departamento}</td>
                    <td style={{ padding: "4px 10px", width: 260 }}>
                      <select value={p.id_area ?? ""} disabled={guardando === p.id_departamento}
                        onChange={e => asignar(p, e.target.value)}
                        aria-label={`Área de ${p.nombre_departamento}`}
                        style={{ ...inp, width: "100%", color: p.id_area ? T.text : "#d97706", fontWeight: p.id_area ? 500 : 700 }}>
                        <option value="">— Sin área —</option>
                        {areas.map(a => <option key={a.id_area} value={a.id_area}>{a.nombre_area}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {lista.length === 0 && <tr><td style={{ padding: 12, color: T.textMuted }}>Sin resultados.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Modal>
  );
}
