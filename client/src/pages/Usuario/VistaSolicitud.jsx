/**
 * VistaSolicitud.jsx
 *
 * Detalle de una solicitud de insumos. Para Usuario es solo lectura; para
 * Administrador o Soporte Técnico permite aprobar o negar cada ítem, ajustar
 * cantidades, fijar la ruta del material, escribir la observación y aceptar o
 * rechazar.
 *
 * Export default: VistaSolicitud
 * Props: id_solicitud, T, esAdmin, onBack.
 * Endpoints: GET /api/solicitudes/:id, PATCH /api/solicitudes/:id/estatus |
 *    /items | /ruta | /observacion, GET /api/auth/sucursales.
 * Soporte Técnico se identifica por el NOMBRE del departamento, no por id.
 *
 * @module client/pages/Usuario/VistaSolicitud
 * @requires react
 * @requires lucide-react
 * @requires ../../services/api-client.js
 * @requires ../../utils/session.js
 * @requires ../../components/Modal.jsx
 * @requires ../../components/Inventario/ModalDetalleInsumo.jsx
 * @requires ../../utils/tipografia.js
 * @exports VistaSolicitud (default)
 */
import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft, Package, User, Calendar, Tag, AlertTriangle,
  CheckCircle2, XCircle, Check, X as XIcon,
  FileText, MapPin, ArrowRight, Save
} from "lucide-react";
import { apiFetch, API_ROUTES, getToken, textoError, MSG_SIN_CONEXION } from '../../services/api-client.js';
import { getUsuario } from '../../utils/session.js';
import Modal from '../../components/Modal.jsx';
import ModalDetalleInsumo from '../../components/Inventario/ModalDetalleInsumo.jsx';
import { FS } from '../../utils/tipografia.js';
import { fechaHora } from '../../utils/fechas.js';
import { ImgOrIcon, SelectSucursal } from '../../components/Insumos/ControlesSolicitud.jsx';
import PanelLateralSolicitud, { ESTATUS_META } from '../../components/Insumos/PanelLateralSolicitud.jsx';


const PRIO_META = {
  "Urgente": { color: "#dc2626", bgL: "#fee2e2", bgD: "rgba(220,38,38,0.15)",  borderL: "#fca5a5", borderD: "rgba(220,38,38,0.3)"  },
  "Alta":    { color: "#ea580c", bgL: "#ffedd5", bgD: "rgba(234,88,12,0.15)",  borderL: "#fdba74", borderD: "rgba(234,88,12,0.3)"  },
  "Media":   { color: "#ca8a04", bgL: "#fef9c3", bgD: "rgba(202,138,4,0.15)",  borderL: "#fde047", borderD: "rgba(202,138,4,0.3)"  },
  "Baja":    { color: "#16a34a", bgL: "#dcfce7", bgD: "rgba(22,163,74,0.15)",  borderL: "#86efac", borderD: "rgba(22,163,74,0.3)"  },
};


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
  const [sucursales,     setSucursales]     = useState([]);
  // Ruta del material: sucursal de donde sale (origen) y a donde va (destino)
  const [ruta,           setRuta]           = useState({ origen: "", destino: "" });
  const [guardandoItems, setGuardandoItems] = useState(false);
  const [itemsGuardados, setItemsGuardados] = useState(false);
  const [guardandoRuta, setGuardandoRuta] = useState(false);
  const [rutaGuardada,   setRutaGuardada]   = useState(false);
  const [errorAccion, setErrorAccion] = useState("");
  const [confirmParcial, setConfirmParcial] = useState(null);
  const [insumoDetalle, setInsumoDetalle] = useState(null);

  // ── Observación única de la solicitud (Soporte Técnico / Administración) ──
  // "Soporte Técnico" NO es un rol (solo existen Administrador y Usuario):
  // se identifica por NOMBRE (igual que NOMBRE_DEPARTAMENTO_SOPORTE en el
  // backend), porque el id cambia si la tabla se renumera o reimporta.
  const sinAcentos = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
  const yo = getUsuario();
  const esDeptoSoporte = sinAcentos(yo?.departamento) === "soporte tecnico";
  const puedeObservar = esAdmin
    || Number(yo?.id_rol) === 1
    || esDeptoSoporte;

  // La ruta del material (de donde sale y a donde llega) es logistica interna:
  // la ven Administracion y Soporte Tecnico, con los mismos privilegios que
  // para las observaciones: verla y guardarla.
  const puedeVerRuta = esAdmin
    || Number(yo?.id_rol) === 1
    || esDeptoSoporte;

  const [obsBorrador,  setObsBorrador]  = useState("");   // texto en edición (uno por solicitud)
  const [obsGuardando, setObsGuardando] = useState(false);
  const [obsMensaje,   setObsMensaje]   = useState(null); // { ok, texto }

  const guardarObservacion = async () => {
    if (!solicitud || obsGuardando) return;
    const texto = obsBorrador.trim();
    setObsGuardando(true);
    setObsMensaje(null);
    try {
      const r = await apiFetch(API_ROUTES.SOLICITUD_OBS(solicitud.id_solicitud), {
        method: "PATCH",
        body: { observacion: texto },
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setObsMensaje({ ok: false, texto: data.error || "No se pudo guardar" });
        return;
      }
      // Se refleja en memoria sin recargar la solicitud entera
      setSolicitud(prev => ({
        ...prev,
        observacion:       data.observacion,
        observacion_por:   data.observacion_por,
        observacion_fecha: data.observacion_fecha,
        observacion_autor: data.observacion_autor,
      }));
      setObsMensaje({ ok: true, texto: texto ? "Guardada" : "Eliminada" });
      setTimeout(() => setObsMensaje(null), 2500);
    } catch {
      setObsMensaje({ ok: false, texto: MSG_SIN_CONEXION });
    } finally {
      setObsGuardando(false);
    }
  };

  const cargar = useCallback(() => {
    if (!id_solicitud) return;
    setLoading(true);
    apiFetch(API_ROUTES.SOLICITUD(id_solicitud))
      .then(r => r.json().catch(() => null).then(d => (r.ok ? d : { error: textoError(d, r.status, "No se pudo abrir la solicitud.") })))
      .then(d => {
        if (d?.error) { setError(d.error); return; }
        if (!d?.id_solicitud) { setError("Solicitud no encontrada"); return; }
        setSolicitud(d);
        setObsBorrador(d.observacion ?? "");
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
        // Ruta guardada; si la solicitud aun no tiene ruta, el destino sugerido
        // es la sucursal a la que pertenece el empleado que solicita.
        setRuta({
          origen:  d.id_sucursal_origen  ?? "",
          destino: d.id_sucursal_destino ?? d.id_sucursal_empleado ?? "",
        });
      })
      .catch(() => setError("No se pudo conectar con el servidor"))
      .finally(() => setLoading(false));
  }, [id_solicitud]);

  useEffect(() => { cargar(); }, [cargar]);

  // Sucursales disponibles para que quien ve la ruta (administrador o
  // Soporte Tecnico) elija de donde sale el material y a donde va antes de
  // aceptar la solicitud. El catalogo es de solo lectura y no exige admin.
  useEffect(() => {
    if (!puedeVerRuta) return;
    apiFetch(API_ROUTES.SUCURSALES)
      .then(r => r.ok ? r.json() : [])
      .then(d => setSucursales(Array.isArray(d) ? d : []))
      .catch(() => setSucursales([]));
  }, [puedeVerRuta]);

  const ejecutarCambioEstatus = async (nuevoEstatus) => {
    setUpdating(true);
    setErrorAccion("");
    try {
      // Capturar snapshot del estado aprobados y cantidades en este momento
      const snapshotAprobados = { ...aprobados };
      const snapshotCantidades = { ...cantidades };
      const body = { estatus: nuevoEstatus };
      if (nuevoEstatus === "Aceptado") {
        // Ruta de sucursales elegida por el admin (obligatoria al aceptar)
        body.id_sucursal_origen  = Number(ruta.origen)  || null;
        body.id_sucursal_destino = Number(ruta.destino) || null;
      }
      if (nuevoEstatus === "Aceptado" && solicitud?.detalle?.length > 0) {
        body.items = solicitud.detalle.map(d => ({
          id_solicitud_insumo: d.id_solicitud_insumo,
          aprobado: snapshotAprobados[d.id_solicitud_insumo] === true ? 1 : 0,
          // Cantidad que se acepta entregar: puede ser menor a la solicitada.
          // En los items negados se manda 0 para que la hoja muestre "0 de N".
          cantidad: snapshotAprobados[d.id_solicitud_insumo] === true
            ? (snapshotCantidades[d.id_solicitud_insumo] ?? d.cantidad_solicitada ?? d.cantidad)
            : 0,
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
      // 1) La ruta de sucursales es obligatoria antes de aceptar
      if (!ruta.origen || !ruta.destino) {
        setErrorAccion("Selecciona la sucursal de ORIGEN (de donde sale el material) y la de DESTINO (a donde va) antes de aceptar.");
        return;
      }
      if (String(ruta.origen) === String(ruta.destino)) {
        setErrorAccion("La sucursal de origen y la de destino deben ser distintas.");
        return;
      }
      // 2) Avisar si se va a aceptar solo una parte de los insumos
      const aprobadosCount = Object.values(aprobados).filter(Boolean).length;
      const totalItems = solicitud.detalle?.length ?? 0;
      if (aprobadosCount < totalItems) {
        setConfirmParcial({ nuevoEstatus, aprobadosCount, totalItems });
        return;
      }
    }
    setErrorAccion("");
    ejecutarCambioEstatus(nuevoEstatus);
  };

  const guardarAprobados = async () => {
    if (!solicitud) return;
    setGuardandoItems(true);
    setErrorAccion("");
    try {
      const items = (solicitud.detalle || []).map(d => ({
        id_solicitud_insumo: d.id_solicitud_insumo,
        aprobado: aprobados[d.id_solicitud_insumo] === true ? 1 : 0,
        cantidad: aprobados[d.id_solicitud_insumo] === true
          ? (cantidades[d.id_solicitud_insumo] ?? d.cantidad_solicitada ?? d.cantidad)
          : 0,
      }));
      const body = { items };
      // Si ya eligio ruta, se guarda junto con la seleccion
      if (ruta.origen && ruta.destino) {
        body.id_sucursal_origen  = Number(ruta.origen);
        body.id_sucursal_destino = Number(ruta.destino);
      }
      const r = await apiFetch(API_ROUTES.SOLICITUD_ITEMS(solicitud.id_solicitud), {
        method: "PATCH",
        body,
      });
      if (r.ok) {
        setItemsGuardados(true);
        setTimeout(() => setItemsGuardados(false), 2500);
        // Recargar para reflejar cambios
        cargar();
      } else {
        const data = await r.json().catch(() => ({}));
        setErrorAccion(data.error || "No se pudo guardar la selección");
      }
    } finally {
      setGuardandoItems(false);
    }
  };

  // Guarda SOLO la ruta del material (no toca items ni estatus) — PATCH /:id/ruta
  const guardarRuta = async () => {
    if (!solicitud) return;
    if (!ruta.origen || !ruta.destino) {
      setErrorAccion("Elige la sucursal de origen y la de destino para guardar la ruta.");
      return;
    }
    if (String(ruta.origen) === String(ruta.destino)) {
      setErrorAccion("La sucursal de origen y la de destino deben ser distintas.");
      return;
    }
    setGuardandoRuta(true);
    setErrorAccion("");
    try {
      const r = await apiFetch(API_ROUTES.SOLICITUD_RUTA(solicitud.id_solicitud), {
        method: "PATCH",
        body: {
          id_sucursal_origen:  Number(ruta.origen),
          id_sucursal_destino: Number(ruta.destino),
        },
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) { setErrorAccion(textoError(data, r.status, "No se pudo guardar la ruta.")); return; }
      setSolicitud(prev => prev ? {
        ...prev,
        nombre_sucursal_origen:  data.nombre_sucursal_origen  ?? prev.nombre_sucursal_origen,
        nombre_sucursal_destino: data.nombre_sucursal_destino ?? prev.nombre_sucursal_destino,
      } : prev);
      setRutaGuardada(true);
      setTimeout(() => setRutaGuardada(false), 2500);
    } catch {
      setErrorAccion(MSG_SIN_CONEXION);
    } finally {
      setGuardandoRuta(false);
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
      <p className="text-[12px] font-bold" style={valStyle}>{error || "Solicitud no encontrada"}</p>
      {onBack && (
        <button onClick={onBack} className="text-[11px] font-bold px-4 py-2 rounded-xl transition-all hover:brightness-110"
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

  // Observaciones generales de la solicitud. Se escriben al crearla y se
  // guardan a nivel de encabezado (solicitud.observacion). Para solicitudes
  // antiguas aún puede venir en solicitud.justificacion o por ítem.
  const justificacion = String(
    solicitud.observacion
    ?? solicitud.justificacion
    ?? solicitud.detalle?.find(d => d.justificacion)?.justificacion
    ?? ""
  ).trim();

  // Ruta del material ya guardada (para la vista de solo lectura)
  const origenNombre  = solicitud.nombre_sucursal_origen  || null;
  const destinoNombre = solicitud.nombre_sucursal_destino || null;
  const sucursalSolicitante = solicitud.nombre_sucursal || null;

  const EstatusIcon = estatusMeta.icon;
  const fmtFechaHora = (d) => fechaHora(d, { vacio: "—" });



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
      <ModalDetalleInsumo insumo={insumoDetalle} onClose={() => setInsumoDetalle(null)} T={T} ocultarStock />
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
          <p style={{ margin: 0, fontSize: FS.enfasis, lineHeight: "1.55", color: T?.text }}>
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
                    className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all hover:brightness-110 active:scale-95 flex-shrink-0"
                    style={{ background: isDark ? "rgba(255,255,255,0.06)" : T?.surfaceAlt, color: T?.textMuted, border: `1px solid ${T?.border}` }}>
                    <ArrowLeft size={13} /> Volver
                  </button>
                )}
                <span className="sm:hidden font-mono text-[11px] font-black px-2.5 py-1 rounded-xl"
                  style={{ background: isDark ? "rgba(255,255,255,0.06)" : T?.surfaceAlt, color: T?.text, border: `1px solid ${T?.border}` }}>
                  {solicitud.folio_solicitud}
                </span>
              </div>

              <h1 className="text-[12px] font-black leading-snug flex-1" style={{ color: T?.text }}>
                Solicitud de Insumos
              </h1>

              <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                <span className="font-mono text-[11px] font-black px-2.5 py-1 rounded-xl"
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
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                style={{ background: prioBg, color: prioMeta.color, border: `1px solid ${prioBrd}` }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: prioMeta.color }} />
                Prioridad: {solicitud.prioridad}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                style={{ background: estatusBg, color: estatusMeta.color, border: `1px solid ${estatusBrd}` }}>
                <EstatusIcon size={11} className={solicitud.estatus === "En proceso" ? "animate-spin" : ""} />
                Estado: {solicitud.estatus || "En proceso"}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
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
                <p className="text-[9px] font-black uppercase tracking-widest" style={labelStyle}>Información del reporte</p>
              </div>
              <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {[
                  { icon: User,          label: "Solicitante",  val: solicitud.nombre_empleado    || "—" },
                  { icon: Tag,           label: "Puesto",       val: solicitud.nombre_departamento || "—" },
                  { icon: Tag,           label: "Área",         val: solicitud.nombre_area         || "—" },
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
                      <p className="text-[11px] font-semibold truncate mt-0.5" style={valStyle}>{val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Justificación del solicitante — la razòn por la que pide los insumos */}
            {justificacion && (
              <div className="rounded-2xl overflow-hidden" style={card}>
                <div className="px-4 py-2.5 flex items-center gap-2" style={hdr}>
                  <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ background: orange }} />
                  <p className="text-[9px] font-black uppercase tracking-widest" style={labelStyle}>Justificación de la solicitud</p>
                </div>
                <div className="px-4 py-3 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(244,121,32,0.1)" }}>
                    <FileText size={13} style={{ color: orange }} />
                  </div>
                  <p className="text-[11px] leading-relaxed whitespace-pre-line flex-1" style={valStyle}>{justificacion}</p>
                </div>
              </div>
            )}

            {/* Ruta del material — la ven Administracion y Soporte Tecnico */}
            {puedeVerRuta && (
            <div className="rounded-2xl overflow-hidden" style={card}>
              <div className="px-4 py-2.5 flex items-center justify-between gap-2" style={hdr}>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ background: orange }} />
                  <p className="text-[9px] font-black uppercase tracking-widest" style={labelStyle}>Ruta del material</p>
                </div>
                <div className="flex items-center gap-2">
                  {rutaGuardada && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                      style={{ background: isDark ? "rgba(22,163,74,0.12)" : "#dcfce7", color: "#16a34a", border: "1px solid rgba(22,163,74,0.3)" }}>
                      <CheckCircle2 size={10} /> Ruta guardada
                    </span>
                  )}
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: T?.bg, color: T?.textMuted, border: `1px solid ${T?.border}` }}>
                    De dónde → a dónde va
                  </span>
                </div>
              </div>
              <div className="p-3 sm:p-4">
                {/* ABIERTA: el admin elige la ruta ANTES de aceptar */}
                {!cerrado ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_26px_1fr] gap-2 sm:gap-1 sm:items-center">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={labelStyle}>Sale de (origen)</p>
                        <SelectSucursal value={ruta.origen} sucursales={sucursales} T={T} isDark={isDark}
                          onChange={v => setRuta(prev => ({ ...prev, origen: v }))} />
                      </div>
                      <div className="hidden sm:flex justify-center">
                        <ArrowRight size={15} style={{ color: orange }} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={labelStyle}>Llega a (destino)</p>
                        <SelectSucursal value={ruta.destino} sucursales={sucursales} T={T} isDark={isDark}
                          onChange={v => setRuta(prev => ({ ...prev, destino: v }))} />
                      </div>
                    </div>

                    {/* Acción: dejar la ruta lista y sacar la hoja desde aquí */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <button
                        onClick={guardarRuta}
                        disabled={guardandoRuta}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                        style={{ background: `${orange}15`, color: orange, border: `1px solid ${orange}40` }}
                      >
                        <Save size={12} strokeWidth={2.5} />
                        {guardandoRuta ? "Guardando..." : "Guardar ruta"}
                      </button>
                      
                    </div>

                    <p className="text-[9px] mt-2.5 flex items-start gap-1.5" style={labelStyle}>
                      <MapPin size={11} className="flex-shrink-0 mt-0.5" />
                      <span>Elige la ruta antes de aceptar: es obligatoria y se imprime en la hoja de la solicitud.
                        {sucursalSolicitante ? ` El solicitante pertenece a ${sucursalSolicitante}.` : ""}</span>
                    </p>
                  </>
                ) : (
                  /* CERRADA: la ruta quedó autorizada, solo se consulta y se imprime */
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold"
                      style={{ background: isDark ? "rgba(255,255,255,0.05)" : T?.surfaceAlt, color: T?.text, border: `1px solid ${T?.border}` }}>
                      <MapPin size={11} style={{ color: orange }} />
                      {origenNombre || "Origen sin asignar"}
                    </span>
                    <ArrowRight size={14} style={{ color: orange }} />
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold"
                      style={{ background: `${orange}15`, color: orange, border: `1px solid ${orange}40` }}>
                      <Package size={11} />
                      {destinoNombre || sucursalSolicitante || "Destino sin asignar"}
                    </span>
                    {origenNombre && destinoNombre && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(22,163,74,0.12)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.3)" }}>
                        Ruta autorizada
                      </span>
                    )}
                    
                  </div>
                )}
              </div>
            </div>
            )}

            {/* Insumos solicitados */}
            <div className="rounded-2xl overflow-hidden" style={card}>
              <div className="px-4 py-2.5 flex items-center justify-between" style={hdr}>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ background: orange }} />
                  <p className="text-[9px] font-black uppercase tracking-widest" style={labelStyle}>Insumos Solicitados</p>
                </div>
                <div className="flex items-center gap-2">
                  {esAdmin && !cerrado && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: isDark ? "rgba(22,163,74,0.12)" : "#dcfce7", color: "#16a34a", border: "1px solid rgba(22,163,74,0.3)" }}>
                      {aprobadosCount}/{totalItems} aprobados
                    </span>
                  )}
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: T?.bg, color: T?.textMuted, border: `1px solid ${T?.border}` }}>
                    {totalItems} ítem{totalItems !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Aviso aprobación parcial — solo admin, solicitud abierta */}
              {esAdmin && !cerrado && (
                <div className="px-4 py-2 flex items-center gap-2"
                  style={{ background: isDark ? "rgba(59,130,246,0.06)" : "#eff6ff", borderBottom: `1px solid ${T?.border}` }}>
                  <p className="text-[9px] flex-1" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#64748b" }}>
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
                    className="text-[9px] font-bold px-2.5 py-1 rounded-lg flex-shrink-0 transition-all hover:brightness-110"
                    style={{ background: isDark ? "rgba(255,255,255,0.06)" : T?.surfaceAlt, color: T?.textMuted, border: `1px solid ${T?.border}` }}>
                    {(solicitud.detalle || []).every(d => aprobados[d.id_solicitud_insumo] === true) ? "Desmarcar todos" : "Aprobar todos"}
                  </button>
                </div>
              )}

              <div className="divide-y" style={{ borderColor: isDark ? "rgba(255,255,255,0.07)" : T?.border }}>
                {!solicitud.detalle?.length ? (
                  <p className="px-4 py-8 text-center text-[11px]" style={labelStyle}>Sin insumos registrados</p>
                ) : solicitud.detalle.map((d, i) => {
                  const aprobado = aprobados[d.id_solicitud_insumo] === true;
                  // Para usuario: en solicitud cerrada, d.aprobado viene de BD (1=sí, 0=no, null=sin revisar)
                  const itemAprobadoBD = d.aprobado === 1 || d.aprobado === true;
                  const itemRechazadoBD = cerrado && d.aprobado === 0;
                  // Opacidad: admin abierta → atenúa no marcados; usuario cerrada → atenúa rechazados
                  const opacidad = (esAdmin && !cerrado && !aprobado) || (!esAdmin && cerrado && itemRechazadoBD) ? 0.45 : 1;
                  return (
                    <div key={d.id_solicitud_insumo ?? i}
                      className="px-4 py-3 flex flex-wrap items-center gap-3 transition-all"
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
                        onClick={() => setInsumoDetalle({ ...d })}
                      />

                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => setInsumoDetalle({ ...d })}
                          className="text-[12px] font-bold truncate block text-left w-full hover:underline"
                          style={{ ...valStyle, background: "none", border: "none", padding: 0, cursor: "pointer" }}
                        >
                          {d.nombre}
                        </button>
                        <p className="text-[10px] mt-0.5" style={labelStyle}>
                          {[d.marca, d.modelo].filter(Boolean).join(" · ") || "Sin especificaciones"}
                          {d.num_serie ? ` · S/N: ${d.num_serie}` : ""}
                        </p>
                        {/* Etiqueta de entrega — visible para usuario en solicitud cerrada */}
                        {!esAdmin && cerrado && d.aprobado != null && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded"
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
                        <p className="text-[9px] font-black uppercase tracking-wide" style={labelStyle}>Solicitado</p>
                        <p className="text-[12px] font-bold leading-none" style={{ color: orange }}>
                          ×{d.cantidad_solicitada ?? d.cantidad}
                        </p>

                        {/* Admin: cantidad que se va a ACEPTAR (puede ser menor a la pedida) */}
                        {esAdmin && !cerrado && aprobado && (
                          <div className="mt-1.5">
                            <p className="text-[9px] font-black uppercase tracking-wide" style={labelStyle}>Se aceptan</p>
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
                              className="mt-0.5 w-14 text-center text-[10px] font-bold rounded-lg px-1 py-0.5 outline-none"
                              style={{
                                background: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9",
                                border: `1px solid ${orange}60`,
                                color: orange,
                              }}
                            />
                            {d.stock != null && d.stock < (cantidades[d.id_solicitud_insumo] ?? d.cantidad) && (
                              <p className="text-[9px] font-bold mt-0.5" style={{ color: "#dc2626" }}>
                                Stock insuficiente
                              </p>
                            )}
                          </div>
                        )}

                        {/* Solicitud cerrada: lo que realmente se va a entregar */}
                        {cerrado && d.aprobado != null && (
                          <p className="text-[9px] font-bold mt-1"
                            style={{ color: itemAprobadoBD ? "#16a34a" : "#dc2626" }}>
                            {itemAprobadoBD
                              ? `Aceptado ×${d.cantidad_a_entregar ?? d.cantidad_aprobada ?? d.cantidad}`
                              : "No autorizado"}
                          </p>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Observación única de Soporte Técnico / Administración sobre toda la solicitud */}
              {(solicitud?.observacion || puedeObservar) && (
                <div className="px-4 py-3" style={{ borderTop: `1px solid ${T?.border}`, background: isDark ? "rgba(255,255,255,0.02)" : (T?.surfaceAlt ?? "#f8fafc") }}>
                  <p className="text-[9px] font-black uppercase mb-1.5" style={{ ...labelStyle, letterSpacing: "0.06em", color: orange }}>
                    Observación de Soporte Técnico
                  </p>
                  {puedeObservar ? (
                    <>
                      <textarea
                        value={obsBorrador}
                        onChange={e => setObsBorrador(e.target.value)}
                        placeholder="Observación de Soporte — p. ej.: sin stock, se sustituye por uno equivalente"
                        rows={2}
                        maxLength={500}
                        disabled={obsGuardando}
                        aria-label="Observación de Soporte sobre la solicitud"
                        className="w-full text-[10px] rounded-lg px-2 py-1.5 outline-none resize-y"
                        style={{
                          background: isDark ? "rgba(255,255,255,0.05)" : "#fff",
                          color: T?.text,
                          border: `1px solid ${T?.border}`,
                        }}
                      />
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-[9px] truncate" style={labelStyle}>
                          {solicitud?.observacion_autor
                            ? `${solicitud.observacion_autor} · ${fmtFechaHora(solicitud.observacion_fecha)}`
                            : "Solo Soporte / Administración · máx. 500 caracteres"}
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {obsMensaje && (
                            <span className="text-[9px] font-bold"
                              style={{ color: obsMensaje.ok ? "#16a34a" : "#dc2626" }}>
                              {obsMensaje.texto}
                            </span>
                          )}
                          <button
                            onClick={guardarObservacion}
                            disabled={obsGuardando}
                            title="Guardar observación"
                            className="flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-md transition-all hover:brightness-110 disabled:opacity-50"
                            style={{ background: `${orange}15`, color: orange, border: `1px solid ${orange}40` }}>
                            <Save size={9} strokeWidth={3} />
                            {obsGuardando ? "..." : "Guardar"}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-[9px] leading-snug" style={{ ...labelStyle, color: T?.textMuted }}>
                      {solicitud?.observacion}
                      {solicitud?.observacion_autor && (
                        <span style={{ opacity: 0.7 }}>
                          {" — "}{solicitud.observacion_autor}, {fmtFechaHora(solicitud.observacion_fecha)}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              )}


              {/* Botón guardar selección — solo admin, solicitud abierta */}
              {esAdmin && !cerrado && (
                <div className="px-4 py-3" style={{ borderTop: `1px solid ${T?.border}` }}>
                  {itemsGuardados && (
                    <p className="text-[9px] font-semibold mb-1.5 flex items-center gap-1" style={{ color: "#16a34a" }}>
                      <CheckCircle2 size={10} /> Selección guardada
                    </p>
                  )}
                  <button onClick={guardarAprobados} disabled={guardandoItems}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                    style={{ background: isDark ? "rgba(22,163,74,0.12)" : "#dcfce7", color: "#16a34a", border: "1px solid rgba(22,163,74,0.3)" }}>
                    <Save size={12} strokeWidth={2.5} />
                    {guardandoItems ? "Guardando..." : `Guardar selección (${aprobadosCount}/${totalItems})`}
                  </button>
                </div>
              )}

              {/* Total */}
              <div className="px-4 py-2.5 flex items-center justify-between"
                style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T?.border}`, ...hdr }}>
                <span className="text-[9px] font-black uppercase tracking-wider" style={labelStyle}>Total de piezas</span>
                <span className="text-[12px] font-black" style={{ color: orange }}>
                  {solicitud.detalle?.reduce((s, d) => s + (d.cantidad_solicitada ?? d.cantidad), 0) ?? 0} pza.
                  {cerrado && (
                    <span className="text-[10px] font-bold ml-1" style={{ color: "#16a34a" }}>
                      ({solicitud.detalle?.reduce((s, d) => s + (d.cantidad_a_entregar ?? 0), 0) ?? 0} aceptadas)
                    </span>
                  )}
                </span>
              </div>
            </div>

          </div>

          {/* ── COLUMNA DERECHA ── */}
          <PanelLateralSolicitud T={T} cambiarEstatus={cambiarEstatus} card={card} cerrado={cerrado} errorAccion={errorAccion} esAdmin={esAdmin} fmtFechaHora={fmtFechaHora} generarReporte={generarReporte} guardado={guardado} hdr={hdr} isDark={isDark} labelStyle={labelStyle} orange={orange} solicitud={solicitud} updating={updating} valStyle={valStyle} />
        </div>
      </div>
    </div>
    </div>
  );
}
