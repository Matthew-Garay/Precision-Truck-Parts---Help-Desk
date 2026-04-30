import { useState } from "react";
import { Search, ChevronDown, Download, Eye, BookOpen, FileText, Inbox, Clock, Tag } from "lucide-react";

// Sin datos — se cargarán desde la API
const MANUALES = [];

const CATEGORIAS = ["Todas", "Mantenimiento", "Redes", "Soporte"];

const CAT_COLORS = {
  Mantenimiento: { color:"#d97706", bg:"#fef3c7", border:"#fde68a" },
  Redes:         { color:"#2563eb", bg:"#dbeafe", border:"#bfdbfe" },
  Soporte:       { color:"#7c3aed", bg:"#ede9fe", border:"#ddd6fe" },
};

// ── ICONO PDF ─────────────────────────────────────────────────
function PdfIcon({ color = "#dc2626" }) {
  return (
    <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-14 rounded-lg relative"
      style={{ background:`${color}15`, border:`1.5px solid ${color}30` }}>
      <FileText size={20} style={{ color }} />
      <span className="text-[8px] font-black mt-0.5 tracking-wider" style={{ color }}>PDF</span>
      {/* doblez esquina */}
      <div className="absolute top-0 right-0 w-3 h-3 rounded-bl-md"
        style={{ background:`${color}25`, borderLeft:`1.5px solid ${color}30`, borderBottom:`1.5px solid ${color}30` }}/>
    </div>
  );
}

// ── TARJETA MANUAL ────────────────────────────────────────────
function CardManual({ m, T }) {
  const cat = CAT_COLORS[m.categoria] || CAT_COLORS.Soporte;
  return (
    <div className="rounded-xl overflow-hidden flex flex-col transition-all duration-200 group"
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.10)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "none"; }}>

      {/* Banda superior de color por categoría */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${cat.color}, ${cat.color}88)` }}/>

      <div className="p-4 flex flex-col gap-3 flex-1">

        {/* Fila principal: icono + info */}
        <div className="flex items-start gap-3">
          <PdfIcon color={m.color}/>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black leading-snug" style={{ color: T.text }}>{m.titulo}</p>
            <p className="text-[11px] mt-1 leading-relaxed line-clamp-2" style={{ color: T.textMuted }}>{m.desc}</p>
          </div>
        </div>

        {/* Badge categoría */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: cat.bg, color: cat.color, border:`1px solid ${cat.border}` }}>
            <Tag size={9}/> {m.categoria}
          </span>
          <span className="text-[10px] font-semibold" style={{ color: T.textFaint }}>
            {m.paginas} páginas
          </span>
        </div>

        {/* Separador */}
        <div className="h-px" style={{ background: T.border }}/>

        {/* Meta: fecha + tamaño */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1" style={{ color: T.textMuted }}>
            <Clock size={11}/>
            <span className="text-[10px] font-semibold">{m.fecha}</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: T.bg, color: T.textMuted, border:`1px solid ${T.border}` }}>
            {m.tipo} · {m.tamaño}
          </span>
        </div>

        {/* Botones acción */}
        <div className="flex gap-2 mt-auto">
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition-all hover:brightness-110 active:scale-95"
            style={{ background: T.surfaceAlt, color: T.textMuted, border:`1px solid ${T.border}` }}>
            <Eye size={12}/> Ver
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold text-white transition-all hover:brightness-110 active:scale-95"
            style={{ background:`linear-gradient(135deg,#F47920,#d97400)`, boxShadow:"0 2px 8px rgba(244,121,32,0.35)" }}>
            <Download size={12}/> Descargar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ESTADO VACÍO ──────────────────────────────────────────────
function EmptyState({ T, filtered }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: T.surfaceAlt, border:`1px solid ${T.border}` }}>
        <Inbox size={26} style={{ color: T.textFaint }}/>
      </div>
      <p className="text-sm font-bold" style={{ color: T.textMuted }}>
        {filtered ? "Sin resultados" : "No hay manuales registrados"}
      </p>
      <p className="text-xs" style={{ color: T.textFaint }}>
        {filtered ? "Intenta con otro término o categoría" : "Los manuales aparecerán aquí una vez cargados desde la base de datos"}
      </p>
    </div>
  );
}

// ── PRINCIPAL ─────────────────────────────────────────────────
export default function ManualesIncidencias({ T }) {
  const [busqueda,  setBusqueda]  = useState("");
  const [categoria, setCategoria] = useState("Todas");

  // Lista vacía — lista para conectar a la API
  const manuales = MANUALES;

  const filtrados = manuales.filter(m => {
    const matchCat = categoria === "Todas" || m.categoria === categoria;
    const matchBus = !busqueda ||
      m.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.desc.toLowerCase().includes(busqueda.toLowerCase());
    return matchCat && matchBus;
  });

  const card = { background: T.surface, border:`1px solid ${T.border}`, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" };

  return (
    <div className="h-full overflow-y-auto" style={{ background: T.bg }}>
      <div className="p-3 md:p-4 flex flex-col gap-3 max-w-[1400px] mx-auto">

        {/* ── HERO BUSCADOR ─────────────────────────────── */}
        <div className="rounded-xl overflow-hidden" style={card}>
          {/* Banda naranja superior */}
          <div className="h-1" style={{ background:`linear-gradient(90deg,#F47920,#ffb347,#F47920)` }}/>

          <div className="px-5 py-5 flex flex-col gap-4">
            {/* Título sección */}
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-4 rounded-full" style={{ background:"#F47920" }}/>
              <div>
                <p className="text-base font-black" style={{ color: T.text }}>Biblioteca de Manuales</p>
                <p className="text-[11px]" style={{ color: T.textMuted }}>
                  {manuales.length} documentos disponibles · Precision Truck Parts
                </p>
              </div>
              {/* Contador por categoría */}
              <div className="ml-auto hidden sm:flex gap-2">
                {CATEGORIAS.slice(1).map(c => {
                  const cc = CAT_COLORS[c];
                  const n  = manuales.filter(m => m.categoria === c).length;
                  return (
                    <span key={c} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                      style={{ background: cc.bg, color: cc.color, border:`1px solid ${cc.border}` }}>
                      {n} {c}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Buscador grande */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: T.textFaint }}/>
                <input
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ background: T.surfaceAlt, border:`1.5px solid ${T.border}`, color: T.text }}
                  placeholder="¿Qué problema tienes hoy? Busca un manual..."
                  value={busqueda} onChange={e => setBusqueda(e.target.value)}
                  onFocus={e => { e.target.style.borderColor="#F47920"; e.target.style.boxShadow="0 0 0 3px rgba(244,121,32,0.12)"; }}
                  onBlur={e  => { e.target.style.borderColor=T.border;   e.target.style.boxShadow="none"; }}/>
              </div>

              {/* Dropdown categoría */}
              <div className="relative">
                <BookOpen size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: categoria !== "Todas" ? "#F47920" : T.textFaint }}/>
                <select value={categoria} onChange={e => setCategoria(e.target.value)}
                  className="appearance-none pl-8 pr-8 py-3 rounded-xl text-sm font-semibold outline-none cursor-pointer"
                  style={{
                    background: categoria !== "Todas" ? "rgba(244,121,32,0.07)" : T.surfaceAlt,
                    border: `1.5px solid ${categoria !== "Todas" ? "#F47920" : T.border}`,
                    color: categoria !== "Todas" ? "#F47920" : T.text,
                    minWidth: "160px",
                  }}>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c === "Todas" ? "Categoría: Todas" : c}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: categoria !== "Todas" ? "#F47920" : T.textMuted }}/>
              </div>
            </div>

            {/* Chips filtros activos */}
            {(busqueda || categoria !== "Todas") && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: T.textFaint }}>Filtros:</span>
                {busqueda && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background:"rgba(244,121,32,0.10)", color:"#F47920", border:"1px solid rgba(244,121,32,0.25)" }}>
                    🔍 "{busqueda}"
                    <button onClick={() => setBusqueda("")} className="font-black hover:opacity-60 ml-0.5">×</button>
                  </span>
                )}
                {categoria !== "Todas" && (() => {
                  const cc = CAT_COLORS[categoria];
                  return (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ background: cc.bg, color: cc.color, border:`1px solid ${cc.border}` }}>
                      {categoria}
                      <button onClick={() => setCategoria("Todas")} className="font-black hover:opacity-60 ml-0.5">×</button>
                    </span>
                  );
                })()}
                <span className="text-[10px] font-bold ml-1" style={{ color: T.textMuted }}>
                  {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── HEADER GRID ───────────────────────────────── */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-0.5 h-3.5 rounded-full" style={{ background:"#F47920" }}/>
            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>
              Manuales disponibles
            </p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: T.surface, color: T.textMuted, border:`1px solid ${T.border}` }}>
            {filtrados.length} de {manuales.length}
          </span>
        </div>

        {/* ── GRID DE TARJETAS ──────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtrados.length === 0
            ? <EmptyState T={T} filtered={busqueda || categoria !== "Todas"}/>
            : filtrados.map(m => <CardManual key={m.id} m={m} T={T}/>)
          }
        </div>

      </div>
    </div>
  );
}
