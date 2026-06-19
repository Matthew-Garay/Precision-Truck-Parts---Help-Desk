import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, Tag, Calendar, User, Clock,
  CheckCircle2, XCircle, ImageOff, ZoomIn,
  X, MessageSquare, ChevronLeft, ChevronRight, Star, Pencil
} from "lucide-react";
import API, { apiFetch, getToken } from "../../Config/api";
import { io } from "socket.io-client";

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

function ModalEditarTicket({ T, ticket, onCerrar, onGuardado }) {
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
    apiFetch("/api/categorias").then(r => r.json()).then(d => setCategorias(d)).catch(() => {});
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
  const ESTATUS_OPTS = [
    { v:"En proceso", c:"#ea580c", icon:"⏳" },
    { v:"Resuelto",   c:"#16a34a", icon:"✓"  },
    { v:"No Resuelto",c:"#dc2626", icon:"✗"  },
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
    const libres = 8 - imgs.length - nuevasEv.length + eliminarEv.length;
    Array.from(files).slice(0, libres).forEach(file => {
      const src = URL.createObjectURL(file);
      setNuevasEv(p => [...p, { src, name:file.name, file }]);
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
                      <img src={ev.src} alt={ev.name} className="w-full h-full object-cover rounded-xl"
                        style={{border:`2px solid ${T.orange}`}}/>
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
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={e=>{agregarNuevas(e.target.files);e.target.value="";}}/>
                + Agregar fotos
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
    const origin    = window.location.origin;
    const pasoIdx   = estatus === 'Resuelto' ? 2 : estatus === 'En proceso' ? 1 : 0;
    const fResuelto = fechaResueltoState ? fmtFecha(fechaResueltoState) : null;
    const hResuelto = fechaResueltoState ? fmtHora(fechaResueltoState)  : null;
    const tecnico   = resueltoporState ? resueltoporState.trim() : 'Pendiente';
    const calNum    = ticket.calificacion ? parseInt(ticket.calificacion, 10) : 0;
    const MENSAJES_CAL = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];

    const estrellasSvg = (n) => [1,2,3,4,5].map(i =>
      `<svg width="18" height="18" viewBox="0 0 24 24" fill="${i<=n?'#f59e0b':'#e5e7eb'}" stroke="${i<=n?'#f59e0b':'#d1d5db'}" stroke-width="1.5" style="display:inline-block;vertical-align:middle"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>`
    ).join('');

    // Stepper vertical
    const stepperHtml = ['Recibido','En proceso','Resuelto'].map((paso, i) => {
      const done   = i <= pasoIdx;
      const active = i === pasoIdx;
      const isLast = i === 2;
      const circBg  = done ? (i===2&&pasoIdx===2 ? '#16a34a' : '#F47920') : '#f1f5f9';
      const circBdr = done ? (i===2&&pasoIdx===2 ? '#16a34a' : '#F47920') : '#d1d5db';
      const lineBg  = i < pasoIdx ? (i+1===2&&pasoIdx===2 ? '#16a34a' : '#F47920') : '#e5e7eb';
      const fechaPaso = i===0 ? (fechaAlta&&horaAlta ? `${fechaAlta} &bull; ${horaAlta}` : '') :
                        i===2 ? (fResuelto&&hResuelto ? `${fResuelto} &bull; ${hResuelto}` : '') : '';
      const badgeHtml = active && pasoIdx < 2
        ? `<span style="font-size:7.5px;font-weight:800;color:#F47920;background:#fff7ed;border:1px solid #fed7aa;padding:1px 7px;border-radius:20px">Actual</span>`
        : active && pasoIdx === 2
        ? `<span style="font-size:7.5px;font-weight:800;color:#16a34a;background:#dcfce7;border:1px solid #86efac;padding:1px 7px;border-radius:20px">&#10003; Completado</span>`
        : done && !active
        ? `<span style="font-size:7.5px;font-weight:700;color:#16a34a;background:#f0fdf4;border:1px solid #bbf7d0;padding:1px 6px;border-radius:20px">&#10003;</span>`
        : `<span style="font-size:7.5px;color:#9ca3af;background:#f9fafb;border:1px solid #e5e7eb;padding:1px 6px;border-radius:20px">Pendiente</span>`;
      return `
        <div style="display:flex;gap:10px;align-items:flex-start">
          <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:24px">
            <div style="width:24px;height:24px;border-radius:50%;background:${circBg};border:2px solid ${circBdr};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;color:${done?'#fff':'#9ca3af'};-webkit-print-color-adjust:exact;print-color-adjust:exact">&#10003;</div>
            ${!isLast ? `<div style="width:2px;height:26px;background:${lineBg};margin:2px 0;border-radius:2px;-webkit-print-color-adjust:exact;print-color-adjust:exact"></div>` : ''}
          </div>
          <div style="flex:1;padding-top:3px;padding-bottom:${!isLast?'0':'0'}">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:2px">
              <span style="font-size:10.5px;font-weight:${active?'900':done?'700':'500'};color:${done?'#1D1D1B':'#9ca3af'}">${paso}</span>
              ${badgeHtml}
            </div>
            ${fechaPaso ? `<span style="font-size:8px;color:#6b7280">${fechaPaso}</span>` : ''}
          </div>
        </div>`;
    }).join('');

    // Grid de evidencias: siempre 4 columnas, altura fija pequeña para caber en hoja
    const cols = imgs.length === 0 ? 0 : 4;
    const imgGridHtml = imgs.length === 0
      ? `<p style="font-size:9px;color:#9ca3af;font-style:italic">No se adjuntaron evidencias fotogr&aacute;ficas.</p>`
      : `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px">
          ${imgs.map((img,i) => `
            <div style="position:relative;border-radius:4px;overflow:hidden;border:1px solid #e5e7eb;width:100%;height:60px">
              <img src="${API}/storage/Evidencias_Tickets/${ticket.folio_ticket}/${img}" style="width:100%;height:100%;object-fit:cover;display:block"/>
              <span style="position:absolute;bottom:2px;right:2px;background:rgba(0,0,0,0.6);color:#fff;font-size:6px;font-weight:900;padding:1px 3px;border-radius:2px">${String(i+1).padStart(2,'0')}</span>
            </div>`).join('')}
         </div>`;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Reporte ${ticket.folio_ticket}</title>
<style>
  @page { size: letter portrait; margin: 10mm 12mm; }
  *  { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Arial,sans-serif; background:#fff; color:#1D1D1B; -webkit-print-color-adjust:exact; print-color-adjust:exact; }

  /* -- HEADER -- */
  .hdr { display:flex; align-items:center; justify-content:space-between; padding:10px 0 10px 0; border-bottom:3px solid #F47920; margin-bottom:10px; }
  .hdr-logo { height:52px; object-fit:contain; }
  .hdr-center { flex:1; text-align:center; }
  .hdr-center-title { font-size:8px; font-weight:700; text-transform:uppercase; letter-spacing:.18em; color:#9ca3af; }
  .hdr-center-name  { font-size:14px; font-weight:900; color:#1D1D1B; margin-top:2px; letter-spacing:-.01em; }
  .hdr-right { text-align:right; }
  .hdr-folio { font-family:monospace; font-size:18px; font-weight:900; color:#F47920; }
  .hdr-date  { font-size:7.5px; color:#9ca3af; margin-top:3px; }

  /* -- BANDA -- */
  .banda { height:3px; background:linear-gradient(90deg,#F47920,#ffb347,#F47920); margin-bottom:10px; }

  /* -- BLOQUE TITULO -- */
  .titulo-block { border:1.5px solid #e5e7eb; border-radius:8px; overflow:hidden; margin-bottom:8px; }
  .titulo-top   { background:#f8fafc; padding:10px 14px; display:flex; align-items:flex-start; justify-content:space-between; gap:12px; border-bottom:1.5px solid #e5e7eb; }
  .titulo-text  { font-size:15px; font-weight:900; color:#1D1D1B; flex:1; line-height:1.3; }
  .titulo-folio { font-family:monospace; font-size:13px; font-weight:900; color:#F47920; background:#fff7ed; padding:4px 10px; border-radius:6px; border:1.5px solid #fed7aa; white-space:nowrap; flex-shrink:0; }
  .titulo-sub   { display:flex; background:#fff; }
  .titulo-sub-item { flex:1; padding:8px 14px; display:flex; flex-direction:column; gap:2px; }
  .titulo-sub-item + .titulo-sub-item { border-left:1.5px solid #e5e7eb; }
  .sub-lbl { font-size:7px; font-weight:900; text-transform:uppercase; letter-spacing:.1em; color:#9ca3af; }
  .sub-val { font-size:13px; font-weight:800; color:#1D1D1B; }

  /* -- GRID -- */
  .g2 { display:grid; grid-template-columns:1fr 1fr; gap:7px; margin-bottom:7px; }
  .g3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:7px; margin-bottom:7px; }

  /* -- SECCIONES -- */
  .sec { border:1.5px solid #e5e7eb; border-radius:7px; overflow:hidden; }
  .sec-h { background:#f8fafc; padding:5px 10px; border-bottom:1.5px solid #e5e7eb; display:flex; align-items:center; gap:5px; }
  .sec-dot { width:3px; height:12px; border-radius:2px; background:#F47920; flex-shrink:0; }
  .sec-title { font-size:7px; font-weight:900; text-transform:uppercase; letter-spacing:.14em; color:#6b7280; }
  .sec-b { padding:8px 10px; }

  /* -- DATOS -- */
  .dato-grid { display:grid; grid-template-columns:1fr 1fr; gap:5px; }
  .dato { background:#f9fafb; border:1px solid #e5e7eb; border-radius:5px; padding:5px 8px; }
  .dato.full { grid-column:1/-1; }
  .dato-lbl { font-size:6.5px; font-weight:900; text-transform:uppercase; letter-spacing:.1em; color:#9ca3af; margin-bottom:3px; }
  .dato-val { font-size:10px; font-weight:700; color:#1D1D1B; line-height:1.3; }

  /* -- BADGES -- */
  .badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:9.5px; font-weight:800; border:1.5px solid; }
  .b-urgente  { background:#fee2e2; color:#dc2626; border-color:#fca5a5; }
  .b-alta     { background:#ffedd5; color:#ea580c; border-color:#fdba74; }
  .b-media    { background:#fef9c3; color:#ca8a04; border-color:#fde047; }
  .b-baja     { background:#dcfce7; color:#16a34a; border-color:#86efac; }
  .b-resuelto { background:#dcfce7; color:#16a34a; border-color:#86efac; }
  .b-proceso  { background:#ffedd5; color:#ea580c; border-color:#fdba74; }
  .b-nores    { background:#fee2e2; color:#dc2626; border-color:#fca5a5; }

  /* -- TEXTO LIBRE -- */
  .tx     { border-left:3px solid #e5e7eb; padding:7px 10px; font-size:10.5px; line-height:1.7; color:#374151; background:#f9fafb; border-radius:0 5px 5px 0; min-height:30px; }
  .tx-tec { border-left-color:#F47920; background:#fff7ed; }

  /* -- TECNICO -- */
  .tec-box { background:#f8fafc; border:1.5px solid #e5e7eb; border-radius:7px; padding:10px 14px; }
  .tec-lbl  { font-size:7px; font-weight:900; text-transform:uppercase; letter-spacing:.12em; color:#9ca3af; margin-bottom:5px; }
  .tec-name { font-size:14px; font-weight:900; color:#1D1D1B; line-height:1.2; }
  .tec-role { font-size:8px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:#F47920; margin-top:3px; }

  /* -- VALORACION -- */
  .val-box  { background:#fffbeb; border:1.5px solid #fde68a; border-radius:7px; padding:10px 12px; }
  .val-lbl  { font-size:7px; font-weight:900; text-transform:uppercase; letter-spacing:.12em; color:#92400e; margin-bottom:6px; }
  .val-stars{ display:flex; align-items:center; gap:2px; margin-bottom:4px; }
  .val-txt  { font-size:11px; font-weight:800; color:#b45309; }
  .val-sub  { font-size:8px; color:#9ca3af; margin-top:1px; }
  .val-none { font-size:9px; color:#9ca3af; font-style:italic; }

  /* -- EVIDENCIAS -- */
  .ev-sec { border:1.5px solid #e5e7eb; border-radius:7px; overflow:hidden; margin-bottom:7px; }

  /* -- FOOTER NEGRO -- */
  .ftr {
    background:#1D1D1B;
    border-radius:8px;
    margin-top:10px;
    padding:12px 18px;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:16px;
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
  }
  .ftr-left  { display:flex; flex-direction:column; gap:3px; }
  .ftr-brand { font-size:11px; font-weight:900; color:#F47920; letter-spacing:.02em; }
  .ftr-sub   { font-size:7.5px; color:rgba(255,255,255,0.45); letter-spacing:.06em; }
  .ftr-divider { width:1px; height:32px; background:rgba(255,255,255,0.12); flex-shrink:0; }
  .ftr-center { flex:1; display:flex; flex-direction:column; align-items:center; gap:2px; }
  .ftr-folio  { font-family:monospace; font-size:13px; font-weight:900; color:#fff; letter-spacing:.06em; }
  .ftr-conf   { font-size:7px; font-weight:600; color:rgba(255,255,255,0.35); text-transform:uppercase; letter-spacing:.12em; }
  .ftr-right  { text-align:right; }
  .ftr-date   { font-size:7.5px; color:rgba(255,255,255,0.45); }
  .ftr-logo   { height:26px; object-fit:contain; margin-top:4px; filter:brightness(0) invert(1); opacity:.6; }
</style>
</head>
<body>

<!-- HEADER -->
<div class="hdr">
  <img src="${origin}/assets/img/logo negro.png" class="hdr-logo" alt="PTP"/>
  <div class="hdr-center">
    <div class="hdr-center-title">Precision Truck Parts &amp; Accessories</div>
    <div class="hdr-center-name">Reporte de Incidencia T&eacute;cnica</div>
  </div>
  <div class="hdr-right">
    <div class="hdr-folio">${ticket.folio_ticket}</div>
    <div class="hdr-date">Generado: ${new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'})} &bull; ${new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}</div>
  </div>
</div>

<!-- TITULO -->
<div class="titulo-block">
  <div class="titulo-top">
    <div class="titulo-text">${ticket.titulo || '&mdash;'}</div>
    <div class="titulo-folio">${ticket.folio_ticket}</div>
  </div>
  <div class="titulo-sub">
    <div class="titulo-sub-item">
      <span class="sub-lbl">Solicitante</span>
      <span class="sub-val">${ticket.nombre_empleado || '&mdash;'}</span>
    </div>
    <div class="titulo-sub-item">
      <span class="sub-lbl">Departamento</span>
      <span class="sub-val">${ticket.nombre_departamento || '&mdash;'}</span>
    </div>
    <div class="titulo-sub-item">
      <span class="sub-lbl">Categor&iacute;a</span>
      <span class="sub-val">${ticket.nombre_categoria || '&mdash;'}</span>
    </div>
  </div>
</div>

<!-- CLASIFICACION + FECHAS -->
<div class="g2">
  <div class="sec">
    <div class="sec-h"><div class="sec-dot"></div><span class="sec-title">Clasificaci&oacute;n</span></div>
    <div class="sec-b">
      <div class="dato-grid">
        <div class="dato">
          <div class="dato-lbl">Prioridad</div>
          <span class="badge b-${(ticket.prioridad||'media').toLowerCase()}">${ticket.prioridad||'&mdash;'}</span>
        </div>
        <div class="dato full">
          <div class="dato-lbl">Estatus</div>
          <span class="badge ${estatus==='Resuelto'?'b-resuelto':estatus==='En proceso'?'b-proceso':'b-nores'}">${estatus}</span>
        </div>
      </div>
    </div>
  </div>
  <div class="sec">
    <div class="sec-h"><div class="sec-dot"></div><span class="sec-title">Fechas</span></div>
    <div class="sec-b">
      <div class="dato-grid">
        <div class="dato"><div class="dato-lbl">Fecha alta</div><div class="dato-val">${fechaAlta}</div></div>
        <div class="dato"><div class="dato-lbl">Hora alta</div><div class="dato-val">${horaAlta}</div></div>
        <div class="dato"><div class="dato-lbl">Fecha resoluci&oacute;n</div><div class="dato-val">${fResuelto||'Pendiente'}</div></div>
        <div class="dato"><div class="dato-lbl">Hora resoluci&oacute;n</div><div class="dato-val">${hResuelto||'Pendiente'}</div></div>
      </div>
    </div>
  </div>
</div>

<!-- DESCRIPCION -->
<div class="sec" style="margin-bottom:7px">
  <div class="sec-h"><div class="sec-dot"></div><span class="sec-title">Descripci&oacute;n del problema</span></div>
  <div class="sec-b"><div class="tx">${ticket.descripcion||'<em style="color:#9ca3af">Sin descripci&oacute;n registrada.</em>'}</div></div>
</div>

<!-- COMENTARIOS TECNICO -->
<div class="sec" style="margin-bottom:7px">
  <div class="sec-h"><div class="sec-dot" style="background:#F47920"></div><span class="sec-title">Comentarios del t&eacute;cnico</span></div>
  <div class="sec-b"><div class="tx tx-tec">${comentario||'<em style="color:#9ca3af">Sin comentarios del t&eacute;cnico.</em>'}</div></div>
</div>

<!-- PROGRESO + CIERRE -->
<div class="g2">
  <div class="sec">
    <div class="sec-h"><div class="sec-dot"></div><span class="sec-title">Progreso del ticket</span></div>
    <div class="sec-b" style="padding:10px 12px">${stepperHtml}</div>
  </div>
  <div class="sec">
    <div class="sec-h"><div class="sec-dot"></div><span class="sec-title">Cierre y valoraci&oacute;n</span></div>
    <div class="sec-b" style="display:flex;flex-direction:column;gap:8px">

      <!-- Tecnico -->
      <div class="tec-box">
        <div class="tec-lbl">T&eacute;cnico responsable</div>
        <div class="tec-name">${tecnico}</div>
        <div class="tec-role">Soporte T&eacute;cnico</div>
      </div>

      <!-- Valoracion -->
      <div class="val-box">
        <div class="val-lbl">Valoraci&oacute;n del usuario</div>
        ${calNum > 0 ? `
          <div class="val-stars">${estrellasSvg(calNum)}</div>
          <div class="val-txt">${MENSAJES_CAL[calNum]}</div>
          <div class="val-sub">${calNum} de 5 estrellas</div>
        ` : `<div class="val-none">Sin valoraci&oacute;n registrada</div>`}
      </div>

    </div>
  </div>
</div>

<!-- EVIDENCIAS -->
<div class="ev-sec">
  <div class="sec-h"><div class="sec-dot"></div><span class="sec-title">Evidencias fotogr&aacute;ficas${imgs.length>0?' ('+imgs.length+')':''}</span></div>
  <div class="sec-b">${imgGridHtml}</div>
</div>

<!-- FOOTER NEGRO -->
<div class="ftr">
  <div class="ftr-left">
    <span class="ftr-brand">Precision Truck Parts &amp; Accessories</span>
    <span class="ftr-sub">Sistema HelpDesk &bull; Documento de uso interno</span>
  </div>
  <div class="ftr-divider"></div>
  <div class="ftr-center">
    <span class="ftr-folio">${ticket.folio_ticket}</span>
  </div>
  <div class="ftr-divider"></div>
  <div class="ftr-right">
    <div class="ftr-date">${new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'})}</div>
    <div class="ftr-date">${new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}</div>
    <img src="${origin}/assets/img/logo blanco.png" class="ftr-logo" alt="PTP"/>
  </div>
</div>

<script>window.onload=function(){window.print();}<\/script>
</body></html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
      const aviso = document.createElement("div");
      aviso.style.cssText = "position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9999;background:#1D1D1B;color:#fff;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:700;border-left:4px solid #F47920;box-shadow:0 4px 20px rgba(0,0,0,0.4);";
      aviso.textContent = "Permite ventanas emergentes para generar el reporte.";
      document.body.appendChild(aviso);
      setTimeout(() => aviso.remove(), 5000);
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  };



  const cerrado = estatus === "Resuelto" || estatus === "No Resuelto";

  const pasoActual = estatus === "Resuelto" ? 2
    : estatus === "En proceso" ? 1 : 0;

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
      else if (estatusFinal === "Resuelto") setResueltoporState(adminNombre || "Administrador");
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

  // Escuchar cambios en tiempo real del ticket abierto
  useEffect(() => {
    const token = getToken();
    if (!token || !ticket.id_ticket) return;
    // Derivar la URL del socket igual que en useSocket.js
    const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin.replace(":5173", ":3001");
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });
    const handleActualizado = (d) => {
      if (d?.id_ticket !== ticket.id_ticket) return;
      if (d.estatus)        setEstatus(d.estatus);
      if (d.fecha_resuelto) setFechaResueltoState(d.fecha_resuelto);
      if (d.resuelto_por)   setResueltoporState(d.resuelto_por);
      else if (d.nombre_tecnico) setResueltoporState(d.nombre_tecnico);
    };
    socket.on("ticket:actualizado", handleActualizado);
    socket.on("ticket:en_atencion", handleActualizado);
    socket.on("ticket:calificado", (d) => {
      if (d?.id_ticket === ticket.id_ticket) {
        setTicketLocal(prev => ({ ...prev, calificacion: d.calificacion }));
      }
    });
    return () => { socket.disconnect(); };
  }, [ticket.id_ticket]);

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
    <div className="overflow-y-auto" style={{ background: isDark ? T.bg : "#f0f4f8" }}>
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
      {modalEditar && (
        <ModalEditarTicket
          T={T}
          ticket={ticketLocal}
          onCerrar={() => setModalEditar(false)}
          onGuardado={(cambios) => {
            setTicketLocal(prev => ({ ...prev, ...cambios }));
            setModalEditar(false);
          }}
        />
      )}
      <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8 pb-10 space-y-4 sm:space-y-5">

        {/* ══ HEADER CARD ══ */}
        <div
          style={{ ...card, overflow: "hidden" }}
          onMouseEnter={e => Object.assign(e.currentTarget.style, cardHover)}
          onMouseLeave={e => Object.assign(e.currentTarget.style, { boxShadow: card.boxShadow })}>
          <div className="h-0.5" style={{ background: `linear-gradient(90deg,${prio.color}cc,${prio.color}22)` }} />
          <div className="p-5 sm:p-7">
            {/* nav + logo corporativo */}
            <div className="flex items-center justify-between gap-2 mb-5">
              <div className="flex items-center gap-2">
                <button onClick={onVolver}
                  className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-full transition-all hover:brightness-95 active:scale-95"
                  style={{ background: isDark?"rgba(255,255,255,0.06)":"#f1f5f9", color:T.textMuted, border:`1px solid ${isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)"}` }}>
                  <ArrowLeft size={12}/> Volver
                </button>
                {(esAdmin || estatus === "En proceso") && (
                  <button onClick={() => setModalEditar(true)}
                    className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-full transition-all active:scale-95"
                    style={{ background: isDark?"rgba(244,121,32,0.1)":"rgba(244,121,32,0.08)", color:T.orange, border:`1px solid rgba(244,121,32,0.25)` }}>
                    <Pencil size={11}/> Editar
                  </button>
                )}
              </div>
              <img
                src={isDark ? "/assets/img/logo blanco.png" : "/assets/img/logo negro.png"}
                alt="Logo corporativo"
                style={{ height: "64px", objectFit: "contain", opacity: 0.9 }}
              />
            </div>

            {/* Folio + título */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-5 mb-5">
              <div className="flex-shrink-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] mb-1" style={{ color:"#94a3b8" }}>Folio de reporte</p>
                <span
                  className="font-mono text-sm font-bold tracking-tight px-3 py-1 rounded-xl inline-block"
                  style={{ color: T.orange, background: isDark ? "rgba(249,115,22,0.1)" : "#fff7ed", border: "1px solid rgba(249,115,22,0.2)", letterSpacing: "-0.01em" }}>
                  {ticketLocal.folio_ticket}
                </span>
              </div>
              <div className="hidden sm:block w-px self-stretch flex-shrink-0 mt-4" style={{ background: isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.06)" }} />
              <div className="flex-1 min-w-0 sm:pt-1">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] mb-1" style={{ color:"#94a3b8" }}>Asunto</p>
                <h1 className="text-base sm:text-lg font-semibold leading-snug" style={{ color:T.text, letterSpacing:"-0.01em" }}>{ticketLocal.titulo}</h1>
              </div>
            </div>

            {/* pills */}
            <div className="flex flex-wrap gap-2 pt-4" style={{ borderTop:`1px solid ${isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)"}` }}>
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
                  background: estatus==="Resuelto"?(isDark?"rgba(22,163,74,0.15)":"#f0fdf4"):estatus==="No Resuelto"?(isDark?"rgba(220,38,38,0.15)":"#fef2f2"):(isDark?"rgba(244,121,32,0.15)":"rgba(244,121,32,0.08)"),
                  color: estatus==="Resuelto"?"#16a34a":estatus==="No Resuelto"?"#dc2626":T.orange,
                  border:`1px solid ${estatus==="Resuelto"?"rgba(22,163,74,0.25)":estatus==="No Resuelto"?"rgba(220,38,38,0.25)":"rgba(244,121,32,0.25)"}`,
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
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">

          {/* -- COLUMNA IZQUIERDA -- */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-5">

            {/* Descripción */}
            <div
              style={card}
              onMouseEnter={e => Object.assign(e.currentTarget.style, cardHover)}
              onMouseLeave={e => Object.assign(e.currentTarget.style, { boxShadow: card.boxShadow })}>
              <div className="px-4 py-3 flex items-center gap-2.5" style={hdr}>
                <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: T.orange }} />
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={labelStyle}>Descripción del problema</p>
              </div>
              <div className="px-4 py-3">
                {ticketLocal.descripcion ? (
                  <div
                    className="text-sm leading-relaxed break-words prose-sm ticket-desc"
                    style={{ color: T.text, lineHeight: "1.7" }}
                    dangerouslySetInnerHTML={{ __html: ticketLocal.descripcion }}
                  />
                ) : (
                  <p className="text-sm italic" style={{ color: T.textFaint }}>Sin descripción registrada.</p>
                )}
              </div>
            </div>

            {/* TeamViewer — solo admin */}
            {esAdmin && (
              <div
                style={card}
                onMouseEnter={e => Object.assign(e.currentTarget.style, cardHover)}
                onMouseLeave={e => Object.assign(e.currentTarget.style, { boxShadow: card.boxShadow })}>
                <div className="px-4 py-3 flex items-center gap-2.5" style={hdr}>
                  <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: "#3b82f6" }} />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={labelStyle}>Acceso remoto (TeamViewer)</p>
                </div>
                <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[{ label: "ID de TeamViewer", value: tvId, setter: setTvId, placeholder: "Ej. 123 456 789" },
                    { label: "Contraseña",        value: tvPass, setter: setTvPass, placeholder: "Contraseña de sesión" }]
                    .map(({ label, value, setter, placeholder }) => (
                      <div key={label}>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: T.textMuted }}>
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

            {/* Información del reporte */}
            <div
              style={card}
              onMouseEnter={e => Object.assign(e.currentTarget.style, cardHover)}
              onMouseLeave={e => Object.assign(e.currentTarget.style, { boxShadow: card.boxShadow })}>
              <div className="px-6 py-4 flex items-center gap-2.5" style={hdr}>
                <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: T.orange }} />
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={labelStyle}>Información del reporte</p>
              </div>
              <div className="px-6 sm:px-8 py-6 grid grid-cols-2 gap-x-8 gap-y-5">
                {[
                  { icon: User,         label: "Solicitante",       val: ticket.nombre_empleado     || "-" },
                  { icon: Tag,          label: "Departamento",       val: ticket.nombre_departamento || "-" },
                  { icon: Calendar,     label: "Fecha de alta",      val: `${fechaAlta} · ${horaAlta}` },
                  { icon: CheckCircle2, label: "Fecha resolución",   val: fechaResuelto ? `${fechaResuelto} · ${horaResuelto}` : "Pendiente" },
                  { icon: User,         label: "Resuelto por",       val: resueltoporState || "Pendiente" },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] flex items-center gap-1" style={{ color: "#94a3b8" }}>
                      <Icon size={9} style={{ color: T.orange, flexShrink: 0 }} />
                      {label}
                    </p>
                    <p className="text-xs font-medium truncate" style={{ color: T.text }}>{val}</p>
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
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={labelStyle}>Evidencias fotográficas</p>
                </div>
                <span className="text-[10px] font-semibold px-3 py-1 rounded-full flex-shrink-0"
                  style={{ background: isDark?"rgba(255,255,255,0.06)":"#f1f5f9", color: T.textMuted, border:`1px solid ${isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)"}` }}>
                  {imgs.length} foto{imgs.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="p-5 sm:p-6">
                {imgs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <ImageOff size={22} style={{ color: T.textFaint }} />
                    <p className="text-xs" style={{ color: T.textFaint }}>No se adjuntaron imágenes</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {imgs.map((img, i) => (
                      <button key={i} onClick={() => setVisor(i)}
                        className="aspect-square rounded-lg overflow-hidden relative group"
                        style={{ boxShadow: "none" }}>
                        <img
                          src={`${API}/storage/Evidencias_Tickets/${ticket.folio_ticket}/${img}`}
                          alt={`Evidencia ${i + 1}`}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                          style={{ background: "rgba(0,0,0,0.45)" }}>
                          <ZoomIn size={18} color="#fff" />
                        </div>
                      </button>
                    ))}
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
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={labelStyle}>Comentarios del técnico</p>
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
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={labelStyle}>Progreso</p>
                </div>
                <span className="text-[10px] font-semibold px-3 py-1 rounded-full"
                  style={{ background: isDark?"rgba(255,255,255,0.06)":"#f1f5f9", color:T.textMuted, border:`1px solid ${isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)"}` }}>
                  {pasoActual+1} / 3
                </span>
              </div>
              {/* barra progreso estilizada */}
              <div className="px-6 pt-5 pb-2">
                <div className="relative h-3 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "#e9eef5" }}>
                  {/* track glow difuso */}
                  <div className="absolute inset-0 rounded-full" style={{ background: isDark?"rgba(249,115,22,0.04)":"rgba(249,115,22,0.06)" }}/>
                  {/* barra activa */}
                  <div
                    className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                    style={{
                      width: pasoActual === 0 ? "8%" : pasoActual === 1 ? "52%" : "100%",
                      background: pasoActual === 2
                        ? "linear-gradient(90deg,#16a34a,#4ade80,#16a34a)"
                        : "linear-gradient(90deg,#ea6000,#F47920,#ffb347,#ffd199)",
                      boxShadow: pasoActual < 2
                        ? "0 0 10px rgba(244,121,32,0.55), 0 0 3px rgba(244,121,32,0.3)"
                        : "0 0 10px rgba(22,163,74,0.55), 0 0 3px rgba(22,163,74,0.3)",
                    }}
                  />
                  {/* marcadores de paso */}
                  {["8%", "52%", "100%"].map((pos, i) => (
                    <div key={i}
                      className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 transition-all duration-500"
                      style={{
                        left: pos, transform: "translate(-50%,-50%)",
                        background: i <= pasoActual ? (pasoActual===2?"#4ade80":"#ffb347") : isDark?"#2a2f3e":"#d1d8e3",
                        borderColor: i <= pasoActual ? (pasoActual===2?"#16a34a":T.orange) : isDark?"rgba(255,255,255,0.1)":"#c5cdd8",
                        boxShadow: i === pasoActual ? (pasoActual===2?"0 0 8px rgba(22,163,74,0.7)":"0 0 8px rgba(244,121,32,0.7)") : "none",
                        zIndex: 2,
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  {["Recibido", "En proceso", "Resuelto"].map((l, i) => (
                    <span key={l} className="text-[9px] font-bold"
                      style={{ color: i <= pasoActual ? (i===2&&pasoActual===2?"#16a34a":T.orange) : "#94a3b8", letterSpacing:"0.04em" }}>
                      {l}
                    </span>
                  ))}
                </div>
              </div>
              {/* pasos */}
              <div className="px-6 pt-4 pb-6 flex flex-col gap-0">
                {[
                  {
                    label:"Recibido", sub:"Reporte registrado en el sistema",
                    fecha: pasoActual >= 0 ? fechaAlta : null, hora: pasoActual >= 0 ? horaAlta : null,
                    extra: ticket.nombre_empleado ? `Por ${ticket.nombre_empleado}` : null,
                    icon:(
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
                        <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
                      </svg>
                    ),
                  },
                  {
                    label:"En proceso", sub:"Técnico trabajando en la incidencia",
                    fecha:null, hora:null,
                    extra: resueltoporState && pasoActual>=1 ? `Asignado: ${resueltoporState}` : null,
                    icon: pasoActual===1 ? (
                      <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                    ),
                  },
                  {
                    label:"Resuelto", sub:"Incidencia cerrada exitosamente",
                    fecha: pasoActual === 2 ? fechaResuelto : null, hora: pasoActual === 2 ? horaResuelto : null,
                    extra: tiempoResolucion ? `Tiempo total: ${tiempoResolucion}` : null,
                    icon:(
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    ),
                  },
                ].map((paso, i) => {
                  const completado = i <= pasoActual;
                  const actual     = i === pasoActual;
                  const pendiente  = i > pasoActual;
                  const esUltimo   = i === 2;
                  const nodeColor  = esUltimo && pasoActual===2 ? "#16a34a" : T.orange;
                  return (
                    <div key={paso.label} className="flex gap-4">
                      {/* nodo + línea */}
                      <div className="flex flex-col items-center flex-shrink-0" style={{ width:36 }}>
                        <div className="relative flex items-center justify-center rounded-full transition-all duration-500"
                          style={{
                            width: 36, height: 36,
                            background: completado
                              ? (esUltimo && pasoActual === 2
                                  ? "linear-gradient(135deg,#16a34a,#4ade80)"
                                  : `linear-gradient(135deg,${T.orange},#ea6000)`)
                              : isDark ? "rgba(255,255,255,0.04)" : "#f8fafc",
                            border: `1.5px solid ${completado ? nodeColor : isDark ? "rgba(255,255,255,0.10)" : "#e2e8f0"}`,
                            boxShadow: actual
                              ? `0 0 0 5px ${nodeColor}14, 0 4px 14px ${nodeColor}38`
                              : completado ? `0 2px 8px ${nodeColor}28` : "none",
                            color: completado ? "#fff" : isDark ? "rgba(255,255,255,0.18)" : "#cbd5e1",
                          }}>
                          {paso.icon}
                          {actual && (
                            <span className="absolute inset-0 rounded-full animate-ping"
                              style={{ background:`${nodeColor}20`, animationDuration:"2s" }}/>
                          )}
                        </div>
                        {!esUltimo && (
                          <div
                            className="relative overflow-hidden"
                            style={{ width: 2, minHeight: 44, borderRadius: 999, background: isDark ? "rgba(255,255,255,0.07)" : "#e2e8f0", margin: "4px 0" }}>
                            <div
                              className="absolute top-0 left-0 w-full transition-all duration-700"
                              style={{
                                height: i < pasoActual ? "100%" : "0%",
                                background: i + 1 === 2 && pasoActual === 2
                                  ? "linear-gradient(180deg,#16a34a,#4ade80)"
                                  : `linear-gradient(180deg,${T.orange},rgba(249,115,22,0.25))`,
                                borderRadius: 999,
                              }}
                            />
                          </div>
                        )}
                      </div>
                      {/* contenido */}
                      <div className="flex-1 pb-5" style={{ paddingTop:5 }}>
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <p className="text-sm font-semibold" style={{ color:completado?T.text:"#94a3b8" }}>{paso.label}</p>
                          {actual && pasoActual<2 && (
                            <span className="text-[8px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background:`rgba(244,121,32,0.1)`, color:T.orange, border:`1px solid rgba(244,121,32,0.2)` }}>
                              Actual
                            </span>
                          )}
                          {actual && pasoActual===2 && (
                            <span className="text-[8px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background:"rgba(22,163,74,0.1)", color:"#16a34a", border:"1px solid rgba(22,163,74,0.2)" }}>✓ Completado</span>
                          )}
                          {completado && !actual && (
                            <span className="text-[8px] font-medium px-1.5 py-0.5 rounded-full"
                              style={{ background:isDark?"rgba(22,163,74,0.1)":"#f0fdf4", color:"#16a34a", border:"1px solid rgba(22,163,74,0.15)" }}>✓</span>
                          )}
                          {pendiente && (
                            <span className="text-[8px] font-medium px-1.5 py-0.5 rounded-full"
                              style={{ background:isDark?"rgba(255,255,255,0.04)":"#f8fafc", color:"#94a3b8", border:`1px solid ${isDark?"rgba(255,255,255,0.07)":"#e2e8f0"}` }}>Pendiente</span>
                          )}
                        </div>
                        <p className="text-[11px] leading-relaxed" style={{ color:"#94a3b8" }}>{paso.sub}</p>
                        {paso.fecha && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                            style={{ background:isDark?"rgba(255,255,255,0.04)":"#f8fafc", border:`1px solid ${isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.05)"}` }}>
                            <Calendar size={9} style={{ color:T.orange, flexShrink:0 }}/>
                            <span className="text-[11px] font-medium" style={{ color:T.text }}>{paso.fecha}</span>
                            <span style={{ color:"#cbd5e1" }}>·</span>
                            <Clock size={9} style={{ color:T.orange, flexShrink:0 }}/>
                            <span className="text-[11px] font-medium" style={{ color:T.text }}>{paso.hora}</span>
                          </div>
                        )}
                        {paso.extra && (
                          <p className="text-[10px] mt-1.5" style={{ color:"#94a3b8" }}>{paso.extra}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
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
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={labelStyle}>Calificar atención</p>
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
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={labelStyle}>Exportar reporte</p>
              </div>
              <div className="px-5 py-5">
                <p className="text-[11px] mb-3" style={{ color: T.textFaint }}>Genera un PDF con toda la información de esta incidencia.</p>
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
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={labelStyle}>Exportar reporte</p>
              </div>
              <div className="px-5 py-5">
                <p className="text-[11px] mb-3" style={{ color: T.textFaint }}>Genera un PDF con toda la información de esta incidencia.</p>
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
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={labelStyle}>Acciones del administrador</p>
                  </div>
                  {estatus === "Resuelto" && (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold"
                      style={{ background: isDark ? "rgba(22,163,74,0.12)" : "#f0fdf4", color: "#16a34a", border: "1px solid rgba(22,163,74,0.2)" }}>
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

      {/* -- VISOR MODAL -- */}
      {visor !== null && imgs[visor] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.93)" }}
          onClick={() => setVisor(null)}>
          <div className="relative w-full max-w-3xl flex flex-col items-center gap-4"
            onClick={e => e.stopPropagation()}>
            <img
              src={`${API}/storage/Evidencias_Tickets/${ticket.folio_ticket}/${imgs[visor]}`}
              alt="" className="rounded-2xl object-contain w-full"
              style={{ maxHeight: "70vh", boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}
            />
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