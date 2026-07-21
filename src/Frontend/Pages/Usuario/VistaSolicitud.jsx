import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft, Package, User, Calendar, Tag, AlertTriangle,
  CheckCircle2, XCircle, Check, X as XIcon
} from "lucide-react";
import { apiFetch, API_ROUTES, getToken } from "../../Config/api";
import Modal from "../../Components/Modal";
import ModalDetalleInsumo from "../../Components/Inventario/ModalDetalleInsumo";

const ESTATUS_META = {
  "En proceso": { color: "#d97706", bgL: "#fef3c7", bgD: "rgba(217,119,6,0.15)",  borderL: "#fde68a", borderD: "rgba(217,119,6,0.3)",   icon: AlertTriangle },
  "Aceptado":   { color: "#16a34a", bgL: "#dcfce7", bgD: "rgba(22,163,74,0.15)",  borderL: "#86efac", borderD: "rgba(22,163,74,0.3)",   icon: CheckCircle2  },
  "Rechazado":  { color: "#dc2626", bgL: "#fee2e2", bgD: "rgba(220,38,38,0.15)",  borderL: "#fca5a5", borderD: "rgba(220,38,38,0.3)",   icon: XCircle       },
};

const PRIO_META = {
  "Urgente": { color: "#dc2626", bgL: "#fee2e2", bgD: "rgba(220,38,38,0.15)",  borderL: "#fca5a5", borderD: "rgba(220,38,38,0.3)"  },
  "Alta":    { color: "#ea580c", bgL: "#ffedd5", bgD: "rgba(234,88,12,0.15)",  borderL: "#fdba74", borderD: "rgba(234,88,12,0.3)"  },
  "Media":   { color: "#ca8a04", bgL: "#fef9c3", bgD: "rgba(202,138,4,0.15)",  borderL: "#fde047", borderD: "rgba(202,138,4,0.3)"  },
  "Baja":    { color: "#16a34a", bgL: "#dcfce7", bgD: "rgba(22,163,74,0.15)",  borderL: "#86efac", borderD: "rgba(22,163,74,0.3)"  },
};

const ESTATUS_OPTS = ["Aceptado", "Rechazado"];

function ImgOrIcon({ src, alt, orange, isDark, onClick }) {
  const [err, setErr] = useState(false);
  return (
    <button
      onClick={onClick}
      title="Ver detalle"
      style={{
        width: "40px", height: "40px", borderRadius: "8px", flexShrink: 0,
        overflow: "hidden", cursor: "pointer", padding: 0, border: "none",
        background: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {src && !err
        ? <img src={src} alt={alt} onError={() => setErr(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <Package size={18} style={{ color: orange, opacity: 0.6 }} />}
    </button>
  );
}

function calcDisponibilidad(stock) {
  const s = stock ?? 0;
  if (s === 0) return "Sin stock";
  if (s <= 5)  return "Stock bajo";
  return "Disponible";
}

export default function VistaSolicitud({ id_solicitud, T, esAdmin = false, onBack }) {
  const isDark  = T?.isDark ?? false;
  const orange  = T?.orange  ?? "#f47920";

  const [solicitud, setSolicitud] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [updating,  setUpdating]  = useState(false);
  const [guardado,  setGuardado]  = useState(false);
  const [aprobados,      setAprobados]      = useState({});
  const [cantidades,     setCantidades]     = useState({});
  const [cantidadesMax,  setCantidadesMax]  = useState({});
  const [guardandoItems, setGuardandoItems] = useState(false);
  const [itemsGuardados, setItemsGuardados] = useState(false);
  const [errorAccion, setErrorAccion] = useState("");
  const [confirmParcial, setConfirmParcial] = useState(null);
  const [insumoDetalle, setInsumoDetalle] = useState(null);

  const cargar = useCallback(() => {
    if (!id_solicitud) return;
    setLoading(true);
    apiFetch(API_ROUTES.SOLICITUD(id_solicitud))
      .then(r => r.json().catch(() => ({ error: `Error del servidor (${r.status})` })))
      .then(d => {
        if (d?.error) { setError(d.error); return; }
        if (!d?.id_solicitud) { setError("Solicitud no encontrada"); return; }
        setSolicitud(d);
        // null = sin revisar → false (el admin debe marcar explícitamente)
        // 1 = aprobado, 0 = rechazado explícito
        const mapa = {};
        const mapaCant = {};
        const mapaMax = {};
        (d.detalle || []).forEach(item => {
          mapa[item.id_solicitud_insumo] = item.aprobado === 1;
          mapaCant[item.id_solicitud_insumo] = item.cantidad;
          mapaMax[item.id_solicitud_insumo] = item.cantidad;
        });
        setAprobados(mapa);
        setCantidades(mapaCant);
        setCantidadesMax(mapaMax);
      })
      .catch(() => setError("No se pudo conectar con el servidor"))
      .finally(() => setLoading(false));
  }, [id_solicitud]);

  useEffect(() => { cargar(); }, [cargar]);

  const ejecutarCambioEstatus = async (nuevoEstatus) => {
    setUpdating(true);
    setErrorAccion("");
    try {
      // Capturar snapshot del estado aprobados en este momento
      const snapshotAprobados = { ...aprobados };
      const body = { estatus: nuevoEstatus };
      if (nuevoEstatus === "Aceptado" && solicitud?.detalle?.length > 0) {
        body.items = solicitud.detalle.map(d => ({
          id_solicitud_insumo: d.id_solicitud_insumo,
          aprobado: snapshotAprobados[d.id_solicitud_insumo] === true ? 1 : 0,
          cantidad: snapshotAprobados[d.id_solicitud_insumo] === true
            ? (cantidades[d.id_solicitud_insumo] ?? d.cantidad)
            : d.cantidad,
        }));
      }
      const r = await apiFetch(API_ROUTES.SOLICITUD_ESTATUS(solicitud.id_solicitud), {
        method: "PATCH",
        body,
      });
      if (r.ok) {
        setSolicitud(prev => ({ ...prev, estatus: nuevoEstatus }));
        setGuardado(true);
        setTimeout(() => setGuardado(false), 2500);
      } else {
        const data = await r.json().catch(() => ({}));
        setErrorAccion(data.error || "Error al actualizar el estatus");
      }
    } finally {
      setUpdating(false);
    }
  };

  const cambiarEstatus = async (nuevoEstatus) => {
    if (!solicitud) return;
    if (nuevoEstatus === "Aceptado") {
      const aprobadosCount = Object.values(aprobados).filter(Boolean).length;
      const totalItems = solicitud.detalle?.length ?? 0;
      if (aprobadosCount < totalItems) {
        setConfirmParcial({ nuevoEstatus, aprobadosCount, totalItems });
        return;
      }
    }
    ejecutarCambioEstatus(nuevoEstatus);
  };

  const guardarAprobados = async () => {
    if (!solicitud) return;
    setGuardandoItems(true);
    try {
      const items = (solicitud.detalle || []).map(d => ({
        id_solicitud_insumo: d.id_solicitud_insumo,
        aprobado: aprobados[d.id_solicitud_insumo] === true ? 1 : 0,
        cantidad: aprobados[d.id_solicitud_insumo] === true
          ? (cantidades[d.id_solicitud_insumo] ?? d.cantidad)
          : d.cantidad,
      }));
      const r = await apiFetch(API_ROUTES.SOLICITUD_ITEMS(solicitud.id_solicitud), {
        method: "PATCH",
        body: { items },
      });
      if (r.ok) {
        setItemsGuardados(true);
        setTimeout(() => setItemsGuardados(false), 2500);
        // Recargar para reflejar cambios
        cargar();
      }
    } finally {
      setGuardandoItems(false);
    }
  };

  const card = {
    background: isDark ? "#141720" : (T?.surface ?? "#fff"),
    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : (T?.border ?? "#e2e8f0")}`,
    boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 1px 6px rgba(0,0,0,0.06)",
  };
  const hdr = {
    background: isDark ? "rgba(255,255,255,0.03)" : (T?.surfaceAlt ?? "#f8fafc"),
    borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : (T?.border ?? "#e2e8f0")}`,
  };
  const labelStyle = { color: isDark ? "rgba(255,255,255,0.45)" : (T?.textMuted ?? "#94a3b8") };
  const valStyle   = { color: T?.text ?? "#1e293b" };

  if (loading) return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={orange} strokeWidth="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
    </div>
  );

  if (error || !solicitud) return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
      <XCircle size={32} style={{ color: "#dc2626" }} />
      <p className="text-sm font-bold" style={valStyle}>{error || "Solicitud no encontrada"}</p>
      {onBack && (
        <button onClick={onBack} className="text-xs font-bold px-4 py-2 rounded-xl transition-all hover:brightness-110"
          style={{ background: `${orange}15`, color: orange, border: `1px solid ${orange}40` }}>
          ← Regresar
        </button>
      )}
    </div>
  );

  const estatusMeta  = ESTATUS_META[solicitud.estatus] || ESTATUS_META["En proceso"];
  const prioMeta     = PRIO_META[solicitud.prioridad]  || PRIO_META["Baja"];
  const estatusBg    = isDark ? estatusMeta.bgD    : estatusMeta.bgL;
  const estatusBrd   = isDark ? estatusMeta.borderD : estatusMeta.borderL;
  const prioBg       = isDark ? prioMeta.bgD       : prioMeta.bgL;
  const prioBrd      = isDark ? prioMeta.borderD   : prioMeta.borderL;

  const cerrado = solicitud.estatus === "Aceptado" || solicitud.estatus === "Rechazado";

  const aprobadosCount = Object.values(aprobados).filter(Boolean).length;
  const totalItems = solicitud.detalle?.length ?? 0;

  const EstatusIcon = estatusMeta.icon;
  const fmtFecha = (d) => d ? new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
  const fmtFechaHora = (d) => d ? new Date(d).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "—";



  const generarReporte = () => {
    const folio = solicitud.folio_solicitud;
    const token = getToken();
    const url   = `/print/solicitud/${encodeURIComponent(folio)}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
    const win   = window.open(url, "_blank", "width=1200,height=800");
    if (!win) {
      const aviso = document.createElement("div");
      aviso.style.cssText = "position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9999;background:#1D1D1B;color:#fff;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:700;border-left:4px solid #F47920;box-shadow:0 4px 20px rgba(0,0,0,0.4);";
      aviso.textContent = "El navegador bloqueó la ventana emergente. Permite las ventanas emergentes e intenta de nuevo.";
      document.body.appendChild(aviso);
      setTimeout(() => aviso.remove(), 5000);
    }
  };

  return (
    <div style={{
      background: T?.bg ?? "#f8fafc",
      fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
    {insumoDetalle && (
      <ModalDetalleInsumo insumo={insumoDetalle} onClose={() => setInsumoDetalle(null)} T={T} />
    )}
    {confirmParcial && (
        <Modal
          T={T}
          title="Aprobación parcial"
          onClose={() => setConfirmParcial(null)}
          onConfirm={() => { const e = confirmParcial; setConfirmParcial(null); ejecutarCambioEstatus(e.nuevoEstatus); }}
          confirmLabel="Sí, continuar"
          cancelLabel="Cancelar"
          maxWidth="380px"
        >
          <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.55", color: T?.text }}>
            Solo <strong>{confirmParcial.aprobadosCount}</strong> de <strong>{confirmParcial.totalItems}</strong> insumos están aprobados.
            Solo se descontará el stock de los aprobados.
          </p>
        </Modal>
      )}
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", padding: "12px 10px" }}>
      <div className="max-w-5xl mx-auto pb-10 space-y-3 sm:space-y-4">

        {/* ── HEADER CARD ── */}
        <div className="rounded-2xl overflow-hidden" style={card}>
          <div className="h-1" style={{ background: `linear-gradient(90deg, ${estatusMeta.color}, ${estatusMeta.color}55)` }} />
          <div className="px-4 py-3 sm:px-5 md:px-6">
            {/* Top row */}
            <div className="flex flex-col gap-2 mb-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex items-center gap-2">
                {onBack && (
                  <button onClick={onBack}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all hover:brightness-110 active:scale-95 flex-shrink-0"
                    style={{ background: isDark ? "rgba(255,255,255,0.06)" : T?.surfaceAlt, color: T?.textMuted, border: `1px solid ${T?.border}` }}>
                    <ArrowLeft size={13} /> Volver
                  </button>
                )}
                <span className="sm:hidden font-mono text-xs font-black px-2.5 py-1 rounded-xl"
                  style={{ background: isDark ? "rgba(255,255,255,0.06)" : T?.surfaceAlt, color: T?.text, border: `1px solid ${T?.border}` }}>
                  {solicitud.folio_solicitud}
                </span>
              </div>

              <h1 className="text-sm font-black leading-snug flex-1" style={{ color: T?.text }}>
                Solicitud de Insumos
              </h1>

              <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl"
                  style={{ background: isDark ? "rgba(255,255,255,0.06)" : T?.surfaceAlt, color: T?.text, border: `1px solid ${T?.border}` }}>
                  {solicitud.folio_solicitud}
                </span>
                <img
                  src={isDark ? "/assets/img/logo blanco.png" : "/assets/img/logo negro.png"}
                  alt="logo" style={{ height: "28px", width: "auto", objectFit: "contain" }}
                />
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                style={{ background: prioBg, color: prioMeta.color, border: `1px solid ${prioBrd}` }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: prioMeta.color }} />
                Prioridad: {solicitud.prioridad}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                style={{ background: estatusBg, color: estatusMeta.color, border: `1px solid ${estatusBrd}` }}>
                <EstatusIcon size={11} className={solicitud.estatus === "En proceso" ? "animate-spin" : ""} />
                Estado: {solicitud.estatus || "En proceso"}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                style={{ background: isDark ? "rgba(255,255,255,0.06)" : T?.surfaceAlt, color: T?.textMuted, border: `1px solid ${T?.border}` }}>
                <Package size={10} />
                {solicitud.detalle?.length ?? 0} insumo{solicitud.detalle?.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* ── CUERPO ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">

          {/* ── COLUMNA IZQUIERDA ── */}
          <div className="lg:col-span-3 space-y-3 sm:space-y-4">

            {/* Información general */}
            <div className="rounded-2xl overflow-hidden" style={card}>
              <div className="px-4 py-2.5 flex items-center gap-2" style={hdr}>
                <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ background: orange }} />
                <p className="text-[10px] font-black uppercase tracking-widest" style={labelStyle}>Información del reporte</p>
              </div>
              <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {[
                  { icon: User,          label: "Solicitante",  val: solicitud.nombre_empleado    || "—" },
                  { icon: Tag,           label: "Área",         val: solicitud.nombre_departamento || "—" },
                  { icon: Calendar,      label: "Fecha",        val: fmtFechaHora(solicitud.fecha) },
                  { icon: AlertTriangle, label: "Prioridad",    val: solicitud.prioridad || "—" },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: isDark ? "rgba(255,255,255,0.03)" : T?.bg, border: `1px solid ${T?.border}` }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(244,121,32,0.1)" }}>
                      <Icon size={13} style={{ color: orange }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-widest" style={labelStyle}>{label}</p>
                      <p className="text-xs font-semibold truncate mt-0.5" style={valStyle}>{val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Insumos solicitados */}
            <div className="rounded-2xl overflow-hidden" style={card}>
              <div className="px-4 py-2.5 flex items-center justify-between" style={hdr}>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ background: orange }} />
                  <p className="text-[10px] font-black uppercase tracking-widest" style={labelStyle}>Insumos Solicitados</p>
                </div>
                <div className="flex items-center gap-2">
                  {esAdmin && !cerrado && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: isDark ? "rgba(22,163,74,0.12)" : "#dcfce7", color: "#16a34a", border: "1px solid rgba(22,163,74,0.3)" }}>
                      {aprobadosCount}/{totalItems} aprobados
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: T?.bg, color: T?.textMuted, border: `1px solid ${T?.border}` }}>
                    {totalItems} ítem{totalItems !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Aviso aprobación parcial — solo admin, solicitud abierta */}
              {esAdmin && !cerrado && (
                <div className="px-4 py-2 flex items-center gap-2"
                  style={{ background: isDark ? "rgba(59,130,246,0.06)" : "#eff6ff", borderBottom: `1px solid ${T?.border}` }}>
                  <p className="text-[10px] flex-1" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#64748b" }}>
                    Marca los insumos a aprobar. Al resolver, solo se descontará el stock de los marcados.
                  </p>
                  <button
                    onClick={() => {
                      const todosAprobados = (solicitud.detalle || []).every(d => aprobados[d.id_solicitud_insumo] === true);
                      const nuevoVal = !todosAprobados;
                      const nuevo = {};
                      (solicitud.detalle || []).forEach(d => { nuevo[d.id_solicitud_insumo] = nuevoVal; });
                      setAprobados(nuevo);
                    }}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg flex-shrink-0 transition-all hover:brightness-110"
                    style={{ background: isDark ? "rgba(255,255,255,0.06)" : T?.surfaceAlt, color: T?.textMuted, border: `1px solid ${T?.border}` }}>
                    {(solicitud.detalle || []).every(d => aprobados[d.id_solicitud_insumo] === true) ? "Desmarcar todos" : "Aprobar todos"}
                  </button>
                </div>
              )}

              <div className="divide-y" style={{ borderColor: isDark ? "rgba(255,255,255,0.07)" : T?.border }}>
                {!solicitud.detalle?.length ? (
                  <p className="px-4 py-8 text-center text-xs" style={labelStyle}>Sin insumos registrados</p>
                ) : solicitud.detalle.map((d, i) => {
                  const aprobado = aprobados[d.id_solicitud_insumo] === true;
                  // Para usuario: en solicitud cerrada, d.aprobado viene de BD (1=sí, 0=no, null=sin revisar)
                  const itemAprobadoBD = d.aprobado === 1 || d.aprobado === true;
                  const itemRechazadoBD = cerrado && d.aprobado === 0;
                  // Opacidad: admin abierta → atenúa no marcados; usuario cerrada → atenúa rechazados
                  const opacidad = (esAdmin && !cerrado && !aprobado) || (!esAdmin && cerrado && itemRechazadoBD) ? 0.45 : 1;
                  return (
                    <div key={d.id_solicitud_insumo ?? i}
                      className="px-4 py-3 flex items-center gap-3 transition-all"
                      style={{ opacity: opacidad }}>

                      {/* Checkbox admin solicitud abierta */}
                      {esAdmin && !cerrado && (
                        <button
                          onClick={() => setAprobados(prev => ({ ...prev, [d.id_solicitud_insumo]: !aprobado }))}
                          className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all active:scale-90"
                          style={{
                            background: aprobado ? "#16a34a" : isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                            border: `2px solid ${aprobado ? "#16a34a" : isDark ? "rgba(255,255,255,0.2)" : "#d1d5db"}`,
                            boxShadow: aprobado ? "0 1px 4px rgba(22,163,74,0.4)" : "none",
                          }}>
                          {aprobado && <Check size={11} color="#fff" strokeWidth={3} />}
                        </button>
                      )}

                      {/* Indicador estado en solicitud cerrada (admin y usuario) */}
                      {cerrado && d.aprobado != null && (
                        <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: itemAprobadoBD ? "rgba(22,163,74,0.15)" : "rgba(220,38,38,0.15)" }}>
                          {itemAprobadoBD
                            ? <Check size={10} style={{ color: "#16a34a" }} strokeWidth={3} />
                            : <XIcon size={10} style={{ color: "#dc2626" }} strokeWidth={3} />}
                        </div>
                      )}

                      {/* Imagen o ícono — clic abre detalle */}
                      <ImgOrIcon
                        src={d.imagen_url || null}
                        alt={d.nombre}
                        orange={orange}
                        isDark={isDark}
                        onClick={() => setInsumoDetalle({ ...d, disponibilidad: calcDisponibilidad(d.stock) })}
                      />

                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => setInsumoDetalle({ ...d, disponibilidad: calcDisponibilidad(d.stock) })}
                          className="text-[13px] font-bold truncate block text-left w-full hover:underline"
                          style={{ ...valStyle, background: "none", border: "none", padding: 0, cursor: "pointer" }}
                        >
                          {d.nombre}
                        </button>
                        <p className="text-[11px] mt-0.5" style={labelStyle}>
                          {[d.marca, d.modelo].filter(Boolean).join(" · ") || "Sin especificaciones"}
                          {d.num_serie ? ` · S/N: ${d.num_serie}` : ""}
                        </p>
                        {/* Etiqueta de entrega — visible para usuario en solicitud cerrada */}
                        {!esAdmin && cerrado && d.aprobado != null && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{
                              background: (d.aprobado === 1 || d.aprobado === true)
                                ? (isDark ? "rgba(22,163,74,0.15)" : "#dcfce7")
                                : (isDark ? "rgba(220,38,38,0.12)" : "#fee2e2"),
                              color: (d.aprobado === 1 || d.aprobado === true) ? "#16a34a" : "#dc2626",
                            }}>
                            {(d.aprobado === 1 || d.aprobado === true) ? "✓ Se entregará" : "✕ No se entregará"}
                          </span>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[13px] font-bold leading-none" style={{ color: orange }}>×{d.cantidad}</p>
                        {/* Input cantidad aprobada — solo admin, abierta, ítem aprobado */}
                        {esAdmin && !cerrado && aprobado && (
                          <input
                            type="number"
                            min={1}
                            max={cantidadesMax[d.id_solicitud_insumo] ?? d.cantidad}
                            value={cantidades[d.id_solicitud_insumo] ?? d.cantidad}
                            onChange={e => {
                              const max = cantidadesMax[d.id_solicitud_insumo] ?? d.cantidad;
                              const v = Math.max(1, Math.min(max, parseInt(e.target.value) || 1));
                              setCantidades(prev => ({ ...prev, [d.id_solicitud_insumo]: v }));
                            }}
                            onClick={e => e.stopPropagation()}
                            className="mt-1 w-14 text-center text-[11px] font-bold rounded-lg px-1 py-0.5 outline-none"
                            style={{
                              background: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9",
                              border: `1px solid ${orange}60`,
                              color: orange,
                            }}
                          />
                        )}
                        <p className="text-[10px] font-semibold uppercase tracking-wide mt-0.5"
                          style={{ color: d.stock > 0 ? "#16a34a" : "#dc2626" }}>
                          {d.stock > 0 ? `Stock: ${d.stock}` : "Agotado"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botón guardar selección — solo admin, solicitud abierta */}
              {esAdmin && !cerrado && (
                <div className="px-4 py-3" style={{ borderTop: `1px solid ${T?.border}` }}>
                  {itemsGuardados && (
                    <p className="text-[10px] font-semibold mb-1.5 flex items-center gap-1" style={{ color: "#16a34a" }}>
                      <CheckCircle2 size={10} /> Selección guardada
                    </p>
                  )}
                  <button onClick={guardarAprobados} disabled={guardandoItems}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-bold transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                    style={{ background: isDark ? "rgba(22,163,74,0.12)" : "#dcfce7", color: "#16a34a", border: "1px solid rgba(22,163,74,0.3)" }}>
                    <Check size={12} strokeWidth={2.5} />
                    {guardandoItems ? "Guardando..." : `Guardar selección (${aprobadosCount}/${totalItems})`}
                  </button>
                </div>
              )}

              {/* Total */}
              <div className="px-4 py-2.5 flex items-center justify-between"
                style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T?.border}`, ...hdr }}>
                <span className="text-[10px] font-black uppercase tracking-wider" style={labelStyle}>Total de piezas</span>
                <span className="text-sm font-black" style={{ color: orange }}>
                  {solicitud.detalle?.reduce((s, d) => s + d.cantidad, 0) ?? 0} pza.
                </span>
              </div>
            </div>

          </div>

          {/* ── COLUMNA DERECHA ── */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">

            {/* Estado de la solicitud */}
            <div className="rounded-2xl overflow-hidden" style={card}>
              <div className="px-4 py-3 flex items-center gap-2" style={hdr}>
                <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: orange }} />
                <p className="text-[11px] font-black uppercase tracking-widest" style={labelStyle}>Estado de la solicitud</p>
              </div>
              <div className="p-5 flex flex-col gap-3">

                {/* Fecha de solicitud */}
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: isDark ? "rgba(255,255,255,0.03)" : T?.bg, border: `1px solid ${T?.border}` }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${orange}18` }}>
                    <Calendar size={13} style={{ color: orange }} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest" style={labelStyle}>Fecha de solicitud</p>
                    <p className="text-xs font-semibold mt-0.5" style={valStyle}>{fmtFechaHora(solicitud.fecha)}</p>
                  </div>
                </div>

                {/* Estado actual */}
                {!cerrado ? (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{
                      background: isDark ? `${orange}12` : "#fff7ed",
                      border: `1px solid ${orange}40`,
                    }}>
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ background: `${orange}20`, border: `2px solid ${orange}` }}>
                        <AlertTriangle size={16} style={{ color: orange }} />
                      </div>
                      <span className="absolute inset-0 rounded-full animate-ping"
                        style={{ background: `${orange}25`, animationDuration: "2s" }} />
                    </div>
                    <div>
                      <p className="text-xs font-black" style={{ color: orange }}>Pendiente de resolución</p>
                      <p className="text-[10px] mt-0.5" style={{ color: T?.textFaint }}>En espera de acción del administrador</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{
                      background: isDark
                        ? (solicitud.estatus === "Aceptado" ? "rgba(22,163,74,0.12)" : "rgba(220,38,38,0.12)")
                        : (solicitud.estatus === "Aceptado" ? "#dcfce7" : "#fee2e2"),
                      border: solicitud.estatus === "Aceptado"
                        ? (isDark ? "1px solid rgba(22,163,74,0.3)" : "1px solid #86efac")
                        : (isDark ? "1px solid rgba(220,38,38,0.3)" : "1px solid #fca5a5"),
                    }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: solicitud.estatus === "Aceptado" ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)",
                        border: solicitud.estatus === "Aceptado" ? "2px solid #16a34a" : "2px solid #dc2626",
                      }}>
                      {solicitud.estatus === "Aceptado"
                        ? <CheckCircle2 size={18} style={{ color: "#16a34a" }} />
                        : <XCircle size={18} style={{ color: "#dc2626" }} />}
                    </div>
                    <div>
                      <p className="text-xs font-black"
                        style={{ color: solicitud.estatus === "Aceptado" ? "#16a34a" : "#dc2626" }}>
                        {solicitud.estatus === "Aceptado" ? "Solicitud aceptada" : "Solicitud rechazada"}
                      </p>
                      {solicitud.estatus === "Aceptado" ? (() => {
                        const entregados = (solicitud.detalle || []).filter(d => d.aprobado === 1 || d.aprobado === true).length;
                        const noEntregados = (solicitud.detalle || []).filter(d => d.aprobado === 0).length;
                        return (
                          <p className="text-[10px] mt-0.5" style={{ color: T?.textFaint }}>
                            {entregados > 0 && noEntregados > 0
                              ? `${entregados} insumo${entregados !== 1 ? "s" : ""} se entregará${entregados !== 1 ? "n" : ""} · ${noEntregados} no`
                              : entregados > 0
                              ? "Todos los insumos aprobados y stock descontado"
                              : "Ningún insumo fue aprobado"}
                          </p>
                        );
                      })() : (
                        <p className="text-[10px] mt-0.5" style={{ color: T?.textFaint }}>La solicitud fue denegada por el administrador</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Exportar PDF */}
            <div style={card} className="rounded-2xl overflow-hidden"
              onMouseEnter={e => Object.assign(e.currentTarget.style, { boxShadow: isDark ? "0 12px 40px rgba(0,0,0,0.55)" : "0 12px 40px rgb(0,0,0,0.09)" })}
              onMouseLeave={e => Object.assign(e.currentTarget.style, { boxShadow: card.boxShadow })}>
              <div className="px-4 py-2.5 flex items-center gap-2" style={hdr}>
                <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ background: "#dc2626" }} />
                <p className="text-[10px] font-black uppercase tracking-widest" style={labelStyle}>Exportar reporte</p>
              </div>
              <div className="px-5 py-5">
                <p className="text-[11px] mb-3" style={{ color: T?.textFaint }}>Genera un PDF con toda la información de esta solicitud.</p>
                <button
                  onClick={generarReporte}
                  className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-xs font-bold transition-all active:scale-95"
                  style={{
                    background: isDark ? "rgba(220,38,38,0.12)" : "#fef2f2",
                    color: "#dc2626",
                    border: `1px solid ${isDark ? "rgba(220,38,38,0.25)" : "#fca5a5"}`,
                    letterSpacing: "0.03em",
                    transition: "all 0.18s ease",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = isDark ? "rgba(220,38,38,0.2)" : "#fee2e2";
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(220,38,38,0.15)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = isDark ? "rgba(220,38,38,0.12)" : "#fef2f2";
                    e.currentTarget.style.boxShadow = "none";
                  }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                  Exportar PDF
                </button>
              </div>
            </div>

            {/* Cambiar estatus — solo admin */}
            {esAdmin && (
              <div className="rounded-2xl" style={{ ...card, overflow: "visible" }}>
                <div className="h-0.5 rounded-t-2xl" style={{ background: "linear-gradient(90deg,#16a34a,#4ade80,#16a34a)" }} />
                <div className="px-4 py-3 flex items-center gap-2"
                  style={{ ...hdr, borderRadius: "0", borderTop: "none" }}>
                  <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ background: "#16a34a" }} />
                  <p className="text-[10px] font-black uppercase tracking-widest" style={labelStyle}>Cambiar estatus</p>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  {guardado && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold"
                      style={{ background: isDark ? "rgba(22,163,74,0.15)" : "#dcfce7", color: "#16a34a", border: isDark ? "1px solid rgba(22,163,74,0.3)" : "1px solid #86efac" }}>
                      <CheckCircle2 size={13} /> Estatus actualizado
                    </div>
                  )}
                  {errorAccion && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold"
                      style={{ background: isDark ? "rgba(220,38,38,0.12)" : "#fee2e2", color: "#dc2626", border: "1px solid rgba(220,38,38,0.3)" }}>
                      <XCircle size={13} /> {errorAccion}
                    </div>
                  )}
                  {!cerrado ? (
                    <div className="flex flex-col gap-3">
                      {ESTATUS_OPTS.map(opt => {
                        const m = ESTATUS_META[opt];
                        const isAceptado = opt === "Aceptado";
                        return (
                          <button
                            key={opt}
                            onClick={() => cambiarEstatus(opt)}
                            disabled={updating}
                            className="w-full flex items-center gap-3 px-4 rounded-xl font-bold transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                            style={{
                              background: isAceptado
                                ? (isDark ? "rgba(22,163,74,0.15)" : "#dcfce7")
                                : (isDark ? "rgba(220,38,38,0.12)" : "#fee2e2"),
                              color: m.color,
                              border: `1px solid ${isDark ? `${m.color}40` : (isAceptado ? "#86efac" : "#fca5a5")}`,
                              minHeight: "52px",
                              fontSize: "13px",
                            }}
                          >
                            <m.icon size={17} />
                            {updating ? "Actualizando..." : opt}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{
                          background: isDark
                            ? (solicitud.estatus === "Rechazado" ? "rgba(220,38,38,0.15)" : "rgba(22,163,74,0.15)")
                            : (solicitud.estatus === "Rechazado" ? "#fee2e2" : "#dcfce7"),
                          border: solicitud.estatus === "Rechazado"
                            ? (isDark ? "2px solid rgba(220,38,38,0.3)" : "2px solid #fca5a5")
                            : (isDark ? "2px solid rgba(22,163,74,0.3)" : "2px solid #86efac"),
                        }}>
                        {solicitud.estatus === "Rechazado"
                          ? <XCircle size={20} style={{ color: "#dc2626" }} />
                          : <CheckCircle2 size={20} style={{ color: "#16a34a" }} />}
                      </div>
                      <p className="text-xs font-black"
                        style={{ color: solicitud.estatus === "Rechazado" ? "#dc2626" : "#16a34a" }}>
                        {solicitud.estatus === "Rechazado" ? "Rechazado" : "Aceptado"}
                      </p>
                      <p className="text-[11px] text-center" style={{ color: T?.textFaint }}>Solicitud cerrada</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
