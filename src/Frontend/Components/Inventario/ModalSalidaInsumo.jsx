/**
 * ModalSalidaInsumo.jsx — Registrar SALIDA INTERNA de insumos (uso interno)
 *
 * El formato replica el del rol Usuario (SolicitudInsumo): insumos con foto,
 * quién solicita (lista + buscador con filtros), RUTA del material, fecha con
 * hora, justificación y prioridad. La salida NO tiene etapa de aprobación:
 * queda ACEPTADA automáticamente y descuenta stock en transacción.
 *
 * POST /api/solicitudes/salidas → { folio, movimientos } y de ahí se abre la
 * hoja para imprimir. Mismo sistema visual que ModalEntradaInsumo.
 *
 * Validación: el backend convierte "" → null antes de validar, por lo que un
 * campo sin elegir ya NUNCA provoca el 422 "Datos inválidos".
 */
import { useState, useEffect, useRef, useMemo } from "react";
import {
  X, ArrowUpFromLine, Plus, Trash2, Printer, Search, MapPin,
  Clock, User, Building2, CheckCircle2,
} from "lucide-react";
import { apiFetch, API_ROUTES } from "../../Config/api";
import { useToast } from "../Feedback";

const ROJO = "#dc2626";
const PRIORIDADES = ["Urgente", "Alta", "Media", "Baja"];

// Nombre completo de empleado para las listas del formato.
const nombreEmpleado = (e = {}) =>
  [e.nombre, e.ap_paterno, e.ap_materno].filter(Boolean).join(" ").replace(/\s+/g, " ").trim()
  || e.email || `Empleado ${e.id_empleado ?? ""}`;

const iniciales = (n = "") =>
  n.trim().split(/\s+/).slice(0, 2).map(w => (w[0] || "").toUpperCase()).join("") || "?";

// /storage/... → URL absoluta con el prefijo del API (mismo criterio que Personal.jsx).
const fotoEmpleadoUrl = (foto) => {
  if (!foto) return null;
  if (foto.startsWith("http")) return foto;
  const API_URL = import.meta.env.VITE_API_URL ?? "";
  const rel = foto.startsWith("/storage/") ? foto : `/storage/${foto}`;
  return `${API_URL}${rel.split("/").map(encodeURIComponent).join("/")}`;
};

function Field({ label, htmlFor, required, children, textFaint }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label htmlFor={htmlFor} style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: textFaint }}>
        {label}{required && <span style={{ color: ROJO, marginLeft: "2px" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const nuevoRenglon = () => ({
  key: Math.random().toString(36).slice(2),
  id_insumo: "",
  cantidad: "",
  buscar: "",
});

export default function ModalSalidaInsumo({ insumos = [], insumoInicial = null, onClose, onSaved, T }) {
  const isDark  = T?.isDark ?? false;
  const toast   = useToast();
  const firstRef = useRef(null);

  const [renglones, setRenglones] = useState(() => {
    const r = nuevoRenglon();
    if (insumoInicial) r.id_insumo = String(insumoInicial);
    return [r];
  });
  const [solicitanteId, setSolicitanteId] = useState("");
  const [solicitanteTxt, setSolicitanteTxt] = useState("");
  const [empleados, setEmpleados]   = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [rutaOrigen, setRutaOrigen]     = useState("");
  const [rutaDestino, setRutaDestino]   = useState("");
  const [fechaHora, setFechaHora] = useState("");
  const [justificacion, setJustificacion] = useState("");
  const [prioridad, setPrioridad] = useState("Media");
  const [error, setError]   = useState("");
  const [saving, setSaving] = useState(false);
  // Ventana de búsqueda de personas (filtros por sucursal / puesto / nombre).
  const [buscandoPersona, setBuscandoPersona] = useState(false);

  // Carga de las listas reales del formato: empleados (quién solicita) y
  // sucursales (ruta origen/destino). Si alguna falla, los campos siguen
  // siendo editables a mano.
  useEffect(() => {
    let viva = true;
    apiFetch(API_ROUTES.EMPLEADOS).then(r => r.json()).then(d => {
      if (!viva) return;
      const lista = Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
      setEmpleados(lista.filter(e => String(e.estatus ?? "Activo").toLowerCase() === "activo"));
    }).catch(() => {});
    apiFetch(API_ROUTES.SUCURSALES).then(r => r.json()).then(d => {
      if (!viva) return;
      setSucursales(Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []));
    }).catch(() => {});
    return () => { viva = false; };
  }, []);

  // Bloqueo de scroll de fondo + cierre con Escape.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = e => { if (e.key === "Escape" && !saving) onClose?.(); };
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", esc); };
  }, [onClose, saving]);

  const surface     = isDark ? "#161B22" : "#ffffff";
  const surfaceAlt  = isDark ? "#1a2030" : "#f8fafc";
  const border      = isDark ? "rgba(255,255,255,0.07)" : "#e8ecf0";
  const textMain    = T?.text     ?? (isDark ? "#e2e8f0" : "#1a202c");
  const textMuted   = T?.textMuted ?? (isDark ? "#8b949e" : "#64748b");
  const textFaint   = T?.textFaint ?? (isDark ? "rgba(255,255,255,0.30)" : "#a0aec0");
  const inputBg     = isDark ? "rgba(255,255,255,0.04)" : "#f8fafc";

  const inp = {
    background: inputBg, border: `1px solid ${border}`, borderRadius: "6px",
    padding: "0 10px", height: "34px", fontSize: "13px", color: textMain,
    width: "100%", outline: "none",
  };
  const onFocus = e => { e.target.style.borderColor = "#2563eb"; };
  const onBlur  = e => { e.target.style.borderColor = border; };

  // Solo insumos habilitados y con stock se pueden elegir en una salida.
  const insumosOperativos = useMemo(
    () => insumos.filter(i => Number(i.activo ?? 1) !== 0 && (i.stock ?? 0) > 0),
    [insumos]
  );

  const setRenglon = (key, patch) =>
    setRenglones(rs => rs.map(r => (r.key === key ? { ...r, ...patch } : r)));

  const stockDe = id => Number(insumos.find(i => String(i.id_insumo) === String(id))?.stock ?? 0);
  const nombreDe = id => insumos.find(i => String(i.id_insumo) === String(id))?.nombre ?? "";
  const marcaDe  = id => {
    const i = insumos.find(x => String(x.id_insumo) === String(id));
    return i ? [i.marca, i.modelo].filter(Boolean).join(" · ") : "";
  };
  const fotoDe   = id => insumos.find(i => String(i.id_insumo) === String(id))?.imagen_url ?? null;

  // Stock que queda disponible para un renglón descontando los demás.
  const restanteDe = id => {
    if (!id) return null;
    const otros = renglones
      .filter(r => String(r.id_insumo) === String(id))
      .reduce((s, r) => s + (parseInt(r.cantidad, 10) || 0), 0);
    return stockDe(id) - otros;
  };

  const totalPiezas = renglones.reduce((s, r) => s + (parseInt(r.cantidad, 10) || 0), 0);

  // Única persona impresa: quien solicita la salida.
  const nombreSolicitante = solicitanteId
    ? (nombreEmpleado(empleados.find(e => String(e.id_empleado) === String(solicitanteId))) || solicitanteTxt.trim())
    : solicitanteTxt.trim();

  const nombreSucursalDe = id =>
    sucursales.find(s => String(s.id_sucursal) === String(id))?.nombre_sucursal ?? "";

  const handleSubmit = async e => {
    e?.preventDefault();
    setError("");
    const items = renglones
      .filter(r => r.id_insumo)
      .map(r => ({ id_insumo: parseInt(r.id_insumo, 10), cantidad: parseInt(r.cantidad, 10) }));

    if (!items.length) { setError("Agrega al menos un insumo a la salida."); return; }
    if (items.some(r => !Number.isFinite(r.id_insumo) || r.id_insumo <= 0 ||
                        !Number.isFinite(r.cantidad)  || r.cantidad < 1)) {
      setError("Cada insumo debe tener cantidad de al menos 1."); return;
    }
    if (rutaOrigen && rutaDestino && rutaOrigen === rutaDestino) {
      setError("La ruta no puede tener el mismo origen y destino."); return;
    }
    if (!justificacion.trim()) { setError("Escribe la justificación de la salida."); return; }

    // Stock por insumo consolidando renglones repetidos.
    const porInsumo = new Map();
    for (const r of items) porInsumo.set(r.id_insumo, (porInsumo.get(r.id_insumo) || 0) + r.cantidad);
    for (const [id, cant] of porInsumo) {
      if (cant > stockDe(id)) {
        setError(`Stock insuficiente en "${nombreDe(id)}": hay ${stockDe(id)}, piden ${cant}.`);
        return;
      }
    }

    setSaving(true);
    try {
      // apiFetch serializa solo: se pasa OBJETO (no JSON.stringify). Si se
      // manda string, no pone Content-Type y Express deja req.body = {},
      // lo que provocaba el 422 "Debe incluir al menos un insumo...".
      const r = await apiFetch(API_ROUTES.SALIDAS, {
        method: "POST",
        body: {
          items,
          // Quién solicita la salida (la persona que se lleva / registra).
          solicitante:        nombreSolicitante || null,
          id_solicitante:     solicitanteId ? parseInt(solicitanteId, 10) : null,
          // Ruta del material (antes solo un campo libre "destino").
          id_sucursal_origen:  rutaOrigen  ? parseInt(rutaOrigen, 10)  : null,
          id_sucursal_destino: rutaDestino ? parseInt(rutaDestino, 10) : null,
          destino:             nombreSucursalDe(rutaDestino) || null,
          // Fecha y hora del movimiento (datetime-local: AAAA-MM-DDTHH:MM).
          fecha:               fechaHora || null,
          justificacion:       justificacion.trim(),
          prioridad:           prioridad || null,
        },
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        const det = Array.isArray(d?.errores) ? d.errores.map(x => x.mensaje).join(", ") : "";
        throw new Error(det || d?.error || "No se pudo registrar la salida");
      }
      const empSel = empleados.find(e => String(e.id_empleado) === String(solicitanteId));
      onSaved?.(d, {
        items,
        solicitante: nombreSolicitante || "",
        solicitante_puesto:   (empSel?.nombre_departamento || empSel?.nombre_rol || "").trim(),
        solicitante_sucursal: (empSel?.nombre_sucursal || "").trim(),
        solicitante_num:      (empSel?.num_empleado || "").trim(),
        destino:     [nombreSucursalDe(rutaOrigen), nombreSucursalDe(rutaDestino)].filter(Boolean).join(" → "),
        responsable: "",
        motivo:      justificacion.trim(),
      });
      toast.success?.(`Salida ${d.folio || ""} registrada`);
    } catch (err) {
      setError(err?.message || "No se pudo registrar la salida");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Salida interna de insumos"
      onMouseDown={e => { if (e.target === e.currentTarget && !saving) onClose?.(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: isDark ? "rgba(0,0,0,0.72)" : "rgba(15,23,42,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
      }}>
      <form onSubmit={handleSubmit}
        style={{
          background: surface, border: `1px solid ${border}`, borderRadius: "12px",
          width: "min(860px, 100%)", maxHeight: "92vh", overflow: "hidden",
          display: "flex", flexDirection: "column",
          boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
        }}>

        {/* ── Cinta superior corporativa ─────────────────────────────── */}
        <div style={{ height: "3px", flexShrink: 0, background: "linear-gradient(90deg, #dc2626, #f59e0b)", borderRadius: "12px 12px 0 0" }} />

        {/* ── Encabezado con LOGO ────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 18px 12px", borderBottom: `1px solid ${border}` }}>
          <div style={{ width: "30px", height: "30px", borderRadius: "8px", flexShrink: 0,
            background: isDark ? "rgba(220,38,38,0.15)" : "#fef2f2",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ArrowUpFromLine size={15} style={{ color: ROJO }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: ROJO }}>
              Salida interna de insumos
            </p>
            <div style={{ fontSize: "13px", fontWeight: 700, color: textMain, lineHeight: 1.25 }}>Formato de salida de material</div>
            <div style={{ fontSize: "11px", color: textMuted }}>Se acepta automáticamente · descuenta stock y genera la hoja para imprimir</div>
          </div>
          <img
            src={isDark ? "/assets/img/logo blanco.png" : "/assets/img/logo negro.png"}
            alt="Precision Trucks"
            style={{ height: "28px", width: "auto", objectFit: "contain", opacity: isDark ? 0.80 : 0.70, flexShrink: 0 }}
          />
          <button type="button" onClick={onClose} disabled={saving} title="Cerrar (Esc)" aria-label="Cerrar"
            style={{ border: "none", background: "transparent", cursor: "pointer",
              color: textFaint, padding: "4px", borderRadius: "6px", display: "flex", opacity: saving ? 0.4 : 1 }}>
            <X size={16} />
          </button>
        </div>

        {/* ── Cuerpo ─────────────────────────────────────────────────── */}
        <div style={{ padding: "16px 18px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Insumos: "Insumo 1", "Insumo 2"… con foto */}
          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: textFaint }}>
                Insumos
              </span>
              <span style={{ fontSize: "11px", color: textMuted, fontVariantNumeric: "tabular-nums" }}>
                {renglones.length} · {totalPiezas} pieza{totalPiezas !== 1 ? "s" : ""}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {renglones.map((r, idx) => {
                const rest = restanteDe(r.id_insumo);
                const sinStock = rest !== null && rest < 0;
                const foto = fotoDe(r.id_insumo);
                return (
                  <div key={r.key} style={{
                    border: `1px solid ${sinStock ? "#fca5a5" : border}`, borderRadius: "8px",
                    padding: "10px", background: isDark ? "rgba(255,255,255,0.02)" : "#fcfdff",
                    display: "flex", flexDirection: "column", gap: "8px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "11px", fontWeight: 800, color: textMuted }}>Insumo {idx + 1}</span>
                      {renglones.length > 1 && (
                        <button type="button" title="Quitar insumo"
                          onClick={() => setRenglones(rs => rs.filter(x => x.key !== r.key))}
                          style={{ border: "none", background: "transparent", cursor: "pointer", color: textFaint, display: "flex", padding: 2 }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: "8px" }}>
                      <Field htmlFor={`sal-ins-${r.key}`} label="Insumo" required textFaint={textFaint}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {foto ? (
                            <img src={foto} alt="" onError={e => { e.currentTarget.style.display = "none"; }}
                              style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover", border: `1px solid ${border}`, flexShrink: 0 }} />
                          ) : (
                            <span aria-hidden style={{ width: 44, height: 44, borderRadius: 6, flexShrink: 0,
                              border: `1px dashed ${border}`, display: "flex", alignItems: "center", justifyContent: "center", color: textFaint }}>
                              <Search size={16} />
                            </span>
                          )}
                          <input id={`sal-ins-${r.key}`} ref={idx === 0 ? firstRef : undefined}
                            list={`sal-list-${r.key}`} type="text" autoComplete="off"
                            value={r.id_insumo ? nombreDe(r.id_insumo) : r.buscar}
                            onChange={e => {
                              const v = e.target.value;
                              const hit = insumosOperativos.find(i => i.nombre === v);
                              if (hit) setRenglon(r.key, { id_insumo: String(hit.id_insumo), buscar: "" });
                              else setRenglon(r.key, { id_insumo: "", buscar: v });
                            }}
                            placeholder="Buscar por nombre, marca o modelo…"
                            style={inp} onFocus={onFocus} onBlur={onBlur} />
                        </div>
                        <datalist id={`sal-list-${r.key}`}>
                          {insumosOperativos
                            .filter(i => {
                              if (r.id_insumo) return String(i.id_insumo) === String(r.id_insumo);
                              const q = r.buscar.trim().toLowerCase();
                              if (!q) return true;
                              return [i.nombre, i.marca, i.modelo]
                                .filter(Boolean).some(x => String(x).toLowerCase().includes(q));
                            })
                            .map(i => (
                              <option key={i.id_insumo} value={i.nombre}>
                                {[i.marca, i.modelo].filter(Boolean).join(" · ")} — stock {i.stock}
                              </option>
                            ))}
                        </datalist>
                      </Field>

                      <Field htmlFor={`sal-cant-${r.key}`} label="Cantidad" required textFaint={textFaint}>
                        <input id={`sal-cant-${r.key}`} type="number" min={1} max={9999}
                          value={r.cantidad} onChange={e => setRenglon(r.key, { cantidad: e.target.value })}
                          placeholder="0" style={{ ...inp, textAlign: "right", fontWeight: 700 }}
                          onFocus={onFocus} onBlur={onBlur} />
                      </Field>
                    </div>

                    {/* Detalle del elegido: marca / MODELO GRANDE / stock */}
                    {r.id_insumo && (
                      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "14px", fontWeight: 800, color: textMain }}>{marcaDe(r.id_insumo)}</span>
                        <span style={{ fontSize: "11px", color: textMuted }}>
                          Stock: {stockDe(r.id_insumo)}
                          {rest !== null && <> · queda {Math.max(rest, 0)}</>}
                        </span>
                        {sinStock && <span style={{ fontSize: "11px", fontWeight: 700, color: "#dc2626" }}>— excede lo disponible</span>}
                      </div>
                    )}
                  </div>
                );
              })}

              <button type="button" onClick={() => setRenglones(rs => [...rs, nuevoRenglon()])}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  padding: "7px", borderRadius: "6px", fontSize: "12px", fontWeight: 600,
                  background: "transparent", border: `1px dashed ${border}`, color: textMuted, cursor: "pointer" }}>
                <Plus size={13} /> Agregar otro insumo
              </button>
            </div>
          </section>

          {/* Quién solicita: lista + buscador con filtros */}
          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: textFaint }}>
                Quién solicita
              </span>
              <button type="button" onClick={() => setBuscandoPersona(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700,
                  padding: "4px 9px", borderRadius: "6px", cursor: "pointer",
                  background: "transparent", border: `1px solid ${border}`, color: textMuted }}>
                <Search size={12} /> Buscar persona
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Field htmlFor="sal-solicita" label="Persona" textFaint={textFaint}>
                <select id="sal-solicita" value={solicitanteId}
                  onChange={e => setSolicitanteId(e.target.value)}
                  style={{ ...inp, cursor: "pointer" }} onFocus={onFocus} onBlur={onBlur}>
                  <option value="">Elegir de la lista…</option>
                  {empleados.map(e => (
                    <option key={e.id_empleado} value={e.id_empleado}>{nombreEmpleado(e)}</option>
                  ))}
                </select>
              </Field>
              <Field htmlFor="sal-solicita-txt" label="O escribir a mano" textFaint={textFaint}>
                <input id="sal-solicita-txt" type="text" maxLength={200} value={solicitanteTxt}
                  onChange={e => { const v = e.target.value; setSolicitanteTxt(v); const norm = s => String(s ?? "").trim().toLowerCase(); const hit = v.trim() ? empleados.find(x => norm(nombreEmpleado(x)) === norm(v)) : null; setSolicitanteId(hit ? String(hit.id_empleado) : ""); }} placeholder="Nombre libre…"
                  style={inp} onFocus={onFocus} onBlur={onBlur} />
              </Field>
            </div>
          </section>

          {/* Ruta del material + fecha con hora */}
          <section>
            <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: textFaint, marginBottom: "8px" }}>
              Ruta y fecha
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Field htmlFor="sal-origen" label="Origen" textFaint={textFaint}>
                <select id="sal-origen" value={rutaOrigen} onChange={e => setRutaOrigen(e.target.value)}
                  style={{ ...inp, cursor: "pointer" }} onFocus={onFocus} onBlur={onBlur}>
                  <option value="">—</option>
                  {sucursales.map(s => (
                    <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre_sucursal}</option>
                  ))}
                </select>
              </Field>
              <Field htmlFor="sal-destino" label="Destino" textFaint={textFaint}>
                <select id="sal-destino" value={rutaDestino} onChange={e => setRutaDestino(e.target.value)}
                  style={{ ...inp, cursor: "pointer" }} onFocus={onFocus} onBlur={onBlur}>
                  <option value="">—</option>
                  {sucursales.map(s => (
                    <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre_sucursal}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", fontSize: "11px", color: textMuted }}>
              <MapPin size={12} />
              <span>{nombreSucursalDe(rutaOrigen) || "Origen"} → {nombreSucursalDe(rutaDestino) || "Destino"}</span>
            </div>

            <div style={{ marginTop: "10px" }}>
              <Field htmlFor="sal-fecha" label="Fecha y hora del movimiento" required textFaint={textFaint}>
                <input id="sal-fecha" type="datetime-local" value={fechaHora}
                  onChange={e => setFechaHora(e.target.value)}
                  style={{ ...inp, cursor: "pointer" }} onFocus={onFocus} onBlur={onBlur} />
              </Field>
            </div>
          </section>

          {/* Justificación + prioridad (igual que el formulario del usuario) */}
          <section>
            <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: textFaint, marginBottom: "8px" }}>
              Justificación
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "10px" }}>
              <Field htmlFor="sal-prio" label="Prioridad" textFaint={textFaint}>
                <select id="sal-prio" value={prioridad} onChange={e => setPrioridad(e.target.value)}
                  style={{ ...inp, cursor: "pointer" }} onFocus={onFocus} onBlur={onBlur}>
                  {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Field htmlFor="sal-just" label="Motivo de la salida" required textFaint={textFaint}>
                <textarea id="sal-just" rows={3} maxLength={2000} value={justificacion}
                  onChange={e => setJustificacion(e.target.value)}
                  placeholder="Describe el motivo de esta salida…"
                  style={{ ...inp, height: "auto", padding: "8px 10px", resize: "vertical", lineHeight: 1.45 }}
                  onFocus={onFocus} onBlur={onBlur} />
              </Field>
            </div>
          </section>

          <p style={{ margin: 0, fontSize: "11px", color: textMuted, fontVariantNumeric: "tabular-nums" }}>
            Total: <strong style={{ color: textMain }}>{totalPiezas}</strong> pieza{totalPiezas !== 1 ? "s" : ""} en {renglones.filter(r => r.id_insumo).length} renglón{renglones.filter(r => r.id_insumo).length !== 1 ? "es" : ""}. Al guardar se descuenta del inventario.
          </p>

          {error && (
            <p role="alert" style={{ margin: 0, padding: "8px 12px", borderRadius: "6px", fontSize: "12px",
              fontWeight: 500, color: "#dc2626", background: isDark ? "rgba(220,38,38,0.10)" : "#fef2f2",
              border: `1px solid ${isDark ? "rgba(220,38,38,0.25)" : "#fecaca"}` }}>{error}</p>
          )}
        </div>

        {/* ── Pie ────────────────────────────────────────────────────── */}
        <div style={{ padding: "10px 18px", borderTop: `1px solid ${border}`, background: surfaceAlt,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexShrink: 0 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700, color: "#16a34a" }}>
            <CheckCircle2 size={13} /> Aceptada automáticamente
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" onClick={onClose} disabled={saving}
              style={{ padding: "6px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: 600,
                background: "transparent", border: `1px solid ${border}`, color: textMuted,
                cursor: "pointer", opacity: saving ? 0.5 : 1 }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 18px",
                borderRadius: "6px", fontSize: "12px", fontWeight: 700,
                background: saving ? "rgba(220,38,38,0.12)" : ROJO, color: "#fff",
                border: "none", cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? <Printer size={13} /> : <ArrowUpFromLine size={13} />}
              {saving ? "Registrando…" : "Registrar salida"}
            </button>
          </div>
        </div>
      </form>

      {/* Buscador de personas con filtros por sucursal, puesto y nombre */}
      {buscandoPersona && (
        <ModalBusquedaPersona
          empleados={empleados}
          sucursales={sucursales}
          isDark={isDark}
          T={T}
          onClose={() => setBuscandoPersona(false)}
          onElegir={emp => {
            setSolicitanteId(String(emp.id_empleado));
            setSolicitanteTxt(nombreEmpleado(emp));
            setBuscandoPersona(false);
          }} />
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────
// ModalBusquedaPersona — ventana para elegir "quién solicita" con FILTROS
// por sucursal, puesto (rol/departamento) y nombre. Muestra la foto (o las
// iniciales) y devuelve el empleado elegido mediante onElegir.
// ─────────────────────────────────────────────────────────────────────
function ModalBusquedaPersona({ empleados = [], sucursales = [], isDark = false, T, onClose, onElegir }) {
  const [q, setQ]                 = useState("");
  const [fSucursal, setFSucursal] = useState("");
  const [fPuesto, setFPuesto]     = useState("");

  const surface   = isDark ? "#161B22" : "#ffffff";
  const surfaceAlt= isDark ? "#1a2030" : "#f8fafc";
  const border    = isDark ? "rgba(255,255,255,0.07)" : "#e8ecf0";
  const textMain  = T?.text     ?? (isDark ? "#e2e8f0" : "#1a202c");
  const textMuted = T?.textMuted ?? (isDark ? "#8b949e" : "#64748b");
  const textFaint = T?.textFaint ?? (isDark ? "rgba(255,255,255,0.30)" : "#a0aec0");
  const inputBg   = isDark ? "rgba(255,255,255,0.04)" : "#f8fafc";

  const inp = {
    background: inputBg, border: `1px solid ${border}`, borderRadius: "6px",
    padding: "0 10px", height: "34px", fontSize: "13px", color: textMain,
    width: "100%", outline: "none",
  };
  const onFocus = e => { e.target.style.borderColor = "#2563eb"; };
  const onBlur  = e => { e.target.style.borderColor = border; };

  // Nombre de sucursal local a este sub-modal (el helper del padre no existe aquí).
  const nombreSucursalDe = id =>
    sucursales.find(s => String(s.id_sucursal) === String(id))?.nombre_sucursal ?? "";

  // Puestos disponibles: rol y, si no hay, departamento.
  const puestos = useMemo(() => {
    const set = new Set();
    for (const e of empleados) {
      const p = (e.nombre_rol || e.nombre_departamento || "").trim();
      if (p) set.add(p);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "es"));
  }, [empleados]);

  // Filtrado combinado por los tres criterios.
  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    return empleados.filter(e => {
      if (fSucursal && String(e.id_sucursal ?? "") !== String(fSucursal)) return false;
      if (fPuesto && (e.nombre_rol || e.nombre_departamento || "").trim() !== fPuesto) return false;
      if (term) {
        const completo = nombreEmpleado(e).toLowerCase();
        const extra = [e.email, e.num_empleado, e.nombre_departamento, e.nombre_rol]
          .filter(Boolean).join(" ").toLowerCase();
        if (!completo.includes(term) && !extra.includes(term)) return false;
      }
      return true;
    });
  }, [empleados, q, fSucursal, fPuesto]);

  useEffect(() => {
    const esc = ev => { if (ev.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label="Buscar persona"
      onMouseDown={ev => { if (ev.target === ev.currentTarget) onClose?.(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1100,
        background: isDark ? "rgba(0,0,0,0.72)" : "rgba(15,23,42,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
      }}>
      <div style={{
        background: surface, border: `1px solid ${border}`, borderRadius: "12px",
        width: "min(560px, 100%)", maxHeight: "88vh", overflow: "hidden",
        display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
      }}>
        <div style={{ height: "3px", background: "linear-gradient(90deg,#dc2626,#f59e0b)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderBottom: `1px solid ${border}` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: ROJO }}>
              Quién solicita
            </p>
            <div style={{ fontSize: "13px", fontWeight: 700, color: textMain }}>Buscar persona</div>
          </div>
          <img
            src={isDark ? "/assets/img/logo blanco.png" : "/assets/img/logo negro.png"}
            alt="Precision Trucks"
            style={{ height: "24px", width: "auto", objectFit: "contain", opacity: isDark ? 0.8 : 0.7, flexShrink: 0 }}
          />
          <button type="button" onClick={onClose} title="Cerrar (Esc)" aria-label="Cerrar"
            style={{ border: "none", background: "transparent", cursor: "pointer", color: textFaint, padding: "4px", display: "flex" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px", borderBottom: `1px solid ${border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Search size={14} style={{ color: textFaint, flexShrink: 0 }} />
            <input autoFocus type="text" value={q} onChange={e => setQ(e.target.value)}
              placeholder="Buscar por nombre…" autoComplete="off"
              style={inp} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Building2 size={13} style={{ color: textFaint, flexShrink: 0 }} />
              <select value={fSucursal} onChange={e => setFSucursal(e.target.value)}
                style={{ ...inp, cursor: "pointer" }} onFocus={onFocus} onBlur={onBlur}>
                <option value="">Todas las sucursales</option>
                {sucursales.map(s => (
                  <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre_sucursal}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <User size={13} style={{ color: textFaint, flexShrink: 0 }} />
              <select value={fPuesto} onChange={e => setFPuesto(e.target.value)}
                style={{ ...inp, cursor: "pointer" }} onFocus={onFocus} onBlur={onBlur}>
                <option value="">Todos los puestos</option>
                {puestos.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ padding: "8px", overflowY: "auto", flex: 1 }}>
          {filtrados.length === 0 ? (
            <p style={{ margin: 0, padding: "24px 12px", textAlign: "center", fontSize: "12px", color: textMuted }}>
              Sin coincidencias con esos filtros.
            </p>
          ) : filtrados.map(e => {
            const nom = nombreEmpleado(e);
            return (
              <button key={e.id_empleado} type="button" onClick={() => onElegir(e)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "10px",
                  padding: "8px 10px", borderRadius: "8px", border: "none",
                  background: "transparent", cursor: "pointer", textAlign: "left",
                }}
                onMouseEnter={ev => { ev.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"; }}
                onMouseLeave={ev => { ev.currentTarget.style.background = "transparent"; }}>
                {fotoEmpleadoUrl(e.foto) ? (
                  <img src={fotoEmpleadoUrl(e.foto)} alt="" onError={ev => { ev.currentTarget.style.display = "none"; }}
                    style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", border: `1px solid ${border}`, flexShrink: 0 }} />
                ) : (
                  <span aria-hidden style={{
                    width: 34, height: 34, borderRadius: "50%", flexShrink: 0, fontSize: "12px", fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: isDark ? "rgba(220,38,38,0.15)" : "#fef2f2", color: ROJO,
                  }}>{iniciales(nom)}</span>
                )}
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: textMain, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nom}</span>
                  <span style={{ display: "block", fontSize: "11px", color: textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {[e.puesto, nombreSucursalDe(e.id_sucursal)].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ padding: "10px 16px", borderTop: `1px solid ${border}`, background: surfaceAlt,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontSize: "11px", color: textMuted, fontVariantNumeric: "tabular-nums" }}>
            {filtrados.length} persona{filtrados.length === 1 ? "" : "s"}
          </span>
          <button type="button" onClick={onClose}
            style={{ padding: "6px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: 600,
              background: "transparent", border: `1px solid ${border}`, color: textMuted, cursor: "pointer" }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
