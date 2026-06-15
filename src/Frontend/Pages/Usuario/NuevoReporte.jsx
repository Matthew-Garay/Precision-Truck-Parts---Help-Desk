import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Camera, Plus, X, ChevronLeft, ChevronRight, Trash2,
  Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Minus } from "lucide-react";
import { apiFetch } from "../../Config/api";

const PRIORIDADES = [
  { label:"Urgente", nivel:"Urgente", color:"#dc2626", bgL:"#fee2e2", bgD:"#2d0a0a" },
  { label:"Alta",    nivel:"Alta",    color:"#ea580c", bgL:"#ffedd5", bgD:"#2d1200" },
  { label:"Media",   nivel:"Media",   color:"#ca8a04", bgL:"#fef9c3", bgD:"#1f1a00" },
  { label:"Bajo",    nivel:"Bajo",    color:"#16a34a", bgL:"#dcfce7", bgD:"#0a2d14" },
];

const MAX_IMGS = 8;
const MAX_PALABRAS = 500;
const EMPTY = { titulo:"", descripcion:"", palabras:0, prioridad:"", categoria:"", evidencias:[], tvId:"", tvPass:"" };
const contarPalabras = t => t.trim() ? t.trim().split(/\s+/).length : 0;

export default function NuevoReporte({ T, solicitante, area = "-", usuario = {}, onSuccess }) {
  const nombreCompleto = [usuario.nombre, usuario.ap_paterno, usuario.ap_materno].filter(Boolean).join(" ") || solicitante || "-";
  const [form,       setForm]       = useState(EMPTY);
  const [visor,      setVisor]      = useState(null);
  const [catOpen,    setCatOpen]    = useState(false);
  const [errores,    setErrores]    = useState({});
  const [dragging,   setDragging]   = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [modal,      setModal]      = useState(null);
  const [enviando,   setEnviando]   = useState(false);
  const [modalLimpiar, setModalLimpiar] = useState(false);
  const fileRef  = useRef();
  const editorRef = useRef(null);
  const location  = useLocation();

  // Precargar imágenes arrastradas desde otras páginas (ej. Manuales)
  useEffect(() => {
    const previas = location.state?.evidencias;
    if (Array.isArray(previas) && previas.length) {
      setForm(f => ({ ...f, evidencias: previas.slice(0, MAX_IMGS) }));
      window.history.replaceState({}, "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    apiFetch(`/api/categorias`)
      .then(r => r.json())
      .then(data => setCategorias(
        Array.isArray(data) ? data.map(c => ({ id: c.id_categoria, valor: c.nombre_categoria, label: c.nombre_categoria })) : []
      ))
      .catch(() => setCategorias([]));
  }, []);

  const isDark = T.isDark;
  const catSel      = categorias.find(c => c.valor === form.categoria);
  const inputBg     = isDark ? "rgba(255,255,255,0.05)" : T.surfaceAlt;
  const inputBorder = isDark ? "rgba(255,255,255,0.12)" : T.border;
  const dividerLine = isDark ? "rgba(255,255,255,0.08)" : T.border;
  const dividerText = isDark ? "rgba(255,255,255,0.45)" : T.textMuted;
  const iconColor   = isDark ? "rgba(255,255,255,0.22)" : T.textFaint;
  const textColor   = isDark ? "#e2e8f0" : T.text;

  const quitarError = k => setErrores(p => { const n = {...p}; delete n[k]; return n; });
  const set = (k, v) => { setForm(f => ({...f, [k]:v})); quitarError(k); };

  // Helper: obtiene o crea un elemento de bloque (p/div) que contiene el rango actual
  const getOrCreateBlock = (range) => {
    let node = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    while (node && node !== editorRef.current) {
      if (["P", "DIV", "LI"].includes(node.tagName)) return node;
      node = node.parentElement;
    }
    // Si no hay bloque, envuelve el contenido en un <p>
    const p = document.createElement("p");
    range.surroundContents(p);
    return p;
  };
  const limpiar = () => {
    setForm(EMPTY);
    setErrores({});
    setModalLimpiar(false);
    if (editorRef.current) editorRef.current.innerHTML = "";
  };

  const fmt = useCallback((cmd) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    // execCommand está deprecado — usamos Selection API con fallback
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    if (cmd === "insertHorizontalRule") {
      const hr = document.createElement("hr");
      range.deleteContents();
      range.insertNode(hr);
      range.setStartAfter(hr);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }

    if (cmd === "removeFormat") {
      // Desenvuelve todos los elementos de formato dentro del rango
      const fragment = range.extractContents();
      const text = document.createTextNode(fragment.textContent ?? "");
      range.insertNode(text);
      range.selectNodeContents(text);
      sel.removeAllRanges();
      sel.addRange(range);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }

    // Comandos de formato inline: bold, italic, underline, strikeThrough
    const TAG_MAP = {
      bold:          "strong",
      italic:        "em",
      underline:     "u",
      strikeThrough: "s",
    };
    // Comandos de bloque: listas y alineación
    const BLOCK_MAP = {
      insertUnorderedList: () => {
        const ul = document.createElement("ul");
        const li = document.createElement("li");
        li.appendChild(range.extractContents());
        ul.appendChild(li);
        range.insertNode(ul);
        range.selectNodeContents(li);
        range.collapse(false);
      },
      insertOrderedList: () => {
        const ol = document.createElement("ol");
        const li = document.createElement("li");
        li.appendChild(range.extractContents());
        ol.appendChild(li);
        range.insertNode(ol);
        range.selectNodeContents(li);
        range.collapse(false);
      },
      justifyLeft:   () => { const b = getOrCreateBlock(range); if (b) b.style.textAlign = "left";   },
      justifyCenter: () => { const b = getOrCreateBlock(range); if (b) b.style.textAlign = "center"; },
      justifyRight:  () => { const b = getOrCreateBlock(range); if (b) b.style.textAlign = "right";  },
    };

    if (BLOCK_MAP[cmd]) {
      BLOCK_MAP[cmd]();
      sel.removeAllRanges();
      sel.addRange(range);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }

    const tag = TAG_MAP[cmd];
    if (!tag) return;
    const wrapper = document.createElement(tag);
    wrapper.appendChild(range.extractContents());
    range.insertNode(wrapper);
    range.selectNodeContents(wrapper);
    sel.removeAllRanges();
    sel.addRange(range);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, []);

  const onEditorInput = () => {
    const texto  = editorRef.current?.innerText || "";
    const html   = editorRef.current?.innerHTML  || "";
    const palabras = contarPalabras(texto);
    if (palabras > MAX_PALABRAS) {
      editorRef.current.innerHTML = form.descripcion || "";
      const range = document.createRange();
      const sel   = window.getSelection();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
    setForm(f => ({ ...f, descripcion: texto.trim() ? html : "", palabras: contarPalabras(texto) }));
    quitarError("descripcion");
  };

  const handleSubir = async () => {
    const e = {};
    const textoPlano = editorRef.current?.innerText?.trim() || "";
    if (!form.titulo.trim())  e.titulo      = "El título es requerido";
    if (!textoPlano)          e.descripcion = "La descripción es requerida";
    if (!form.prioridad)      e.prioridad   = "Selecciona una prioridad";
    if (!form.categoria)      e.categoria   = "Selecciona una categoría";
    if (Object.keys(e).length) { setErrores(e); return; }

    const catObj = categorias.find(c => c.valor === form.categoria);
    if (!catObj) { setErrores(e => ({ ...e, categoria: "Categoría no válida" })); return; }
    if (!usuario?.id_empleado) { setModal({ ok: false, titulo: "Error de sesión", msg: "No se pudo identificar al usuario. Recarga la página." }); return; }
    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append("titulo",       form.titulo.trim());
      const tvBlock = (form.tvId || form.tvPass)
        ? `<hr/><p><strong>TeamViewer ID:</strong> ${form.tvId}</p><p><strong>CONTRASEÑA:</strong> ${form.tvPass}</p>`
        : "";
      formData.append("descripcion",  form.descripcion + tvBlock);
      formData.append("prioridad",    form.prioridad);
      formData.append("id_empleado",  usuario.id_empleado);
      formData.append("id_categoria", catObj.id);

      for (const ev of form.evidencias) {
        formData.append("evidencias", ev.file, ev.name);
      }

      const res  = await apiFetch(`/api/tickets`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setModal({ ok: false, titulo: "Error al enviar", msg: data.error ?? JSON.stringify(data) }); return; }
      setModal({ ok: true, titulo: "Reporte enviado", folio: data.folio_ticket, prioridad: form.prioridad, categoria: catObj.label });
      limpiar();
      setTimeout(() => { onSuccess?.(); }, 1800);
    } catch (err) {
      console.error("[NuevoReporte] Error al enviar:", err);
      setModal({ ok: false, titulo: "Sin conexión", msg: err?.message || "No se pudo conectar con el servidor" });
    } finally {
      setEnviando(false);
    }
  };

  const agregarImgs = files => {
    const libres = MAX_IMGS - form.evidencias.length;
    // Guardar el File original + URL de previsualización - sin doble conversión base64
    Array.from(files).slice(0, libres).forEach(file => {
      const src = URL.createObjectURL(file);
      setForm(f => ({ ...f, evidencias: [...f.evidencias, { src, name: file.name, file }] }));
    });
  };

  const handleDrop = e => {
    e.preventDefault(); setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (files.length) agregarImgs(files);
  };

  const borrarImg = i => {
    const evs = form.evidencias.filter((_, idx) => idx !== i);
    // Liberar la URL de objeto para evitar memory leaks
    URL.revokeObjectURL(form.evidencias[i].src);
    setForm(f => ({...f, evidencias:evs}));
    if (visor !== null) setVisor(evs.length === 0 ? null : Math.min(i, evs.length - 1));
  };

  const slots = [...form.evidencias];
  if (slots.length < MAX_IMGS) slots.push(null);

  const card = {
    background: isDark ? "#141720" : T.surface,
    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb"}`,
  };

  const inputStyle = {
    background: isDark ? "rgba(255,255,255,0.05)" : "#fff",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "#d1d5db"}`,
    color: textColor,
    borderRadius: "2px",
    fontSize: "12px",
    padding: "6px 10px",
    outline: "none",
    width: "100%",
    transition: "border-color .15s, box-shadow .15s",
  };

  const onFocus = e => { e.target.style.borderColor = "#FF6600"; e.target.style.boxShadow = "0 0 0 2px rgba(255,102,0,0.1)"; };
  const onBlur  = e => { e.target.style.borderColor = isDark ? "rgba(255,255,255,0.15)" : "#d1d5db"; e.target.style.boxShadow = "none"; };

  const SectionHeader = ({ title }) => (
    <div className="flex items-center gap-2 mb-1.5">
      <div className="w-0.5 h-4 rounded-full flex-shrink-0" style={{ background:"#F47920" }}/>
      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color:dividerText }}>{title}</span>
      <div className="flex-1 h-px" style={{ background:dividerLine }}/>
    </div>
  );

  const Label = ({ children, required }) => (
    <label className="block text-xs font-semibold mb-1" style={{ color: isDark ? "rgba(255,255,255,0.75)" : T.text }}>
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );

  const Err = ({ campo }) => errores[campo]
    ? <p className="text-[11px] mt-1 font-semibold flex items-center gap-1" style={{ color:"#ef4444" }}>⚠ {errores[campo]}</p>
    : null;

  return (
    <div className="h-full overflow-y-auto p-2 md:p-4"
      style={{ background:T.bg }}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragEnter={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false); }}
      onDrop={handleDrop}>

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

      <div className="max-w-2xl mx-auto rounded-sm p-3" style={card}>
        {/* Header */}
        <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4"
          style={{ background: isDark ? "rgba(59,130,246,0.12)" : "#eff6ff", borderBottom:`1px solid ${isDark ? "rgba(59,130,246,0.2)" : "#bfdbfe"}` }}>
          <img src={isDark ? "/assets/img/logo blanco.png" : "/assets/img/logo negro.png"} alt="Logo" className="object-contain flex-shrink-0" style={{ width:"40px", height:"40px" }}/>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-black tracking-tight" style={{ color: isDark ? "#93c5fd" : "#1d4ed8" }}>FORMULARIO DE INCIDENCIAS</p>
            <p className="text-[10px] font-medium mt-0.5 hidden sm:block" style={{ color: isDark ? "rgba(147,197,253,0.6)" : "#3b82f6" }}>Completa el formulario para habilitar el envío.</p>
          </div>
        </div>

        <div className="flex flex-col gap-0">

          {/* ── SECCIÓN 1: Información del Solicitante ── */}
          <div className="flex flex-col gap-2 py-3">
            <SectionHeader title="Información del Solicitante" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="col-span-2 md:col-span-1">
                <Label>Solicitante</Label>
                <input readOnly value={nombreCompleto}
                  style={{ ...inputStyle, opacity:.6, cursor:"default", background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt }}/>
              </div>
              <div>
                <Label>Área</Label>
                <input readOnly value={area}
                  style={{ ...inputStyle, opacity:.6, cursor:"default", background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt }}/>
              </div>
              <div>
                <Label>Fecha y hora</Label>
                <input readOnly value={new Date().toLocaleString("es-MX", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                  style={{ ...inputStyle, opacity:.6, cursor:"default", background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt }}/>
              </div>
            </div>
          </div>

          <hr style={{ border:"none", borderTop:`1px solid ${dividerLine}`, margin:0 }}/>

          {/* ── SECCIÓN 2: Detalles de la Falla ── */}
          <div className="flex flex-col gap-2 py-3">
            <SectionHeader title="Detalles de la Falla" />

            {/* Título */}
            <div>
              <Label required>Título del problema</Label>
              <input
                style={{ ...inputStyle, borderColor: errores.titulo ? "#ef4444" : inputBorder }}
                placeholder="Ej. Falla en impresora de recepción"
                value={form.titulo} onChange={e => set("titulo", e.target.value)}
                onFocus={onFocus} onBlur={onBlur}/>
              <Err campo="titulo"/>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

              {/* Prioridad */}
              <div>
                <Label required>Nivel de prioridad</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {PRIORIDADES.map(p => {
                    const sel = form.prioridad === p.nivel;
                    return (
                      <button key={p.nivel} type="button" onClick={() => set("prioridad", p.nivel)}
                        className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-[11px] font-bold transition-all select-none"
                        style={{
                          background: sel ? (isDark ? p.bgD : p.bgL) : inputBg,
                          border:    `2.5px solid ${sel ? p.color : errores.prioridad ? "#ef4444" : inputBorder}`,
                          color:      sel ? p.color : dividerText,
                          boxShadow:  sel ? `0 0 0 3px ${p.color}20, 0 4px 14px ${p.color}40` : "none",
                          transform:  sel ? "translateY(-2px) scale(1.02)" : "none",
                        }}>
                        <span className="w-3 h-3 rounded-full"
                          style={{ background:p.color, boxShadow:sel ? `0 0 12px ${p.color}90` : "none" }}/>
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
                    border: `1px solid ${catOpen ? "#FF6600" : errores.categoria ? "#ef4444" : isDark ? "rgba(255,255,255,0.15)" : "#d1d5db"}`,
                    color: catSel ? textColor : dividerText,
                    boxShadow: catOpen ? "0 0 0 2px rgba(255,102,0,0.1)" : "none",
                    cursor: "pointer",
                  }}>
                  <span className="flex items-center gap-2.5 font-medium text-sm">
                    {catSel ? catSel.label : "Selecciona una categoría"}
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
                    {categorias.map((c, idx) => {
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
            </div>
          </div>

          <hr style={{ border:"none", borderTop:`1px solid ${dividerLine}`, margin:0 }}/>

          {/* ── SECCIÓN 3: Descripción & Evidencias ── */}
          <div className="flex flex-col gap-2 py-3">
            <SectionHeader title="Descripción y Evidencias" />

            <div>
              <Label required>Descripción detallada</Label>
                <div style={{
                  border: `1px solid ${errores.descripcion ? "#ef4444" : isDark ? "rgba(255,255,255,0.15)" : "#d1d5db"}`,
                  borderRadius: "2px", overflow: "hidden", background: isDark ? "rgba(255,255,255,0.05)" : "#fff",
                  transition: "border-color .15s, box-shadow .15s",
                }}>
                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5"
                    style={{ borderBottom:`1px solid ${dividerLine}`, background: isDark ? "rgba(255,255,255,0.04)" : T.surfaceAlt }}>
                    {[
                      { cmd:"bold",          Icon:Bold,          title:"Negrita (Ctrl+B)"   },
                      { cmd:"italic",        Icon:Italic,        title:"Cursiva (Ctrl+I)"   },
                      { cmd:"underline",     Icon:Underline,     title:"Subrayado (Ctrl+U)" },
                      { cmd:"strikeThrough", Icon:Strikethrough, title:"Tachado"            },
                    ].map(({ cmd, Icon, title }) => (
                      <ToolBtn key={cmd} title={title} onClick={() => fmt(cmd)} isDark={isDark} T={T}>
                        <Icon size={13}/>
                      </ToolBtn>
                    ))}
                    <Divider dividerLine={dividerLine}/>
                    {[
                      { cmd:"insertUnorderedList", Icon:List,        title:"Lista con viñetas" },
                      { cmd:"insertOrderedList",   Icon:ListOrdered, title:"Lista numerada"    },
                    ].map(({ cmd, Icon, title }) => (
                      <ToolBtn key={cmd} title={title} onClick={() => fmt(cmd)} isDark={isDark} T={T}>
                        <Icon size={13}/>
                      </ToolBtn>
                    ))}
                    <Divider dividerLine={dividerLine}/>
                    {[
                      { cmd:"justifyLeft",   Icon:AlignLeft,   title:"Alinear izquierda" },
                      { cmd:"justifyCenter", Icon:AlignCenter, title:"Centrar"           },
                      { cmd:"justifyRight",  Icon:AlignRight,  title:"Alinear derecha"   },
                    ].map(({ cmd, Icon, title }) => (
                      <ToolBtn key={cmd} title={title} onClick={() => fmt(cmd)} isDark={isDark} T={T}>
                        <Icon size={13}/>
                      </ToolBtn>
                    ))}
                    <Divider dividerLine={dividerLine}/>
                    <ToolBtn title="Línea separadora" onClick={() => fmt("insertHorizontalRule")} isDark={isDark} T={T}>
                      <Minus size={13}/>
                    </ToolBtn>
                    <ToolBtn title="Quitar formato" onClick={() => fmt("removeFormat")} isDark={isDark} T={T}>
                      <span className="text-[10px] font-black">Aa</span>
                    </ToolBtn>
                  </div>

                  {/* Área editable */}
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onInput={onEditorInput}
                    onFocus={e => {
                      e.currentTarget.parentElement.style.borderColor = "#FF6600";
                      e.currentTarget.parentElement.style.boxShadow   = "0 0 0 2px rgba(255,102,0,0.1)";
                      quitarError("descripcion");
                    }}
                    onBlur={e => {
                      e.currentTarget.parentElement.style.borderColor = errores.descripcion ? "#ef4444" : isDark ? "rgba(255,255,255,0.15)" : "#d1d5db";
                      e.currentTarget.parentElement.style.boxShadow   = "none";
                    }}
                    className="outline-none px-3 py-2 text-xs leading-relaxed"
                    style={{ minHeight:"110px", color:textColor, background:"transparent" }}
                    data-placeholder="Describe el problema con el mayor detalle posible: cuándo ocurrió, qué estabas haciendo, mensajes de error, etc."
                    ref={el => { editorRef.current = el; }}
                  />
                </div>
                <style>{`
                  [contenteditable]:empty:before { content: attr(data-placeholder); color: ${iconColor}; pointer-events: none; }
                  [contenteditable] ul { list-style: disc; padding-left: 1.25rem; }
                  [contenteditable] ol { list-style: decimal; padding-left: 1.25rem; }
                  [contenteditable] hr { border: none; border-top: 1px solid ${dividerLine}; margin: 6px 0; }
                `}</style>
                <div className="flex items-center justify-between mt-1.5">
                  <Err campo="descripcion"/>
                  <span className="ml-auto text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                    style={{
                      background: form.palabras >= MAX_PALABRAS ? "#fee2e2" : form.palabras >= 450 ? "#fef9c3" : isDark ? "rgba(255,255,255,0.06)" : T.bg,
                      color:      form.palabras >= MAX_PALABRAS ? "#dc2626" : form.palabras >= 450 ? "#ca8a04" : T.textMuted,
                      border: `1px solid ${form.palabras >= MAX_PALABRAS ? "#fca5a5" : form.palabras >= 450 ? "#fde047" : dividerLine}`,
                    }}>
                    {form.palabras} / {MAX_PALABRAS} palabras
                  </span>
                </div>
            </div>

            {/* TeamViewer */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold" style={{ color: dividerText }}>TeamViewer <span style={{ fontWeight:400 }}>(opcional)</span></span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={form.tvId}
                  onChange={e => set("tvId", e.target.value)}
                  placeholder="TeamViewer ID"
                  style={{ ...inputStyle }}
                  onFocus={onFocus} onBlur={onBlur}
                />
                <input
                  value={form.tvPass}
                  onChange={e => set("tvPass", e.target.value)}
                  placeholder="Contraseña"
                  style={{ ...inputStyle }}
                  onFocus={onFocus} onBlur={onBlur}
                />
              </div>
            </div>

          {/* Evidencias */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Fotografías adjuntas</Label>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                style={{ background: isDark ? "rgba(255,255,255,0.06)" : T.bg, color:dividerText, border:`1px solid ${dividerLine}` }}>
                {form.evidencias.length}/{MAX_IMGS}
              </span>
            </div>
            <div className="grid gap-1.5" style={{ gridTemplateColumns:"repeat(auto-fill,minmax(72px,1fr))" }}>
              {slots.map((img, i) =>
                img === null ? (
                  <label key="add"
                    className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                    style={{ border:`2px dashed ${inputBorder}`, background: isDark ? "rgba(255,255,255,0.02)" : "rgba(244,121,32,0.02)" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor="#F47920"; e.currentTarget.style.background="rgba(244,121,32,0.06)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor=inputBorder; e.currentTarget.style.background= isDark ? "rgba(255,255,255,0.02)" : "rgba(244,121,32,0.02)"; }}>
                    <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                      onChange={e => { agregarImgs(e.target.files); e.target.value=""; }}/>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:"rgba(244,121,32,0.1)" }}>
                      {form.evidencias.length === 0 ? <Camera size={20} style={{ color:T.orange }}/> : <Plus size={18} style={{ color:T.orange }}/>}
                    </div>
                    <span className="text-[11px] font-semibold" style={{ color:T.orange }}>
                      {form.evidencias.length === 0 ? "Agregar foto" : "Agregar"}
                    </span>
                  </label>
                ) : (
                  <div key={i} className="relative group">
                    <div className="aspect-square rounded-xl overflow-hidden cursor-pointer"
                      style={{ border:`1.5px solid ${isDark ? "rgba(255,255,255,0.12)" : T.border}`, boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.5)" : "0 2px 8px rgba(0,0,0,0.08)" }}
                      onClick={() => setVisor(i)}>
                      <img src={img.src} alt={img.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"/>
                    </div>
                    {/* X de borrar siempre visible */}
                    <button type="button"
                      onClick={e => { e.stopPropagation(); borrarImg(i); }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                      style={{ background:"#dc2626", color:"#fff", boxShadow:"0 2px 6px rgba(220,38,38,0.5)", zIndex:10 }}>
                      <X size={10} strokeWidth={3}/>
                    </button>
                  </div>
                )
              )}
            </div>
            <p className="text-[11px] mt-2" style={{ color:iconColor }}>
              Arrastra imágenes desde tu computadora a cualquier parte de la página · Máx. {MAX_IMGS} fotos
            </p>
          </div>

          </div>{/* ── fin sección 3 ── */}

          {/* Botones */}
          <div className="flex flex-col gap-3 pt-3" style={{ borderTop:`1px solid ${dividerLine}` }}>
            <p className="text-[11px] text-center leading-relaxed" style={{ color: isDark ? "rgba(255,255,255,0.3)" : T.textFaint }}>
              Al enviar este reporte, el usuario autoriza al personal de soporte técnico a ejecutar los protocolos y medidas necesarias para la resolución efectiva de la incidencia.
            </p>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <p className="text-xs flex items-center gap-1" style={{ color:iconColor }}>
                <span className="text-red-400 font-bold">*</span> Campos obligatorios
              </p>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
                <button type="button" onClick={() => setModalLimpiar(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 rounded-sm text-sm font-semibold transition-all hover:brightness-95 active:scale-95"
                  style={{ background: isDark ? "rgba(255,255,255,0.06)" : "#f3f4f6", color: isDark ? "rgba(255,255,255,0.7)" : "#374151", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#d1d5db"}` }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Limpiar
                </button>
                <button type="button" onClick={handleSubir} disabled={enviando}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 rounded-sm text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: "#FF6600" }}>
                  {enviando ? (
                    <>
                      <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5v14M5 12l7-7 7 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Subir Reporte
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modal confirmación limpiar */}
      {modalLimpiar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background:"rgba(0,0,0,0.6)" }}
          onClick={() => setModalLimpiar(false)}>
          <div className="w-full max-w-xs rounded-2xl overflow-hidden"
            style={{ background: isDark?"#141720":T.surface, border:`1px solid ${isDark?"rgba(255,255,255,0.1)":T.border}`, boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}
            onClick={e => e.stopPropagation()}>
            <div className="h-1.5" style={{ background:"#3b82f6" }}/>
            <div className="p-6 flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: isDark?"rgba(59,130,246,0.2)":"#eff6ff" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-black" style={{ color:T.text }}>¿Limpiar formulario?</p>
                <p className="text-xs mt-1" style={{ color:T.textMuted }}>Se borrarán todos los campos y las imágenes adjuntas.</p>
              </div>
              <div className="flex gap-2 w-full">
                <button onClick={() => setModalLimpiar(false)}
                  className="flex-1 py-2 rounded-xl text-sm font-bold transition-all hover:brightness-110"
                  style={{ background: isDark?"rgba(255,255,255,0.06)":T.surfaceAlt, color:T.textMuted, border:`1px solid ${T.border}` }}>
                  Cancelar
                </button>
                <button onClick={limpiar}
                  className="flex-1 py-2 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95"
                  style={{ background:"#3b82f6" }}>
                  Sí, limpiar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmación */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background:"rgba(0,0,0,0.6)" }}
          onClick={() => setModal(null)}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: isDark?"#141720":T.surface, border:`1px solid ${isDark?"rgba(255,255,255,0.1)":T.border}`, boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}
            onClick={e => e.stopPropagation()}>
            <div className="h-1.5" style={{ background: modal.ok ? "#16a34a" : "#dc2626" }}/>
            <div className="p-6 flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: modal.ok ? (isDark?"rgba(22,163,74,0.2)":"#dcfce7") : (isDark?"rgba(220,38,38,0.2)":"#fee2e2") }}>
                {modal.ok
                  ? <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 8v4m0 4h.01" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round"/><circle cx="12" cy="12" r="9" stroke="#dc2626" strokeWidth="2"/></svg>
                }
              </div>
              <div className="w-full">
                <p className="text-base font-black" style={{ color:T.text }}>{modal.titulo}</p>
                {modal.ok
                  ? <div className="mt-3 flex flex-col gap-2.5 text-left">
                      <div className="h-1 rounded-full" style={{ background:"linear-gradient(90deg,#3b82f6,#60a5fa)", boxShadow:"0 2px 8px rgba(59,130,246,0.3)" }}/>
                      <span className="text-sm font-mono font-bold" style={{ color:T.orange }}>#{modal.folio}</span>
                      <div className="flex flex-col gap-1.5 text-xs border-t" style={{ borderColor:T.border, paddingTop:"12px" }}>
                        <div className="flex items-center justify-between">
                          <span style={{ color:T.textMuted }}>Prioridad:</span>
                          <span style={{ color: PRIORIDADES.find(p => p.nivel === modal.prioridad)?.color ?? T.text, fontWeight:600 }}>{modal.prioridad}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span style={{ color:T.textMuted }}>Estado:</span>
                          <span style={{ color:"#ca8a04", fontWeight:600 }}>En Proceso</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span style={{ color:T.textMuted }}>Categoría:</span>
                          <span style={{ color:T.text, fontWeight:600 }}>{modal.categoria}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span style={{ color:T.textMuted }}>Fecha:</span>
                          <span style={{ color:T.text, fontWeight:600 }}>{new Date().toLocaleDateString("es-MX")}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span style={{ color:T.textMuted }}>Hora:</span>
                          <span style={{ color:T.text, fontWeight:600 }}>{new Date().toLocaleTimeString("es-MX", { hour:"2-digit", minute:"2-digit" })}</span>
                        </div>
                      </div>
                    </div>
                  : <p className="text-sm mt-1" style={{ color:T.textMuted }}>{modal.msg}</p>
                }
              </div>
              <button onClick={() => setModal(null)}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95"
                style={{ background: modal.ok ? "#16a34a" : "#dc2626" }}>
                {modal.ok ? "Aceptar" : "Cerrar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visor modal */}
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

function ToolBtn({ children, onClick, title, isDark, T }) {
  return (
    <button type="button" title={title}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className="flex items-center justify-center w-7 h-7 rounded-lg transition-all hover:brightness-110 active:scale-95"
      style={{ color: isDark ? "rgba(255,255,255,0.6)" : T.textMuted, background:"transparent" }}
      onMouseEnter={e => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : T.border; e.currentTarget.style.color = isDark ? "#fff" : T.text; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.6)" : T.textMuted; }}>
      {children}
    </button>
  );
}

function Divider({ dividerLine }) {
  return <div className="w-px h-4 mx-0.5" style={{ background: dividerLine }}/>;
}

