import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

// -- TOKENS LIGHT ---------------------------------------------
export const LIGHT = {
  isDark:       false,
  orange:       "#F47920",
  orangeDark:   "#d96a10",
  orangeMuted:  "rgba(244,121,32,0.10)",
  bg:           "#F9FAFB",
  surface:      "#FFFFFF",
  surfaceAlt:   "#F3F4F6",
  surfaceHover: "#E5E7EB",
  border:       "#E5E7EB",
  borderFocus:  "#F47920",
  text:         "#111827",
  textMuted:    "#6B7280",
  textFaint:    "#9CA3AF",
  sidebar:      "#111827",
  sidebarText:  "#9CA3AF",
  sidebarHover: "rgba(255,255,255,0.06)",
};

// -- TOKENS DARK ----------------------------------------------
export const DARK = {
  isDark:       true,
  orange:       "#F47920",
  orangeDark:   "#d96a10",
  orangeMuted:  "rgba(244,121,32,0.12)",
  bg:           "#0D1117",
  surface:      "#161B22",
  surfaceAlt:   "#1C2230",
  surfaceHover: "#21283A",
  border:       "#21283A",
  borderFocus:  "#F47920",
  text:         "#E6EDF3",
  textMuted:    "#8B949E",
  textFaint:    "#484F58",
  sidebar:      "#0D1117",
  sidebarText:  "#6E7681",
  sidebarHover: "rgba(255,255,255,0.06)",
};

// -- RELOJ Y FECHA --------------------------------------------
export function RelojFecha({ T }) {
  const [ahora, setAhora] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pad  = n => String(n).padStart(2, "0");
  const pad3 = n => String(n).padStart(3, "0");
  const hrs  = ahora.getHours();
  const min  = pad(ahora.getMinutes());
  const seg  = pad(ahora.getSeconds());
  const ms   = pad3(ahora.getMilliseconds()).slice(0, 2); // 2 dígitos
  const ampm = hrs >= 12 ? "PM" : "AM";
  const h12  = pad(hrs % 12 || 12);

  const DIAS_SEMANA = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const MESES_NOMBRE = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                        "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const diaSemana = DIAS_SEMANA[ahora.getDay()];
  const diaMes    = pad(ahora.getDate());
  const mesNombre = MESES_NOMBRE[ahora.getMonth()];
  const anio      = ahora.getFullYear();
  const isDark    = T.isDark;

  return (
    <div style={{
      borderRadius: "10px",
      overflow: "hidden",
      border: `1px solid ${T.border}`,
      background: isDark ? "#141720" : T.surface,
    }}>
      {/* Hora grande */}
      <div style={{
        padding: "14px 16px 10px",
        background: isDark ? "rgba(255,255,255,0.02)" : T.surfaceAlt,
        borderBottom: `1px solid ${T.border}`,
        display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
      }}>
        {/* HH:MM */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
          <span style={{
            fontSize: "38px", fontWeight: 900, lineHeight: 1,
            color: T.text, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em",
          }}>
            {h12}<span style={{ color: T.orange }}>:</span>{min}
          </span>
          <span style={{
            fontSize: "13px", fontWeight: 700, color: T.textMuted,
            marginBottom: "4px", marginLeft: "3px",
          }}>{ampm}</span>
        </div>
        {/* SS */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{
            fontSize: "13px", fontWeight: 700,
            color: T.orange, fontVariantNumeric: "tabular-nums",
          }}>{seg}</span>
          <span style={{ fontSize: "11px", color: T.textFaint, fontWeight: 500 }}>seg</span>
        </div>
      </div>

      {/* Fecha */}
      <div style={{
        padding: "10px 16px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
      }}>
        <span style={{
          fontSize: "11px", fontWeight: 800, color: T.orange,
          textTransform: "uppercase", letterSpacing: "0.1em",
        }}>{diaSemana}</span>
        <span style={{
          fontSize: "13px", fontWeight: 700, color: T.text,
        }}>{diaMes} de {mesNombre}, {anio}</span>
      </div>
    </div>
  );
}

// -- CALENDARIO -----------------------------------------------
export function Calendario({ T }) {
  const hoy  = new Date();
  const mes  = hoy.getMonth();
  const anio = hoy.getFullYear();

  const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                 "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const DIAS  = ["D","L","M","M","J","V","S"];

  const primerDia = new Date(anio, mes, 1).getDay();
  const totalDias = new Date(anio, mes + 1, 0).getDate();
  const celdas = [
    ...Array(primerDia).fill(null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ];

  const isDark = T.isDark;
  const hoyNum = hoy.getDate();

  // Determinar si un día es fin de semana (col 0=Dom, 6=Sáb)
  const esFinde = (idx) => {
    const col = idx % 7;
    return col === 0 || col === 6;
  };

  return (
    <div style={{ width: "100%", fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* Encabezado mes */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: "10px", gap: "6px",
      }}>
        <div style={{
          width: "3px", height: "12px", borderRadius: "99px",
          background: `linear-gradient(180deg, ${T.orange}, ${T.orangeDark})`,
          flexShrink: 0,
        }} />
        <p style={{
          fontSize: "12px", fontWeight: 800, color: T.text,
          letterSpacing: "-0.01em",
        }}>
          {MESES[mes]} <span style={{ color: T.textMuted, fontWeight: 500 }}>{anio}</span>
        </p>
      </div>

      {/* Días de la semana */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(7,1fr)",
        marginBottom: "4px",
        padding: "4px 0",
        borderRadius: "6px",
        background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt,
      }}>
        {DIAS.map((d, i) => (
          <div key={i} style={{
            textAlign: "center",
            fontSize: "9px", fontWeight: 700,
            color: (i === 0 || i === 6) ? T.orange : T.textMuted,
            letterSpacing: "0.04em",
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Celdas de días */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "2px" }}>
        {celdas.map((dia, i) => {
          const esHoy   = dia === hoyNum;
          const finde   = dia ? esFinde(i) : false;

          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              height: "26px",
            }}>
              {dia && (
                <span style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "24px", height: "24px",
                  borderRadius: esHoy ? "8px" : "6px",
                  background: esHoy
                    ? `linear-gradient(135deg, ${T.orange}, ${T.orangeDark})`
                    : "transparent",
                  color: esHoy
                    ? "#fff"
                    : finde
                    ? T.orange
                    : T.textMuted,
                  fontSize: "10px",
                  fontWeight: esHoy ? 800 : finde ? 600 : 400,
                  boxShadow: esHoy ? `0 2px 8px rgba(244,121,32,0.4)` : "none",
                  userSelect: "none",
                  transition: "all 0.15s",
                }}>
                  {dia}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Indicador hoy */}
      <div style={{
        marginTop: "6px",
        display: "flex", alignItems: "center", justifyContent: "flex-end",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: T.orange, boxShadow: `0 0 6px ${T.orange}`,
          }} />
          <span style={{ fontSize: "9px", fontWeight: 600, color: T.orange }}>Hoy</span>
        </div>
      </div>
    </div>
  );
}
