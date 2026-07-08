/**
 * theme.jsx
 *
 * Componentes visuales del dashboard que muestran fecha, hora y calendario.
 * Reciben el objeto T de tokens del tema activo para adaptarse al modo claro u oscuro.
 *
 * Componentes exportados:
 *
 * RelojFecha({ T })
 *   Muestra un reloj digital en formato 12 horas con segundos, el dia de la semana
 *   y la fecha completa. Se actualiza cada segundo con setInterval.
 *   El punto naranja pulsante indica que el reloj esta activo.
 *   Usa fontVariantNumeric tabular-nums para que los digitos no salten al cambiar.
 *
 * Calendario({ T })
 *   Muestra el calendario del mes actual con los dias de la semana como encabezado.
 *   Resalta el dia de hoy con un fondo naranja degradado y sombra de color.
 *   Los dias de fin de semana (domingo y sabado) se muestran en naranja.
 *   El primer dia del mes se posiciona en la columna correcta de la semana
 *   calculando el desplazamiento con celdas vacias al inicio.
 */
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
        padding: "12px 14px 10px",
        background: isDark ? `linear-gradient(135deg, rgba(244,121,32,0.08), rgba(59,130,246,0.05))` : `linear-gradient(135deg, rgba(244,121,32,0.05), rgba(59,130,246,0.03))`,
        borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "1px" }}>
          <span style={{ fontSize: "32px", fontWeight: 900, lineHeight: 1, color: T.text, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>{h12}</span>
          <span style={{ fontSize: "32px", fontWeight: 900, lineHeight: 1, color: T.orange, margin: "0 2px" }}>:</span>
          <span style={{ fontSize: "32px", fontWeight: 900, lineHeight: 1, color: T.text, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>{min}</span>
          <div style={{ display: "flex", flexDirection: "column", marginLeft: "5px", gap: "2px", paddingBottom: "3px", alignSelf: "flex-end" }}>
            <span style={{ fontSize: "12px", fontWeight: 800, color: T.orange, lineHeight: 1 }}>{ampm}</span>
            <span style={{ fontSize: "13px", fontWeight: 700, color: isDark ? "rgba(255,255,255,0.4)" : T.textMuted, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{seg}s</span>
          </div>
        </div>
        {/* Punto naranja pulsante */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: T.orange, boxShadow: `0 0 6px ${T.orange}`, animation: "pulse 1s ease-in-out infinite" }} />
          <span style={{ fontSize: "11px", fontWeight: 600, color: T.textFaint }}>{diaSemana}</span>
        </div>
      </div>
      {/* Fecha */}
      <div style={{ padding: "7px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "12px", fontWeight: 700, color: T.textMuted }}>{diaMes} de {mesNombre}</span>
        <span style={{ fontSize: "12px", fontWeight: 800, color: T.text }}>{anio}</span>
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
        marginBottom: "8px", gap: "6px",
      }}>
        <div style={{
          width: "3px", height: "12px", borderRadius: "99px",
          background: `linear-gradient(180deg, ${T.orange}, ${T.orangeDark})`,
          flexShrink: 0,
        }} />
        <p style={{ fontSize: "13px", fontWeight: 800, color: T.text, letterSpacing: "-0.01em" }}>
          {MESES[mes]} <span style={{ color: T.textMuted, fontWeight: 500 }}>{anio}</span>
        </p>
      </div>

      {/* Días de la semana */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(7,1fr)",
        marginBottom: "4px", padding: "4px 0",
        borderRadius: "6px",
        background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt,
      }}>
        {DIAS.map((d, i) => (
          <div key={i} style={{
            textAlign: "center", fontSize: "10px", fontWeight: 700,
            color: (i === 0 || i === 6) ? T.orange : T.textMuted,
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
              height: "30px",
            }}>
              {dia && (
                <span style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "26px", height: "26px",
                  borderRadius: esHoy ? "7px" : "5px",
                  background: esHoy
                    ? `linear-gradient(135deg, ${T.orange}, ${T.orangeDark})`
                    : "transparent",
                  color: esHoy ? "#fff" : finde ? T.orange : T.textMuted,
                  fontSize: "11px",
                  fontWeight: esHoy ? 800 : finde ? 600 : 400,
                  boxShadow: esHoy ? `0 2px 8px rgba(244,121,32,0.45)` : "none",
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
      <div style={{ marginTop: "6px", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: T.orange, boxShadow: `0 0 6px ${T.orange}` }} />
          <span style={{ fontSize: "10px", fontWeight: 600, color: T.orange }}>Hoy</span>
        </div>
      </div>
    </div>
  );
}
