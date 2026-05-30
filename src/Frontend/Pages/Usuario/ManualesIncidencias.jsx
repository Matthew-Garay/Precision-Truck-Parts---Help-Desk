import { useState, useEffect } from "react";
import { Search, Download, Eye, FileText, Inbox } from "lucide-react";
import API from "../../Config/api";

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
        {filtered ? "Intenta con otro término" : "Sube archivos PDF a storage/Manuales/ para que aparezcan aquí"}
      </p>
    </div>
  );
}

export default function ManualesIncidencias({ T }) {
  const [busqueda, setBusqueda] = useState("");
  const [manuales, setManuales] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const isDark = T.isDark;

  useEffect(() => {
    fetch(`${API}/api/manuales`)
      .then(r => r.json())
      .then(data => setManuales(Array.isArray(data) ? data : []))
      .catch(() => setManuales([]))
      .finally(() => setLoading(false));
  }, []);

  const filtrados = manuales.filter(m =>
    !busqueda || m.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const card = {
    background: isDark ? "#141720" : T.surface,
    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}`,
    boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.05)",
  };

  return (
    <div className="overflow-y-auto" style={{ background: T.bg }}>
      <div className="p-3 md:p-4 flex flex-col gap-3 max-w-[1400px] mx-auto">

        {/* Hero buscador */}
        <div className="rounded-xl overflow-hidden" style={card}>
          <div className="h-1" style={{ background:"linear-gradient(90deg,#F47920,#ffb347,#F47920)" }}/>
          <div className="px-5 py-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-4 rounded-full" style={{ background:"#F47920" }}/>
              <div>
                <p className="text-base font-black" style={{ color: T.text }}>Biblioteca de Manuales</p>
                <p className="text-[11px]" style={{ color: T.textMuted }}>
                  {manuales.length} documento{manuales.length !== 1 ? "s" : ""} disponible{manuales.length !== 1 ? "s" : ""} · Precision Truck Parts
                </p>
              </div>
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: T.textFaint }}/>
              <input
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: T.surfaceAlt, border:`1.5px solid ${busqueda ? "#F47920" : T.border}`, color: T.text }}
                placeholder="Busca un manual por nombre..."
                value={busqueda} onChange={e => setBusqueda(e.target.value)}
                onFocus={e => { e.target.style.borderColor="#F47920"; e.target.style.boxShadow="0 0 0 3px rgba(244,121,32,0.12)"; }}
                onBlur={e  => { if (!busqueda) { e.target.style.borderColor=T.border; e.target.style.boxShadow="none"; } }}/>
              {busqueda && (
                <button onClick={() => setBusqueda("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-black"
                  style={{ color: T.textMuted, background:"none", border:"none", cursor:"pointer" }}>×</button>
              )}
            </div>
          </div>
        </div>

        {/* Contador */}
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

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F47920" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtrados.length === 0
              ? <EmptyState T={T} filtered={!!busqueda}/>
              : filtrados.map((m, i) => (
                <div key={i} className="rounded-xl overflow-hidden flex flex-col transition-all duration-200"
                  style={{ ...card }}
                  onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=isDark?"0 8px 32px rgba(0,0,0,0.6)":"0 6px 24px rgba(0,0,0,0.10)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow=card.boxShadow; }}>
                  <div className="h-1" style={{ background:"linear-gradient(90deg,#F47920,#ffb347)" }}/>
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-14 rounded-lg relative"
                        style={{ background:"rgba(220,38,38,0.1)", border:"1.5px solid rgba(220,38,38,0.2)" }}>
                        <FileText size={20} style={{ color:"#dc2626" }}/>
                        <span className="text-[8px] font-black mt-0.5 tracking-wider" style={{ color:"#dc2626" }}>PDF</span>
                        <div className="absolute top-0 right-0 w-3 h-3 rounded-bl-md"
                          style={{ background:"rgba(220,38,38,0.15)", borderLeft:"1.5px solid rgba(220,38,38,0.2)", borderBottom:"1.5px solid rgba(220,38,38,0.2)" }}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black leading-snug break-words" style={{ color: T.text }}>
                          {m.nombre.replace(/\.pdf$/i, "")}
                        </p>
                        <span className="text-[10px] font-semibold mt-1 block" style={{ color: T.textFaint }}>{m.tamaño}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <a href={`${API}${m.url}`} target="_blank" rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition-all hover:brightness-110 active:scale-95"
                        style={{ background: isDark?"rgba(255,255,255,0.06)":T.surfaceAlt, color: T.textMuted, border:`1px solid ${isDark?"rgba(255,255,255,0.08)":T.border}` }}>
                        <Eye size={12}/> Ver
                      </a>
                      <a href={`${API}${m.url}`} download={m.nombre}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold text-white transition-all hover:brightness-110 active:scale-95"
                        style={{ background:"linear-gradient(135deg,#F47920,#d97400)", boxShadow:"0 2px 8px rgba(244,121,32,0.35)" }}>
                        <Download size={12}/> Descargar
                      </a>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}

      </div>
    </div>
  );
}
