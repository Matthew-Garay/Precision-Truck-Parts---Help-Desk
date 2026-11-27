/**
 * VistaTicket.jsx
 *
 * Detalle de un ticket: datos, evidencias (subir y eliminar imágenes),
 * historial de cambios, edición por el dueño, cancelación, calificación y,
 * para el administrador, asignación de técnico, estatus y comentarios.
 *
 * Export default: VistaTicket
 * Props: T, ticket, onVolver, esAdmin, usuario.
 * Endpoints: GET/PATCH /api/tickets/:id, PUT …/editar, PATCH …/cancelar |
 *    …/calificar, GET/POST/DELETE …/imagenes, GET …/historial.
 *
 * @module client/pages/Usuario/VistaTicket
 * @requires react
 * @requires dompurify
 * @requires lucide-react
 * @requires ../../components/ProgressTimeline.jsx
 * @requires ../../components/Modal.jsx
 * @requires ../../services/api-client.js
 * @requires ../../hooks/use-socket.js
 * @requires ../../utils/tipografia.js
 * @requires ../../components/LogoModal.jsx
 * @exports VistaTicket (default)
 */
import { useState, useEffect, useRef, useCallback } from "react";
import DOMPurify from "dompurify";
import { ArrowLeft, Tag, Calendar, User, CheckCircle2, XCircle, ImageOff, ZoomIn, X, MessageSquare, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import Modal from '../../components/Modal.jsx';
import API, { apiFetch, getToken, textoError, textoExcepcion } from '../../services/api-client.js';
import { useSocket } from '../../hooks/use-socket.js';
import { FS } from '../../utils/tipografia.js';
import LogoModal from '../../components/LogoModal.jsx';
import { ModalEditarTicket } from '../../components/Ticket/ModalEditarTicket.jsx';
import { fechaCorta } from '../../utils/fechas.js';
import PanelLateralTicket from '../../components/Ticket/PanelLateralTicket.jsx';
const PRIO = {
  Urgente: { color: "#dc2626", bgL: "#fee2e2", bgD: "rgba(220,38,38,0.15)", borderL: "#fca5a5", borderD: "rgba(220,38,38,0.3)" },
  Alta:    { color: "#ea580c", bgL: "#ffedd5", bgD: "rgba(234,88,12,0.15)",  borderL: "#fdba74", borderD: "rgba(234,88,12,0.3)"  },
  Media:   { color: "#ca8a04", bgL: "#fef9c3", bgD: "rgba(202,138,4,0.15)",  borderL: "#fde047", borderD: "rgba(202,138,4,0.3)"  },
  Baja:    { color: "#16a34a", bgL: "#dcfce7", bgD: "rgba(22,163,74,0.15)",  borderL: "#86efac", borderD: "rgba(22,163,74,0.3)"  },
};

export default function VistaTicket({ T, ticket, onVolver, esAdmin = false, usuario = {} }) {
  const isDark = T.isDark;
  const prio   = PRIO[ticket.prioridad] || PRIO.Media;
  const prioBg     = isDark ? prio.bgD     : prio.bgL;
  const prioBorder = isDark ? prio.borderD : prio.borderL;

  // Leer id del admin: primero del prop, luego localStorage (donde vive la sesión)
  const getAdminId = () => {
    if (usuario?.id_empleado) return parseInt(usuario.id_empleado, 10);
    try {
      const s = JSON.parse(localStorage.getItem("usuario") || "{}");
      return s.id_empleado ? parseInt(s.id_empleado, 10) : null;
    } catch { return null; }
  };
  const getNombreAdmin = () => {
    if (usuario?.nombre) {
      const partes = [usuario.nombre, usuario.ap_paterno, usuario.ap_materno].filter(Boolean);
      return partes.join(' ');
    }
    try {
      const s = JSON.parse(localStorage.getItem("usuario") || "{}");
      const partes = [s.nombre, s.ap_paterno, s.ap_materno].filter(Boolean);
      return partes.length > 0 ? partes.join(' ') : null;
    } catch { return null; }
  };
  const [imgs,        setImgs]        = useState([]);
  const [visor,       setVisor]       = useState(null);
  const [comentario,  setComentario]  = useState(ticket.comentarios || "");
  const [tvId,        setTvId]        = useState("");
  const [tvPass,      setTvPass]      = useState("");
  const [estatus,     setEstatus]     = useState(ticket.estatus);
  const [guardando,   setGuardando]   = useState(false);
  const [guardado,    setGuardado]    = useState(false);
  const [errorGuard,  setErrorGuard]  = useState("");
  const [confirmCierre,  setConfirmCierre]  = useState(false);
  const [modalEditar,    setModalEditar]    = useState(false);
  const [ticketLocal,    setTicketLocal]    = useState(ticket);
  const [cancelando,     setCancelando]     = useState(false);
  const [confirmCancel,  setConfirmCancel]  = useState(false);
  const [errorCancel,    setErrorCancel]    = useState("");

  const [fechaResueltoState, setFechaResueltoState] = useState(ticket.fecha_resuelto || null);
  const [resueltoporState,   setResueltoporState]   = useState(ticket.resuelto_por   || null);

  // Sincronizar estado local cuando cambia el ticket prop (ej: recarga desde dashboard)
  useEffect(() => {
    setTicketLocal(ticket);
    setComentario(ticket.comentarios || "");
    setEstatus(ticket.estatus);
    setFechaResueltoState(ticket.fecha_resuelto || null);
    setResueltoporState(ticket.resuelto_por || null);
  // Solo los campos que cambian desde fuera; el objeto `ticket` es nuevo en cada render del padre.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.id_ticket, ticket.calificacion, ticket.estatus, ticket.comentarios, ticket.resuelto_por]);

  const fmtFecha = (d) => fechaCorta(d);
  const fmtHora  = (d) => new Date(d).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  const fechaAlta     = ticketLocal.fecha_subido    ? fmtFecha(ticketLocal.fecha_subido)   : "-";
  const horaAlta      = ticketLocal.fecha_subido    ? fmtHora(ticketLocal.fecha_subido)    : "-";
  const fechaResuelto = fechaResueltoState     ? fmtFecha(fechaResueltoState)    : null;
  const horaResuelto  = fechaResueltoState     ? fmtHora(fechaResueltoState)     : null;

  const generarReporte = () => {
    const folio = ticketLocal.folio_ticket;
    // Pasar token via sessionStorage temporal — nunca en la URL (historial/logs)
    const tk = getToken();
    if (tk) sessionStorage.setItem("_print_tk", tk);
    const url = `/print/ticket/${encodeURIComponent(folio)}`;
    const win = window.open(url, "_blank", "width=1200,height=800");
    if (!win) {
      const aviso = document.createElement("div");
      aviso.style.cssText = "position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9999;background:#1D1D1B;color:#fff;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:700;border-left:4px solid #F47920;box-shadow:0 4px 20px rgba(0,0,0,0.4);";
      aviso.textContent = "El navegador bloqueó la ventana emergente. Permite las ventanas emergentes e intenta de nuevo.";
      document.body.appendChild(aviso);
      setTimeout(() => aviso.remove(), 5000);
    }
  };

  const handleCancelar = async () => {
    setCancelando(true);
    setErrorCancel("");
    try {
      const res = await apiFetch(`/api/tickets/${ticket.id_ticket}/cancelar`, { method: "PATCH" });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setErrorCancel(textoError(data, res.status, "No se pudo cancelar el reporte.")); return; }
      setEstatus("Cancelado");
      setConfirmCancel(false);
    } catch (err) { setErrorCancel(textoExcepcion(err)); }
    finally { setCancelando(false); }
  };

  const cerrado = estatus === "Resuelto" || estatus === "No Resuelto" || estatus === "Cancelado";

  // 0=Recibido | 1=Técnico asignado | 2=En proceso | 3=Resuelto
  // Un técnico está asignado si resueltoporState tiene valor O si el ticket tiene id_tecnico/nombre_tecnico
  const tieneTecnico = !!(resueltoporState || ticketLocal.nombre_tecnico || ticketLocal.id_tecnico);
  const pasoActual = estatus === "Resuelto" || estatus === "No Resuelto" || estatus === "Cancelado" ? 3
    : estatus === "En proceso" && tieneTecnico ? 2
    : estatus === "En proceso" ? 1
    : 0;
  // Color y nombre del último paso según cómo terminó el ticket.
  const FIN = estatus === "No Resuelto" ? { fuerte: "#dc2626", suave: "#f87171", brillo: "rgba(220,38,38,0.55)", etiqueta: "No resuelto" }
            : estatus === "Cancelado"   ? { fuerte: "#64748b", suave: "#94a3b8", brillo: "rgba(100,116,139,0.45)", etiqueta: "Cancelado" }
            :                             { fuerte: "#16a34a", suave: "#4ade80", brillo: "rgba(22,163,74,0.55)", etiqueta: "Resuelto" };

  // "¿Qué significa?": explica en palabras simples en qué va el ticket y qué puede hacer el usuario.
  const nombreTecnicoActual = resueltoporState || ticketLocal.nombre_tecnico || null;
  const folioTxt = ticketLocal.folio_ticket ? ` (folio ${ticketLocal.folio_ticket})` : "";
  const explicacion = esAdmin ? null
    : estatus === "En proceso" && !tieneTecnico
      ? "Tu reporte ya llegó a Soporte Técnico y está en espera de que un técnico lo tome. Te llegará una notificación cuando eso pase. Mientras tanto puedes editarlo o agregar más fotos. Si en 2 días nadie lo atiende, el sistema lo cierra como «No resuelto»."
    : estatus === "En proceso"
      ? `${nombreTecnicoActual || "Un técnico"} está atendiendo tu reporte. Si necesita algo de ti te contactará; mantente al pendiente de tus notificaciones.`
    : estatus === "Resuelto"
      ? `Soporte Técnico marcó tu reporte como resuelto. Si el problema sigue, crea un reporte nuevo y menciona este${folioTxt}. No olvides calificar la atención: nos ayuda a mejorar.`
    : estatus === "No Resuelto"
      ? `Este reporte se cerró sin solución (por ejemplo, porque no se atendió a tiempo). Si el problema sigue, crea un reporte nuevo y menciona este${folioTxt}.`
    : estatus === "Cancelado"
      ? "Cancelaste este reporte, así que Soporte Técnico ya no lo atenderá. Si lo necesitas de nuevo, crea un reporte nuevo."
    : null;

  // Estado previo para detectar cuando el técnico cierra el ticket
  const estatusPrevRef = useRef(estatus);
  useEffect(() => {
    estatusPrevRef.current = estatus;
  }, [estatus]);

  const tiempoResolucion = (() => {
    if (estatus !== "Resuelto" || !ticketLocal.fecha_subido || !fechaResueltoState) return null;
    const diff = new Date(fechaResueltoState).getTime() - new Date(ticketLocal.fecha_subido).getTime();
    const totalMins = Math.floor(diff / 60000);
    const dias = Math.floor(totalMins / (60 * 24));
    const hrs  = Math.floor((totalMins % (60 * 24)) / 60);
    const mins = totalMins % 60;
    const partes = [];
    if (dias > 0) partes.push(`${dias} día${dias !== 1 ? "s" : ""}`);
    if (hrs > 0)  partes.push(`${hrs} hora${hrs !== 1 ? "s" : ""}`);
    if (mins > 0 || partes.length === 0) partes.push(`${mins} minuto${mins !== 1 ? "s" : ""}`);
    return partes.join(", ");
  })();

  const guardarCambios = async (nuevoEstatus) => {
    setGuardando(true);
    setErrorGuard("");
    const estatusFinal = nuevoEstatus ?? estatus;
    const adminId = getAdminId();
    const adminNombre = getNombreAdmin();
    try {
      const res = await apiFetch(`/api/tickets/${ticket.id_ticket}`, {
        method: "PATCH",
        body: {
          comentarios: comentario,
          estatus: estatusFinal,
          id_resuelto_por: estatusFinal === "Resuelto" ? adminId : null,
        },
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); }
      catch { throw new Error(textoError(null, res.status)); }
      if (!res.ok) throw new Error(textoError(data, res.status, "No se pudo guardar. Inténtalo de nuevo."));
      if (data.estatus) setEstatus(data.estatus);
      if (data.fecha_resuelto) setFechaResueltoState(data.fecha_resuelto);
      if (data.resuelto_por)   setResueltoporState(data.resuelto_por);
      else if (estatusFinal === "Resuelto") setResueltoporState(adminNombre || data.resuelto_por || "Administrador");
      else if (estatusFinal === "En proceso" && !resueltoporState) setResueltoporState(adminNombre || "Soporte técnico");
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2500);
    } catch (err) {
      setErrorGuard(textoExcepcion(err, "No se pudo guardar. Inténtalo de nuevo."));
    } finally {
      setGuardando(false);
      setConfirmCierre(false);
    }
  };

  useEffect(() => {
    if (!ticket.id_ticket) return;
    apiFetch(`/api/tickets/${ticket.id_ticket}/imagenes`)
      .then(r => r.json())
      .then(d => setImgs(Array.isArray(d) ? d : []))
      .catch(() => setImgs([]));
  }, [ticket.id_ticket]);

  // Escuchar cambios en tiempo real del ticket abierto usando el socket global
  const handleSocketEvento = useCallback(({ tipo, data: d }) => {
    if (!d || d.id_ticket !== ticket.id_ticket) return;
    if (tipo === "ticket:actualizado" || tipo === "ticket:en_atencion") {
      if (d.estatus)         setEstatus(d.estatus);
      if (d.fecha_resuelto)  setFechaResueltoState(d.fecha_resuelto);
      if (d.resuelto_por)    setResueltoporState(d.resuelto_por);
      else if (d.nombre_tecnico) setResueltoporState(d.nombre_tecnico);
    }
    if (tipo === "ticket:calificado") {
      setTicketLocal(prev => ({ ...prev, calificacion: d.calificacion }));
    }
  }, [ticket.id_ticket]);

  useSocket(usuario?.id_empleado, handleSocketEvento);

  const card = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    boxShadow: isDark
      ? "0 8px 32px rgba(0,0,0,0.45)"
      : "0 2px 8px rgba(0,0,0,0.06)",
    borderRadius: "16px",
    transition: "box-shadow 0.2s ease",
  };
  const cardHover = {
    boxShadow: isDark
      ? "0 12px 40px rgba(0,0,0,0.55)"
      : "0 6px 20px rgba(0,0,0,0.09)",
  };
  const hdr = {
    background: T.surfaceAlt,
    borderBottom: `1px solid ${T.border}`,
  };

  return (
    <div style={{
      background: T.bg,
      fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      <style>{`
        .ticket-desc p { margin-bottom: 0.5em; }
        .ticket-desc br { display: block; margin: 0.2em 0; }
        .ticket-desc strong, .ticket-desc b { font-weight: 700; }
        .ticket-desc em, .ticket-desc i { font-style: italic; }
        .ticket-desc u { text-decoration: underline; }
        .ticket-desc s { text-decoration: line-through; }
        .ticket-desc ul { list-style: disc; padding-left: 1.25rem; margin-bottom: 0.5em; }
        .ticket-desc ol { list-style: decimal; padding-left: 1.25rem; margin-bottom: 0.5em; }
        .ticket-desc li { margin-bottom: 0.2em; }
        .ticket-desc hr { border: none; border-top: 1px solid #e5e7eb; margin: 0.6em 0; }
        .ticket-desc [style*="text-align: center"] { text-align: center; }
        .ticket-desc [style*="text-align: right"]  { text-align: right; }

        /* ── Responsividad tablet ≤768px ── */
        @media (max-width: 768px) {
          .vt-title     { font-size: 12px !important; }
          .vt-body      { font-size: 11px !important; }
          .vt-lbl       { font-size: 9px  !important; }
          .vt-val       { font-size: 11px !important; }
          .vt-pill      { font-size: 9px  !important; padding: 3px 8px !important; }
          .vt-btn       { font-size: 9px  !important; padding: 4px 9px !important; }
          .vt-folio     { font-size: 9px  !important; padding: 4px 9px !important; }
          .vt-shdr      { font-size: 9px  !important; }
          .vt-info-grid { grid-template-columns: 1fr 1fr !important; gap: 8px 6px !important; }
          .vt-logo      { height: 42px !important; }
          .ticket-desc  { font-size: 11px !important; }
        }
        /* ── Responsividad móvil ≤480px ── */
        @media (max-width: 480px) {
          .vt-title     { font-size: 11px !important; }
          .vt-body      { font-size: 10px !important; }
          .vt-lbl       { font-size: 8px  !important; }
          .vt-val       { font-size: 10px !important; }
          .vt-pill      { font-size: 8px  !important; padding: 2px 7px !important; }
          .vt-btn       { font-size: 8px  !important; padding: 3px 7px !important; }
          .vt-folio     { font-size: 8px  !important; padding: 3px 7px !important; }
          .vt-shdr      { font-size: 8px  !important; }
          .vt-info-grid { grid-template-columns: 1fr !important; }
          .vt-logo      { height: 30px !important; }
          .ticket-desc  { font-size: 10px !important; }
        }
      `}</style>
      {confirmCancel && (
        <Modal
          T={T}
          title="¿Cancelar este ticket?"
          onClose={() => { setConfirmCancel(false); setErrorCancel(""); }}
          onConfirm={handleCancelar}
          confirmLabel={cancelando ? "Cancelando…" : "Sí, cancelar"}
          cancelLabel="Volver"
          loading={cancelando}
          maxWidth="380px"
          variant="danger"
          closeOnOverlay={false}
        >
          <p className="text-[11px] leading-relaxed" style={{color: T.isDark ? "rgba(255,255,255,0.75)" : T.text}}>
            Esta acción no se puede deshacer. El ticket quedará marcado como <strong style={{color: T.isDark ? "#fff" : T.text}}>Cancelado</strong> y no podrá editarse.
          </p>
          {errorCancel && (
            <p className="text-[11px] font-semibold px-3 py-2 rounded-lg mt-3"
              style={{background:"rgba(220,38,38,0.2)",color:"#fca5a5",border:"1px solid rgba(220,38,38,0.4)"}}>
              {errorCancel}
            </p>
          )}
        </Modal>
      )}
      {confirmCierre && (
        <Modal
          T={T}
          title="¿Confirmar cierre?"
          onClose={() => setConfirmCierre(false)}
          onConfirm={() => guardarCambios("Resuelto")}
          confirmLabel={guardando ? "Cerrando..." : "Sí, cerrar"}
          cancelLabel="Cancelar"
          loading={guardando}
          maxWidth="360px"
          variant="success"
          closeOnOverlay={false}
        >
          <p className="text-[11px] leading-relaxed" style={{ color: T.isDark ? "rgba(255,255,255,0.75)" : T.text }}>
            Marcará el ticket como <strong style={{ color: T.isDark ? "#fff" : T.text }}>Resuelto</strong> y guardará los comentarios.
          </p>
        </Modal>
      )}
      {modalEditar && (
        <ModalEditarTicket
          T={T}
          ticket={ticketLocal}
          esAdmin={esAdmin}
          onCerrar={() => setModalEditar(false)}
          onGuardado={(cambios) => {
            setTicketLocal(prev => ({ ...prev, ...cambios }));
            setModalEditar(false);
          }}
        />
      )}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        overflowX: "hidden",
        padding: "12px 10px",
      }}>
      <div className="max-w-5xl mx-auto pb-10 space-y-3 sm:space-y-5">

        {/* ══ HEADER CARD ══ */}
        <div
          style={{ ...card, overflow: "hidden" }}
          onMouseEnter={e => Object.assign(e.currentTarget.style, cardHover)}
          onMouseLeave={e => Object.assign(e.currentTarget.style, { boxShadow: card.boxShadow })}>
          <div className="h-0.5" style={{ background: `linear-gradient(90deg,${prio.color}cc,${prio.color}22)` }} />
          <div className="p-3 sm:p-5">
            {/* nav + logo corporativo + folio — fila única compacta */}
            <div className="flex items-center justify-between gap-2 mb-3">
              {/* Izquierda: acciones */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button onClick={onVolver}
                  className="vt-btn flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-full transition-all hover:brightness-95 active:scale-95"
                  style={{ fontSize: FS.cuerpo, background: isDark?"rgba(255,255,255,0.06)":"#f1f5f9", color:T.textMuted, border:`1px solid ${isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)"}` }}>
                  <ArrowLeft size={11}/> Volver
                </button>
                {estatus === "En proceso" && (
                  <button onClick={() => setModalEditar(true)}
                    className="vt-btn flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-full transition-all active:scale-95"
                    style={{ fontSize: FS.cuerpo, background: isDark?"rgba(244,121,32,0.1)":"rgba(244,121,32,0.08)", color:T.orange, border:`1px solid rgba(244,121,32,0.25)` }}>
                    <Pencil size={11}/> Editar
                  </button>
                )}
                {!esAdmin && estatus === "En proceso" && (
                  <button onClick={() => setConfirmCancel(true)}
                    className="vt-btn flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-full transition-all active:scale-95"
                    style={{ fontSize: FS.cuerpo, background: isDark?"rgba(220,38,38,0.1)":"rgba(220,38,38,0.07)", color:"#dc2626", border:"1px solid rgba(220,38,38,0.25)" }}>
                    <XCircle size={11}/> Cancelar ticket
                  </button>
                )}
                {/* Folio alineado junto a los botones */}
                <span
                  className="vt-folio font-mono font-bold px-3 py-1.5 rounded-full"
                  style={{ fontSize: FS.cuerpo, color: T.orange, background: isDark?"rgba(249,115,22,0.1)":"#fff7ed", border:"1px solid rgba(249,115,22,0.2)" }}>
                  {ticketLocal.folio_ticket}
                </span>
              </div>
              {/* Derecha: logo */}
              <img
                src={isDark ? "/assets/img/logo blanco.png" : "/assets/img/logo negro.png"}
                alt="Logo corporativo"
                className="vt-logo"
                style={{ height: "64px", objectFit: "contain", opacity: 0.9, flexShrink: 0 }}
              />
            </div>

            {/* Título */}
            <div className="mb-3">
              <p className="vt-lbl font-semibold uppercase tracking-[0.12em] mb-1" style={{ fontSize: FS.etiqueta, color:"#94a3b8" }}>Asunto</p>
              <h1 className="vt-title font-semibold leading-snug" style={{ fontSize: FS.enfasis, color:T.text }}>{ticketLocal.titulo}</h1>
            </div>

            {/* pills */}
            <div className="flex flex-wrap gap-1.5 pt-3" style={{ borderTop:`1px solid ${isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)"}` }}>
              {/* Prioridad */}
              <span className="vt-pill flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-semibold"
                style={{
                  background: ticket.prioridad === "Alta"
                    ? (isDark ? "rgba(249,115,22,0.15)" : "#fff7ed")
                    : (isDark ? `${prio.color}18` : prioBg),
                  color: ticket.prioridad === "Alta" ? T.orange : prio.color,
                  border: `1px solid ${ticket.prioridad === "Alta" ? "rgba(249,115,22,0.3)" : (isDark ? `${prio.color}30` : prioBorder)}`,
                }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: ticket.prioridad === "Alta" ? T.orange : prio.color }} />{ticket.prioridad}
              </span>

              {/* Estatus */}
              <span className="vt-pill flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-semibold"
                style={{
                  background: estatus==="Resuelto"?(isDark?"rgba(22,163,74,0.15)":"#f0fdf4"):estatus==="No Resuelto"||estatus==="Cancelado"?(isDark?"rgba(220,38,38,0.15)":"#fef2f2"):(isDark?"rgba(244,121,32,0.15)":"rgba(244,121,32,0.08)"),
                  color: estatus==="Resuelto"?"#16a34a":estatus==="No Resuelto"||estatus==="Cancelado"?"#dc2626":T.orange,
                  border:`1px solid ${estatus==="Resuelto"?"rgba(22,163,74,0.25)":estatus==="No Resuelto"||estatus==="Cancelado"?"rgba(220,38,38,0.25)":"rgba(244,121,32,0.25)"}`,
                }}>
                {estatus==="Resuelto"?<CheckCircle2 size={11}/>:estatus==="No Resuelto"?<XCircle size={11}/>:
                  <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
                {estatus}
              </span>

              {ticket.nombre_categoria && (
                <span className="vt-pill flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-medium"
                  style={{ background: isDark?"rgba(255,255,255,0.05)":"#f1f5f9", color:T.textMuted, border:`1px solid ${isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)"}` }}>
                  <Tag size={10}/>{ticket.nombre_categoria}
                </span>
              )}
              {tiempoResolucion && (
                <span className="vt-pill flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-semibold"
                  style={{ background: isDark?"rgba(22,163,74,0.12)":"#f0fdf4", color:"#16a34a", border:"1px solid rgba(22,163,74,0.2)" }}>
                  <CheckCircle2 size={10}/> Resuelto en {tiempoResolucion}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* -- CUERPO -- */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-5">

          {/* -- COLUMNA IZQUIERDA -- */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-5">

            {/* TeamViewer — solo admin, siempre primero */}
            {esAdmin && (
              <div
                style={card}
                onMouseEnter={e => Object.assign(e.currentTarget.style, cardHover)}
                onMouseLeave={e => Object.assign(e.currentTarget.style, { boxShadow: card.boxShadow })}>
                <div className="px-4 py-3 flex items-center gap-2.5" style={hdr}>
                  <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: "#3b82f6" }} />
                <p className="font-semibold uppercase tracking-[0.12em]" style={{ fontSize: FS.secundario, color: T.textFaint }}>Acceso remoto (TeamViewer)</p>
                </div>
                <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[{ label: "ID de TeamViewer", value: tvId, setter: setTvId, placeholder: "Ej. 123 456 789" },
                    { label: "Contraseña",        value: tvPass, setter: setTvPass, placeholder: "Contraseña de sesión" }]
                    .map(({ label, value, setter, placeholder }) => (
                      <div key={label}>
                        <p className="font-bold uppercase tracking-widest mb-1.5" style={{ fontSize: FS.secundario, color: T.textMuted }}>
                          {label} <span style={{ color: "#ef4444" }}>*</span>
                        </p>
                        <input
                          value={value}
                          onChange={e => setter(e.target.value)}
                          placeholder={placeholder}
                          disabled={cerrado}
                          style={{
                            width: "100%", fontSize: FS.enfasis, padding: "9px 12px",
                            borderRadius: "10px", outline: "none",
                            background: cerrado ? (isDark?"rgba(255,255,255,0.02)":"#f4f4f4") : (isDark?"rgba(255,255,255,0.05)":"#fafafa"),
                            border: `1.5px solid ${isDark?"rgba(255,255,255,0.1)":"#e2e8f0"}`,
                            color: T.text, cursor: cerrado ? "not-allowed" : "text",
                            opacity: cerrado ? 0.6 : 1, transition: "border-color .15s, box-shadow .15s",
                          }}
                          onFocus={e => { if(!cerrado){ e.target.style.borderColor="#3b82f6"; e.target.style.boxShadow="0 0 0 3px rgba(59,130,246,0.12)"; }}}
                          onBlur={e  => { e.target.style.borderColor=isDark?"rgba(255,255,255,0.1)":"#e2e8f0"; e.target.style.boxShadow="none"; }}
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Descripción */}
            <div
              style={card}
              onMouseEnter={e => Object.assign(e.currentTarget.style, cardHover)}
              onMouseLeave={e => Object.assign(e.currentTarget.style, { boxShadow: card.boxShadow })}>
              <div className="px-4 py-3 flex items-center gap-2.5" style={hdr}>
                <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: T.orange }} />
              <p className="vt-shdr font-semibold uppercase tracking-[0.12em]" style={{ fontSize: FS.secundario, color: T.textFaint }}>Descripción del problema</p>
              </div>
              <div className="px-4 py-3">
                {ticketLocal.descripcion ? (
                  <div
                    className="vt-body leading-relaxed break-words ticket-desc"
                    style={{ fontSize: FS.enfasis, color: T.text, lineHeight: "1.7" }}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(ticketLocal.descripcion, { ALLOWED_TAGS: ["p","br","strong","b","em","i","u","s","ul","ol","li","hr","div","span"], ALLOWED_ATTR: ["style"] }) }}
                  />
                ) : (
                  <p className="italic" style={{ fontSize: FS.enfasis, color: T.textFaint }}>Sin descripción registrada.</p>
                )}
              </div>
            </div>

            {/* Información del reporte */}
            <div
              style={card}
              onMouseEnter={e => Object.assign(e.currentTarget.style, cardHover)}
              onMouseLeave={e => Object.assign(e.currentTarget.style, { boxShadow: card.boxShadow })}>
              <div className="px-6 py-4 flex items-center gap-2.5" style={hdr}>
                <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: T.orange }} />
                <p className="vt-shdr font-semibold uppercase tracking-[0.12em]" style={{ fontSize: FS.secundario, color: T.textFaint }}>Información del reporte</p>
              </div>
              <div className="vt-info-grid px-4 sm:px-8 py-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:gap-x-8 sm:gap-y-4">
                {[
                  { icon: User,         label: "Solicitante",       val: ticket.nombre_empleado     || "-" },
                  { icon: Tag,          label: "Puesto",             val: ticket.nombre_departamento || "-" },
                  { icon: Tag,          label: "Área",               val: ticket.nombre_area         || "-" },
                  { icon: Tag,          label: "Sucursal",           val: ticket.nombre_sucursal     || "-" },
                  { icon: Calendar,     label: "Fecha de alta",      val: `${fechaAlta} · ${horaAlta}` },
                  { icon: CheckCircle2, label: "Fecha resolución",   val: fechaResuelto ? `${fechaResuelto} · ${horaResuelto}` : "Pendiente" },
                  { icon: User,         label: "Resuelto por",       val: resueltoporState || "Pendiente" },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <p className="vt-lbl font-semibold uppercase tracking-[0.12em] flex items-center gap-1" style={{ fontSize: FS.secundario, color: T.textFaint }}>
                      <Icon size={9} style={{ color: T.orange, flexShrink: 0 }} />
                      {label}
                    </p>
                    <p className="vt-val font-medium truncate" style={{ fontSize: FS.enfasis, color: T.text }}>{val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidencias */}
            <div
              style={card}
              onMouseEnter={e => Object.assign(e.currentTarget.style, cardHover)}
              onMouseLeave={e => Object.assign(e.currentTarget.style, { boxShadow: card.boxShadow })}>
              <div className="px-6 py-4 flex items-center justify-between" style={hdr}>
                <div className="flex items-center gap-2.5">
                  <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: T.orange }} />
                  <p className="font-semibold uppercase tracking-[0.12em]" style={{ fontSize: FS.secundario, color: T.textFaint }}>Evidencias adjuntas</p>
                </div>
                <span className="font-semibold px-3 py-1 rounded-full flex-shrink-0"
                  style={{ fontSize: FS.secundario, background: isDark?"rgba(255,255,255,0.06)":"#f1f5f9", color: T.textMuted, border:`1px solid ${isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)"}` }}>
                  {imgs.length} archivo{imgs.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="p-5 sm:p-6">
                {imgs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <ImageOff size={22} style={{ color: T.textFaint }} />
                    <p className="text-[11px]" style={{ color: T.textFaint }}>No se adjuntaron archivos</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {imgs.map((img, i) => {
                      const isVideo = /\.(mp4|webm|mov|avi)$/i.test(img);
                      return (
                        <button key={i} onClick={() => setVisor(i)}
                          className="aspect-square rounded-lg overflow-hidden relative group"
                          style={{ boxShadow: "none" }}>
                          {isVideo ? (
                            <div className="w-full h-full flex items-center justify-center"
                              style={{ background: isDark ? "rgba(0,0,0,0.7)" : "#1e293b" }}>
                              {/* Miniatura generada al subir (min/NN.jpg). Sin ella el video
                                  no se precarga: la lista no descarga el archivo entero. */}
                              <video src={`${API}/storage/Evidencias_Tickets/${ticket.folio_ticket}/${img}`}
                                poster={`${API}/storage/Evidencias_Tickets/${ticket.folio_ticket}/min/${img.replace(/\.[^.]+$/, "")}.jpg`}
                                className="w-full h-full object-cover absolute inset-0" muted preload="none"/>
                              <svg className="relative z-10" width="22" height="22" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)"><polygon points="5,3 19,12 5,21"/></svg>
                            </div>
                          ) : (
                            <img
                              src={`${API}/storage/Evidencias_Tickets/${ticket.folio_ticket}/${img}`}
                              alt={`Evidencia ${i + 1}`}
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                            style={{ background: "rgba(0,0,0,0.45)" }}>
                            <ZoomIn size={18} color="#fff" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Comentarios */}
            <div
              style={card}
              onMouseEnter={e => Object.assign(e.currentTarget.style, cardHover)}
              onMouseLeave={e => Object.assign(e.currentTarget.style, { boxShadow: card.boxShadow })}>
              <div className="px-6 py-4 flex items-center gap-2.5" style={hdr}>
                <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: T.orange }} />
                <p className="font-semibold uppercase tracking-[0.12em]" style={{ fontSize: FS.secundario, color: T.textFaint }}>Comentarios del técnico</p>
              </div>
              <div className="p-5 sm:p-6">
                {esAdmin ? (
                  <div className="flex flex-col gap-1.5">
                    <div className="relative">
                      <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
                        style={{ background: cerrado ? T.border : "#F47920", marginLeft: "12px" }} />
                      <textarea
                        rows={5}
                        disabled={cerrado}
                        className="w-full rounded-xl text-[12px] outline-none resize-none transition-all"
                        style={{
                          background: cerrado
                            ? isDark ? "rgba(255,255,255,0.02)" : "#f4f4f4"
                            : isDark ? "rgba(255,255,255,0.04)" : "#fafafa",
                          border: `1.5px solid ${cerrado ? T.border : isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
                          color: cerrado ? T.textMuted : T.text,
                          fontSize: FS.enfasis,
                          lineHeight: "1.65",
                          padding: "12px 14px 12px 28px",
                          letterSpacing: "0.01em",
                          cursor: cerrado ? "not-allowed" : "text",
                          opacity: cerrado ? 0.6 : 1,
                        }}
                        placeholder="Describe la solución aplicada, pasos realizados o notas relevantes para el cierre del ticket..."
                        value={comentario}
                        onChange={e => !cerrado && setComentario(e.target.value)}
                        onFocus={e => {
                          if (cerrado) return;
                          e.target.style.borderColor = "#F47920";
                          e.target.style.boxShadow  = "0 0 0 3px rgba(244,121,32,0.10)";
                          e.target.style.background = isDark ? "rgba(244,121,32,0.04)" : "#fff";
                        }}
                        onBlur={e => {
                          e.target.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0";
                          e.target.style.boxShadow  = "none";
                          e.target.style.background = cerrado
                            ? isDark ? "rgba(255,255,255,0.02)" : "#f4f4f4"
                            : isDark ? "rgba(255,255,255,0.04)" : "#fafafa";
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[9px]" style={{ color: T.textFaint }}>
                        {cerrado ? "Ticket cerrado - comentarios bloqueados" : "Visible para el solicitante una vez guardado"}
                      </span>
                      {!cerrado && (
                        <span className="text-[9px] font-semibold" style={{ color: comentario.length > 900 ? "#dc2626" : T.textFaint }}>
                          {comentario.length} / 1000
                        </span>
                      )}
                    </div>
                  </div>
                ) : comentario ? (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "rgba(244,121,32,0.1)", border: "1px solid rgba(244,121,32,0.2)" }}>
                      <MessageSquare size={13} style={{ color: T.orange }} />
                    </div>
                    <div className="flex-1 px-3 py-2.5 rounded-xl text-[12px] leading-relaxed break-words"
                      style={{ background: isDark ? "rgba(255,255,255,0.04)" : T.bg, color: T.text, border: `1px solid ${T.border}` }}>
                      {comentario}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 py-5 justify-center flex-col">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: isDark ? "rgba(255,255,255,0.04)" : T.surfaceAlt, border: `1px solid ${T.border}` }}>
                      <MessageSquare size={18} style={{ color: T.textFaint }} />
                    </div>
                    <p className="text-[11px] font-semibold" style={{ color: T.textMuted }}>Sin comentarios aún</p>
                    <p className="text-[10px]" style={{ color: T.textFaint }}>El técnico asignado agregará notas aquí</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ── COLUMNA DERECHA ── */}
          <PanelLateralTicket FIN={FIN} T={T} card={card} cardHover={cardHover} cerrado={cerrado} errorGuard={errorGuard} esAdmin={esAdmin} estatus={estatus} explicacion={explicacion} fechaAlta={fechaAlta} fechaResuelto={fechaResuelto} generarReporte={generarReporte} guardado={guardado} guardando={guardando} guardarCambios={guardarCambios} hdr={hdr} horaAlta={horaAlta} horaResuelto={horaResuelto} isDark={isDark} pasoActual={pasoActual} resueltoporState={resueltoporState} setConfirmCierre={setConfirmCierre} ticket={ticket} ticketLocal={ticketLocal} tiempoResolucion={tiempoResolucion} usuario={usuario} />
        </div>

      </div>
      </div>

      {/* -- VISOR MODAL -- */}
      {visor !== null && imgs[visor] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.93)" }}
          onClick={() => setVisor(null)}>
          <div className="relative w-full max-w-3xl flex flex-col items-center gap-4"
            onClick={e => e.stopPropagation()}>
            <LogoModal claro alto={18} />
            {/\.(mp4|webm|mov|avi)$/i.test(imgs[visor]) ? (
              <video
                src={`${API}/storage/Evidencias_Tickets/${ticket.folio_ticket}/${imgs[visor]}`}
                controls autoPlay
                className="rounded-2xl w-full"
                style={{ maxHeight: "70vh", boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}
              />
            ) : (
              <img
                src={`${API}/storage/Evidencias_Tickets/${ticket.folio_ticket}/${imgs[visor]}`}
                alt="" className="rounded-2xl object-contain w-full"
                style={{ maxHeight: "70vh", boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}
              />
            )}
            <p className="text-[11px] text-center px-4" style={{ color: "rgba(255,255,255,0.4)" }}>
              {imgs[visor]} · {visor + 1} de {imgs.length}
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setVisor(v => Math.max(0, v - 1))} disabled={visor === 0}
                className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-25 hover:scale-110 active:scale-95 transition-all"
                style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}>
                <ChevronLeft size={20} />
              </button>
              <span className="text-[12px] font-bold text-white">{visor + 1} / {imgs.length}</span>
              <button onClick={() => setVisor(v => Math.min(imgs.length - 1, v + 1))} disabled={visor === imgs.length - 1}
                className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-25 hover:scale-110 active:scale-95 transition-all"
                style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <button onClick={() => setVisor(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-all"
            style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }}>
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}