/**
 * ModalReporte.jsx
 * Usa el componente Modal base con ARIA completo.
 *
 * Props:
 *   T         — tokens del tema activo
 *   admins    — [{ id_empleado, nombre_completo }]
 *   onClose   — cerrar sin generar
 *   onGenerar — function({ fecha_inicio, fecha_fin, id_tecnico })
 *   generando — boolean
 */
import { useState } from "react";
import { FileDown } from "lucide-react";
import { NEUTRAL, SLATE, RADIUS } from "../Config/DesignSystem";
import Modal from "./Modal";

const ORANGE = "#F47920";

export default function ModalReporte({ T, admins = [], onClose, onGenerar, generando = false }) {
  const hoy = new Date().toISOString().slice(0, 10);
  const primerDiaMes = hoy.slice(0, 8) + "01";
  const [params, setParams] = useState({ fecha_inicio: primerDiaMes, fecha_fin: hoy, id_tecnico: "todos" });
  const set    = (k, v) => setParams(p => ({ ...p, [k]: v }));
  const valido = params.fecha_inicio && params.fecha_fin;
  const isDark = T?.isDark ?? false;
  const border = T?.border ?? SLATE[200];

  const inpSt = {
    background:  isDark ? "rgba(255,255,255,0.05)" : NEUTRAL.slate50,
    border:      `1px solid ${border}`,
    color:       T?.text ?? SLATE[700],
    outline:     "none",
    borderRadius: RADIUS.sm,
    padding:     "8px 12px",
    fontSize:    "13px",
    width:       "100%",
    transition:  "border-color 0.15s",
    colorScheme: isDark ? "dark" : "light",
  };

  const Field = ({ htmlFor, label, children }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label
        htmlFor={htmlFor}
        style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.06em", color: T?.textMuted ?? SLATE[600] }}
      >
        {label}
      </label>
      {children}
    </div>
  );

  return (
    <Modal
      T={T}
      title="Generar Reporte"
      subtitle="Define el rango y los parámetros"
      icon={<FileDown size={14} aria-hidden="true" />}
      onClose={onClose}
      onConfirm={valido && !generando ? () => onGenerar(params) : undefined}
      confirmLabel={generando ? "Generando…" : "Generar Reporte"}
      loading={generando}
      maxWidth="400px"
      variant="info"
    >
      <Field htmlFor="mr-fecha-inicio" label="Fecha inicio">
        <input
          id="mr-fecha-inicio"
          type="date"
          value={params.fecha_inicio}
          onChange={e => set("fecha_inicio", e.target.value)}
          aria-required="true"
          style={inpSt}
          onFocus={e => { e.target.style.borderColor = ORANGE; }}
          onBlur={e  => { e.target.style.borderColor = border; }}
        />
      </Field>

      <Field htmlFor="mr-fecha-fin" label="Fecha fin">
        <input
          id="mr-fecha-fin"
          type="date"
          value={params.fecha_fin}
          onChange={e => set("fecha_fin", e.target.value)}
          aria-required="true"
          style={inpSt}
          onFocus={e => { e.target.style.borderColor = ORANGE; }}
          onBlur={e  => { e.target.style.borderColor = border; }}
        />
      </Field>

      {admins.length > 0 && (
      <Field htmlFor="mr-tecnico" label="Técnico">
        <select
          id="mr-tecnico"
          value={params.id_tecnico}
          onChange={e => set("id_tecnico", e.target.value)}
          style={{ ...inpSt, cursor: "pointer" }}
          onFocus={e => { e.target.style.borderColor = ORANGE; }}
          onBlur={e  => { e.target.style.borderColor = border; }}
        >
          <option value="todos">Todos los técnicos</option>
          {admins.map(a => (
            <option key={a.id_empleado} value={a.id_empleado}>{a.nombre_completo}</option>
          ))}
        </select>
      </Field>
      )}
    </Modal>
  );
}
