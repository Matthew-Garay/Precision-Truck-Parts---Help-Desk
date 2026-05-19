import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export const LIGHT = {
  orange:      "#F47920",
  bg:          "#f1f5f9",
  surface:     "#ffffff",
  surfaceAlt:  "#f8fafc",
  border:      "#e2e8f0",
  text:        "#1D1D1B",
  textMuted:   "#64748b",
  textFaint:   "#cbd5e1",
  sidebar:     "#1D1D1B",
  sidebarText: "#94a3b8",
};

export const DARK = {
  orange:      "#F47920",
  bg:          "#0b0e14",
  surface:     "#141720",
  surfaceAlt:  "#1c2030",
  border:      "#252a3a",
  text:        "#f1f5f9",
  textMuted:   "#94a3b8",
  textFaint:   "#3d4460",
  sidebar:     "#0d1018",
  sidebarText: "#5a6480",
};

export function RelojFecha({ T }) {
  const [ahora, setAhora] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const pad  = n => String(n).padStart(2, "0");
  const dia  = pad(ahora.getDate());
  const mes  = pad(ahora.getMonth() + 1);
  const anio = ahora.getFullYear();
  const hrs  = ahora.getHours();
  const min  = pad(ahora.getMinutes());
  const seg  = pad(ahora.getSeconds());
  const ampm = hrs >= 12 ? "pm" : "am";
  const h12  = pad(hrs % 12 || 12);
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
      <div className="px-4 py-2 flex items-center justify-between" style={{ background: T.orange }}>
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/80">Fecha y hora</span>
        <Clock size={11} color="rgba(255,255,255,0.7)" />
      </div>
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: T.surfaceAlt }}>
        <p className="text-xs font-semibold">
          <span style={{ color: T.text, fontWeight: 700 }}>{dia}</span>
          <span style={{ color: T.orange, fontWeight: 700 }}>/</span>
          <span style={{ color: T.text, fontWeight: 700 }}>{mes}</span>
          <span style={{ color: T.orange, fontWeight: 700 }}>/</span>
          <span style={{ color: T.text, fontWeight: 700 }}>{anio}</span>
        </p>
        <p className="text-xs font-black" style={{ color: T.text }}>
          {h12}:{min}<span style={{ color: T.orange }}>:{seg}</span>
          <span className="text-[10px] font-semibold ml-1" style={{ color: T.textMuted }}>{ampm}</span>
        </p>
      </div>
    </div>
  );
}

export function Calendario({ T }) {
  const hoy = new Date();
  const mes  = hoy.getMonth();
  const anio = hoy.getFullYear();
  const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                 "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const DIAS  = ["Do","Lu","Ma","Mi","Ju","Vi","Sa"];
  const primerDia = new Date(anio, mes, 1).getDay();
  const totalDias = new Date(anio, mes + 1, 0).getDate();
  const celdas = [
    ...Array(primerDia).fill(null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-center">
        <span className="text-[11px] font-bold" style={{ color: T.text }}>{MESES[mes]} {anio}</span>
      </div>
      <div className="grid grid-cols-7">
        {DIAS.map(d => (
          <div key={d} className="text-center text-[9px] font-bold py-0.5" style={{ color: T.textFaint }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {celdas.map((dia, i) => {
          const esHoy = dia === hoy.getDate();
          return (
            <div key={i} className="flex items-center justify-center h-6">
              {dia && (
                <span className="w-6 h-6 flex items-center justify-center rounded-full text-[11px] select-none transition-all"
                  style={{
                    background: esHoy ? T.orange : "transparent",
                    color:      esHoy ? "#fff"   : T.textMuted,
                    fontWeight: esHoy ? 700 : 400,
                    boxShadow:  esHoy ? `0 2px 8px rgba(244,121,32,0.5)` : "none",
                  }}>
                  {dia}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
