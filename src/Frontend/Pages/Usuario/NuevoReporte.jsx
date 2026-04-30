import { useState, useRef, useCallback } from "react";
import { Camera, Plus, X, ZoomIn, ChevronLeft, ChevronRight, Trash2,
  Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Minus } from "lucide-react";

const PRIORIDADES = [
  { label:"Urgente", nivel:"Urgente", color:"#dc2626", bgL:"#fee2e2", bgD:"#2d0a0a", borderL:"#fca5a5", borderD:"#7f1d1d" },
  { label:"Alta",    nivel:"Alta",    color:"#ea580c", bgL:"#ffedd5", bgD:"#2d1200", borderL:"#fdba74", borderD:"#7c2d12" },
  { label:"Media",   nivel:"Media",   color:"#ca8a04", bgL:"#fef9c3", bgD:"#1f1a00", borderL:"#fde047", borderD:"#713f12" },
  { label:"Baja",    nivel:"Baja",    color:"#16a34a", bgL:"#dcfce7", bgD:"#052e16", borderL:"#86efac", borderD:"#14532d" },
];

const CATEGORIAS = [
  { valor:"Hardware",           icono:"🖥️", label:"Hardware"           },
  { valor:"Software",           icono:"💾", label:"Software"           },
  { valor:"Red / Conectividad", icono:"🌐", label:"Red / Conectividad"  },
  { valor:"Impresoras",         icono:"🖨️", label:"Impresoras"         },
  { valor:"Accesos y Permisos", icono:"🔐", label:"Accesos y Permisos"  },
  { valor:"Correo Electrónico", icono:"📧", label:"Correo Electrónico"  },
  { valor:"Otro",               icono:"📌", label:"Otro"               },
];

const MAX_IMGS = 8;
const EMPTY = { titulo:"", descripcion:"", palabras:0, prioridad:"", categoria:"", evidencias:[] };
const MAX_PALABRAS = 500;
const contarPalabras = t => t.trim().length;

export default function NuevoReporte({ T, solicitante = "—", area = "—" }) {
  const [form,     setForm]     = useState(EMPTY);
  const [visor,    setVisor]    = useState(null);
  const [catOpen,  setCatOpen]  = useState(false);
  const [errores,  setErrores]  = useState({});
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const isDark      = T.bg === "#0b0e14";
  const catSel      = CATEGORIAS.find(c => c.valor === form.categoria);
  const inputBg     = isDark ? "rgba(255,255,255,0.05)" : T.surfaceAlt;
  const inputBorder = isDark ? "rgba(255,255,255,0.12)" : T.border;
  const dividerLine = isDark ? "rgba(255,255,255,0.08)" : T.border;
  const dividerText = isDark ? "rgba(255,255,255,0.45)" : T.textMuted;
  const iconColor   = isDark ? "rgba(255,255,255,0.22)" : T.textFaint;
  const textColor   = isDark ? "#e2e8f0" : T.text;

  const editorRef = useRef(null);

  const quitarError = k => setErrores(p => { const n = {...p}; delete n[k]; return n; });
  const set = (k, v) => { setForm(f => ({...f, [k]:v})); quitarError(k); };
  const limpiar = () => {
    setForm(EMPTY);
    setErrores({});
    if (editorRef.current) editorRef.current.innerHTML = "";
  };

  // Ejecuta comando de formato sin perder el foco
  const fmt = useCallback((cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
  }, []);

  const onEditorInput = () => {
    const texto   = editorRef.current?.innerText || "";
    const html    = editorRef.current?.innerHTML  || "";
    const palabras = contarPalabras(texto);

    if (palabras > MAX_PALABRAS) {
      // revertir al último HTML válido
      editorRef.current.innerHTML = form.descripcion || "";
      const range = document.createRange();
      const sel   = window.getSelection();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
    setForm(f => ({ ...f, descripcion: texto.trim() ? html : "", palabras: texto.trim().length }));
    quitarError("descripcion");
  };

  const handleSubir = () => {
    const e = {};
    if (!form.titulo.trim())      e.titulo      = "El título es requerido";
    if (!form.descripcion.trim()) e.descripcion = "La descripción es requerida";
    if (!form.prioridad)          e.prioridad   = "Selecciona una prioridad";
    if (!form.categoria)          e.categoria   = "Selecciona una categoría";
    if (Object.keys(e).length) { setErrores(e); return; }
    alert("✅ Reporte enviado correctamente");
    limpiar();
  };

  const agregarImgs = files => {
    const libres = MAX_IMGS - form.evidencias.length;
    Array.from(files).slice(0, libres).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setForm(f => ({...f, evidencias:[...f.evidencias, {src:ev.target.result, name:file.name}]}));
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = e => {
    e.preventDefault(); setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (files.length) agregarImgs(files);
  };

  const borrarImg = i => {
    const evs = form.evidencias.filter((_, idx) => idx !== i);
    setForm(f => ({...f, evidencias:evs}));
    if (visor !== null) setVisor(evs.length === 0 ? null : Math.min(i, evs.length - 1));
  };

  const slots = [...form.evidencias];
  if (slots.length < MAX_IMGS) slots.push(null);

  // ── tokens de estilo ──────────────────────────────────────
  const card = {
    background: isDark ? "#141720" : T.surface,
    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}`,
    boxShadow: isDark ? "0 8px 40px rgba(0,0,0,0.5)" : "0 1px 8px rgba(0,0,0,0.07)",
  };

  const inputStyle = {
    background: inputBg,
    border: `1.5px solid ${inputBorder}`,
    color: textColor,
    borderRadius: "12px",
    fontSize: "13px",
    padding: "10px 14px",
    outline: "none",
    width: "100%",
    transition: "border-color .15s, box-shadow .15s",
  };

  const onFocus = e => { e.target.style.borderColor = "#F47920"; e.target.style.boxShadow = "0 0 0 3px rgba(244,121,32,0.12)"; };
  const onBlur  = e => { e.target.style.borderColor = inputBorder; e.target.style.boxShadow = "none"; };

  // ── sub-componentes ───────────────────────────────────────
  const SectionHeader = ({ title }) => (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-0.5 h-4 rounded-full flex-shrink-0" style={{ background:"#F47920" }}/>
      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color:dividerText }}>{title}</span>
      <div className="flex-1 h-px" style={{ background:dividerLine }}/>
    </div>
  );

  const Label = ({ children, required }) => (
    <label className="block text-xs font-bold mb-1.5" style={{ color: isDark ? "rgba(255,255,255,0.65)" : T.text }}>
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );

  const Err = ({ campo }) => errores[campo]
    ? <p className="text-[11px] mt-1 font-semibold flex items-center gap-1" style={{ color:"#ef4444" }}>⚠ {errores[campo]}</p>
    : null;

  return (
    <div className="h-full overflow-y-auto relative p-4 md:p-6"
      style={{ background:T.bg }}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragEnter={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false); }}
      onDrop={handleDrop}>

      {/* Overlay drag */}
      {dragging && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 pointer-events-none"
          style={{ background:"rgba(244,121,32,0.07)", border:"3px dashed #F47920" }}>
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            <path d="M26 8v24M14 20l12-12 12 12" stroke="#F47920" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 40v3a3 3 0 003 3h34a3 3 0 003-3v-3" stroke="#F47920" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          <p className="text-xl font-black" style={{ color:"#F47920" }}>Suelta las imágenes</p>
          <p className="text-sm" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#64748b" }}>Se agregarán a Evidencias fotográficas</p>
        </div>
      )}

      {/* ── Tarjeta ── */}
      <div className="max-w-5xl mx-auto rounded-2xl overflow-hidden" style={card}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5"
          style={{ background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt, borderBottom:`1px solid ${dividerLine}` }}>
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-4 rounded-full" style={{ background:"#F47920" }}/>
            <div>
              <p className="text-sm font-black" style={{ color:textColor }}>Formulario de Incidencias</p>
              <p className="text-[11px]" style={{ color:dividerText }}>Completa todos los campos obligatorios</p>
            </div>
          </div>
          <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full"
            style={{ background:`rgba(244,121,32,0.10)`, color:T.orange, border:`1px solid rgba(244,121,32,0.25)` }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background:T.orange }}/>
            Nuevo ticket
          </span>
        </div>

        <div className="p-5 md:p-7 flex flex-col gap-6">

          {/* ── Grid 2 columnas ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Col izquierda */}
            <div className="flex flex-col gap-5">
              <SectionHeader title="Información general"/>

              <div>
                <Label required>Título del problema</Label>
                <input
                  style={{ ...inputStyle, borderColor: errores.titulo ? "#ef4444" : inputBorder }}
                  placeholder="Ej. Falla en impresora de recepción"
                  value={form.titulo} onChange={e => set("titulo", e.target.value)}
                  onFocus={onFocus} onBlur={onBlur}/>
                <Err campo="titulo"/>
              </div>

              <div>
                <Label required>Descripción detallada</Label>

                {/* Contenedor editor */}
                <div style={{
                  border: `1.5px solid ${errores.descripcion ? "#ef4444" : inputBorder}`,
                  borderRadius: "12px",
                  overflow: "hidden",
                  background: inputBg,
                  transition: "border-color .15s, box-shadow .15s",
                }}>

                  {/* ── Barra de herramientas ── */}
                  <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5"
                    style={{ borderBottom:`1px solid ${dividerLine}`, background: isDark ? "rgba(255,255,255,0.04)" : T.surfaceAlt }}>

                    {/* Grupo formato */}
                    {[
                      { cmd:"bold",          Icon:Bold,          title:"Negrita (Ctrl+B)"    },
                      { cmd:"italic",        Icon:Italic,        title:"Cursiva (Ctrl+I)"    },
                      { cmd:"underline",     Icon:Underline,     title:"Subrayado (Ctrl+U)"  },
                      { cmd:"strikeThrough", Icon:Strikethrough, title:"Tachado"             },
                    ].map(({ cmd, Icon, title }) => (
                      <ToolBtn key={cmd} title={title} onClick={() => fmt(cmd)} isDark={isDark} T={T} dividerLine={dividerLine}>
                        <Icon size={13}/>
                      </ToolBtn>
                    ))}

                    <Divider dividerLine={dividerLine}/>

                    {/* Listas */}
                    {[
                      { cmd:"insertUnorderedList", Icon:List,         title:"Lista con viñetas" },
                      { cmd:"insertOrderedList",   Icon:ListOrdered,  title:"Lista numerada"   },
                    ].map(({ cmd, Icon, title }) => (
                      <ToolBtn key={cmd} title={title} onClick={() => fmt(cmd)} isDark={isDark} T={T} dividerLine={dividerLine}>
                        <Icon size={13}/>
                      </ToolBtn>
                    ))}

                    <Divider dividerLine={dividerLine}/>

                    {/* Alineación */}
                    {[
                      { cmd:"justifyLeft",   Icon:AlignLeft,   title:"Alinear izquierda" },
                      { cmd:"justifyCenter", Icon:AlignCenter, title:"Centrar"           },
                      { cmd:"justifyRight",  Icon:AlignRight,  title:"Alinear derecha"   },
                    ].map(({ cmd, Icon, title }) => (
                      <ToolBtn key={cmd} title={title} onClick={() => fmt(cmd)} isDark={isDark} T={T} dividerLine={dividerLine}>
                        <Icon size={13}/>
                      </ToolBtn>
                    ))}

                    <Divider dividerLine={dividerLine}/>

                    {/* Línea horizontal */}
                    <ToolBtn title="Línea separadora" onClick={() => fmt("insertHorizontalRule")} isDark={isDark} T={T} dividerLine={dividerLine}>
                      <Minus size={13}/>
                    </ToolBtn>

                    {/* Limpiar formato */}
                    <ToolBtn title="Quitar formato" onClick={() => fmt("removeFormat")} isDark={isDark} T={T} dividerLine={dividerLine}>
                      <span className="text-[10px] font-black">Aa</span>
                    </ToolBtn>
                  </div>

                  {/* ── Área editable ── */}
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={onEditorInput}
                    onFocus={e => {
                      e.currentTarget.parentElement.style.borderColor = "#F47920";
                      e.currentTarget.parentElement.style.boxShadow   = "0 0 0 3px rgba(244,121,32,0.12)";
                      quitarError("descripcion");
                    }}
                    onBlur={e => {
                      e.currentTarget.parentElement.style.borderColor = errores.descripcion ? "#ef4444" : inputBorder;
                      e.currentTarget.parentElement.style.boxShadow   = "none";
                    }}
                    className="outline-none px-3.5 py-3 text-sm leading-relaxed"
                    style={{
                      minHeight: "160px",
                      color: textColor,
                      background: "transparent",
                    }}
                    data-placeholder="Describe el problema con el mayor detalle posible: cuándo ocurrió, qué estabas haciendo, mensajes de error, etc."
                  />
                </div>

                <style>{`
                  [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: ${iconColor};
                    pointer-events: none;
                  }
                  [contenteditable] ul { list-style: disc; padding-left: 1.25rem; }
                  [contenteditable] ol { list-style: decimal; padding-left: 1.25rem; }
                  [contenteditable] hr { border: none; border-top: 1px solid ${dividerLine}; margin: 6px 0; }
                `}</style>

                {/* Contador de palabras */}
                <div className="flex items-center justify-between mt-1.5">
                  <Err campo="descripcion"/>
                  <span className="ml-auto text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                    style={{
                      background: form.palabras >= MAX_PALABRAS ? "#fee2e2"
                        : form.palabras >= 450 ? "#fef9c3"
                        : isDark ? "rgba(255,255,255,0.06)" : T.bg,
                      color: form.palabras >= MAX_PALABRAS ? "#dc2626"
                        : form.palabras >= 450 ? "#ca8a04"
                        : T.textMuted,
                      border: `1px solid ${
                        form.palabras >= MAX_PALABRAS ? "#fca5a5"
                        : form.palabras >= 450 ? "#fde047"
                        : dividerLine}`,
                    }}>
                    {form.palabras} / {MAX_PALABRAS} palabras
                  </span>
                </div>
              </div>
            </div>

            {/* Col derecha */}
            <div className="flex flex-col gap-5">
              <SectionHeader title="Clasificación"/>

              {/* Prioridad */}
              <div>
                <Label required>Nivel de prioridad</Label>
                <div className="grid grid-cols-4 gap-2">
                  {PRIORIDADES.map(p => {
                    const sel = form.prioridad === p.nivel;
                    return (
                      <button key={p.nivel} type="button" onClick={() => set("prioridad", p.nivel)}
                        className="flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-xl text-xs font-bold transition-all select-none"
                        style={{
                          background: sel ? (isDark ? p.bgD : p.bgL) : inputBg,
                          border:    `1.5px solid ${sel ? (isDark ? p.borderD : p.borderL) : errores.prioridad ? "#ef4444" : inputBorder}`,
                          color:      sel ? p.color : dividerText,
                          boxShadow:  sel ? `0 4px 14px ${p.color}40` : "none",
                          transform:  sel ? "translateY(-2px)" : "none",
                        }}>
                        <span className="w-3 h-3 rounded-full"
                          style={{ background:p.color, boxShadow:sel ? `0 0 8px ${p.color}90` : "none" }}/>
                        {p.label}
                        {sel && <span className="text-[10px] leading-none">✓</span>}
                      </button>
                    );
                  })}
                </div>
                <Err campo="prioridad"/>
              </div>

              {/* Categoría */}
              <div className="relative">
                <Label required>Categoría</Label>
                <button type="button"
                  onClick={() => { setCatOpen(o => !o); quitarError("categoria"); }}
                  onBlur={() => setTimeout(() => setCatOpen(false), 120)}
                  className="w-full flex items-center justify-between gap-2 transition-all"
                  style={{
                    ...inputStyle,
                    border: `1.5px solid ${catOpen ? "#F47920" : errores.categoria ? "#ef4444" : inputBorder}`,
                    color: catSel ? textColor : dividerText,
                    boxShadow: catOpen ? "0 0 0 3px rgba(244,121,32,0.12)" : "none",
                    cursor: "pointer",
                  }}>
                  <span className="flex items-center gap-2.5 font-medium text-sm">
                    {catSel
                      ? <><span className="text-base">{catSel.icono}</span><span>{catSel.label}</span></>
                      : <span>Selecciona una categoría</span>
                    }
                  </span>
                  <svg width="12" height="12" viewBox="0 0 13 13" fill="none"
                    style={{ flexShrink:0, transition:"transform .2s", transform:catOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                    <path d="M2.5 4.5l4 4 4-4" stroke="#F47920" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {catOpen && (
                  <div className="absolute z-30 left-0 right-0 mt-1.5 rounded-xl overflow-hidden"
                    style={{
                      background: isDark ? "#1a1f2e" : T.surface,
                      border: `1.5px solid ${isDark ? "rgba(255,255,255,0.12)" : T.border}`,
                      boxShadow: isDark ? "0 16px 48px rgba(0,0,0,0.7)" : "0 8px 28px rgba(0,0,0,0.14)",
                    }}>
                    {CATEGORIAS.map((c, idx) => {
                      const sel = form.categoria === c.valor;
                      return (
                        <button key={c.valor} type="button"
                          onMouseDown={() => { set("categoria", c.valor); setCatOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all text-left"
                          style={{
                            background: sel ? "rgba(244,121,32,0.12)" : "transparent",
                            color: sel ? "#F47920" : isDark ? "rgba(255,255,255,0.8)" : T.text,
                            borderTop: idx === 0 ? "none" : `1px solid ${isDark ? "rgba(255,255,255,0.06)" : T.border}`,
                          }}
                          onMouseEnter={e => { if (!sel) e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : T.surfaceAlt; }}
                          onMouseLeave={e => { if (!sel) e.currentTarget.style.background = "transparent"; }}>
                          <span className="text-base w-5 text-center flex-shrink-0">{c.icono}</span>
                          <span className="flex-1">{c.label}</span>
                          {sel && (
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                              <path d="M2 6.5l3.5 3.5 5.5-6" stroke="#F47920" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                <Err campo="categoria"/>
              </div>

              {/* Solicitante + Área */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Solicitante</Label>
                  <input readOnly value={solicitante}
                    style={{ ...inputStyle, opacity:.6, cursor:"default", background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt }}/>
                </div>
                <div>
                  <Label>Área</Label>
                  <input readOnly value={area}
                    style={{ ...inputStyle, opacity:.6, cursor:"default", background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt }}/>
                </div>
              </div>
            </div>
          </div>

          {/* ── Evidencias ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-0.5 h-4 rounded-full flex-shrink-0" style={{ background:"#F47920" }}/>
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color:dividerText }}>
                Evidencias fotográficas
              </span>
              <div className="flex-1 h-px" style={{ background:dividerLine }}/>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                style={{ background: isDark ? "rgba(255,255,255,0.06)" : T.bg, color:dividerText, border:`1px solid ${dividerLine}` }}>
                {form.evidencias.length}/{MAX_IMGS}
              </span>
            </div>

            <div className="grid gap-3" style={{ gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))" }}>
              {slots.map((img, i) =>
                img === null ? (
                  <label key="add"
                    className="aspect-square rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                    style={{ border:`2px dashed ${inputBorder}`, background:inputBg }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor="#F47920"; e.currentTarget.style.background="rgba(244,121,32,0.07)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor=inputBorder; e.currentTarget.style.background=inputBg; }}>
                    <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                      onChange={e => { agregarImgs(e.target.files); e.target.value=""; }}/>
                    {form.evidencias.length === 0
                      ? <><Camera size={26} style={{ color:iconColor }}/><span className="text-xs" style={{ color:iconColor }}>Agregar foto</span></>
                      : <><Plus size={22} style={{ color:iconColor }}/><span className="text-xs" style={{ color:iconColor }}>Agregar</span></>
                    }
                  </label>
                ) : (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="aspect-square rounded-xl overflow-hidden relative group"
                      style={{ border:`1.5px solid ${isDark ? "rgba(255,255,255,0.12)" : T.border}`, boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.5)" : "0 2px 8px rgba(0,0,0,0.08)" }}>
                      <img src={img.src} alt={img.name} className="w-full h-full object-cover"/>
                      <div className="absolute inset-0 items-center justify-center gap-2 hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background:"rgba(0,0,0,0.6)" }}>
                        <button type="button" onClick={() => setVisor(i)}
                          className="w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-all"
                          style={{ background:"rgba(255,255,255,0.2)", color:"#fff" }}>
                          <ZoomIn size={16}/>
                        </button>
                        <button type="button" onClick={() => borrarImg(i)}
                          className="w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-all"
                          style={{ background:"rgba(220,38,38,0.8)", color:"#fff" }}>
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-1.5 md:hidden">
                      <button type="button" onClick={() => setVisor(i)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold"
                        style={{ background:inputBg, border:`1px solid ${inputBorder}`, color:dividerText }}>
                        <ZoomIn size={12}/> Ver
                      </button>
                      <button type="button" onClick={() => borrarImg(i)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold"
                        style={{ background: isDark ? "rgba(220,38,38,0.15)" : "#fee2e2", border:`1px solid ${isDark ? "rgba(220,38,38,0.3)" : "#fca5a5"}`, color:"#ef4444" }}>
                        <Trash2 size={12}/> Borrar
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
            <p className="text-[11px] mt-2" style={{ color:iconColor }}>
              Arrastra imágenes desde tu computadora a cualquier parte de la página · Máx. {MAX_IMGS} fotos
            </p>
          </div>

          {/* ── Botones ── */}
          <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 pt-4"
            style={{ borderTop:`1px solid ${dividerLine}` }}>
            <p className="text-xs" style={{ color:iconColor }}>
              <span className="text-red-400 font-bold">*</span> Campos obligatorios
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-2.5 w-full sm:w-auto">
              <button type="button" onClick={limpiar}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95"
                style={{ background:"#3b82f6", boxShadow:"0 3px 10px rgba(59,130,246,0.35)" }}>
                Limpiar Campos
              </button>
              <button type="button" onClick={handleSubir}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95"
                style={{ background:`linear-gradient(135deg,${T.orange},#d97400)`, boxShadow:"0 4px 14px rgba(244,121,32,0.45)" }}>
                Subir Reporte
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── Visor modal ── */}
      {visor !== null && form.evidencias[visor] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background:"rgba(0,0,0,0.92)" }}
          onClick={() => setVisor(null)}>
          <div className="relative w-full max-w-4xl mx-4 sm:mx-10 flex flex-col items-center gap-4"
            onClick={e => e.stopPropagation()}>
            <img src={form.evidencias[visor].src} alt=""
              className="rounded-2xl object-contain w-full"
              style={{ maxHeight:"74vh", boxShadow:"0 12px 48px rgba(0,0,0,0.7)" }}/>
            <p className="text-xs truncate max-w-xs" style={{ color:"rgba(255,255,255,0.45)" }}>
              {form.evidencias[visor].name}
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setVisor(i => Math.max(0, i-1))} disabled={visor === 0}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-25 hover:scale-110"
                style={{ background:"rgba(255,255,255,0.15)", color:"#fff" }}>
                <ChevronLeft size={20}/>
              </button>
              <span className="text-sm font-bold text-white">{visor+1} / {form.evidencias.length}</span>
              <button onClick={() => setVisor(i => Math.min(form.evidencias.length-1, i+1))} disabled={visor === form.evidencias.length-1}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-25 hover:scale-110"
                style={{ background:"rgba(255,255,255,0.15)", color:"#fff" }}>
                <ChevronRight size={20}/>
              </button>
            </div>
            <button onClick={() => borrarImg(visor)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all hover:brightness-110 active:scale-95"
              style={{ background:"rgba(220,38,38,0.85)", color:"#fff" }}>
              <Trash2 size={14}/> Eliminar foto
            </button>
          </div>
          <button onClick={() => setVisor(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-all"
            style={{ background:"rgba(255,255,255,0.12)", color:"#fff" }}>
            <X size={18}/>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Botón de herramienta ─────────────────────────────────────
function ToolBtn({ children, onClick, title, isDark, T, dividerLine }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className="flex items-center justify-center w-7 h-7 rounded-lg transition-all hover:brightness-110 active:scale-95"
      style={{
        color: isDark ? "rgba(255,255,255,0.6)" : T.textMuted,
        background: "transparent",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : T.border;
        e.currentTarget.style.color = isDark ? "#fff" : T.text;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.6)" : T.textMuted;
      }}>
      {children}
    </button>
  );
}

// ── Separador vertical de toolbar ────────────────────────────
function Divider({ dividerLine }) {
  return <div className="w-px h-4 mx-0.5" style={{ background: dividerLine }}/>;
}
