import { useState, useRef } from "react";
import { Camera, Plus, X, ZoomIn, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

const PRIORIDADES = [
  { label: "Urgente", nivel: "Urgente", color: "#dc2626", bgL: "#fee2e2", bgD: "#2d0a0a", borderL: "#fca5a5", borderD: "#7f1d1d" },
  { label: "Alta",    nivel: "Alta",    color: "#ea580c", bgL: "#ffedd5", bgD: "#2d1200", borderL: "#fdba74", borderD: "#7c2d12" },
  { label: "Media",   nivel: "Media",   color: "#ca8a04", bgL: "#fef9c3", bgD: "#1f1a00", borderL: "#fde047", borderD: "#713f12" },
  { label: "Baja",    nivel: "Baja",    color: "#16a34a", bgL: "#dcfce7", bgD: "#052e16", borderL: "#86efac", borderD: "#14532d" },
];

const CATEGORIAS = [
  { valor: "Hardware",           icono: "🖥️", label: "Hardware"           },
  { valor: "Software",           icono: "💾", label: "Software"           },
  { valor: "Red / Conectividad", icono: "🌐", label: "Red / Conectividad"  },
  { valor: "Impresoras",         icono: "🖨️", label: "Impresoras"         },
  { valor: "Accesos y Permisos", icono: "🔐", label: "Accesos y Permisos"  },
  { valor: "Correo Electrónico", icono: "📧", label: "Correo Electrónico"  },
  { valor: "Otro",               icono: "📌", label: "Otro"               },
];

const MAX_IMGS = 8;
const EMPTY = { titulo: "", descripcion: "", prioridad: "", categoria: "", evidencias: [] };

export default function NuevoReporte({ T, solicitante = "—", area = "—" }) {
  const [form,      setForm]      = useState(EMPTY);
  const [visor,     setVisor]     = useState(null);
  const [imgActiva, setImgActiva] = useState(null);
  const [catOpen,   setCatOpen]   = useState(false);
  const [errores,   setErrores]   = useState({});
  const fileRef                   = useRef();

  const isDark = T.bg === "#0b0e14";
  const catSel = CATEGORIAS.find(c => c.valor === form.categoria);

  const quitarError = (k) => setErrores(p => { const n = { ...p }; delete n[k]; return n; });
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); quitarError(k); };

  const limpiar = () => { setForm(EMPTY); setErrores({}); };

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

  const agregarImgs = (files) => {
    const libres = MAX_IMGS - form.evidencias.length;
    Array.from(files).slice(0, libres).forEach(file => {
      const reader = new FileReader();
      reader.onload = e =>
        setForm(f => ({ ...f, evidencias: [...f.evidencias, { src: e.target.result, name: file.name }] }));
      reader.readAsDataURL(file);
    });
  };

  const borrarImg = (i) => {
    const evs = form.evidencias.filter((_, idx) => idx !== i);
    setForm(f => ({ ...f, evidencias: evs }));
    if (visor !== null) {
      if (evs.length === 0) setVisor(null);
      else setVisor(Math.min(i, evs.length - 1));
    }
  };

  const slots = [...form.evidencias];
  if (slots.length < MAX_IMGS) slots.push(null);

  // Tokens de color
  const inputBg     = isDark ? "rgba(255,255,255,0.05)" : T.surfaceAlt;
  const inputBorder = isDark ? "rgba(255,255,255,0.12)" : T.border;
  const dividerLine = isDark ? "rgba(255,255,255,0.08)" : T.border;
  const dividerText = isDark ? "rgba(255,255,255,0.4)"  : T.textMuted;
  const iconColor   = isDark ? "rgba(255,255,255,0.22)" : T.textFaint;

  const inputCls   = "w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all";
  const inputStyle = { background: inputBg, border: `1.5px solid ${inputBorder}`, color: isDark ? "#e2e8f0" : T.text };
  const focusStyle = {
    onFocus: e => { e.target.style.borderColor = "#F47920"; e.target.style.boxShadow = "0 0 0 3px rgba(244,121,32,0.15)"; },
    onBlur:  e => { e.target.style.borderColor = inputBorder; e.target.style.boxShadow = "none"; },
  };

  const Label = ({ children, required }) => (
    <label className="block text-xs font-bold mb-1.5"
      style={{ color: isDark ? "rgba(255,255,255,0.7)" : T.text }}>
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );

  const Err = ({ campo }) => errores[campo]
    ? <p className="text-[10px] mt-1 font-semibold flex items-center gap-1" style={{ color: "#ef4444" }}>⚠ {errores[campo]}</p>
    : null;

  const Divider = ({ title }) => (
    <div className="flex items-center gap-2.5 mb-1">
      <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ background: "#F47920" }} />
      <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
        style={{ color: dividerText }}>{title}</span>
      <div className="flex-1 h-px" style={{ background: dividerLine }} />
    </div>
  );

  return (
    <div className="p-4 sm:p-5 md:p-6 h-full overflow-y-auto" style={{ background: T.bg }}>
      <div className="max-w-5xl mx-auto rounded-2xl overflow-hidden"
        style={{
          background: isDark ? "#141720" : T.surface,
          border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : T.border}`,
          boxShadow: isDark ? "0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)" : "0 2px 16px rgba(0,0,0,0.08)",
        }}>

        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5"
            style={{ background: "linear-gradient(90deg,#F47920,#ffb347,#F47920)" }} />
          <div className="px-6 py-4 flex items-center gap-3"
            style={{
              borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}`,
              background: isDark ? "rgba(255,255,255,0.04)" : T.surfaceAlt,
            }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#F47920,#d97400)", boxShadow: "0 3px 10px rgba(244,121,32,0.4)" }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M2 4h11M2 7.5h7M2 11h5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-black" style={{ color: isDark ? "#f1f5f9" : T.text }}>Formulario de Incidencias</p>
              <p className="text-[11px]" style={{ color: isDark ? "rgba(255,255,255,0.4)" : T.textMuted }}>
                Completa todos los campos obligatorios
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 md:p-7 flex flex-col gap-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Columna izquierda */}
            <div className="flex flex-col gap-4">
              <Divider title="Información general" />

              <div>
                <Label required>Título</Label>
                <input className={inputCls}
                  style={{ ...inputStyle, border: `1.5px solid ${errores.titulo ? "#ef4444" : inputBorder}` }}
                  placeholder="Ej. Falla en impresora de recepción"
                  value={form.titulo} onChange={e => set("titulo", e.target.value)}
                  {...focusStyle} />
                <Err campo="titulo" />
              </div>

              <div>
                <Label required>Descripción</Label>
                <textarea className={inputCls}
                  style={{ ...inputStyle, resize: "none", minHeight: "clamp(130px, 20vh, 175px)", border: `1.5px solid ${errores.descripcion ? "#ef4444" : inputBorder}` }}
                  maxLength={300} placeholder="Describe el problema con detalle..."
                  value={form.descripcion} onChange={e => set("descripcion", e.target.value)}
                  {...focusStyle} />
                <div className="flex items-center justify-between mt-0.5">
                  <Err campo="descripcion" />
                  <p className="text-[10px] font-medium ml-auto"
                    style={{ color: isDark ? "rgba(255,255,255,0.3)" : T.textMuted }}>
                    {form.descripcion.length}/300
                  </p>
                </div>
              </div>
            </div>

            {/* Columna derecha */}
            <div className="flex flex-col gap-4">
              <Divider title="Clasificación" />

              {/* Prioridad */}
              <div>
                <Label required>Prioridad</Label>
                <div className="grid grid-cols-4 gap-2">
                  {PRIORIDADES.map(p => {
                    const sel = form.prioridad === p.nivel;
                    return (
                      <button key={p.nivel} type="button"
                        onClick={() => set("prioridad", p.nivel)}
                        className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl text-[11px] font-bold transition-all"
                        style={{
                          background: sel ? (isDark ? p.bgD : p.bgL) : inputBg,
                          border:     `2px solid ${sel ? (isDark ? p.borderD : p.borderL) : errores.prioridad ? "#ef4444" : inputBorder}`,
                          color:      sel ? p.color : dividerText,
                          boxShadow:  sel ? `0 4px 14px ${p.color}45` : "none",
                          transform:  sel ? "scale(1.04)" : "scale(1)",
                        }}>
                        <span className="w-3 h-3 rounded-full"
                          style={{ background: p.color, boxShadow: sel ? `0 0 8px ${p.color}80` : "none" }} />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
                <Err campo="prioridad" />
              </div>

              {/* Categoría */}
              <div className="relative">
                <Label required>Categoría</Label>
                <button type="button"
                  onClick={() => { setCatOpen(o => !o); quitarError("categoria"); }}
                  onBlur={() => setTimeout(() => setCatOpen(false), 120)}
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm flex items-center justify-between gap-2 transition-all"
                  style={{
                    background: inputBg,
                    border: `1.5px solid ${catOpen ? "#F47920" : errores.categoria ? "#ef4444" : inputBorder}`,
                    color: catSel ? (isDark ? "#e2e8f0" : T.text) : dividerText,
                    boxShadow: catOpen ? "0 0 0 3px rgba(244,121,32,0.15)" : "none",
                  }}>
                  <span className="flex items-center gap-2 font-medium">
                    {catSel
                      ? <><span className="text-base">{catSel.icono}</span><span>{catSel.label}</span></>
                      : <span>Selecciona una categoría</span>
                    }
                  </span>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"
                    style={{ flexShrink: 0, transition: "transform 0.2s", transform: catOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
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
                            background: sel ? "rgba(244,121,32,0.15)" : "transparent",
                            color: sel ? "#F47920" : isDark ? "rgba(255,255,255,0.8)" : T.text,
                            borderTop: idx === 0 ? "none" : `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}`,
                          }}
                          onMouseEnter={e => { if (!sel) e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : T.surfaceAlt; }}
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
                <Err campo="categoria" />
              </div>

              {/* Solicitante y Área */}
              <div className="flex flex-col gap-3">
                <div>
                  <Label>Solicitante</Label>
                  <input className={inputCls} readOnly value={solicitante}
                    style={{ ...inputStyle, opacity: isDark ? 0.5 : 0.65, cursor: "default",
                      background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt }} />
                </div>
                <div>
                  <Label>Área</Label>
                  <input className={inputCls} readOnly value={area}
                    style={{ ...inputStyle, opacity: isDark ? 0.5 : 0.65, cursor: "default",
                      background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt }} />
                </div>
              </div>
            </div>
          </div>

          {/* Evidencias */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ background: "#F47920" }} />
              <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
                style={{ color: dividerText }}>Evidencias fotográficas</span>
              <div className="flex-1 h-px" style={{ background: dividerLine }} />
              <span className="text-[10px] font-black whitespace-nowrap" style={{ color: dividerText }}>
                {form.evidencias.length}/{MAX_IMGS}
              </span>
            </div>

            <div className="grid gap-4"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
              {slots.map((img, i) =>
                img === null ? (
                  <label key="add"
                    className="aspect-square rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                    style={{ border: `2px dashed ${inputBorder}`, background: inputBg }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#F47920"; e.currentTarget.style.background = "rgba(244,121,32,0.08)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = inputBorder; e.currentTarget.style.background = inputBg; }}>
                    <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                      onChange={e => { agregarImgs(e.target.files); e.target.value = ""; }} />
                    {form.evidencias.length === 0
                      ? <><Camera size={26} style={{ color: iconColor }} /><span className="text-xs" style={{ color: iconColor }}>Agregar foto</span></>
                      : <><Plus size={24} style={{ color: iconColor }} /><span className="text-xs" style={{ color: iconColor }}>Agregar</span></>
                    }
                  </label>
                ) : (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="aspect-square rounded-xl overflow-hidden relative group"
                      style={{
                        border: `1.5px solid ${isDark ? "rgba(255,255,255,0.12)" : T.border}`,
                        boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.5)" : "0 2px 10px rgba(0,0,0,0.1)",
                      }}
                      onTouchEnd={e => { e.preventDefault(); setImgActiva(imgActiva === i ? null : i); }}>
                      <img src={img.src} alt={img.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 items-center justify-center gap-2 hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(0,0,0,0.6)" }}>
                        <button type="button" onClick={() => setVisor(i)}
                          className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                          style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>
                          <ZoomIn size={18} />
                        </button>
                        <button type="button" onClick={() => borrarImg(i)}
                          className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                          style={{ background: "rgba(220,38,38,0.8)", color: "#fff" }}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-1.5 md:hidden">
                      <button type="button" onClick={() => setVisor(i)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95"
                        style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: isDark ? "rgba(255,255,255,0.6)" : T.textMuted }}>
                        <ZoomIn size={13} /> Ver
                      </button>
                      <button type="button" onClick={() => borrarImg(i)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95"
                        style={{ background: isDark ? "rgba(220,38,38,0.18)" : "#fee2e2", border: `1px solid ${isDark ? "rgba(220,38,38,0.35)" : "#fca5a5"}`, color: "#ef4444" }}>
                        <Trash2 size={13} /> Borrar
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
            <p className="text-[10px] mt-2 hidden md:block" style={{ color: iconColor }}>
              Pasa el cursor sobre una imagen para ver las opciones · Máx. {MAX_IMGS} fotos
            </p>
            <p className="text-[10px] mt-2 md:hidden" style={{ color: iconColor }}>
              Usa los botones debajo de cada foto para verla o eliminarla · Máx. {MAX_IMGS} fotos
            </p>
          </div>

          {/* Botones */}
          <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 pt-4"
            style={{ borderTop: `1px solid ${dividerLine}` }}>
            <p className="text-[10px]" style={{ color: iconColor }}>
              <span className="text-red-400 font-bold">*</span> Campos obligatorios
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
              <button type="button" onClick={limpiar}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95"
                style={{ background: "#007BFF", boxShadow: "0 3px 10px rgba(0,123,255,0.3)" }}>
                Limpiar Campos
              </button>
              <button type="button" onClick={handleSubir}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95"
                style={{ background: "linear-gradient(135deg,#F47920,#d97400)", boxShadow: "0 3px 12px rgba(244,121,32,0.4)" }}>
                Subir Reporte
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Visor modal */}
      {visor !== null && form.evidencias[visor] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.9)" }}
          onClick={() => setVisor(null)}>
          <div className="relative w-full max-w-4xl mx-4 sm:mx-10 flex flex-col items-center gap-4"
            onClick={e => e.stopPropagation()}>
            <img src={form.evidencias[visor].src} alt=""
              className="rounded-2xl object-contain w-full"
              style={{ maxHeight: "74vh", boxShadow: "0 12px 48px rgba(0,0,0,0.7)" }} />
            <p className="text-xs truncate max-w-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              {form.evidencias[visor].name}
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setVisor(i => Math.max(0, i - 1))}
                disabled={visor === 0}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-25 hover:scale-110"
                style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm font-bold text-white">{visor + 1} / {form.evidencias.length}</span>
              <button onClick={() => setVisor(i => Math.min(form.evidencias.length - 1, i + 1))}
                disabled={visor === form.evidencias.length - 1}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-25 hover:scale-110"
                style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
                <ChevronRight size={20} />
              </button>
            </div>
            <button onClick={() => borrarImg(visor)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all hover:brightness-110 active:scale-95"
              style={{ background: "rgba(220,38,38,0.85)", color: "#fff" }}>
              <Trash2 size={14} /> Eliminar foto
            </button>
          </div>
          <button onClick={() => setVisor(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}>
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
