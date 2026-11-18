/**
 * ModalEditarTicket.jsx
 *
 * Ventana para editar un ticket (usuario o administrador).
 *
 * Extraído de pages/Usuario/VistaTicket.jsx para facilitar su mantenimiento.
 */
import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import Modal from '../Modal.jsx';
import { apiFetch, textoError, textoExcepcion } from '../../services/api-client.js';
import { FS } from '../../utils/tipografia.js';


export function ModalEditarTicket({ T, ticket, esAdmin = false, onCerrar, onGuardado }) {
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
    borderRadius:"10px", color:T.text, fontSize: FS.enfasis,
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
      if (!resEditar.ok) { setError(textoError(dataEditar, resEditar.status, "No se pudieron guardar los cambios.")); return; }

      // 2. Si es cierre, usar el endpoint correcto que guarda fecha_resuelto e id_tecnico
      if (esCierre) {
        let adminId = null;
        try {
          const s = JSON.parse(localStorage.getItem("usuario") || "{}");
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
        if (!resCierre.ok) { setError(textoError(dataCierre, resCierre.status, "No se pudo cerrar el ticket.")); return; }
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
    } catch (err) { setError(textoExcepcion(err)); }
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
            <label className="block text-[9px] font-black uppercase tracking-widest mb-1.5" style={{color:T.textMuted}}>Título <span style={{color:"#ef4444"}}>*</span></label>
            <input value={form.titulo} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))}
              style={inputStyle} placeholder="Título del problema" onFocus={onFI} onBlur={onBI}/>
          </div>

          {/* Prioridad + Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest mb-1.5" style={{color:T.textMuted}}>Prioridad <span style={{color:"#ef4444"}}>*</span></label>
              <div className="grid grid-cols-4 gap-1.5">
                {PRIOS.map(p=>(
                  <button key={p.v} type="button" onClick={()=>setForm(f=>({...f,prioridad:p.v}))}
                    className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl text-[11px] font-bold transition-all"
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
              <label className="block text-[9px] font-black uppercase tracking-widest mb-1.5" style={{color:T.textMuted}}>Categoría <span style={{color:"#ef4444"}}>*</span></label>
              <select value={form.id_categoria} onChange={e=>setForm(f=>({...f,id_categoria:e.target.value}))}
                style={{...inputStyle,cursor:"pointer",colorScheme:isDark?"dark":"light"}} onFocus={onFI} onBlur={onBI}>
                <option value="">Selecciona una categoría</option>
                {categorias.map(c=><option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>)}
              </select>
            </div>
          </div>

          {/* Estatus */}
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest mb-1.5" style={{color:T.textMuted}}>Estatus</label>
            <div className="flex gap-2">
              {ESTATUS_OPTS.map(s=>(
                <button key={s.v} type="button" onClick={()=>setForm(f=>({...f,estatus:s.v}))}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold transition-all"
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
            <label className="block text-[9px] font-black uppercase tracking-widest mb-1.5" style={{color:T.textMuted}}>Descripción <span style={{color:"#ef4444"}}>*</span></label>
            <div style={{border:`1.5px solid ${isDark?"rgba(255,255,255,0.12)":T.border}`,borderRadius:"10px",overflow:"hidden",background:isDark?"rgba(255,255,255,0.05)":"#fff",transition:"border-color .15s, box-shadow .15s"}}>
              <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5"
                style={{borderBottom:`1px solid ${dividerLine}`,background:isDark?"rgba(255,255,255,0.04)":T.surfaceAlt}}>
                {[{cmd:"bold",l:<><strong>B</strong></>,t:"Negrita"},{cmd:"italic",l:<><em>I</em></>,t:"Cursiva"},{cmd:"underline",l:<><u>U</u></>,t:"Subrayado"},{cmd:"strikeThrough",l:<><s>S</s></>,t:"Tachado"}].map(({cmd,l,t})=>(
                  <ToolBtn key={cmd} title={t} onClick={()=>fmt(cmd)}><span className="text-[10px] font-bold">{l}</span></ToolBtn>
                ))}
                <div className="w-px h-4 mx-0.5" style={{background:dividerLine}}/>
                <ToolBtn title="Lista viñetas" onClick={()=>fmt("insertUnorderedList")}><span className="text-[9px] font-bold">•—</span></ToolBtn>
                <ToolBtn title="Lista numerada" onClick={()=>fmt("insertOrderedList")}><span className="text-[9px] font-bold">1.</span></ToolBtn>
                <div className="w-px h-4 mx-0.5" style={{background:dividerLine}}/>
                <ToolBtn title="Izquierda" onClick={()=>fmt("justifyLeft")}><span className="text-[9px]">⬅</span></ToolBtn>
                <ToolBtn title="Centro" onClick={()=>fmt("justifyCenter")}><span className="text-[9px]">≡</span></ToolBtn>
                <ToolBtn title="Derecha" onClick={()=>fmt("justifyRight")}><span className="text-[9px]">➡</span></ToolBtn>
                <div className="w-px h-4 mx-0.5" style={{background:dividerLine}}/>
                <ToolBtn title="Línea" onClick={()=>fmt("insertHorizontalRule")}><span className="text-[9px] font-bold">—</span></ToolBtn>
                <ToolBtn title="Quitar formato" onClick={()=>fmt("removeFormat")}><span className="text-[9px] font-black">Aa</span></ToolBtn>
              </div>
              <div contentEditable suppressContentEditableWarning
                ref={el=>{editorRef.current=el;}}
                onInput={onEditorInput}
                onFocus={e=>{e.currentTarget.parentElement.style.borderColor=T.orange;e.currentTarget.parentElement.style.boxShadow="0 0 0 3px rgba(244,121,32,0.1)";setError("");}}
                onBlur={e=>{e.currentTarget.parentElement.style.borderColor=isDark?"rgba(255,255,255,0.12)":T.border;e.currentTarget.parentElement.style.boxShadow="none";}}
                className="outline-none px-3.5 py-3 text-[12px] leading-relaxed ticket-desc"
                style={{minHeight:"120px",color:T.text,background:"transparent"}}
                data-placeholder="Describe el problema..."/>
            </div>
          </div>

          {/* Evidencias */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[9px] font-black uppercase tracking-widest" style={{color:T.textMuted}}>Evidencias fotográficas</label>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{background:isDark?"rgba(255,255,255,0.06)":T.bg,color:T.textMuted,border:`1px solid ${dividerLine}`}}>
                {totalFotos}/8
              </span>
            </div>

            {/* Fotos existentes */}
            {imgs.length > 0 && (
              <div className="mb-2">
                <p className="text-[9px] mb-1.5" style={{color:T.textFaint}}>Actuales — clic para marcar eliminación</p>
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
                          {marcada && <span className="text-white font-black text-[16px]">✕</span>}
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
                <p className="text-[9px] mb-1.5" style={{color:T.textFaint}}>Nuevas a agregar</p>
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
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer text-[11px] font-semibold transition-all"
                style={{background:isDark?"rgba(255,255,255,0.04)":T.surfaceAlt,border:`1.5px dashed ${isDark?"rgba(255,255,255,0.15)":T.border}`,color:T.orange}}>
                <input ref={fileRef} type="file" accept="image/*,video/mp4,video/webm,video/quicktime,video/x-msvideo" multiple className="hidden"
                  onChange={e=>{agregarNuevas(e.target.files);e.target.value="";}}/>
                + Agregar archivos
              </label>
            )}
          </div>

          {error && (
            <p className="text-[11px] font-semibold px-3 py-2 rounded-lg"
              style={{background:isDark?"rgba(220,38,38,0.15)":"#fee2e2",color:"#dc2626",border:"1px solid rgba(220,38,38,0.3)"}}>
              ⚠ {error}
            </p>
          )}
        </form>
    </Modal>
  );
}
