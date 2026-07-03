import { useState, useEffect, useRef, useCallback } from "react";
import DOMPurify from "dompurify";
import {
  ArrowLeft, Tag, Calendar, User, Clock,
  CheckCircle2, XCircle, ImageOff, ZoomIn,
  X, MessageSquare, ChevronLeft, ChevronRight, Star, Pencil
} from "lucide-react";
import ProgressTimeline from "../../Components/ProgressTimeline";
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
    background: isDark ? "#141720" : "#ffffff",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "transparent"}`,
    boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.45)" : "0 8px 30px rgb(0,0,0,0.04)",
    borderRadius: "16px",
  };
  const hdr = {
    background: isDark ? "rgba(255,255,255,0.025)" : "#f8fafc",
    borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9"}`,
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
            style={{ color: isDark ? "rgba(255,255,255,0.38)" : "#94a3b8" }}>Historial de cambios</p>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: isDark ? "rgba(139,92,246,0.15)" : "#f5f3ff", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.25)" }}>
              {items.length}
            </span>
          )}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"
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
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
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
  const calInicial = ticket.calificacion ? parseInt(ticket.calificacion, 10) : 0;
  const idTicket   = parseInt(ticket.id_ticket, 10);
  const [hover,        setHover]        = useState(0);
  const [calificacion, setCalificacion] = useState(calInicial);
  const [guardando,    setGuardando]    = useState(false);
  const [guardado,     setGuardado]     = useState(calInicial > 0);
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
      {yaGuardado && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold"
          style={{ background: isDark ? "rgba(22,163,74,0.08)" : "#f0fdf4", color: "#16a34a", border: "1px solid rgba(22,163,74,0.25)" }}>
          <CheckCircle2 size={12} />
          Calificación registrada - gracias por tu opinión
        </div>
      )}
      <div className={`flex items-center justify-center gap-1.5 py-2 ${yaGuardado ? "opacity-60" : ""}`}>
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
                  filter: activa && !yaGuardado ? "drop-shadow(0 0 4px rgba(245,158,11,0.6))" : "none",
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
      // 1. Editar datos del ticket
      const res = await apiFetch(`/api/tickets/${ticket.id_ticket}/editar`, {
        method: "PUT",
        body: {
          titulo:       form.titulo.trim(),
          descripcion:  descripcionHtml,
          prioridad:    form.prioridad,
          id_categoria: parseInt(form.id_categoria),
          estatus:      form.estatus,
          comentarios:  form.comentarios || null,
        },
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error||"Error al guardar"); return; }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{background:"rgba(0,0,0,0.75)",backdropFilter:"blur(4px)"}}
      onClick={e=>{if(e.target===e.currentTarget)onCerrar();}}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{background:isDark?"#141720":T.surface,boxShadow:"0 32px 80px rgba(0,0,0,0.5)",borderTop:`3px solid ${T.orange}`,maxHeight:"92vh",display:"flex",flexDirection:"column"}}>

        {/* Header sticky */}
        <div className="px-5 py-3.5 flex items-center justify-between flex-shrink-0"
          style={{borderBottom:`1px solid ${isDark?"rgba(255,255,255,0.07)":T.border}`,background:isDark?"#141720":T.surface}}>
          <div className="flex items-center gap-2">
            <span className="w-1 h-5 rounded-full" style={{background:T.orange}}/>
            <p className="font-black text-sm" style={{color:T.text}}>Editar ticket</p>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg"
              style={{background:isDark?"rgba(255,255,255,0.06)":T.bg,color:T.orange,border:`1px solid ${isDark?"rgba(255,255,255,0.1)":T.border}`}}>
              {ticket.folio_ticket}
            </span>
          </div>
          <button onClick={onCerrar} className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{background:isDark?"rgba(255,255,255,0.06)":T.surfaceAlt,color:T.textMuted,border:`1px solid ${T.border}`}}>
            <X size={13}/>
          </button>
        </div>

        {/* Cuerpo scrollable */}
        <form onSubmit={handleGuardar} className="flex flex-col gap-4 p-5 overflow-y-auto">

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

          {/* Comentarios del técnico */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{color:T.textMuted}}>Comentarios del técnico</label>
            <textarea rows={3} value={form.comentarios}
              onChange={e=>setForm(f=>({...f,comentarios:e.target.value}))}
              placeholder="Notas o solución aplicada..."
              style={{...inputStyle,resize:"vertical",lineHeight:"1.6"}}
              onFocus={onFI} onBlur={onBI}/>
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

          <div className="flex gap-2 pt-1 pb-1">
            <button type="button" onClick={onCerrar}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110"
              style={{background:isDark?"rgba(255,255,255,0.06)":T.surfaceAlt,color:T.textMuted,border:`1px solid ${T.border}`}}>
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-60"
              style={{background:`linear-gradient(135deg,${T.orange},#d97400)`,boxShadow:"0 3px 12px rgba(244,121,32,0.3)"}}>
              {guardando?"Guardando...":"Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
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
    _generarReporteInline();
  };

  // Imprime el reporte en un iframe invisible dentro de la misma página
  // para evitar abrir una pestaña nueva en el navegador.
  const _imprimirEnIframe = (htmlContent) => {
    // Eliminar iframe anterior si existe
    const existing = document.getElementById('__print_iframe__');
    if (existing) existing.remove();

    const iframe = document.createElement('iframe');
    iframe.id = '__print_iframe__';
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Esperar a que cargue antes de imprimir
    iframe.onload = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.warn('[imprimirEnIframe]', e);
      }
      // Redirigir al listado de tickets tras cerrar el diálogo de impresión
      setTimeout(() => {
        iframe.remove();
        onVolver();
      }, 1200);
    };
  };

  const _generarReporteInline = () => {
    const origin     = window.location.origin;
    const t          = ticketLocal;
    const fmtF  = (d) => d ? new Date(d).toLocaleDateString('es-MX',{day:'2-digit',month:'2-digit',year:'numeric'}) : null;
    const fmtH  = (d) => d ? new Date(d).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'}) : null;
    const fmtFL = (d) => d ? new Date(d).toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'}) : null;
    const now        = new Date();
    const fechaGen   = `${fmtFL(now)} · ${fmtH(now)}`;
    const fechaAlta  = fmtF(t.fecha_subido);
    const horaAlta   = fmtH(t.fecha_subido);
    const fechaRes   = fmtF(fechaResueltoState);
    const horaRes    = fmtH(fechaResueltoState);
    const calNum     = t.calificacion ? Math.min(5,Math.max(1,parseInt(t.calificacion,10))) : 0;
    const CAL_LABELS = ['','Muy malo','Malo','Regular','Bueno','Excelente'];
    const tecnico    = resueltoporState || 'Pendiente';

    // Tiempo de resolución
    let tiempoRes = '';
    if (fechaResueltoState && estatus === 'Resuelto') {
      const mins = Math.floor((new Date(fechaResueltoState) - new Date(t.fecha_subido)) / 60000);
      const d = Math.floor(mins/1440), h = Math.floor((mins%1440)/60), m = mins%60;
      tiempoRes = [d>0?`${d}d`:'', h>0?`${h}h`:'', `${m}m`].filter(Boolean).join(' ');
    }

    // Badges colores
    const PRIO_STYLE = {
      Urgente: 'background:#FEF2F2;color:#B91C1C;border:1px solid #FCA5A5',
      Alta:    'background:#FFF7ED;color:#C2410C;border:1px solid #FDBA74',
      Media:   'background:#FEFCE8;color:#A16207;border:1px solid #FDE047',
      Baja:    'background:#F0FDF4;color:#15803D;border:1px solid #86EFAC',
    };
    const EST_STYLE = {
      'Resuelto':    'background:#F0FDF4;color:#15803D;border:1px solid #86EFAC',
      'En proceso':  'background:#FFF7ED;color:#C2410C;border:1px solid #FDBA74',
      'No Resuelto': 'background:#FEF2F2;color:#B91C1C;border:1px solid #FCA5A5',
      'Cancelado':   'background:#F1F5F9;color:#475569;border:1px solid #CBD5E1',
    };
    const EST_ICON = {Resuelto:'✓','En proceso':'◷','No Resuelto':'✕',Cancelado:'✕'};
    const prioStyle = PRIO_STYLE[t.prioridad] || PRIO_STYLE.Media;
    const estStyle  = EST_STYLE[estatus]  || EST_STYLE['En proceso'];

    // Estrellas SVG
    const stars = (n) => [1,2,3,4,5].map(i =>
      `<svg width="14" height="14" viewBox="0 0 24 24" fill="${i<=n?'#F59E0B':'none'}" stroke="${i<=n?'#D97706':'#CBD5E1'}" stroke-width="1.5"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>`
    ).join('');

    // Stepper
    const step = estatus==='Resuelto'?2:estatus==='En proceso'?1:0;
    const stepperRows = [
      {label:'Recibido',   sub:`${fechaAlta} · ${horaAlta}`},
      {label:'En proceso', sub: tecnico !== 'Pendiente' ? `Técnico: ${tecnico}` : 'Pendiente asignación'},
      {label:'Resuelto',   sub: fechaRes ? `${fechaRes} · ${horaRes}` : 'Pendiente'},
    ].map((s,i) => {
      const done = i <= step;
      return `
        <div style="display:flex;gap:8px;align-items:flex-start">
          <div style="display:flex;flex-direction:column;align-items:center;width:20px;flex-shrink:0">
            <div style="width:20px;height:20px;border-radius:50%;background:${done?'#0C1A2E':'#F8FAFC'};border:1.5px solid ${done?'#0C1A2E':'#E2E8F0'};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:500;color:${done?'#fff':'#94A3B8'};-webkit-print-color-adjust:exact;print-color-adjust:exact">${i<step?'✓':i+1}</div>
            ${i<2?`<div style="width:1.5px;flex:1;min-height:12px;background:${i<step?'#0C1A2E':'#E2E8F0'};margin:2px 0"></div>`:''}
          </div>
          <div style="flex:1;padding:1px 0 10px">
            <div style="font-size:8pt;font-weight:${done?600:400};color:${done?'#0f172a':'#94A3B8'}">${s.label}</div>
            <div style="font-size:6pt;color:#475569;margin-top:1px">${s.sub}</div>
          </div>
        </div>`;
    }).join('');

    // Galería evidencias
    const galeria = imgs.length === 0
      ? `<div style="display:flex;align-items:center;gap:8px;padding:12px;background:#F8FAFC;border:1px dashed #E2E8F0;border-radius:3px;color:#94A3B8;font-size:7.5pt;font-style:italic">Sin evidencias fotográficas adjuntas.</div>`
      : `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">${
          imgs.map((nombre,i) =>
            `<div style="border:1px solid #E2E8F0;border-radius:3px;overflow:hidden">
              <img src="${origin}/storage/Evidencias_Tickets/${t.folio_ticket}/${nombre}" style="width:100%;height:70px;object-fit:cover;display:block" />
              <div style="font-size:5.5pt;color:#475569;padding:3px 6px;background:#F8FAFC;border-top:1px solid #E2E8F0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${String(i+1).padStart(2,'0')} — ${nombre}</div>
            </div>`
          ).join('')
        }</div>`;

    // Fila de datos (grid 4 col, half=span2)
    const datoCelda = (label, value, half=false) =>
      `<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-top:2px solid #0C1A2E;border-radius:0 0 3px 3px;padding:5px 8px;display:flex;flex-direction:column;gap:2px;${half?'grid-column:span 2':''}"><div style="font-size:5pt;font-weight:500;text-transform:uppercase;letter-spacing:.15em;color:#94A3B8">${label}</div><div style="font-size:8pt;font-weight:500;color:#0f172a">${value||'—'}</div></div>`;

    const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/>
<title>Reporte ${t.folio_ticket}</title>
<style>
  @page{size:letter portrait;margin:10mm 12mm 18mm 12mm}
  *{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
  html,body{width:100%;height:100%;background:#fff;font-family:'Segoe UI',Arial,sans-serif;font-size:7.5pt;color:#0f172a}
  .wrap{width:100%;padding:0}
  .sec-hdr{display:flex;align-items:center;gap:8px;padding:4px 10px;background:#0C1A2E}
  .sec-title{font-size:5.5pt;font-weight:500;text-transform:uppercase;letter-spacing:.2em;color:rgba(255,255,255,.85)}
  .sec-rule{flex:1;height:1px;background:rgba(255,255,255,.12)}
  .sec{margin-bottom:7px;border:1px solid #E2E8F0;border-radius:4px;overflow:hidden}
  .sec-body{padding:7px 10px;background:#fff}
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:7px}
  .badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:4px;font-size:6.5pt;font-weight:500;letter-spacing:.03em}
  .rt{font-size:7.5pt;line-height:1.6;padding:6px 10px;background:#F8FAFC;border-radius:3px;min-height:22px}
  .lbl{font-size:5pt;font-weight:500;text-transform:uppercase;letter-spacing:.14em;color:#94A3B8}
  .footer{position:fixed;bottom:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:6px 12px;border-top:2px solid #0C1A2E;background:#fff}
</style></head><body>
<div class="wrap">

<!-- HEADER -->
<div style="display:flex;align-items:stretch;border-bottom:2.5px solid #0C1A2E;margin-bottom:10px">
  <div style="display:flex;align-items:center;padding:8px 14px 8px 0;border-right:1px solid #E2E8F0;flex-shrink:0">
    <img src="${origin}/assets/img/log.png" style="height:70px;width:auto;object-fit:contain;display:block" alt="PTP" />
  </div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:8px 14px;gap:2px">
    <div style="font-size:9pt;font-weight:500;letter-spacing:.09em;color:#0C1A2E">PRECISION TRUCK PARTS AND ACCESSORIES</div>
    <div style="font-size:8pt;font-weight:400;color:#475569;text-align:center">Reporte de Incidencia Técnica</div>
    <div style="font-size:5.5pt;font-weight:400;text-transform:uppercase;letter-spacing:.12em;color:#94A3B8;text-align:center">Departamento de Soporte Técnico</div>
  </div>
  <div style="display:flex;flex-direction:column;justify-content:center;align-items:flex-end;padding:8px 0 8px 14px;border-left:1px solid #E2E8F0;gap:3px;flex-shrink:0">
    <div class="lbl">Folio</div>
    <div style="font-family:monospace;font-size:10pt;font-weight:500;color:#0C1A2E;letter-spacing:.06em">${t.folio_ticket}</div>
    <div class="lbl" style="margin-top:2px">Generado</div>
    <div style="font-size:6.5pt;font-weight:400;color:#475569">${fechaGen}</div>
  </div>
</div>
<div style="height:2px;background:#E8621A;margin-top:-6px;margin-bottom:8px"></div>

<!-- BANDA ESTADO -->
<div style="display:flex;align-items:stretch;border:1px solid #E2E8F0;border-radius:5px;overflow:hidden;margin-bottom:9px;background:#F8FAFC">
  <div style="flex:1;display:flex;flex-direction:column;gap:3px;padding:8px 12px;border-right:1px solid #E2E8F0;background:#fff">
    <div style="font-size:5pt;font-weight:500;text-transform:uppercase;letter-spacing:.15em;color:#94A3B8">Título del Incidente</div>
    <div style="font-size:9.5pt;font-weight:500;color:#0f172a;line-height:1.25">${t.titulo||'—'}</div>
  </div>
  <div style="display:flex;flex-direction:column;gap:3px;padding:8px 12px;border-right:1px solid #E2E8F0;flex-shrink:0">
    <div style="font-size:5pt;font-weight:800;text-transform:uppercase;letter-spacing:.15em;color:#94A3B8">Estatus</div>
    <span class="badge" style="${estStyle}">${EST_ICON[estatus]||''} ${estatus}</span>
  </div>
  <div style="display:flex;flex-direction:column;gap:3px;padding:8px 12px;flex-shrink:0">
    <div style="font-size:5pt;font-weight:800;text-transform:uppercase;letter-spacing:.15em;color:#94A3B8">Prioridad</div>
    <span class="badge" style="${prioStyle}">${t.prioridad}</span>
  </div>
  ${tiempoRes?`<div style="display:flex;flex-direction:column;gap:3px;padding:8px 12px;border-left:1px solid #E2E8F0;flex-shrink:0"><div style="font-size:5pt;font-weight:500;text-transform:uppercase;letter-spacing:.15em;color:#94A3B8">Tiempo resolución</div><div style="font-size:8pt;font-weight:500;color:#0f172a;font-family:monospace">${tiempoRes}</div></div>`:''}
</div>

<!-- DATOS -->
<div class="sec"><div class="sec-hdr"><span class="sec-title">Datos del Reporte</span><div class="sec-rule"></div></div>
<div class="sec-body"><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">
  ${datoCelda('Folio', t.folio_ticket)}
  ${datoCelda('Solicitante', t.nombre_empleado)}
  ${datoCelda('Departamento', t.nombre_departamento)}
  ${datoCelda('Categoría', t.nombre_categoria)}
  ${datoCelda('Fecha de alta', `${fechaAlta} · ${horaAlta}`)}
  ${fechaRes ? datoCelda('Fecha resolución', `${fechaRes} · ${horaRes}`) : datoCelda('Fecha resolución', 'Pendiente')}
  ${fechaRes ? datoCelda('Resuelto por', tecnico) : datoCelda('Resuelto por', 'Pendiente')}
  ${tiempoRes ? datoCelda('Tiempo resolución', tiempoRes) : datoCelda('Tiempo resolución', '—')}
</div></div></div>

<!-- DESCRIPCIÓN -->
<div class="sec"><div class="sec-hdr"><span class="sec-title">Descripción del Problema</span><div class="sec-rule"></div></div>
<div class="sec-body"><div class="rt">${t.descripcion||'<em style="color:#94A3B8">Sin descripción registrada.</em>'}</div></div></div>

<!-- RESOLUCIÓN -->
<div class="sec"><div class="sec-hdr"><span class="sec-title">Resolución y Comentarios del Técnico</span><div class="sec-rule"></div></div>
<div class="sec-body">
  <div style="border:1px solid #E2E8F0;border-radius:4px;overflow:hidden">
    <div style="display:flex;align-items:baseline;gap:8px;padding:5px 10px;background:#F8FAFC;border-bottom:1px solid #E2E8F0">
      <span style="font-size:8.5pt;font-weight:500;color:#0f172a">${tecnico}</span>
      <span style="font-size:5.5pt;font-weight:400;text-transform:uppercase;letter-spacing:.1em;color:#475569">Técnico de Soporte</span>
    </div>
    <div class="rt" style="background:#fff">${t.comentarios||'<em style="color:#94A3B8">Sin comentarios registrados.</em>'}</div>
  </div>
</div></div>

<!-- PROGRESO + CALIFICACIÓN -->
<div class="two-col">
  <div class="sec"><div class="sec-hdr"><span class="sec-title">Progreso del Ticket</span><div class="sec-rule"></div></div>
  <div class="sec-body">${stepperRows}</div></div>

  <div class="sec"><div class="sec-hdr"><span class="sec-title">Calificación y Firma</span><div class="sec-rule"></div></div>
  <div class="sec-body">
    ${calNum > 0
      ? `<div style="display:flex;flex-direction:column;gap:3px;padding:7px 10px;background:#FFFBEB;border:1px solid #FDE68A;border-top:2px solid #D97706;border-radius:0 0 3px 3px;margin-bottom:10px">
           <div style="display:flex;gap:2px">${stars(calNum)}</div>
           <div style="font-size:13pt;font-weight:500;color:#B45309;line-height:1">${calNum} / 5</div>
           <div style="font-size:7pt;font-weight:400;color:#92400E">${CAL_LABELS[calNum]}</div>
           <div style="font-size:6pt;color:#94A3B8">Evaluado por: ${t.nombre_empleado}</div>
         </div>`
      : `<p style="font-size:7.5pt;color:#94A3B8;font-style:italic;margin:4px 2px 10px">Valoración pendiente.</p>`
    }
    <div style="margin-top:4px;padding-top:10px;display:flex;flex-direction:column;gap:3px">
      <div style="width:100%;height:48px;border-bottom:1px solid #0f172a;margin-bottom:6px"></div>
      <div style="font-size:8.5pt;font-weight:500;color:#0f172a">${tecnico}</div>
      <div style="font-size:6.5pt;color:#475569">Técnico de Soporte</div>
      <div style="font-size:6.5pt;color:#475569">Precision Truck Parts and Accessories</div>
    </div>
  </div></div>
</div>

<!-- EVIDENCIAS -->
<div class="sec"><div class="sec-hdr"><span class="sec-title">Evidencias Fotográficas${imgs.length>0?' — '+imgs.length+' archivo'+(imgs.length!==1?'s':''):''}</span><div class="sec-rule"></div></div>
<div class="sec-body">${galeria}</div></div>

</div><!-- /wrap -->

<!-- FOOTER fijo al fondo de cada página -->
<div class="footer">
  <img src="${origin}/assets/img/log.png" style="height:20px;width:auto;object-fit:contain;display:block;opacity:.35" alt="" />
  <span style="flex:1;text-align:center;font-size:6pt;color:#94A3B8">Precision Truck Parts and Accessories — Sistema de Soporte Técnico HelpDesk</span>
  <span style="font-size:6pt;color:#94A3B8;font-family:monospace;white-space:nowrap">${t.folio_ticket} · ${fechaGen}</span>
</div>
</body></html>`;

    _imprimirEnIframe(html);
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
    background: isDark ? "#141720" : "#ffffff",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "transparent"}`,
    boxShadow: isDark
      ? "0 8px 32px rgba(0,0,0,0.45)"
      : "0 8px 30px rgb(0,0,0,0.04)",
    borderRadius: "16px",
    transition: "box-shadow 0.2s ease",
  };
  const cardHover = {
    boxShadow: isDark
      ? "0 12px 40px rgba(0,0,0,0.55)"
      : "0 12px 40px rgb(0,0,0,0.09)",
  };
  const hdr = {
    background: isDark ? "rgba(255,255,255,0.025)" : "#f8fafc",
    borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9"}`,
  };
  const labelStyle = { color: isDark ? "rgba(255,255,255,0.38)" : "#94a3b8" };
  const valStyle   = { color: T.text };

  return (
    <div style={{
      background: isDark ? T.bg : "#f0f4f8",
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
      `}</style>
      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{background:"rgba(0,0,0,0.75)",backdropFilter:"blur(4px)"}}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{background:isDark?"#141720":"#fff",boxShadow:"0 32px 80px rgba(0,0,0,0.5)",borderTop:"3px solid #dc2626"}}>
            <div className="px-5 py-4" style={{borderBottom:`1px solid ${isDark?"rgba(255,255,255,0.07)":"#f1f5f9"}`}}>
              <div className="flex items-center gap-2">
                <span className="w-1 h-5 rounded-full" style={{background:"#dc2626"}}/>
                <p className="font-black text-sm" style={{color:T.text}}>Cancelar este ticket?</p>
              </div>
            </div>
            <div className="px-5 py-4 flex flex-col gap-4">
              <p className="text-xs leading-relaxed" style={{color:T.textMuted}}>
                Esta accion no se puede deshacer. El ticket quedara marcado como <strong>Cancelado</strong> y no podra editarse.
              </p>
              {errorCancel && (
                <p className="text-xs font-semibold px-3 py-2 rounded-lg"
                  style={{background:isDark?"rgba(220,38,38,0.15)":"#fee2e2",color:"#dc2626",border:"1px solid rgba(220,38,38,0.3)"}}>
                  {errorCancel}
                </p>
              )}
              <div className="flex gap-2">
                <button onClick={() => { setConfirmCancel(false); setErrorCancel(""); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                  style={{background:isDark?"rgba(255,255,255,0.06)":"#f1f5f9",color:T.textMuted,border:`1px solid ${T.border}`}}>
                  Volver
                </button>
                <button onClick={handleCancelar} disabled={cancelando}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                  style={{background:"linear-gradient(135deg,#dc2626,#b91c1c)",boxShadow:"0 3px 12px rgba(220,38,38,0.3)"}}>
                  {cancelando ? "Cancelando..." : "Si, cancelar"}
                </button>
              </div>
            </div>
          </div>
        </div>
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
                  className="flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-full transition-all hover:brightness-95 active:scale-95"
                  style={{ fontSize:12, background: isDark?"rgba(255,255,255,0.06)":"#f1f5f9", color:T.textMuted, border:`1px solid ${isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)"}` }}>
                  <ArrowLeft size={11}/> Volver
                </button>
                {estatus === "En proceso" && (
                  <button onClick={() => setModalEditar(true)}
                    className="flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-full transition-all active:scale-95"
                    style={{ fontSize:12, background: isDark?"rgba(244,121,32,0.1)":"rgba(244,121,32,0.08)", color:T.orange, border:`1px solid rgba(244,121,32,0.25)` }}>
                    <Pencil size={11}/> Editar
                  </button>
                )}
                {!esAdmin && estatus === "En proceso" && (
                  <button onClick={() => setConfirmCancel(true)}
                    className="flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-full transition-all active:scale-95"
                    style={{ fontSize:12, background: isDark?"rgba(220,38,38,0.1)":"rgba(220,38,38,0.07)", color:"#dc2626", border:"1px solid rgba(220,38,38,0.25)" }}>
                    <XCircle size={11}/> Cancelar ticket
                  </button>
                )}
                {/* Folio alineado junto a los botones */}
                <span
                  className="font-mono font-bold px-3 py-1.5 rounded-full"
                  style={{ fontSize:12, color: T.orange, background: isDark?"rgba(249,115,22,0.1)":"#fff7ed", border:"1px solid rgba(249,115,22,0.2)" }}>
                  {ticketLocal.folio_ticket}
                </span>
              </div>
              {/* Derecha: logo */}
              <img
                src={isDark ? "/assets/img/logo blanco.png" : "/assets/img/logo negro.png"}
                alt="Logo corporativo"
                style={{ height: "64px", objectFit: "contain", opacity: 0.9, flexShrink: 0 }}
              />
            </div>

            {/* Título */}
            <div className="mb-3">
              <p className="font-semibold uppercase tracking-[0.12em] mb-1" style={{ fontSize:10, color:"#94a3b8" }}>Asunto</p>
              <h1 className="font-semibold leading-snug" style={{ fontSize:13, color:T.text }}>{ticketLocal.titulo}</h1>
            </div>

            {/* pills */}
            <div className="flex flex-wrap gap-1.5 pt-3" style={{ borderTop:`1px solid ${isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)"}` }}>
              {/* Prioridad */}
              <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold"
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
              <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold"
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
                <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-medium"
                  style={{ background: isDark?"rgba(255,255,255,0.05)":"#f1f5f9", color:T.textMuted, border:`1px solid ${isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)"}` }}>
                  <Tag size={10}/>{ticket.nombre_categoria}
                </span>
              )}
              {tiempoResolucion && (
                <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold"
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
                  <p className="font-semibold uppercase tracking-[0.12em]" style={{ fontSize:11, color: isDark?"rgba(255,255,255,0.38)":"#94a3b8" }}>Acceso remoto (TeamViewer)</p>
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
                <p className="font-semibold uppercase tracking-[0.12em]" style={{ fontSize:11, color: isDark?"rgba(255,255,255,0.38)":"#94a3b8" }}>Descripción del problema</p>
              </div>
              <div className="px-4 py-3">
                {ticketLocal.descripcion ? (
                  <div
                    className="leading-relaxed break-words ticket-desc"
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
                <p className="font-semibold uppercase tracking-[0.12em]" style={{ fontSize:11, color: isDark?"rgba(255,255,255,0.38)":"#94a3b8" }}>Información del reporte</p>
              </div>
              <div className="px-4 sm:px-8 py-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:gap-x-8 sm:gap-y-4">
                {[
                  { icon: User,         label: "Solicitante",       val: ticket.nombre_empleado     || "-" },
                  { icon: Tag,          label: "Departamento",       val: ticket.nombre_departamento || "-" },
                  { icon: Calendar,     label: "Fecha de alta",      val: `${fechaAlta} · ${horaAlta}` },
                  { icon: CheckCircle2, label: "Fecha resolución",   val: fechaResuelto ? `${fechaResuelto} · ${horaResuelto}` : "Pendiente" },
                  { icon: User,         label: "Resuelto por",       val: resueltoporState || "Pendiente" },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <p className="font-semibold uppercase tracking-[0.12em] flex items-center gap-1" style={{ fontSize:11, color: "#94a3b8" }}>
                      <Icon size={9} style={{ color: T.orange, flexShrink: 0 }} />
                      {label}
                    </p>
                    <p className="font-medium truncate" style={{ fontSize:13, color: T.text }}>{val}</p>
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
                  <p className="font-semibold uppercase tracking-[0.12em]" style={{ fontSize:11, color: isDark?"rgba(255,255,255,0.38)":"#94a3b8" }}>Evidencias adjuntas</p>
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
                <p className="font-semibold uppercase tracking-[0.12em]" style={{ fontSize:11, color: isDark?"rgba(255,255,255,0.38)":"#94a3b8" }}>Comentarios del técnico</p>
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
                  <p className="font-semibold uppercase tracking-[0.12em]" style={{ fontSize:11, color: isDark?"rgba(255,255,255,0.38)":"#94a3b8" }}>Progreso</p>
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

            {/* -- CALIFICACIÓN -- solo usuario -- */}
            {!esAdmin && (
            <div
              style={card}
              onMouseEnter={e => Object.assign(e.currentTarget.style, cardHover)}
              onMouseLeave={e => Object.assign(e.currentTarget.style, { boxShadow: card.boxShadow })}>
              <div className="px-6 py-4 flex items-center gap-2.5" style={hdr}>
                <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: "#f59e0b" }} />
                <p className="font-semibold uppercase tracking-[0.12em]" style={{ fontSize:11, color: isDark?"rgba(255,255,255,0.38)":"#94a3b8" }}>Calificar atención</p>
              </div>
              <div className="px-6 py-6 flex flex-col gap-3">
                <CalificacionEstrellas T={T} ticket={ticketLocal} estatusActual={estatus} />
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
                <p className="font-semibold uppercase tracking-[0.12em]" style={{ fontSize:11, color: isDark?"rgba(255,255,255,0.38)":"#94a3b8" }}>Exportar reporte</p>
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
                <p className="font-semibold uppercase tracking-[0.12em]" style={{ fontSize:11, color: isDark?"rgba(255,255,255,0.38)":"#94a3b8" }}>Exportar reporte</p>
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
                    <p className="font-semibold uppercase tracking-[0.12em]" style={{ fontSize:11, color: isDark?"rgba(255,255,255,0.38)":"#94a3b8" }}>Acciones del administrador</p>
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
                      {!confirmCierre ? (
                        <button onClick={() => setConfirmCierre(true)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110 active:scale-95"
                  style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", color: "#fff", boxShadow: "0 3px 12px rgba(22,163,74,0.3)", minHeight: "48px" }}>
                          <CheckCircle2 size={14}/> Cerrar ticket
                        </button>
                      ) : (
                        <div className="rounded-xl overflow-hidden"
                          style={{ border: isDark ? "1.5px solid rgba(22,163,74,0.3)" : "1.5px solid #86efac", background: isDark ? "rgba(22,163,74,0.08)" : "#f0fdf4" }}>
                          <div className="px-4 py-3 flex items-center gap-2"
                            style={{ borderBottom: isDark ? "1px solid rgba(22,163,74,0.2)" : "1px solid #86efac", background: isDark ? "rgba(22,163,74,0.12)" : "#dcfce7" }}>
                            <CheckCircle2 size={13} style={{ color: "#16a34a" }}/>
                            <p className="text-xs font-black" style={{ color: "#16a34a" }}>¿Confirmar cierre?</p>
                          </div>
                          <p className="px-4 py-2 text-[11px]" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#64748b" }}>
                            Marcará el ticket como <strong>Resuelto</strong> y guardará los comentarios.
                          </p>
                          <div className="flex gap-2 px-4 pb-4">
                            <button onClick={() => guardarCambios("Resuelto")} disabled={guardando}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                              style={{ background: "#16a34a", color: "#fff", boxShadow: "0 2px 8px rgba(22,163,74,0.3)" }}>
                              <CheckCircle2 size={12}/> {guardando ? "Cerrando..." : "Sí, cerrar"}
                            </button>
                            <button onClick={() => setConfirmCierre(false)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all hover:brightness-110 active:scale-95"
                              style={{ background: isDark ? "rgba(255,255,255,0.08)" : T.surface, color: T.textMuted, border: `1px solid ${T.border}` }}>
                              <X size={12}/> Cancelar
                            </button>
                          </div>
                        </div>
                      )}
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