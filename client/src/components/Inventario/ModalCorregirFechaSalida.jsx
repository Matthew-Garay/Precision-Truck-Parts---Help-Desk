/**
 * ModalCorregirFechaSalida.jsx — Corrige la fecha de una salida interna (SAL-…).
 *
 * Sustituye las correcciones que antes se hacían directo en la base de datos.
 * El servidor cambia la fecha de la salida y de sus renglones de inventario y
 * guarda el cambio (anterior → nuevo, motivo, quién y cuándo). Aquí se muestra
 * también el historial de correcciones de esa salida.
 *
 * Reglas (las valida el servidor): no anulada, no futura y dentro del mismo
 * mes del folio (SAL-AAAAMM-…).
 *
 * Props: salida { folio, id_salida_num, fecha }, T, onClose, onGuardado
 */
import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import Modal from "../Modal.jsx";
import { apiFetch, textoError, textoExcepcion } from "../../services/api-client.js";
import { useToast } from "../Feedback.jsx";
import { aFecha, fechaCorta, fechaHora, isoLocal, hoyISO } from "../../utils/fechas.js";

export default function ModalCorregirFechaSalida({ salida, T, onClose, onGuardado }) {
  const toast = useToast();
  const actual = aFecha(salida.fecha);
  const [fecha,    setFecha]    = useState(actual ? isoLocal(actual) : "");
  const [motivo,   setMotivo]   = useState("");
  const [guardando, setGuardando] = useState(false);
  const [cambios,  setCambios]  = useState(null);

  // Límites del input: el mes del folio (SAL-AAAAMM-…) y nunca después de hoy.
  const fol = String(salida.folio || "").match(/^SAL-(\d{4})(\d{2})-/);
  const min = fol ? `${fol[1]}-${fol[2]}-01` : undefined;
  const finMes = fol ? isoLocal(new Date(Number(fol[1]), Number(fol[2]), 0)) : undefined;
  const hoy = hoyISO();
  const max = finMes && finMes < hoy ? finMes : hoy;

  useEffect(() => {
    let vivo = true;
    apiFetch(`/api/solicitudes/salidas/${Number(salida.id_salida_num)}/cambios`)
      .then(r => (r.ok ? r.json() : []))
      .then(d => { if (vivo) setCambios(Array.isArray(d) ? d : []); })
      .catch(() => { if (vivo) setCambios([]); });
    return () => { vivo = false; };
  }, [salida.id_salida_num]);

  const guardar = async () => {
    if (!fecha) { toast.error("Elige la fecha correcta"); return; }
    if (motivo.trim().length < 5) { toast.error("Escribe el motivo (mínimo 5 caracteres)"); return; }
    setGuardando(true);
    try {
      const r = await apiFetch(`/api/solicitudes/salidas/${Number(salida.id_salida_num)}/fecha`, {
        method: "PUT", body: { fecha, motivo: motivo.trim() },
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast.error(textoError(d, r.status, "No se pudo corregir la fecha")); return; }
      toast.success(`Salida ${d.folio}: fecha cambiada de ${d.fecha_anterior} a ${d.fecha_nueva}`);
      onGuardado?.();
      onClose();
    } catch (e) {
      toast.error(textoExcepcion(e, "No se pudo corregir la fecha"));
    } finally {
      setGuardando(false);
    }
  };

  const campo = { padding: 8, borderRadius: 6, fontSize: 13, border: `1px solid ${T.border}`, background: T.bg, color: T.text };
  const etiqueta = { display: "flex", flexDirection: "column", gap: 4, fontSize: 11, fontWeight: 700, color: T.textMuted };

  return (
    <Modal T={T} title={`Corregir fecha de ${salida.folio}`} subtitle="Salida interna"
      icon={<CalendarClock size={15} />} loading={guardando} confirmLabel="Guardar fecha"
      onClose={() => !guardando && onClose()} onConfirm={guardar}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <p style={{ margin: 0, fontSize: 13, color: T.text }}>
          Fecha registrada: <b>{fechaHora(salida.fecha)}</b>
        </p>
        <label style={etiqueta}>
          FECHA CORRECTA
          <input type="date" value={fecha} min={min} max={max} onChange={e => setFecha(e.target.value)} style={campo} />
        </label>
        <p style={{ margin: 0, fontSize: 11, color: T.textMuted }}>
          Se conserva la hora. La fecha debe quedar en el mismo mes del folio
          {fol ? ` (${fol[2]}/${fol[1]})` : ""}; si la salida fue en otro mes, anúlala y captúrala de nuevo.
        </p>
        <label style={etiqueta}>
          MOTIVO DE LA CORRECCIÓN
          <textarea value={motivo} onChange={e => setMotivo(e.target.value)} maxLength={500} rows={2} autoFocus
            placeholder="Ej. Se capturó con la fecha del día equivocado"
            style={{ ...campo, resize: "vertical" }} />
        </label>

        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
          <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: T.textMuted }}>CORRECCIONES ANTERIORES</p>
          {cambios === null ? (
            <p style={{ margin: 0, fontSize: 12, color: T.textFaint }}>Cargando…</p>
          ) : cambios.length === 0 ? (
            <p style={{ margin: 0, fontSize: 12, color: T.textFaint }}>Esta salida no se ha corregido antes.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: T.text, maxHeight: 120, overflowY: "auto" }}>
              {cambios.map(c => (
                <li key={c.id_cambio} style={{ marginBottom: 4 }}>
                  <b>{c.valor_anterior} → {c.valor_nuevo}</b>
                  <span style={{ color: T.textMuted }}> · {fechaCorta(c.fecha)}{c.empleado ? ` · ${c.empleado}` : ""}</span>
                  <br /><span style={{ color: T.textMuted }}>{c.motivo}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
