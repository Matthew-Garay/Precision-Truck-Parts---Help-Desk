import { useState, useEffect, useRef, useCallback } from "react";
import DOMPurify from "dompurify";
import {
  ArrowLeft, Tag, Calendar, User, Clock,
  CheckCircle2, XCircle, ImageOff, ZoomIn,
  X, MessageSquare, ChevronLeft, ChevronRight, Star, Pencil
} from "lucide-react";
import ProgressTimeline from "../../Components/ProgressTimeline";
import Modal from "../../Components/Modal";
import API, { apiFetch, getToken } from "../../Config/api";
import { useSocket } from "../../Config/useSocket";

function HistorialCambios({ T, id_ticket }) {
  const isDark = T.isDark;
  const [items,    setItems]    = useState([]);
  const [cargando, setCargando] = useState(true);
  const [abierto,  setAbierto]  = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setCargando(true);
    apiFetch(`/api/tickets/${id_ticket}/historial`)
      .then(r => r.json())
      .then(d => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setCargando(false));
  }, [id_ticket, abierto]);

  const fmt = (iso) => new Date(iso).toLocaleString("es-MX", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const CAMPO_LABEL = { estatus: "Estatus", comentarios: "Comentarios" };

  const card = {
    background: isDark ? "#141720" : T.surface,
    border: `1px solid ${T.border}`,
    boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.45)" : "0 2px 8px rgba(0,0,0,0.06)",
    borderRadius: "16px",
  };
  const hdr = {
    background: T.surfaceAlt,
    borderBottom: `1px solid ${T.border}`,
  };

  return (
    <div style={card}>
      <button
        onClick={() => setAbierto(o => !o)}
        className="w-full px-6 py-4 flex items-center justify-between"
        style={{ ...hdr, borderRadius: abierto ? "16px 16px 0 0" : "16px", cursor: "pointer", background: "transparent" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: "#8b5cf6" }} />
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: T.textFaint }}>Historial de cambios</p>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: isDark ? "rgba(139,92,246,0.15)" : "#f5f3ff", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.25)" }}>
              {items.length}
            </span>
          )}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.textFaint} strokeWidth="2.5"
            style={{ transform: abierto ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {abierto && (
        <div className="px-6 py-4 flex flex-col gap-3">
          {cargando ? (
            <div className="flex justify-center py-4">
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="#8b5cf6" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            </div>
          ) : items.length === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: T.textFaint }}>Sin cambios registrados</p>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map((item) => (
                <div key={item.id_historial} className="flex gap-3 items-start">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#8b5cf6" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider"
                        style={{ color: "#8b5cf6" }}>
                        {CAMPO_LABEL[item.campo_cambiado] ?? item.campo_cambiado}
                      </span>
                      <span className="text-[10px]" style={{ color: T.textFaint }}>{fmt(item.fecha_cambio)}</span>
                      <span className="text-[10px] font-medium" style={{ color: T.textMuted }}>por {item.nombre_empleado}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {item.valor_anterior && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md line-through"
                          style={{ background: isDark ? "rgba(220,38,38,0.1)" : "#fef2f2", color: "#dc2626" }}>
                          {item.valor_anterior}
                        </span>
                      )}
                      {item.valor_anterior && item.valor_nuevo && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.textFaint} strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      )}
                      {item.valor_nuevo && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md font-semibold"
                          style={{ background: isDark ? "rgba(22,163,74,0.1)" : "#f0fdf4", color: "#16a34a" }}>
                          {item.campo_cambiado === "comentarios"
                            ? (item.valor_nuevo.length > 60 ? item.valor_nuevo.slice(0, 60) + "…" : item.valor_nuevo)
                            : item.valor_nuevo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const PRIO = {
  Urgente: { color: "#dc2626", bgL: "#fee2e2", bgD: "rgba(220,38,38,0.15)", borderL: "#fca5a5", borderD: "rgba(220,38,38,0.3)" },
  Alta:    { color: "#ea580c", bgL: "#ffedd5", bgD: "rgba(234,88,12,0.15)",  borderL: "#fdba74", borderD: "rgba(234,88,12,0.3)"  },
  Media:   { color: "#ca8a04", bgL: "#fef9c3", bgD: "rgba(202,138,4,0.15)",  borderL: "#fde047", borderD: "rgba(202,138,4,0.3)"  },
  Baja:    { color: "#16a34a", bgL: "#dcfce7", bgD: "rgba(22,163,74,0.15)",  borderL: "#86efac", borderD: "rgba(22,163,74,0.3)"  },
};

function CalificacionEstrellas({ T, ticket, estatusActual }) {
  const isDark = T.isDark;
  const calInicial = Math.max(0, parseInt(ticket.calificacion, 10) || 0);
  const idTicket   = parseInt(ticket.id_ticket, 10);
  const [hover,        setHover]        = useState(0);
  const [calificacion, setCalificacion] = useState(calInicial);
  const [guardando,    setGuardando]    = useState(false);
  const [guardado,     setGuardado]     = useState(calInicial > 0);

  useEffect(() => {
    const n = Math.max(0, parseInt(ticket.calificacion, 10) || 0);
    setCalificacion(n);
    setGuardado(n > 0);
  }, [ticket.calificacion]);
  const [error,        setError]        = useState("");
  const MENSAJES = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];

  const bloqueado  = estatusActual === "En proceso" || estatusActual === "No Resuelto";
  const yaGuardado = guardado && calificacion > 0;

  const guardar = async (n) => {
    if (bloqueado || yaGuardado || guardando) return;
    setError("");
    setCalificacion(n);
    setGuardando(true);
    try {
      const res = await apiFetch(`/api/tickets/${idTicket}/calificar`, {
        method: "PATCH",
        body: { calificacion: Number(n) },
      });
      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); } catch { data = {}; }
      if (res.ok && data.ok) {
        setGuardado(true);
      } else {
        setError(data.error || "No se pudo guardar");
        setCalificacion(calInicial);
      }
    } catch {
      setError("Error de conexión");
      setCalificacion(calInicial);
    } finally {
      setGuardando(false);
    }
  };

  if (estatusActual === "No Resuelto") return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-semibold"
      style={{ background: isDark ? "rgba(220,38,38,0.08)" : "#fef2f2", color: "#dc2626", border: "1px solid rgba(220,38,38,0.25)" }}>
      <XCircle size={12} />
      No disponible — ticket marcado como No Resuelto
    </div>
  );

  if (estatusActual === "En proceso") return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-semibold"
      style={{ background: isDark ? "rgba(244,121,32,0.08)" : "#fff7ed", color: "#ea580c", border: "1px solid rgba(234,88,12,0.25)" }}>
      <Clock size={12} />
      Disponible una vez resuelta la incidencia
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-center gap-1.5 py-2">
        {[1,2,3,4,5].map(n => {
          const activa = n <= (hover || calificacion);
          return (
            <button key={n}
              disabled={bloqueado || yaGuardado || guardando}
              onClick={() => guardar(n)}
              onMouseEnter={() => !yaGuardado && setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="transition-all duration-150 active:scale-90"
              style={{ cursor: yaGuardado ? "default" : "pointer" }}>
              <Star size={28} fill={activa ? "#f59e0b" : "none"}
                style={{
                  color: activa ? "#f59e0b" : isDark ? "rgba(255,255,255,0.15)" : "#d1d5db",
                  filter: activa ? "drop-shadow(0 0 4px rgba(245,158,11,0.5))" : "none",
                  transform: hover === n && !yaGuardado ? "scale(1.2)" : "scale(1)",
                  transition: "all 0.15s",
                }}/>
            </button>
          );
        })}
      </div>
      <p className="text-center text-[11px] font-bold"
        style={{ color: calificacion ? "#f59e0b" : T.textFaint }}>
        {guardando ? "Guardando..." : calificacion ? MENSAJES[calificacion] : "Selecciona una calificación"}
      </p>
      {yaGuardado && (
        <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold"
          style={{ background: isDark ? "rgba(22,163,74,0.08)" : "#f0fdf4", color: "#16a34a", border: "1px solid rgba(22,163,74,0.25)" }}>
          <CheckCircle2 size={12} /> Gracias por tu opinión
        </div>
      )}
      {error && (
        <p className="text-center text-[10px] font-semibold" style={{ color: "#dc2626" }}>{error}</p>
      )}
    </div>
  );
}

function ModalEditarTicket({ T, ticket, esAdmin = false, onCerrar, onGuardado }) {
  const isDark = T.isDark;
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState({
    titulo:       ticket.titulo       || "",
    prioridad:    ticket.prioridad    || "Media",
    id_categoria: ticket.id_categoria || "",
    estatus:      ticket.estatus      || "En proceso",
    comentarios:  ticket.comentarios  || "",
  });
  const [descripcionHtml, setDescripcionHtml] = useState(ticket.descripcion || "");
  const [imgs,       setImgs]      = useState([]);        // existentes en disco
  const [nuevasEv,   setNuevasEv]  = useState([]);        // File nuevos a subir
  const [eliminarEv, setEliminarEv] = useState([]);       // nombres a borrar
  const [guardando,  setGuardando] = useState(false);
  const [error,      setError]     = useState("");
  const editorRef = useRef(null);
  const fileRef   = useRef(null);

  useEffect(() => {
    apiFetch("/api/categorias?tipo=ticket").then(r => r.json()).then(d => setCategorias(d)).catch(() => {});
    apiFetch(`/api/tickets/${ticket.id_ticket}/imagenes`).then(r => r.json()).then(d => setImgs(Array.isArray(d) ? d : [])).catch(() => {});
  }, [ticket.id_ticket]);

  useEffect(() => {
    if (editorRef.current && ticket.descripcion)
      editorRef.current.innerHTML = ticket.descripcion;
  }, [ticket.descripcion]);

  const PRIOS = [
    { v:"Urgente", c:"#dc2626" }, { v:"Alta", c:"#ea580c" },
    { v:"Media",   c:"#ca8a04" }, { v:"Baja", c:"#16a34a" },
  ];
  const ESTATUS_OPTS = esAdmin ? [
    { v:"En proceso", c:"#ea580c", icon:"⏳" },
    { v:"Resuelto",   c:"#16a34a", icon:"✓"  },
    { v:"No Resuelto",c:"#dc2626", icon:"✗"  },
  ] : [
    { v:"En proceso", c:"#ea580c", icon:"⏳" },
  ];

  const inputStyle = {
    background: isDark?"rgba(255,255,255,0.05)":T.surfaceAlt,
    border: `1.5px solid ${isDark?"rgba(255,255,255,0.12)":T.border}`,
    borderRadius:"10px", color:T.text, fontSize:"13px",
    padding:"9px 12px", outline:"none", width:"100%",
    transition:"border-color .15s, box-shadow .15s",
  };
  const onFI = e => { e.target.style.borderColor=T.orange; e.target.style.boxShadow="0 0 0 3px rgba(244,121,32,0.1)"; };
  const onBI = e => { e.target.style.borderColor=isDark?"rgba(255,255,255,0.12)":T.border; e.target.style.boxShadow="none"; };
  const dividerLine = isDark?"rgba(255,255,255,0.08)":T.border;
  const iconColor   = isDark?"rgba(255,255,255,0.22)":"#94a3b8";

  const fmt = (cmd) => {
    const el = editorRef.current; if (!el) return;
    el.focus();
    const sel = window.getSelection(); if (!sel || sel.rangeCount===0) return;
    const range = sel.getRangeAt(0);
    if (cmd==="insertHorizontalRule") { const hr=document.createElement("hr"); range.deleteContents(); range.insertNode(hr); range.setStartAfter(hr); range.collapse(true); sel.removeAllRanges(); sel.addRange(range); el.dispatchEvent(new Event("input",{bubbles:true})); return; }
    if (cmd==="removeFormat") { const t=document.createTextNode(range.extractContents().textContent??""); range.insertNode(t); range.selectNodeContents(t); sel.removeAllRanges(); sel.addRange(range); el.dispatchEvent(new Event("input",{bubbles:true})); return; }
    const TAG={bold:"strong",italic:"em",underline:"u",strikeThrough:"s"};
    const getB=(r)=>{ let n=r.commonAncestorContainer; if(n.nodeType===Node.TEXT_NODE) n=n.parentElement; while(n&&n!==el){ if(["P","DIV","LI"].includes(n.tagName)) return n; n=n.parentElement; } const p=document.createElement("p"); r.surroundContents(p); return p; };
    const BLK={ insertUnorderedList:()=>{ const u=document.createElement("ul"),l=document.createElement("li"); l.appendChild(range.extractContents()); u.appendChild(l); range.insertNode(u); range.selectNodeContents(l); range.collapse(false); }, insertOrderedList:()=>{ const o=document.createElement("ol"),l=document.createElement("li"); l.appendChild(range.extractContents()); o.appendChild(l); range.insertNode(o); range.selectNodeContents(l); range.collapse(false); }, justifyLeft:()=>{const b=getB(range);if(b)b.style.textAlign="left";}, justifyCenter:()=>{const b=getB(range);if(b)b.style.textAlign="center";}, justifyRight:()=>{const b=getB(range);if(b)b.style.textAlign="right";} };
    if(BLK[cmd]){BLK[cmd]();sel.removeAllRanges();sel.addRange(range);el.dispatchEvent(new Event("input",{bubbles:true}));return;}
    const tag=TAG[cmd]; if(!tag) return;
    const w=document.createElement(tag); w.appendChild(range.extractContents()); range.insertNode(w); range.selectNodeContents(w); sel.removeAllRanges(); sel.addRange(range); el.dispatchEvent(new Event("input",{bubbles:true}));
  };

  const onEditorInput = () => {
    const html=editorRef.current?.innerHTML||""; const text=editorRef.current?.innerText||"";
    setDescripcionHtml(text.trim()?html:""); setError("");
  };

  const agregarNuevas = files => {
    const MIME_OK = new Set(["image/jpeg","image/png","image/gif","image/webp","video/mp4","video/webm","video/quicktime","video/x-msvideo"]);
    const libres = 8 - imgs.length - nuevasEv.length + eliminarEv.length;
    Array.from(files)
      .filter(f => MIME_OK.has(f.type))
      .slice(0, libres)
      .forEach(file => {
        const src = URL.createObjectURL(file);
        setNuevasEv(p => [...p, { src, name:file.name, file, isVideo: file.type.startsWith("video/") }]);
      });
  };

  const toggleEliminar = nombre => {
    setEliminarEv(p => p.includes(nombre) ? p.filter(n=>n!==nombre) : [...p, nombre]);
  };

  const borrarNueva = i => {
    URL.revokeObjectURL(nuevasEv[i].src);
    setNuevasEv(p => p.filter((_,idx)=>idx!==i));
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    const textoPlano = editorRef.current?.innerText?.trim()||""; 
    if (!form.titulo.trim()) return setError("El título es requerido");
    if (!textoPlano)         return setError("La descripción es requerida");
    if (!form.prioridad)     return setError("Selecciona una prioridad");
    if (!form.id_categoria)  return setError("Selecciona una categoría");
    setGuardando(true); setError("");
    try {
      const esCierre = form.estatus === "Resuelto" || form.estatus === "No Resuelto";

      // 1. Editar datos del ticket (título, descripción, prioridad, categoría)
      const resEditar = await apiFetch(`/api/tickets/${ticket.id_ticket}/editar`, {
        method: "PUT",
        body: {
          titulo:       form.titulo.trim(),
          descripcion:  descripcionHtml,
          prioridad:    form.prioridad,
          id_categoria: parseInt(form.id_categoria),
          estatus:      esCierre ? undefined : form.estatus,
          comentarios:  esCierre ? undefined : (form.comentarios || null),
        },
      });
      const dataEditar = await resEditar.json();
      if (!resEditar.ok) { setError(dataEditar.error||"Error al guardar"); return; }

      // 2. Si es cierre, usar el endpoint correcto que guarda fecha_resuelto e id_tecnico
      if (esCierre) {
        let adminId = null;
        try {
          const s = JSON.parse(sessionStorage.getItem("usuario") || "{}");
          adminId = s.id_empleado ? parseInt(s.id_empleado, 10) : null;
        } catch {}
        const resCierre = await apiFetch(`/api/tickets/${ticket.id_ticket}`, {
          method: "PATCH",
          body: {
            comentarios:     form.comentarios || null,
            estatus:         form.estatus,
            id_resuelto_por: form.estatus === "Resuelto" ? adminId : null,
          },
        });
        const dataCierre = await resCierre.json();
        if (!resCierre.ok) { setError(dataCierre.error||"Error al cerrar ticket"); return; }
      }

      const data = dataEditar;

      // 2. Eliminar evidencias marcadas
      for (const nombre of eliminarEv) {
        await apiFetch(`/api/tickets/${ticket.id_ticket}/imagenes/${encodeURIComponent(nombre)}`, { method:"DELETE" }).catch(()=>{});
      }

      // 3. Subir nuevas evidencias
      if (nuevasEv.length > 0) {
        const fd = new FormData();
        nuevasEv.forEach(ev => fd.append("evidencias", ev.file, ev.name));
        await apiFetch(`/api/tickets/${ticket.id_ticket}/imagenes`, { method:"POST", body:fd }).catch(()=>{});
      }

      onGuardado({
        titulo:         form.titulo.trim(),
        descripcion:    descripcionHtml,
        prioridad:      form.prioridad,
        id_categoria:   parseInt(form.id_categoria),
        estatus:        form.estatus,
        comentarios:    form.comentarios || null,
        ...(esCierre && { fecha_resuelto: new Date().toISOString() }),
      });
    } catch { setError("No se pudo conectar con el servidor"); }
    finally { setGuardando(false); }
  };

  const ToolBtn = ({ children, onClick, title }) => (
    <button type="button" title={title}
      onMouseDown={e=>{e.preventDefault();onClick();}}
      className="flex items-center justify-center w-7 h-7 rounded-lg transition-all"
      style={{color:isDark?"rgba(255,255,255,0.6)":"#94a3b8",background:"transparent"}}
      onMouseEnter={e=>{e.currentTarget.style.background=isDark?"rgba(255,255,255,0.08)":T.border;e.currentTarget.style.color=isDark?"#fff":T.text;}}
      onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=isDark?"rgba(255,255,255,0.6)":"#94a3b8";}}>
      {children}
    </button>
  );

  const totalFotos = imgs.length - eliminarEv.length + nuevasEv.length;

  return (
    <Modal
      T={T}
      title="Editar ticket"
      subtitle={ticket.folio_ticket}
      onClose={onCerrar}
      onConfirm={handleGuardar}
      confirmLabel={guardando ? "Guardando…" : "Guardar cambios"}
      cancelLabel="Cancelar"
      loading={guardando}
      maxWidth="672px"
      noBodyPadding
    >
        <form onSubmit={handleGuardar} className="flex flex-col gap-4 p-5 overflow-y-auto" style={{maxHeight:"75vh"}}>

          {/* Título */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{color:T.textMuted}}>Título <span style={{color:"#ef4444"}}>*</span></label>
            <input value={form.titulo} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))}
              style={inputStyle} placeholder="Título del problema" onFocus={onFI} onBlur={onBI}/>
          </div>

          {/* Prioridad + Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{color:T.textMuted}}>Prioridad <span style={{color:"#ef4444"}}>*</span></label>
              <div className="grid grid-cols-4 gap-1.5">
                {PRIOS.map(p=>(
                  <button key={p.v} type="button" onClick={()=>setForm(f=>({...f,prioridad:p.v}))}
                    className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background:form.prioridad===p.v?`${p.c}18`:isDark?"rgba(255,255,255,0.04)":T.surfaceAlt,
                      border:`2px solid ${form.prioridad===p.v?p.c:isDark?"rgba(255,255,255,0.1)":T.border}`,
                      color:form.prioridad===p.v?p.c:isDark?"rgba(255,255,255,0.45)":"#94a3b8",
                      boxShadow:form.prioridad===p.v?`0 0 0 3px ${p.c}20,0 4px 14px ${p.c}40`:"none",
                      transform:form.prioridad===p.v?"translateY(-2px) scale(1.02)":"none",
                    }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{background:p.c}}/>
                    {p.v}
                    {form.prioridad===p.v&&<span className="text-[9px]">✓</span>}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{color:T.textMuted}}>Categoría <span style={{color:"#ef4444"}}>*</span></label>
              <select value={form.id_categoria} onChange={e=>setForm(f=>({...f,id_categoria:e.target.value}))}
                style={{...inputStyle,cursor:"pointer",colorScheme:isDark?"dark":"light"}} onFocus={onFI} onBlur={onBI}>
                <option value="">Selecciona una categoría</option>
                {categorias.map(c=><option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>)}
              </select>
            </div>
          </div>

          {/* Estatus */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{color:T.textMuted}}>Estatus</label>
            <div className="flex gap-2">
              {ESTATUS_OPTS.map(s=>(
                <button key={s.v} type="button" onClick={()=>setForm(f=>({...f,estatus:s.v}))}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background:form.estatus===s.v?`${s.c}18`:isDark?"rgba(255,255,255,0.04)":T.surfaceAlt,
                    border:`2px solid ${form.estatus===s.v?s.c:isDark?"rgba(255,255,255,0.1)":T.border}`,
                    color:form.estatus===s.v?s.c:isDark?"rgba(255,255,255,0.45)":"#94a3b8",
                    boxShadow:form.estatus===s.v?`0 0 0 3px ${s.c}20`:"none",
                  }}>
                  <span>{s.icon}</span>{s.v}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción editor rico */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{color:T.textMuted}}>Descripción <span style={{color:"#ef4444"}}>*</span></label>
            <div style={{border:`1.5px solid ${isDark?"rgba(255,255,255,0.12)":T.border}`,borderRadius:"10px",overflow:"hidden",background:isDark?"rgba(255,255,255,0.05)":"#fff",transition:"border-color .15s, box-shadow .15s"}}>
              <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5"
                style={{borderBottom:`1px solid ${dividerLine}`,background:isDark?"rgba(255,255,255,0.04)":T.surfaceAlt}}>
                {[{cmd:"bold",l:<><strong>B</strong></>,t:"Negrita"},{cmd:"italic",l:<><em>I</em></>,t:"Cursiva"},{cmd:"underline",l:<><u>U</u></>,t:"Subrayado"},{cmd:"strikeThrough",l:<><s>S</s></>,t:"Tachado"}].map(({cmd,l,t})=>(
                  <ToolBtn key={cmd} title={t} onClick={()=>fmt(cmd)}><span className="text-[11px] font-bold">{l}</span></ToolBtn>
                ))}
                <div className="w-px h-4 mx-0.5" style={{background:dividerLine}}/>
                <ToolBtn title="Lista viñetas" onClick={()=>fmt("insertUnorderedList")}><span className="text-[10px] font-bold">•—</span></ToolBtn>
                <ToolBtn title="Lista numerada" onClick={()=>fmt("insertOrderedList")}><span className="text-[10px] font-bold">1.</span></ToolBtn>
                <div className="w-px h-4 mx-0.5" style={{background:dividerLine}}/>
                <ToolBtn title="Izquierda" onClick={()=>fmt("justifyLeft")}><span className="text-[10px]">⬅</span></ToolBtn>
                <ToolBtn title="Centro" onClick={()=>fmt("justifyCenter")}><span className="text-[10px]">≡</span></ToolBtn>
                <ToolBtn title="Derecha" onClick={()=>fmt("justifyRight")}><span className="text-[10px]">➡</span></ToolBtn>
                <div className="w-px h-4 mx-0.5" style={{background:dividerLine}}/>
                <ToolBtn title="Línea" onClick={()=>fmt("insertHorizontalRule")}><span className="text-[10px] font-bold">—</span></ToolBtn>
                <ToolBtn title="Quitar formato" onClick={()=>fmt("removeFormat")}><span className="text-[10px] font-black">Aa</span></ToolBtn>
              </div>
              <div contentEditable suppressContentEditableWarning
                ref={el=>{editorRef.current=el;}}
                onInput={onEditorInput}
                onFocus={e=>{e.currentTarget.parentElement.style.borderColor=T.orange;e.currentTarget.parentElement.style.boxShadow="0 0 0 3px rgba(244,121,32,0.1)";setError("");}}
                onBlur={e=>{e.currentTarget.parentElement.style.borderColor=isDark?"rgba(255,255,255,0.12)":T.border;e.currentTarget.parentElement.style.boxShadow="none";}}
                className="outline-none px-3.5 py-3 text-sm leading-relaxed ticket-desc"
                style={{minHeight:"120px",color:T.text,background:"transparent"}}
                data-placeholder="Describe el problema..."/>
            </div>
          </div>

          {/* Evidencias */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-black uppercase tracking-widest" style={{color:T.textMuted}}>Evidencias fotográficas</label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{background:isDark?"rgba(255,255,255,0.06)":T.bg,color:T.textMuted,border:`1px solid ${dividerLine}`}}>
                {totalFotos}/8
              </span>
            </div>

            {/* Fotos existentes */}
            {imgs.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] mb-1.5" style={{color:T.textFaint}}>Actuales — clic para marcar eliminación</p>
                <div className="flex flex-wrap gap-2">
                  {imgs.map(nombre=>{
                    const marcada = eliminarEv.includes(nombre);
                    return (
                      <div key={nombre} className="relative" style={{width:72,height:72}}>
                        <img src={`/storage/Evidencias_Tickets/${ticket.folio_ticket}/${nombre}`}
                          alt={nombre} className="w-full h-full object-cover rounded-xl"
                          style={{border:`2px solid ${marcada?"#dc2626":isDark?"rgba(255,255,255,0.12)":T.border}`,opacity:marcada?0.4:1,transition:"all .2s"}}/>
                        <button type="button" onClick={()=>toggleEliminar(nombre)}
                          className="absolute inset-0 flex items-center justify-center rounded-xl transition-all"
                          style={{background:marcada?"rgba(220,38,38,0.3)":"rgba(0,0,0,0)"}}>
                          {marcada && <span className="text-white font-black text-lg">✕</span>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Nuevas fotos */}
            {nuevasEv.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] mb-1.5" style={{color:T.textFaint}}>Nuevas a agregar</p>
                <div className="flex flex-wrap gap-2">
                  {nuevasEv.map((ev,i)=>(
                    <div key={i} className="relative" style={{width:72,height:72}}>
                      {ev.isVideo ? (
                        <div className="w-full h-full rounded-xl flex items-center justify-center relative overflow-hidden"
                          style={{border:`2px solid ${T.orange}`,background:"#1e293b"}}>
                          <video src={ev.src} className="w-full h-full object-cover absolute inset-0" muted preload="metadata"/>
                          <svg className="relative z-10" width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)"><polygon points="5,3 19,12 5,21"/></svg>
                        </div>
                      ) : (
                        <img src={ev.src} alt={ev.name} className="w-full h-full object-cover rounded-xl"
                          style={{border:`2px solid ${T.orange}`}}/>
                      )}
                      <button type="button" onClick={()=>borrarNueva(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{background:"#dc2626",color:"#fff",boxShadow:"0 2px 6px rgba(220,38,38,0.5)",zIndex:10}}>
                        <X size={10} strokeWidth={3}/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botón agregar */}
            {totalFotos < 8 && (
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer text-xs font-semibold transition-all"
                style={{background:isDark?"rgba(255,255,255,0.04)":T.surfaceAlt,border:`1.5px dashed ${isDark?"rgba(255,255,255,0.15)":T.border}`,color:T.orange}}>
                <input ref={fileRef} type="file" accept="image/*,video/mp4,video/webm,video/quicktime,video/x-msvideo" multiple className="hidden"
                  onChange={e=>{agregarNuevas(e.target.files);e.target.value="";}}/>
                + Agregar archivos
              </label>
            )}
          </div>

          {error && (
            <p className="text-xs font-semibold px-3 py-2 rounded-lg"
              style={{background:isDark?"rgba(220,38,38,0.15)":"#fee2e2",color:"#dc2626",border:"1px solid rgba(220,38,38,0.3)"}}>
              ⚠ {error}
            </p>
          )}
        </form>
    </Modal>
  );
}

export default function VistaTicket({ T, ticket, onVolver, esAdmin = false, usuario = {} }) {
  const isDark = T.isDark;
  const prio   = PRIO[ticket.prioridad] || PRIO.Media;
  const prioBg     = isDark ? prio.bgD     : prio.bgL;
  const prioBorder = isDark ? prio.borderD : prio.borderL;

  // Leer id del admin: primero del prop, luego sessionStorage como fallback
  const getAdminId = () => {
    if (usuario?.id_empleado) return parseInt(usuario.id_empleado, 10);
    try {
      const s = JSON.parse(sessionStorage.getItem("usuario") || "{}");
      return s.id_empleado ? parseInt(s.id_empleado, 10) : null;
    } catch { return null; }
  };
  const getNombreAdmin = () => {
    if (usuario?.nombre) {
      const partes = [usuario.nombre, usuario.ap_paterno, usuario.ap_materno].filter(Boolean);
      return partes.join(' ');
    }
    try {
      const s = JSON.parse(sessionStorage.getItem("usuario") || "{}");
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
  }, [ticket.id_ticket, ticket.calificacion, ticket.estatus, ticket.comentarios, ticket.resuelto_por]);

  const fmtFecha = (d) => new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
  const fmtHora  = (d) => new Date(d).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  const fechaAlta     = ticketLocal.fecha_subido    ? fmtFecha(ticketLocal.fecha_subido)   : "-";
  const horaAlta      = ticketLocal.fecha_subido    ? fmtHora(ticketLocal.fecha_subido)    : "-";
  const fechaResuelto = fechaResueltoState     ? fmtFecha(fechaResueltoState)    : null;
  const horaResuelto  = fechaResueltoState     ? fmtHora(fechaResueltoState)     : null;

  const generarReporte = () => {
    const folio = ticketLocal.folio_ticket;
    const token = getToken();
    const url   = `/print/ticket/${encodeURIComponent(folio)}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
    const win   = window.open(url, "_blank", "width=1200,height=800");
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
      const data = await res.json();
      if (!res.ok) { setErrorCancel(data.error || "No se pudo cancelar"); return; }
      setEstatus("Cancelado");
      setConfirmCancel(false);
    } catch { setErrorCancel("Error de conexión"); }
    finally { setCancelando(false); }
  };

  const cerrado = estatus === "Resuelto" || estatus === "No Resuelto" || estatus === "Cancelado";

  // 0=Recibido | 1=Técnico asignado | 2=En proceso | 3=Resuelto
  // Un técnico está asignado si resueltoporState tiene valor O si el ticket tiene id_tecnico/nombre_tecnico
  const tieneTecnico = !!(resueltoporState || ticketLocal.nombre_tecnico || ticketLocal.id_tecnico);
  const pasoActual = estatus === "Resuelto" || estatus === "No Resuelto" ? 3
    : estatus === "En proceso" && tieneTecnico ? 2
    : estatus === "En proceso" ? 1
    : 0;

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
      catch { throw new Error(`Respuesta inesperada del servidor: ${text.slice(0, 80)}`); }
      if (!res.ok) throw new Error(data.error || "Error del servidor");
      if (data.estatus) setEstatus(data.estatus);
      if (data.fecha_resuelto) setFechaResueltoState(data.fecha_resuelto);
      if (data.resuelto_por)   setResueltoporState(data.resuelto_por);
      else if (estatusFinal === "Resuelto") setResueltoporState(adminNombre || data.resuelto_por || "Administrador");
      else if (estatusFinal === "En proceso" && !resueltoporState) setResueltoporState(adminNombre || "Soporte técnico");
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2500);
    } catch (err) {
      setErrorGuard(err.message || "No se pudo guardar. Intenta de nuevo.");
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
  const labelStyle = { color: T.textFaint };
  const valStyle   = { color: T.text };

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
          <p className="text-xs leading-relaxed" style={{color: T.isDark ? "rgba(255,255,255,0.75)" : T.text}}>
            Esta acción no se puede deshacer. El ticket quedará marcado como <strong style={{color: T.isDark ? "#fff" : T.text}}>Cancelado</strong> y no podrá editarse.
          </p>
          {errorCancel && (
            <p className="text-xs font-semibold px-3 py-2 rounded-lg mt-3"
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
          <p className="text-xs leading-relaxed" style={{ color: T.isDark ? "rgba(255,255,255,0.75)" : T.text }}>
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
                  style={{ fontSize:12, background: isDark?"rgba(255,255,255,0.06)":"#f1f5f9", color:T.textMuted, border:`1px solid ${isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)"}` }}>
                  <ArrowLeft size={11}/> Volver
                </button>
                {estatus === "En proceso" && (
                  <button onClick={() => setModalEditar(true)}
                    className="vt-btn flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-full transition-all active:scale-95"
                    style={{ fontSize:12, background: isDark?"rgba(244,121,32,0.1)":"rgba(244,121,32,0.08)", color:T.orange, border:`1px solid rgba(244,121,32,0.25)` }}>
                    <Pencil size={11}/> Editar
                  </button>
                )}
                {!esAdmin && estatus === "En proceso" && (
                  <button onClick={() => setConfirmCancel(true)}
                    className="vt-btn flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-full transition-all active:scale-95"
                    style={{ fontSize:12, background: isDark?"rgba(220,38,38,0.1)":"rgba(220,38,38,0.07)", color:"#dc2626", border:"1px solid rgba(220,38,38,0.25)" }}>
                    <XCircle size={11}/> Cancelar ticket
                  </button>
                )}
                {/* Folio alineado junto a los botones */}
                <span
                  className="vt-folio font-mono font-bold px-3 py-1.5 rounded-full"
                  style={{ fontSize:12, color: T.orange, background: isDark?"rgba(249,115,22,0.1)":"#fff7ed", border:"1px solid rgba(249,115,22,0.2)" }}>
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
              <p className="vt-lbl font-semibold uppercase tracking-[0.12em] mb-1" style={{ fontSize:10, color:"#94a3b8" }}>Asunto</p>
              <h1 className="vt-title font-semibold leading-snug" style={{ fontSize:13, color:T.text }}>{ticketLocal.titulo}</h1>
            </div>

            {/* pills */}
            <div className="flex flex-wrap gap-1.5 pt-3" style={{ borderTop:`1px solid ${isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)"}` }}>
              {/* Prioridad */}
              <span className="vt-pill flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold"
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
              <span className="vt-pill flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold"
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
                <span className="vt-pill flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-medium"
                  style={{ background: isDark?"rgba(255,255,255,0.05)":"#f1f5f9", color:T.textMuted, border:`1px solid ${isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)"}` }}>
                  <Tag size={10}/>{ticket.nombre_categoria}
                </span>
              )}
              {tiempoResolucion && (
                <span className="vt-pill flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold"
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
                <p className="font-semibold uppercase tracking-[0.12em]" style={{ fontSize:11, color: T.textFaint }}>Acceso remoto (TeamViewer)</p>
                </div>
                <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[{ label: "ID de TeamViewer", value: tvId, setter: setTvId, placeholder: "Ej. 123 456 789" },
                    { label: "Contraseña",        value: tvPass, setter: setTvPass, placeholder: "Contraseña de sesión" }]
                    .map(({ label, value, setter, placeholder }) => (
                      <div key={label}>
                        <p className="font-bold uppercase tracking-widest mb-1.5" style={{ fontSize:11, color: T.textMuted }}>
                          {label} <span style={{ color: "#ef4444" }}>*</span>
                        </p>
                        <input
                          value={value}
                          onChange={e => setter(e.target.value)}
                          placeholder={placeholder}
                          disabled={cerrado}
                          style={{
                            width: "100%", fontSize: "13px", padding: "9px 12px",
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
              <p className="vt-shdr font-semibold uppercase tracking-[0.12em]" style={{ fontSize:11, color: T.textFaint }}>Descripción del problema</p>
              </div>
              <div className="px-4 py-3">
                {ticketLocal.descripcion ? (
                  <div
                    className="vt-body leading-relaxed break-words ticket-desc"
                    style={{ fontSize:13, color: T.text, lineHeight: "1.7" }}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(ticketLocal.descripcion, { ALLOWED_TAGS: ["p","br","strong","b","em","i","u","s","ul","ol","li","hr","div","span"], ALLOWED_ATTR: ["style"] }) }}
                  />
                ) : (
                  <p className="italic" style={{ fontSize:13, color: T.textFaint }}>Sin descripción registrada.</p>
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
                <p className="vt-shdr font-semibold uppercase tracking-[0.12em]" style={{ fontSize:11, color: T.textFaint }}>Información del reporte</p>
              </div>
              <div className="vt-info-grid px-4 sm:px-8 py-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:gap-x-8 sm:gap-y-4">
                {[
                  { icon: User,         label: "Solicitante",       val: ticket.nombre_empleado     || "-" },
                  { icon: Tag,          label: "Departamento",       val: ticket.nombre_departamento || "-" },
                  { icon: Tag,          label: "Sucursal",           val: ticket.nombre_sucursal     || "-" },
                  { icon: Calendar,     label: "Fecha de alta",      val: `${fechaAlta} · ${horaAlta}` },
                  { icon: CheckCircle2, label: "Fecha resolución",   val: fechaResuelto ? `${fechaResuelto} · ${horaResuelto}` : "Pendiente" },
                  { icon: User,         label: "Resuelto por",       val: resueltoporState || "Pendiente" },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <p className="vt-lbl font-semibold uppercase tracking-[0.12em] flex items-center gap-1" style={{ fontSize:11, color: T.textFaint }}>
                      <Icon size={9} style={{ color: T.orange, flexShrink: 0 }} />
                      {label}
                    </p>
                    <p className="vt-val font-medium truncate" style={{ fontSize:13, color: T.text }}>{val}</p>
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
                  <p className="font-semibold uppercase tracking-[0.12em]" style={{ fontSize:11, color: T.textFaint }}>Evidencias adjuntas</p>
                </div>
                <span className="font-semibold px-3 py-1 rounded-full flex-shrink-0"
                  style={{ fontSize:11, background: isDark?"rgba(255,255,255,0.06)":"#f1f5f9", color: T.textMuted, border:`1px solid ${isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)"}` }}>
                  {imgs.length} archivo{imgs.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="p-5 sm:p-6">
                {imgs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <ImageOff size={22} style={{ color: T.textFaint }} />
                    <p className="text-xs" style={{ color: T.textFaint }}>No se adjuntaron archivos</p>
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
                              <video src={`${API}/storage/Evidencias_Tickets/${ticket.folio_ticket}/${img}`}
                                className="w-full h-full object-cover absolute inset-0" muted preload="metadata"/>
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
                <p className="font-semibold uppercase tracking-[0.12em]" style={{ fontSize:11, color: T.textFaint }}>Comentarios del técnico</p>
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
                        className="w-full rounded-xl text-sm outline-none resize-none transition-all"
                        style={{
                          background: cerrado
                            ? isDark ? "rgba(255,255,255,0.02)" : "#f4f4f4"
                            : isDark ? "rgba(255,255,255,0.04)" : "#fafafa",
                          border: `1.5px solid ${cerrado ? T.border : isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
                          color: cerrado ? T.textMuted : T.text,
                          fontSize: "13px",
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
                      <span className="text-[10px]" style={{ color: T.textFaint }}>
                        {cerrado ? "Ticket cerrado - comentarios bloqueados" : "Visible para el solicitante una vez guardado"}
                      </span>
                      {!cerrado && (
                        <span className="text-[10px] font-semibold" style={{ color: comentario.length > 900 ? "#dc2626" : T.textFaint }}>
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
                    <div className="flex-1 px-3 py-2.5 rounded-xl text-sm leading-relaxed break-words"
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
                    <p className="text-xs font-semibold" style={{ color: T.textMuted }}>Sin comentarios aún</p>
                    <p className="text-[11px]" style={{ color: T.textFaint }}>El técnico asignado agregará notas aquí</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ── COLUMNA DERECHA ── */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5">

            {/* ── LÍNEA DEL TIEMPO ── */}
            <div
              style={card}
              onMouseEnter={e => Object.assign(e.currentTarget.style, cardHover)}
              onMouseLeave={e => Object.assign(e.currentTarget.style, { boxShadow: card.boxShadow })}>
              <div className="px-6 py-4 flex items-center justify-between" style={hdr}>
                <div className="flex items-center gap-2.5">
                  <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background:T.orange }}/>
                  <p className="font-semibold uppercase tracking-[0.12em]" style={{ fontSize:11, color: T.textFaint }}>Progreso</p>
                </div>
                <span className="font-semibold px-3 py-1 rounded-full"
                  style={{ fontSize:11, background: isDark?"rgba(255,255,255,0.06)":"#f1f5f9", color:T.textMuted, border:`1px solid ${isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)"}` }}>
                  {pasoActual+1} / 4
                </span>
              </div>
              {/* barra progreso estilizada — 4 pasos */}
              <div className="px-6 pt-5 pb-2">
                <div className="relative h-3 rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "#e9eef5" }}>
                  <div
                    className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                    style={{
                      width: ["8%", "40%", "73%", "100%"][pasoActual],
                      background: pasoActual === 3
                        ? "linear-gradient(90deg,#16a34a,#4ade80)"
                        : "linear-gradient(90deg,#ea6000,#F47920,#ffb347)",
                      boxShadow: pasoActual < 3
                        ? "0 0 10px rgba(244,121,32,0.55)"
                        : "0 0 10px rgba(22,163,74,0.55)",
                    }}
                  />
                  {[0, 1, 2, 3].map((i) => {
                    const pct = ["0%", "33.3%", "66.6%", "100%"][i];
                    return (
                      <div key={i}
                        className="absolute top-1/2 w-3 h-3 rounded-full border-2 transition-all duration-500"
                        style={{
                          left: pct, transform: "translate(-50%,-50%)",
                          background: i <= pasoActual ? (pasoActual===3?"#4ade80":"#ffb347") : isDark?"#2a2f3e":"#d1d8e3",
                          borderColor: i <= pasoActual ? (pasoActual===3?"#16a34a":T.orange) : isDark?"rgba(255,255,255,0.1)":"#c5cdd8",
                          boxShadow: i === pasoActual ? (pasoActual===3?"0 0 8px rgba(22,163,74,0.7)":"0 0 8px rgba(244,121,32,0.7)") : "none",
                          zIndex: 2,
                        }}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2">
                  {["Recibido", "Asignado", "En proceso", "Resuelto"].map((l, i) => (
                    <span key={l} className="text-[9px] font-bold"
                      style={{ color: i <= pasoActual ? (pasoActual===3?"#16a34a":T.orange) : "#94a3b8", letterSpacing:"0.04em" }}>
                      {l}
                    </span>
                  ))}
                </div>
              </div>
              {/* Stepper desacoplado */}
              <div className="px-6 pt-4 pb-6">
                <ProgressTimeline
                  T={T}
                  pasoActual={pasoActual}
                  metadata={{
                    fechaAlta,
                    horaAlta,
                    fechaResuelto,
                    horaResuelto,
                    nombreEmpleado: ticket.nombre_empleado,
                    resuelto_por:   resueltoporState,
                    nombreTecnico:  resueltoporState || ticket.nombre_tecnico || ticketLocal.nombre_tecnico,
                    tiempoResolucion,
                  }}
                />
              </div>
            </div>

            {/* -- CALIFICACIÓN -- usuario: interactiva / admin: solo lectura -- */}
            {!esAdmin ? (
            <div
              style={card}
              onMouseEnter={e => Object.assign(e.currentTarget.style, cardHover)}
              onMouseLeave={e => Object.assign(e.currentTarget.style, { boxShadow: card.boxShadow })}>
              <div className="px-6 py-4 flex items-center gap-2.5" style={hdr}>
                <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: "#f59e0b" }} />
                <p className="font-semibold uppercase tracking-[0.12em]" style={{ fontSize:11, color: T.textFaint }}>Calificar atención</p>
              </div>
              <div className="px-6 py-6 flex flex-col gap-3">
                <CalificacionEstrellas T={T} ticket={ticketLocal} estatusActual={estatus} />
              </div>
            </div>
            ) : (estatus === "Resuelto" || estatus === "No Resuelto") && (
            <div
              style={card}
              onMouseEnter={e => Object.assign(e.currentTarget.style, cardHover)}
              onMouseLeave={e => Object.assign(e.currentTarget.style, { boxShadow: card.boxShadow })}>
              <div className="px-6 py-4 flex items-center gap-2.5" style={hdr}>
                <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: "#f59e0b" }} />
                <p className="font-semibold uppercase tracking-[0.12em]" style={{ fontSize:11, color: T.textFaint }}>Calificación del usuario</p>
              </div>
              <div className="px-6 py-5 flex flex-col gap-2">
                {(() => {
                  const calNum = Math.max(0, parseInt(ticketLocal.calificacion, 10) || 0);
                  const MENSAJES = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];
                  return calNum > 0 ? (
                    <>
                      <div className="flex items-center justify-center gap-1.5 py-2">
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} size={28} fill={n <= calNum ? "#f59e0b" : "none"}
                            style={{ color: n <= calNum ? "#f59e0b" : isDark ? "rgba(255,255,255,0.15)" : "#d1d5db",
                              filter: n <= calNum ? "drop-shadow(0 0 4px rgba(245,158,11,0.5))" : "none" }}/>
                        ))}
                      </div>
                      <p className="text-center text-[11px] font-bold" style={{ color: "#f59e0b" }}>
                        {MENSAJES[calNum]} · {calNum}/5
                      </p>
                    </>
                  ) : (
                    <p className="text-center text-xs py-3" style={{ color: T.textFaint }}>Sin calificación aún</p>
                  );
                })()}
              </div>
            </div>
            )}

            {/* -- EXPORTAR PDF (usuario) -- */}
            {!esAdmin && (
            <div
              style={card}
              onMouseEnter={e => Object.assign(e.currentTarget.style, cardHover)}
              onMouseLeave={e => Object.assign(e.currentTarget.style, { boxShadow: card.boxShadow })}>
              <div className="px-6 py-4 flex items-center gap-2.5" style={hdr}>
                <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: "#dc2626" }} />
                <p className="font-semibold uppercase tracking-[0.12em]" style={{ fontSize:11, color: T.textFaint }}>Exportar reporte</p>
              </div>
              <div className="px-5 py-5">
                <p className="mb-3" style={{ fontSize:12, color: T.textFaint }}>Genera un PDF con toda la información de esta incidencia.</p>
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
            )}

            {/* -- EXPORTAR PDF (admin) -- */}
            {esAdmin && (
            <div
              style={card}
              onMouseEnter={e => Object.assign(e.currentTarget.style, cardHover)}
              onMouseLeave={e => Object.assign(e.currentTarget.style, { boxShadow: card.boxShadow })}>
              <div className="px-6 py-4 flex items-center gap-2.5" style={hdr}>
                <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: "#dc2626" }} />
                <p className="font-semibold uppercase tracking-[0.12em]" style={{ fontSize:11, color: T.textFaint }}>Exportar reporte</p>
              </div>
              <div className="px-5 py-5">
                <p className="mb-3" style={{ fontSize:12, color: T.textFaint }}>Genera un PDF con toda la información de esta incidencia.</p>
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
            )}

            {/* -- ACCIONES ADMIN -- */}
            {esAdmin && (
              <div
                style={card}
                onMouseEnter={e => Object.assign(e.currentTarget.style, cardHover)}
                onMouseLeave={e => Object.assign(e.currentTarget.style, { boxShadow: card.boxShadow })}>
                <div className="h-0.5 rounded-t-2xl" style={{ background: "linear-gradient(90deg,#16a34a99,#4ade8066)" }} />
                <div className="px-6 py-4 flex items-center justify-between" style={hdr}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: "#16a34a" }} />
                    <p className="font-semibold uppercase tracking-[0.12em]" style={{ fontSize:11, color: T.textFaint }}>Acciones del administrador</p>
                  </div>
                  {estatus === "Resuelto" && (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full font-semibold"
                      style={{ fontSize:11, background: isDark ? "rgba(22,163,74,0.12)" : "#f0fdf4", color: "#16a34a", border: "1px solid rgba(22,163,74,0.2)" }}>
                      <CheckCircle2 size={10}/> Cerrado
                    </span>
                  )}
                </div>
                <div className="px-6 py-5 flex flex-col gap-3">
                  {errorGuard && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold"
                      style={{ background: isDark ? "rgba(220,38,38,0.15)" : "#fee2e2", color: "#dc2626", border: isDark ? "1px solid rgba(220,38,38,0.3)" : "1px solid #fca5a5" }}>
                      <XCircle size={13}/> {errorGuard}
                    </div>
                  )}
                  {guardado && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold"
                      style={{ background: isDark ? "rgba(22,163,74,0.15)" : "#dcfce7", color: "#16a34a", border: isDark ? "1px solid rgba(22,163,74,0.3)" : "1px solid #86efac" }}>
                      <CheckCircle2 size={13}/> Cambios guardados
                    </div>
                  )}
                  {!cerrado ? (
                    <>
                      <button
                        onClick={() => guardarCambios(null)}
                        disabled={guardando}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: `linear-gradient(135deg,${T.orange},#ea6000)`, color: "#fff", boxShadow: "0 4px 14px rgba(249,115,22,0.35)", minHeight: "48px", transition: "all 0.18s ease" }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(249,115,22,0.45)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(249,115,22,0.35)"; e.currentTarget.style.transform = "none"; }}>
                        <MessageSquare size={14}/> {guardando ? "Guardando..." : "Guardar comentario"}
                      </button>
                      <button onClick={() => setConfirmCierre(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110 active:scale-95"
                        style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", color: "#fff", boxShadow: "0 3px 12px rgba(22,163,74,0.3)", minHeight: "48px" }}>
                        <CheckCircle2 size={14}/> Cerrar ticket
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: isDark ? "rgba(22,163,74,0.15)" : "#dcfce7", border: isDark ? "2px solid rgba(22,163,74,0.3)" : "2px solid #86efac" }}>
                        <CheckCircle2 size={20} style={{ color: "#16a34a" }}/>
                      </div>
                      <p className="text-xs font-black" style={{ color: "#16a34a" }}>Ticket cerrado</p>
                      <p className="text-[11px] text-center" style={{ color: T.textFaint }}>No se pueden realizar más acciones</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
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
            <p className="text-xs text-center px-4" style={{ color: "rgba(255,255,255,0.4)" }}>
              {imgs[visor]} · {visor + 1} de {imgs.length}
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setVisor(v => Math.max(0, v - 1))} disabled={visor === 0}
                className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-25 hover:scale-110 active:scale-95 transition-all"
                style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}>
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm font-bold text-white">{visor + 1} / {imgs.length}</span>
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