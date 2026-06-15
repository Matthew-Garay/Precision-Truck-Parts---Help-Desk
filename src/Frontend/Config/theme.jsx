import { useState, useEffect } from "react";

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
      borderRadius: "12px",
      overflow: "hidden",
      border: `1px solid ${T.border}`,
      background: isDark ? "#141720" : T.surface,
    }}>
      {/* Hora principal */}
      <div style={{
        padding: "8px 12px 6px",
        background: isDark ? `linear-gradient(135deg, rgba(244,121,32,0.08), rgba(59,130,246,0.05))` : `linear-gradient(135deg, rgba(244,121,32,0.05), rgba(59,130,246,0.03))`,
        borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "1px" }}>
          <span style={{ fontSize: "24px", fontWeight: 900, lineHeight: 1, color: T.text, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>{h12}</span>
          <span style={{ fontSize: "24px", fontWeight: 900, lineHeight: 1, color: T.orange, margin: "0 1px" }}>:</span>
          <span style={{ fontSize: "24px", fontWeight: 900, lineHeight: 1, color: T.text, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>{min}</span>
          <div style={{ display: "flex", flexDirection: "column", marginLeft: "4px", gap: "1px", paddingBottom: "2px", alignSelf: "flex-end" }}>
            <span style={{ fontSize: "10px", fontWeight: 800, color: T.orange, lineHeight: 1 }}>{ampm}</span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: isDark ? "rgba(255,255,255,0.4)" : T.textMuted, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{seg}s</span>
          </div>
        </div>
        {/* Punto naranja pulsante */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: T.orange, boxShadow: `0 0 6px ${T.orange}`, animation: "pulse 1s ease-in-out infinite" }} />
          <span style={{ fontSize: "9px", fontWeight: 600, color: T.textFaint }}>{diaSemana}</span>
        </div>
      </div>
      {/* Fecha */}
      <div style={{ padding: "5px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted }}>{diaMes} de {mesNombre}</span>
        <span style={{ fontSize: "10px", fontWeight: 800, color: T.text }}>{anio}</span>
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
        marginBottom: "6px", gap: "5px",
      }}>
        <div style={{
          width: "3px", height: "10px", borderRadius: "99px",
          background: `linear-gradient(180deg, ${T.orange}, ${T.orangeDark})`,
          flexShrink: 0,
        }} />
        <p style={{ fontSize: "11px", fontWeight: 800, color: T.text, letterSpacing: "-0.01em" }}>
          {MESES[mes]} <span style={{ color: T.textMuted, fontWeight: 500 }}>{anio}</span>
        </p>
      </div>

      {/* Días de la semana */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(7,1fr)",
        marginBottom: "3px", padding: "3px 0",
        borderRadius: "5px",
        background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt,
      }}>
        {DIAS.map((d, i) => (
          <div key={i} style={{
            textAlign: "center", fontSize: "8px", fontWeight: 700,
            color: (i === 0 || i === 6) ? T.orange : T.textMuted,
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Celdas de días */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "1px" }}>
        {celdas.map((dia, i) => {
          const esHoy   = dia === hoyNum;
          const finde   = dia ? esFinde(i) : false;

          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              height: "22px",
            }}>
              {dia && (
                <span style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "20px", height: "20px",
                  borderRadius: esHoy ? "6px" : "4px",
                  background: esHoy
                    ? `linear-gradient(135deg, ${T.orange}, ${T.orangeDark})`
                    : "transparent",
                  color: esHoy ? "#fff" : finde ? T.orange : T.textMuted,
                  fontSize: "9px",
                  fontWeight: esHoy ? 800 : finde ? 600 : 400,
                  boxShadow: esHoy ? `0 2px 6px rgba(244,121,32,0.4)` : "none",
                  userSelect: "none",
                }}>
                  {dia}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Indicador hoy */}
      <div style={{ marginTop: "4px", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: T.orange, boxShadow: `0 0 5px ${T.orange}` }} />
          <span style={{ fontSize: "8px", fontWeight: 600, color: T.orange }}>Hoy</span>
        </div>
      </div>
    </div>
  );
}
