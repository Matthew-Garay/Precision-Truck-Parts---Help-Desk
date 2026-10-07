/**
 * ModalSalidaInsumo.jsx — Registrar SALIDA INTERNA de insumos (uso interno)
 * Hoja manual multi-renglón: elige insumos, escribe cantidades y campos libres
 * (destino, quién recibe, motivo). Al guardar descuenta stock vía
 * POST /api/solicitudes/salidas y devuelve { folio, movimientos } para imprimir.
 * Mismo sistema visual que ModalEntradaInsumo.
 */
import { useState, useEffect, useRef, useMemo } from "react";
import { X, ArrowUpFromLine, Plus, Trash2, Printer, Minus } from "lucide-react";
import { apiFetch, API_ROUTES } from "../../Config/api";
import { useToast } from "../Feedback";

const NARANJA = "#F47920";

// Nombre completo de empleado para las listas del formato.
const nombreEmpleado = (e = {}) =>
  [e.nombre, e.ap_paterno, e.ap_materno].filter(Boolean).join(" ").replace(/\s+/g, " ").trim()
  || e.email || `Empleado ${e.id_empleado ?? ""}`;

function Field({ label, htmlFor, required, children, textFaint }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label htmlFor={htmlFor} style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: textFaint }}>
        {label}{required && <span style={{ color: "#F47920", marginLeft: "2px" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const nuevoRenglon = () => ({ key: Math.random().toString(36).slice(2), id_insumo: "", cantidad: "", buscar: "" });

// Fecha de hoy en YYYY-MM-DD para el input date y como valor por defecto.
const fechaHoy = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function ModalSalidaInsumo({ insumos = [], onClose, onSaved, T }) {
  const isDark  = T?.isDark ?? false;
  const toast   = useToast();
  const firstRef = useRef(null);

  const [renglones, setRenglones]     = useState([nuevoRenglon()]);
  // Formato 100% editable: cada campo es lista + texto libre de respaldo.
  const [destinoId, setDestinoId]         = useState("");
  const [destinoTxt, setDestinoTxt]       = useState("");
  const [responsableId, setResponsableId] = useState("");
  const [responsableTxt, setResponsableTxt] = useState("");
  const [fecha, setFecha]             = useState("");
  const [solicitanteId, setSolicitanteId] = useState("");
  const [solicitanteTxt, setSolicitanteTxt] = useState("");
  const [motivo, setMotivo]           = useState("");
  const [empleados, setEmpleados]     = useState([]);
  const [sucursales, setSucursales]   = useState([]);
  const [error, setError]             = useState("");
  const [saving, setSaving]           = useState(false);

  // Listas reales del formato: usuarios (quién solicita/recibe) y sucursales
  // (destino). Si alguna falla, el campo sigue usable como texto libre.
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

  useEffect(() => { firstRef.current?.focus(); }, []);
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const surface     = isDark ? "#161B22" : "#ffffff";
  const surfaceAlt  = isDark ? "#1a2030" : "#f8fafc";
  const border      = isDark ? "rgba(255,255,255,0.07)" : "#e8ecf0";
  const borderFocus = "#2563eb";
  const textMain    = T?.text     ?? (isDark ? "#e2e8f0" : "#1a202c");
  const textMuted   = T?.textMuted ?? (isDark ? "#8b949e" : "#64748b");
  const textFaint   = T?.textFaint ?? (isDark ? "rgba(255,255,255,0.30)" : "#a0aec0");
  const inputBg     = isDark ? "rgba(255,255,255,0.04)" : "#f8fafc";

  const inp = {
    background: inputBg, border: `1px solid ${border}`, borderRadius: "6px",
    padding: "0 10px", height: "34px", fontSize: "13px", color: textMain,
    outline: "none", width: "100%", boxSizing: "border-box",
    colorScheme: isDark ? "dark" : "light", transition: "border-color 0.12s, box-shadow 0.12s",
  };
  const onFocus = e => {
    e.target.style.borderColor = borderFocus;
    e.target.style.boxShadow   = "0 0 0 3px rgba(37,99,235,0.10)";
    e.target.style.background  = isDark ? "rgba(255,255,255,0.07)" : "#fff";
  };
  const onBlur = e => {
    e.target.style.borderColor = border;
    e.target.style.boxShadow   = "none";
    e.target.style.background  = inputBg;
  };
  const setRenglon = (key, patch) =>
    setRenglones(rs => rs.map(r => (r.key === key ? { ...r, ...patch } : r)));
  const handleEliminarRenglon = (key) => {
    if (renglones.length <= 1) {
      setError("Mínimo un renglón de insumo.");
      return;
    }
    setRenglones(rs => rs.filter(r => r.key !== key));
  };
  const totalPiezas = useMemo(
    () => renglones.reduce((s, r) => s + (parseInt(r.cantidad, 10) || 0), 0),
    [renglones]);
  const restanteDe = id => {
    if (!id) return null;
    const pedido = renglones.reduce((s, r) =>
      String(r.id_insumo) === String(id) ? s + (parseInt(r.cantidad, 10) || 0) : s, 0);
    return stockDe(id) - pedido;
  };

  const guardar = undefined; // (reservado) — el submit real es handleSubmit



  const insumosOperativos = useMemo(
    () => (insumos ?? []).filter(i => Number(i.activo ?? 1) !== 0),
    [insumos]);
  const stockDe = id => Number(insumosOperativos.find(i => String(i.id_insumo) === String(id))?.stock) || 0;
  const nombreDe = id => insumosOperativos.find(i => String(i.id_insumo) === String(id))?.nombre ?? "";
  const marcaModelo = id => {
    const i = insumosOperativos.find(x => String(x.id_insumo) === String(id));
    return i ? [i.marca, i.modelo].filter(Boolean).join(" · ") : "";
  };
  const opcionesDe = buscar => {
    const q = (buscar || "").trim().toLowerCase();
    const base = insumosOperativos.filter(i => (Number(i.stock) || 0) > 0);
    if (!q) return base.slice(0, 60);
    return base.filter(i =>
      String(i.nombre || "").toLowerCase().includes(q) ||
      String(i.marca || "").toLowerCase().includes(q) ||
      String(i.modelo || "").toLowerCase().includes(q)
    ).slice(0, 60);
  };
  // Nombres resueltos para la hoja impresa (lista o texto libre).
  const nombreDestino = destinoId
    ? (sucursales.find(s => String(s.id_sucursal) === String(destinoId))?.nombre_sucursal || destinoTxt.trim())
    : destinoTxt.trim();
  const nombreResponsable = responsableId
    ? (nombreEmpleado(empleados.find(e => String(e.id_empleado) === String(responsableId))) || responsableTxt.trim())
    : responsableTxt.trim();
  const nombreSolicitante = solicitanteId
    ? (nombreEmpleado(empleados.find(e => String(e.id_empleado) === String(solicitanteId))) || solicitanteTxt.trim())
    : solicitanteTxt.trim();
  /* Submit: valida stock en cliente y registra la salida */
  const handleSubmit = async e => {
    e?.preventDefault();
    setError("");
    const items = renglones
      .filter(r => r.id_insumo)
      .map(r => ({ id_insumo: parseInt(r.id_insumo, 10), cantidad: parseInt(r.cantidad, 10) }));
    if (!items.length) { setError("Agrega al menos un insumo a la salida."); return; }
    if (items.some(r => !Number.isFinite(r.cantidad) || r.cantidad < 1)) {
      setError("Cada renglón debe tener cantidad de al menos 1."); return;
    }
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
      const r = await apiFetch(API_ROUTES.SALIDAS, {
        method: "POST",
        body: JSON.stringify({
          items,
          fecha: fecha.trim() || fechaHoy(),
          // IDs de las listas (el backend los resuelve a nombre) + texto libre.
          id_sucursal_destino: destinoId ? parseInt(destinoId, 10) : null,
          id_responsable: responsableId ? parseInt(responsableId, 10) : null,
          id_solicitante: solicitanteId ? parseInt(solicitanteId, 10) : null,
          destino: nombreDestino || null,
          responsable: nombreResponsable || null,
          solicitante: nombreSolicitante || null,
          motivo: motivo.trim() || null,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error || `Error ${r.status} al registrar la salida`);
      toast.success(`Salida ${d.folio} registrada`);
      onSaved?.(d, { items, fecha, solicitante: nombreSolicitante, destino: nombreDestino, responsable: nombreResponsable, motivo: motivo.trim() });
    } catch (err) {
      setError(err.message || "No se pudo registrar la salida");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div onMouseDown={e => { if (e.target === e.currentTarget && !saving) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(2px)", display: "flex", alignItems: "center",
        justifyContent: "center", padding: "16px" }}>
      <div style={{ background: surface, borderRadius: "10px", border: `1px solid ${border}`,
        boxShadow: "0 24px 64px rgba(0,0,0,0.35)", width: "640px", maxWidth: "100%",
        maxHeight: "92vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 18px",
          borderBottom: `1px solid ${border}`, background: surfaceAlt, flexShrink: 0 }}>
          <div style={{ width: "30px", height: "30px", borderRadius: "8px",
            background: isDark ? "rgba(244,121,32,0.15)" : "#fff3e8",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ArrowUpFromLine size={15} style={{ color: NARANJA }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: textMain }}>Salida interna de insumos</div>
            <div style={{ fontSize: "11px", color: textMuted }}>Uso interno — descuenta stock y genera la hoja para imprimir</div>
          </div>
          <button onClick={onClose} disabled={saving} title="Cerrar (Esc)"
            style={{ border: "none", background: "transparent", cursor: "pointer",
              color: textFaint, padding: "4px", borderRadius: "6px", display: "flex", opacity: saving ? 0.4 : 1 }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: "16px 18px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
          <form id="form-salida" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {renglones.map((r, idx) => {
                const rest = restanteDe(r.id_insumo);
                const sinStock = rest !== null && rest < 0;
                return (
                  <div key={r.key} style={{ border: `1px solid ${sinStock ? "#fca5a5" : border}`,
                    borderRadius: "8px", padding: "10px",
                    background: isDark ? "rgba(255,255,255,0.02)" : "#fcfdff",
                    display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: textMuted }}>Renglón {idx + 1}</span>
                      {renglones.length > 1 && (
                        <button type="button" title="Quitar renglón"
                          onClick={() => setRenglones(rs => rs.filter(x => x.key !== r.key))}
                          style={{ border: "none", background: "transparent", cursor: "pointer", color: textFaint, display: "flex", padding: 2 }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: "8px" }}>
                      <Field htmlFor={`sal-ins-${r.key}`} label="Insumo" required textFaint={textFaint}>
                        <input id={`sal-ins-${r.key}`} ref={idx === 0 ? firstRef : undefined}
                          list={`sal-list-${r.key}`} type="text" autoComplete="off"
                          value={r.id_insumo ? nombreDe(r.id_insumo) : r.buscar}
                          onChange={e => {
                            const v = e.target.value;
                            const hit = insumosOperativos.find(i => i.nombre === v);
                            if (hit) setRenglon(r.key, { id_insumo: String(hit.id_insumo), buscar: "" });
                            else setRenglon(r.key, { id_insumo: "", buscar: v });
                          }}
                          placeholder="Buscar por nombre, marca, modelo…"
                          style={inp} onFocus={onFocus} onBlur={onBlur} />
                        <datalist id={`sal-list-${r.key}`}>
                          {opcionesDe(r.id_insumo ? "" : r.buscar).map(i => (
                            <option key={i.id_insumo} value={i.nombre}>
                              {`${i.marca || ""} ${i.modelo || ""} · stock ${i.stock}`.trim()}
                            </option>
                          ))}
                        </datalist>
                      </Field>
                      <Field htmlFor={`sal-cant-${r.key}`} label="Cantidad" required textFaint={textFaint}>
                        <input id={`sal-cant-${r.key}`} type="number" min={1} step={1} inputMode="numeric"
                          value={r.cantidad} onChange={e => setRenglon(r.key, { cantidad: e.target.value })}
                          placeholder="Ej. 2" style={inp} onFocus={onFocus} onBlur={onBlur} />
                      </Field>
                    </div>
                    {r.id_insumo && (
                      <div style={{ fontSize: "11px", color: sinStock ? "#dc2626" : textMuted, fontVariantNumeric: "tabular-nums" }}>
                        {marcaModelo(r.id_insumo) ? `${marcaModelo(r.id_insumo)} · ` : ""}
                        Stock: {stockDe(r.id_insumo)} → queda {rest}
                        {sinStock && " — excede lo disponible"}
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
            {/* ── Formato entero editable: todo con lista + texto libre ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Field htmlFor="sal-solicita" label="Quién solicita / entrega" textFaint={textFaint}>
                <select id="sal-solicita" value={solicitanteId}
                  onChange={e => setSolicitanteId(e.target.value)}
                  style={{ ...inp, cursor: "pointer" }} onFocus={onFocus} onBlur={onBlur}>
                  <option value="">Elegir de la lista…</option>
                  {empleados.map(e => (
                    <option key={e.id_empleado} value={e.id_empleado}>{nombreEmpleado(e)}</option>
                  ))}
                </select>
                <input type="text" maxLength={200} value={solicitanteTxt}
                  onChange={e => setSolicitanteTxt(e.target.value)} placeholder="O escribir nombre libre…"
                  style={{ ...inp, marginTop: "6px" }} onFocus={onFocus} onBlur={onBlur} />
              </Field>
              <Field htmlFor="sal-resp" label="Quién recibe" textFaint={textFaint}>
                <select id="sal-resp" value={responsableId}
                  onChange={e => setResponsableId(e.target.value)}
                  style={{ ...inp, cursor: "pointer" }} onFocus={onFocus} onBlur={onBlur}>
                  <option value="">Elegir de la lista…</option>
                  {empleados.map(e => (
                    <option key={e.id_empleado} value={e.id_empleado}>{nombreEmpleado(e)}</option>
                  ))}
                </select>
                <input type="text" maxLength={200} value={responsableTxt}
                  onChange={e => setResponsableTxt(e.target.value)} placeholder="O escribir nombre libre…"
                  style={{ ...inp, marginTop: "6px" }} onFocus={onFocus} onBlur={onBlur} />
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Field htmlFor="sal-destino" label="Destino / sucursal" textFaint={textFaint}>
                <select id="sal-destino" value={destinoId}
                  onChange={e => setDestinoId(e.target.value)}
                  style={{ ...inp, cursor: "pointer" }} onFocus={onFocus} onBlur={onBlur}>
                  <option value="">Elegir sucursal…</option>
                  {sucursales.map(s => (
                    <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre_sucursal}</option>
                  ))}
                </select>
                <input type="text" maxLength={200} value={destinoTxt}
                  onChange={e => setDestinoTxt(e.target.value)} placeholder="O escribir destino libre…"
                  style={{ ...inp, marginTop: "6px" }} onFocus={onFocus} onBlur={onBlur} />
              </Field>
              <Field htmlFor="sal-fecha" label="Fecha de la salida" required textFaint={textFaint}>
                <input id="sal-fecha" type="date" value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  style={inp} onFocus={onFocus} onBlur={onBlur} />
              </Field>
            </div>
            <Field htmlFor="sal-motivo" label="Motivo / observaciones" textFaint={textFaint}>
              <input id="sal-motivo" type="text" maxLength={500} value={motivo}
                onChange={e => setMotivo(e.target.value)} placeholder="Uso interno, reparación, préstamo…"
                style={inp} onFocus={onFocus} onBlur={onBlur} />
            </Field>
            <p style={{ margin: 0, fontSize: "11px", color: textMuted, fontVariantNumeric: "tabular-nums" }}>
              Total: <strong style={{ color: textMain }}>{totalPiezas}</strong> pieza{totalPiezas !== 1 ? "s" : ""} en {renglones.filter(r => r.id_insumo).length} renglones. Al guardar se descuenta del inventario.
            </p>
            {error && (
              <p role="alert" style={{ margin: 0, padding: "8px 12px", borderRadius: "6px", fontSize: "12px",
                fontWeight: 500, color: "#dc2626", background: isDark ? "rgba(220,38,38,0.10)" : "#fef2f2",
                border: `1px solid ${isDark ? "rgba(220,38,38,0.25)" : "#fecaca"}` }}>{error}</p>
            )}
          </form>
        </div>
        <div style={{ padding: "10px 18px", borderTop: `1px solid ${border}`, background: surfaceAlt,
          display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px", flexShrink: 0 }}>
          <button type="button" onClick={onClose} disabled={saving}
            style={{ padding: "6px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: 600,
              background: "transparent", border: `1px solid ${border}`, color: textMuted,
              cursor: "pointer", opacity: saving ? 0.5 : 1 }}>Cancelar</button>
          <button type="submit" form="form-salida" disabled={saving}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 18px",
              borderRadius: "6px", fontSize: "12px", fontWeight: 700,
              background: saving ? `${NARANJA}99` : NARANJA, border: "none", color: "#fff",
              cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? <Printer size={13} /> : <ArrowUpFromLine size={13} />}
            {saving ? "Registrando…" : "Registrar salida"}
          </button>
        </div>
      </div>
    </div>
  );
}






