import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Camera, X, ChevronLeft, ChevronRight, Trash2,
  Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Minus, ArrowRight, ArrowLeft, Send } from "lucide-react";
import { apiFetch } from "../../Config/api";
import Modal from "../../Components/Modal";

const PRIORIDADES = [
  { label:"Urgente", nivel:"Urgente", color:"#dc2626", bgL:"#fee2e2", bgD:"#2d0a0a" },
  { label:"Alta",    nivel:"Alta",    color:"#ea580c", bgL:"#ffedd5", bgD:"#2d1200" },
  { label:"Media",   nivel:"Media",   color:"#ca8a04", bgL:"#fef9c3", bgD:"#1f1a00" },
  { label:"Baja",    nivel:"Baja",    color:"#16a34a", bgL:"#dcfce7", bgD:"#0a2d14" },
];

const MAX_IMGS = 8;
const MAX_PALABRAS = 500;
const EMPTY = { titulo:"", descripcion:"", palabras:0, prioridad:"", categoria:"", evidencias:[], tvId:"", tvPass:"" };
const contarPalabras = t => t.trim() ? t.trim().split(/\s+/).length : 0;

const PASOS = [
  { num: 1, label: "¿Qué sucede?",   desc: "Datos básicos" },
  { num: 2, label: "Describe el error", desc: "Descripción" },
  { num: 3, label: "Evidencias",      desc: "Archivos adjuntos" },
];

const AYUDA = {
  titulo:      "Escribe un resumen breve del problema. Ej: 'No enciende la PC de caja 3'.",
  categoria:   "Selecciona el área o tipo de equipo que presenta la falla.",
  prioridad:   "Urgente: bloquea el trabajo por completo. Alta: afecta varias personas. Media: molestia menor. Baja: puede esperar.",
  descripcion: "Explica cuándo ocurrió, qué estabas haciendo y qué mensaje de error apareció. Entre más detalle, más rápido se resuelve.",
  evidencias:  "Adjunta fotos de la pantalla o del equipo dañado. Máximo 8 imágenes. No son obligatorias pero ayudan al técnico.",
};

function AyudaTooltip({ texto, isDark, children }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      style={{ cursor: "default" }}>
      {children}
      {visible && (
        <span
          className="absolute z-50 bottom-full left-0 mb-2 w-56 text-[11px] leading-relaxed rounded-xl px-3 py-2 shadow-xl pointer-events-none"
          style={{ background: isDark ? "#1e2330" : "#1e293b", color: "#f1f5f9", border: "1px solid rgba(255,255,255,0.1)", whiteSpace: "normal" }}>
          {texto}
          <span className="absolute top-full left-4 border-4 border-transparent" style={{ borderTopColor: isDark ? "#1e2330" : "#1e293b" }} />
        </span>
      )}
    </span>
  );
}

export default function NuevoReporte({ T, solicitante, area = "-", usuario = {}, onSuccess, onVerTicket }) {
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
  const [tvVisible,    setTvVisible]    = useState(false);
  const [paso,         setPaso]         = useState(1);
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
    apiFetch(`/api/categorias?tipo=ticket`)
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

  const limpiar = () => {
    setForm(EMPTY);
    setErrores({});
    setModalLimpiar(false);
    setTvVisible(false);
    setPaso(1);
    if (editorRef.current) editorRef.current.innerHTML = "";
  };

  const validarPaso = (p) => {
    const e = {};
    if (p === 1) {
      if (!form.titulo.trim()) e.titulo    = "El título es requerido";
      if (!form.prioridad)     e.prioridad = "Selecciona una prioridad";
      if (!form.categoria)     e.categoria = "Selecciona una categoría";
    }
    if (p === 2) {
      const textoPlano = editorRef.current?.innerText?.trim() || "";
      if (!textoPlano) e.descripcion = "La descripción es requerida";
    }
    return e;
  };

  const avanzar = () => {
    const e = validarPaso(paso);
    if (Object.keys(e).length) { setErrores(e); return; }
    setErrores({});
    setPaso(p => Math.min(3, p + 1));
  };

  const retroceder = () => {
    setErrores({});
    setPaso(p => Math.max(1, p - 1));
  };

  const fmt = useCallback((cmd) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();

    // Usamos execCommand como fallback robusto — sigue funcionando en todos los
    // navegadores modernos para los comandos básicos de texto, aunque esté
    // marcado como deprecado. La alternativa manual con Range.surroundContents
    // lanza DOMException cuando la selección cruza múltiples nodos (ej. texto
    // parcialmente dentro de un <strong>), lo que rompe silenciosamente el editor.
    const EXEC_MAP = {
      bold:                "bold",
      italic:              "italic",
      underline:           "underline",
      strikeThrough:       "strikeThrough",
      insertUnorderedList: "insertUnorderedList",
      insertOrderedList:   "insertOrderedList",
      justifyLeft:         "justifyLeft",
      justifyCenter:       "justifyCenter",
      justifyRight:        "justifyRight",
      removeFormat:        "removeFormat",
    };

    if (cmd === "insertHorizontalRule") {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
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

    if (EXEC_MAP[cmd]) {
      // eslint-disable-next-line no-restricted-globals
      document.execCommand(EXEC_MAP[cmd], false, null);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
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
    if (Object.keys(e).length) { setErrores(e); setPaso(Object.keys(e).some(k => k !== "descripcion") ? 1 : 2); return; }

    const catObj = categorias.find(c => c.valor === form.categoria);
    if (!catObj) { setErrores(e => ({ ...e, categoria: "Categoría no válida" })); return; }
    if (!usuario?.id_empleado) { setModal({ ok: false, titulo: "Error de sesión", msg: "No se pudo identificar al usuario. Recarga la página." }); return; }
    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append("titulo",       form.titulo.trim());
      formData.append("descripcion",  form.descripcion);
      formData.append("prioridad",    form.prioridad);
      formData.append("id_empleado",  usuario.id_empleado);
      formData.append("id_categoria", catObj.id);
      // TeamViewer: se agrega como bloque al final de la descripción solo si fue ingresado
      if (form.tvId || form.tvPass) {
        const tvBloque = `<hr/><p><strong>Acceso remoto (TeamViewer)</strong></p><p><strong>ID:</strong> ${form.tvId || "-"}</p><p><strong>Contraseña:</strong> ${form.tvPass || "-"}</p>`;
        formData.set("descripcion", (form.descripcion || "") + tvBloque);
      }

      for (const ev of form.evidencias) {
        formData.append("evidencias", ev.file, ev.name);
      }

      const res  = await apiFetch(`/api/tickets`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setModal({ ok: false, titulo: "Error al enviar", msg: data.error ?? JSON.stringify(data) }); return; }
      setModal({ ok: true, titulo: "Reporte enviado", folio: data.folio_ticket, id_ticket: data.id_ticket, prioridad: form.prioridad, categoria: catObj.label });
      limpiar();
    } catch (err) {
      console.error("[NuevoReporte] Error al enviar:", err);
      setModal({ ok: false, titulo: "Sin conexión", msg: err?.message || "No se pudo conectar con el servidor" });
    } finally {
      setEnviando(false);
    }
  };

  const MIME_PERMITIDOS = new Set([
    "image/jpeg","image/png","image/gif","image/webp",
    "video/mp4","video/webm","video/quicktime","video/x-msvideo",
  ]);
  const esVideo = (tipo) => tipo?.startsWith("video/");

  const agregarImgs = files => {
    const libres = MAX_IMGS - form.evidencias.length;
    Array.from(files)
      .filter(f => MIME_PERMITIDOS.has(f.type))
      .slice(0, libres)
      .forEach(file => {
        const src = URL.createObjectURL(file);
        setForm(f => ({ ...f, evidencias: [...f.evidencias, { src, name: file.name, file, isVideo: esVideo(file.type) }] }));
      });
  };

  const handleDrop = e => {
    e.preventDefault(); setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => MIME_PERMITIDOS.has(f.type));
    if (files.length) agregarImgs(files);
  };

  const borrarImg = i => {
    const evs = form.evidencias.filter((_, idx) => idx !== i);
    // Liberar la URL de objeto para evitar memory leaks
    URL.revokeObjectURL(form.evidencias[i].src);
    setForm(f => ({...f, evidencias:evs}));
    if (visor !== null) setVisor(evs.length === 0 ? null : Math.min(i, evs.length - 1));
  };

const card = {
    background: isDark ? "#141720" : T.surface,
    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : T.border}`,
    boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 1px 6px rgba(0,0,0,0.06)",
  };

  const inputStyle = {
    background: isDark ? "rgba(255,255,255,0.05)" : T.surface,
    border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : T.border}`,
    color: textColor,
    borderRadius: "2px",
    fontSize: "12px",
    padding: "6px 10px",
    outline: "none",
    width: "100%",
    transition: "border-color .15s, box-shadow .15s",
  };

  const onFocus = e => { e.target.style.borderColor = T.orange; e.target.style.boxShadow = "0 0 0 2px rgba(255,102,0,0.1)"; };
  const onBlur  = e => { e.target.style.borderColor = isDark ? "rgba(255,255,255,0.15)" : T.border; e.target.style.boxShadow = "none"; };

  const SectionHeader = ({ title }) => (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-0.5 h-4 rounded-full flex-shrink-0" style={{ background:"#F47920" }}/>
      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color:dividerText }}>{title}</span>
      <div className="flex-1 h-px" style={{ background:dividerLine }}/>
    </div>
  );

  const Label = ({ children, required, ayuda }) => (
    <label className="block text-xs font-semibold mb-1" style={{ color: isDark ? "rgba(255,255,255,0.75)" : T.text }}>
      {ayuda ? (
        <AyudaTooltip texto={ayuda} isDark={isDark}>{children}</AyudaTooltip>
      ) : children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );

  const Err = ({ campo }) => errores[campo]
    ? <p className="text-[11px] mt-1 font-semibold flex items-center gap-1" style={{ color:"#ef4444" }}>⚠ {errores[campo]}</p>
    : null;

  return (
    <div className="h-full overflow-y-auto py-6 px-2 md:py-8 md:px-4"
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
          <p className="text-base font-black" style={{ color:"#F47920" }}>Suelta las imágenes</p>
          <p className="text-sm" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#64748b" }}>Se agregarán a Evidencias fotográficas</p>
        </div>
      )}

      <div className="max-w-5xl mx-auto rounded-sm p-3" style={card}>
        {/* Header */}
        <div className="flex items-center gap-3 px-3 py-3 sm:px-4"
          style={{ background: isDark ? "rgba(59,130,246,0.12)" : "#eff6ff", borderBottom:`1px solid ${isDark ? "rgba(59,130,246,0.2)" : "#bfdbfe"}` }}>
          <img src={isDark ? "/assets/img/logo blanco.png" : "/assets/img/logo negro.png"} alt="Logo" className="object-contain flex-shrink-0" style={{ width:"68px", height:"68px" }}/>
          <div className="min-w-0">
            <p className="text-sm font-black tracking-tight" style={{ color: isDark ? "#93c5fd" : "#1d4ed8" }}>FORMULARIO DE INCIDENCIAS</p>
            <p className="text-[11px] font-medium mt-0.5" style={{ color: isDark ? "rgba(147,197,253,0.6)" : "#3b82f6" }}>Completa el formulario para habilitar el envío.</p>
          </div>
        </div>

        <div className="flex flex-col gap-0">

          {/* ── SECCIÓN 1: Información del Solicitante ── */}
          <div className="flex flex-col gap-2 py-3">
            <SectionHeader title="Información del Solicitante" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="sm:col-span-2 md:col-span-1">
                <Label>Solicitante</Label>
                <div
                  style={{
                    ...inputStyle,
                    opacity: .6,
                    cursor: "default",
                    background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "block",
                    lineHeight: "1.4",
                    padding: "7px 10px",
                  }}
                  title={nombreCompleto}
                >
                  {nombreCompleto}
                </div>
              </div>
              <div>
                <Label>Área</Label>
                <input readOnly value={area}
                  style={{ ...inputStyle, opacity:.6, cursor:"default", background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt }}/>
              </div>
              <div>
                <Label>Sucursal</Label>
                <input readOnly value={usuario.sucursal || usuario.nombre_sucursal || "-"}
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

          {/* ── DOS COLUMNAS: Izquierda = Detalles | Derecha = Descripción & Evidencias ── */}
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-6 py-3">

            {/* ── COLUMNA IZQUIERDA: Detalles de la Falla ── */}
            <div className="flex flex-col gap-2">
              <SectionHeader title="Detalles de la Falla" />

              {/* Título */}
              <div>
                <Label required ayuda={AYUDA.titulo}>Título del problema</Label>
                <input
                  style={{ ...inputStyle, borderColor: errores.titulo ? "#ef4444" : inputBorder }}
                  placeholder="Ej. Falla en impresora de recepción"
                  value={form.titulo} onChange={e => set("titulo", e.target.value)}
                  onFocus={onFocus} onBlur={onBlur}/>
                <Err campo="titulo"/>
              </div>

              {/* Categoría */}
              <div className="relative">
                <Label required ayuda={AYUDA.categoria}>Categoría</Label>
                <button type="button"
                  onClick={() => { setCatOpen(o => !o); quitarError("categoria"); }}
                  onBlur={() => setTimeout(() => setCatOpen(false), 120)}
                  className="w-full flex items-center justify-between gap-2 transition-all"
                  style={{
                    ...inputStyle,
                    border: `1px solid ${catOpen ? T.orange : errores.categoria ? "#ef4444" : isDark ? "rgba(255,255,255,0.15)" : T.border}`,
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

              {/* Prioridad – Segmented Control */}
              <div>
                <Label required ayuda={AYUDA.prioridad}>Nivel de prioridad</Label>
                <div className="flex rounded-lg overflow-hidden"
                  style={{ border:`1.5px solid ${errores.prioridad ? "#ef4444" : isDark ? "rgba(255,255,255,0.12)" : T.border}` }}>
                  {PRIORIDADES.map((p, idx) => {
                    const sel = form.prioridad === p.nivel;
                    return (
                      <button key={p.nivel} type="button" onClick={() => set("prioridad", p.nivel)}
                        className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-bold transition-all select-none"
                        style={{
                          background: sel ? (isDark ? p.bgD : p.bgL) : "transparent",
                          color: sel ? p.color : dividerText,
                          borderRight: idx < PRIORIDADES.length - 1 ? `1px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}` : "none",
                          transition: "background .15s, color .15s",
                        }}>
                        <PRIORIDAD_ICON nivel={p.nivel} color={sel ? p.color : dividerText} />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
                <Err campo="prioridad"/>
              </div>

              {/* TeamViewer – colapsable */}
              <div className="mt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                  <div
                    onClick={() => { setTvVisible(v => !v); if (tvVisible) { set("tvId",""); set("tvPass",""); } }}
                    className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      background: tvVisible ? "#FF6600" : "transparent",
                      border: `2px solid ${tvVisible ? "#FF6600" : isDark ? "rgba(255,255,255,0.3)" : "#d1d5db"}`,
                    }}>
                    {tvVisible && <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: dividerText }}>
                    ¿Necesitas asistencia remota (TeamViewer)?
                  </span>
                </label>
                {tvVisible && (
                  <div className="flex flex-col gap-1.5 mt-2">
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
                )}
              </div>
            </div>

            {/* Divisor vertical solo en md+ */}
            <div className="hidden md:block absolute left-1/2 top-3 bottom-3 w-px" style={{ background: dividerLine }}/>

            {/* ── COLUMNA DERECHA: Descripción & Evidencias ── */}
            <div className="flex flex-col gap-2 mt-4 md:mt-0">
              <SectionHeader title="Descripción y Evidencias" />

            <div>
              <Label required ayuda={AYUDA.descripcion}>Descripción detallada</Label>
                <div style={{
                  border: `1px solid ${errores.descripcion ? "#ef4444" : isDark ? "rgba(255,255,255,0.15)" : T.border}`,
                  borderRadius: "2px", overflow: "hidden", background: isDark ? "rgba(255,255,255,0.05)" : T.surface,
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
                      e.currentTarget.parentElement.style.borderColor = T.orange;
                      e.currentTarget.parentElement.style.boxShadow   = "0 0 0 2px rgba(255,102,0,0.1)";
                      quitarError("descripcion");
                    }}
                    onBlur={e => {
                      e.currentTarget.parentElement.style.borderColor = errores.descripcion ? "#ef4444" : isDark ? "rgba(255,255,255,0.15)" : T.border;
                      e.currentTarget.parentElement.style.boxShadow   = "none";
                    }}
                    className="outline-none px-3 py-2 text-xs leading-relaxed"
                    style={{ minHeight:"200px", color:textColor, background:"transparent" }}
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
                  {(() => {
                    const pct  = form.palabras / MAX_PALABRAS;
                    const enRojo    = form.palabras >= MAX_PALABRAS;
                    const enNaranja = !enRojo && form.palabras >= 400;
                    const enAmarillo= !enRojo && !enNaranja && form.palabras >= 300;
                    const textC = enRojo ? "#dc2626" : enNaranja ? "#ea580c" : enAmarillo ? "#ca8a04" : T.textMuted;
                    const bgC   = enRojo ? (isDark?"rgba(220,38,38,0.15)":"#fee2e2") : enNaranja ? (isDark?"rgba(234,88,12,0.15)":"#ffedd5") : enAmarillo ? (isDark?"rgba(202,138,4,0.12)":"#fef9c3") : isDark ? "rgba(255,255,255,0.06)" : T.bg;
                    const borderC = enRojo ? "#fca5a5" : enNaranja ? "#fdba74" : enAmarillo ? "#fde047" : dividerLine;
                    return (
                      <span className="ml-auto text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 transition-all"
                        style={{ background: bgC, color: textC, border: `1px solid ${borderC}` }}>
                        {(enRojo || enNaranja) && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                            <path d="M12 8v4m0 4h.01" stroke={textC} strokeWidth="2.5" strokeLinecap="round"/>
                            <circle cx="12" cy="12" r="9" stroke={textC} strokeWidth="2"/>
                          </svg>
                        )}
                        {form.palabras} / {MAX_PALABRAS}
                        <span style={{ opacity: 0.6, fontWeight: 400 }}>palabras</span>
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Evidencias – zona drag & drop amplia + thumbnails */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label ayuda={AYUDA.evidencias}>Fotografías adjuntas</Label>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                    style={{ background: isDark ? "rgba(255,255,255,0.06)" : T.bg, color: dividerText, border:`1px solid ${dividerLine}` }}>
                    {form.evidencias.length}/{MAX_IMGS}
                  </span>
                </div>

                {/* Zona principal drag & drop */}
                {form.evidencias.length < MAX_IMGS && (
                  <label className="flex flex-col items-center justify-center gap-2 w-full py-5 rounded-xl cursor-pointer transition-all mb-3"
                    style={{
                      border: `2px dashed ${dragging ? "#F47920" : isDark ? "rgba(255,255,255,0.15)" : "#d1d5db"}`,
                      background: dragging ? "rgba(244,121,32,0.06)" : isDark ? "rgba(255,255,255,0.02)" : "rgba(244,121,32,0.02)",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor="#F47920"; e.currentTarget.style.background="rgba(244,121,32,0.05)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor= isDark ? "rgba(255,255,255,0.15)" : "#d1d5db"; e.currentTarget.style.background= isDark ? "rgba(255,255,255,0.02)" : "rgba(244,121,32,0.02)"; }}>
                    <input ref={fileRef} type="file" accept="image/*,video/mp4,video/webm,video/quicktime,video/x-msvideo" multiple className="hidden"
                      onChange={e => { agregarImgs(e.target.files); e.target.value=""; }}/>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background:"rgba(244,121,32,0.1)" }}>
                      <Camera size={22} style={{ color:"#F47920" }}/>
                    </div>
                    <p className="text-xs font-semibold" style={{ color:"#F47920" }}>Haz clic o arrastra archivos aquí</p>
                    <p className="text-[11px]" style={{ color:iconColor }}>PNG, JPG, MP4, WebM · Máx. {MAX_IMGS} archivos</p>
                  </label>
                )}

                {/* Thumbnails */}
                {form.evidencias.length > 0 && (
                  <div className="grid gap-2" style={{ gridTemplateColumns:"repeat(auto-fill,minmax(70px,1fr))" }}>
                    {form.evidencias.map((img, i) => (
                      <div key={i} className="relative group">
                        <div className="aspect-square rounded-xl overflow-hidden cursor-pointer"
                          style={{ border:`1.5px solid ${isDark ? "rgba(255,255,255,0.12)" : T.border}`, boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.5)" : "0 2px 8px rgba(0,0,0,0.08)" }}
                          onClick={() => setVisor(i)}>
                          {img.isVideo ? (
                            <div className="w-full h-full flex items-center justify-center relative"
                              style={{ background: isDark ? "rgba(0,0,0,0.6)" : "#1e293b" }}>
                              <video src={img.src} className="w-full h-full object-cover absolute inset-0" muted preload="metadata"/>
                              <svg className="relative z-10" width="22" height="22" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)"><polygon points="5,3 19,12 5,21"/></svg>
                            </div>
                          ) : (
                            <img src={img.src} alt={img.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"/>
                          )}
                        </div>
                        <button type="button"
                          onClick={e => { e.stopPropagation(); borrarImg(i); }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                          style={{ background:"#dc2626", color:"#fff", boxShadow:"0 2px 6px rgba(220,38,38,0.5)", zIndex:10 }}>
                          <X size={10} strokeWidth={3}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>{/* ── fin columna derecha ── */}

          </div>{/* ── fin grid dos columnas ── */}

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
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-sm text-xs font-semibold transition-all hover:opacity-80 active:scale-95"
                  style={{ background: "transparent", color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb"}` }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
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
        <Modal
          T={T}
          title="¿Limpiar formulario?"
          onClose={() => setModalLimpiar(false)}
          onConfirm={limpiar}
          confirmLabel="Sí, limpiar"
          maxWidth="340px"
        >
          <p className="text-xs" style={{ color: T.text }}>
            Se borrarán todos los campos y las imágenes adjuntas.
          </p>
        </Modal>
      )}

      {/* Modal resultado envío */}
      {modal && (
        <Modal
          T={T}
          title={modal.titulo}
          onClose={() => { setModal(null); if (!modal.ok) return; if (modal.id_ticket && onVerTicket) onVerTicket(modal.id_ticket); else onSuccess?.(); }}
          onConfirm={() => { setModal(null); if (modal.ok && modal.id_ticket && onVerTicket) onVerTicket(modal.id_ticket); else onSuccess?.(); }}
          confirmLabel={modal.ok ? (onVerTicket ? "Ver mi ticket" : "Aceptar") : "Cerrar"}
          cancelLabel={null}
          maxWidth="380px"
          danger={!modal.ok}
        >
          {modal.ok ? (
            <div className="flex flex-col gap-2.5">
              <span className="text-sm font-mono font-bold" style={{ color:"#FF6600" }}>#{modal.folio}</span>
              <div className="flex flex-col gap-1.5 text-xs pt-2" style={{ borderTop:`1px solid ${T.border}` }}>
                {[
                  ["Prioridad", modal.prioridad, PRIORIDADES.find(p => p.nivel === modal.prioridad)?.color],
                  ["Estado",    "En Proceso",    "#ca8a04"],
                  ["Categoría", modal.categoria, null],
                  ["Fecha",     new Date().toLocaleDateString("es-MX"), null],
                ].map(([lbl, val, color]) => (
                  <div key={lbl} className="flex items-center justify-between">
                    <span style={{ color: T.textMuted }}>{lbl}:</span>
                    <span style={{ fontWeight:600, color: color || T.text }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: T.text }}>{modal.msg}</p>
          )}
        </Modal>
      )}

      {/* Visor modal */}
      {visor !== null && form.evidencias[visor] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background:"rgba(0,0,0,0.92)" }}
          onClick={() => setVisor(null)}>
          <div className="relative w-full max-w-4xl mx-4 sm:mx-10 flex flex-col items-center gap-4"
            onClick={e => e.stopPropagation()}>
            {form.evidencias[visor].isVideo ? (
              <video src={form.evidencias[visor].src} controls autoPlay
                className="rounded-2xl w-full"
                style={{ maxHeight:"74vh", boxShadow:"0 12px 48px rgba(0,0,0,0.7)" }}/>
            ) : (
              <img src={form.evidencias[visor].src} alt=""
                className="rounded-2xl object-contain w-full"
                style={{ maxHeight:"74vh", boxShadow:"0 12px 48px rgba(0,0,0,0.7)" }}/>
            )}
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

function PRIORIDAD_ICON({ nivel, color }) {
  const s = { stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" };
  if (nivel === "Urgente") return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L12 14" {...s}/>
      <circle cx="12" cy="19" r="1.5" fill={color} stroke="none"/>
      <path d="M5 5l14 14M19 5L5 19" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.35"/>
    </svg>
  );
  if (nivel === "Alta") return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M12 19V5M6 11l6-6 6 6" {...s}/>
    </svg>
  );
  if (nivel === "Media") return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14M5 7h14" {...s}/>
    </svg>
  );
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M18 13l-6 6-6-6" {...s}/>
    </svg>
  );
}

