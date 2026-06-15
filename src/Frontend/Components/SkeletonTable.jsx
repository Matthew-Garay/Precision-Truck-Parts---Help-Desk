/**
 * SkeletonTable — Nielsen #1: Visibilidad del estado del sistema
 *
 * Reemplaza spinners en tablas mientras los datos cargan desde el backend.
 * Preserva la estructura visual de la tabla, reduciendo el "layout shift"
 * y la percepción de tiempo de espera (UX centrado en el usuario).
 *
 * Props:
 *   cols  : number  — cantidad de columnas de la tabla
 *   rows  : number  — filas skeleton a renderizar (default: 6)
 *   hasActions : boolean — si la última columna es de acciones (botones)
 */
export default function SkeletonTable({ cols = 4, rows = 6, hasActions = false }) {
  // Anchos variados crean ilusión de contenido real (mejor UX percibido)
  const widths = ["60%", "80%", "45%", "70%", "55%", "90%"];

  return (
    <tbody>
      {Array.from({ length: rows }, (_, rowIdx) => (
        <tr key={rowIdx}>
          {Array.from({ length: cols }, (_, colIdx) => {
            const isActionCol = hasActions && colIdx === cols - 1;
            const w = widths[(rowIdx + colIdx) % widths.length];
            return (
              <td
                key={colIdx}
                style={{ padding: "12px 16px", borderBottom: "1px solid var(--ptp-border)" }}
              >
                {isActionCol ? (
                  // Columna de acciones: dos botones skeleton
                  <div style={{ display: "flex", gap: "8px" }}>
                    <div className="skeleton" style={{ width: 32, height: 32, borderRadius: "4px" }} />
                    <div className="skeleton" style={{ width: 32, height: 32, borderRadius: "4px", animationDelay: "0.1s" }} />
                  </div>
                ) : (
                  <div
                    className="skeleton skeleton-text"
                    style={{
                      width: w,
                      animationDelay: `${(rowIdx * cols + colIdx) * 0.04}s`,
                    }}
                  />
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  );
}

/**
 * SkeletonCards — variante para vistas de tarjetas (mobile / KPI cards)
 *
 * Props:
 *   count : number — número de cards skeleton
 */
export function SkeletonCards({ count = 4 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          style={{
            background: "var(--ptp-surface)",
            border: "1px solid var(--ptp-border)",
            borderRadius: "6px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div className="skeleton skeleton-text" style={{ width: "40%", animationDelay: `${i * 0.08}s` }} />
          <div className="skeleton skeleton-heading" style={{ width: "60%", animationDelay: `${i * 0.08 + 0.05}s` }} />
          <div className="skeleton skeleton-text" style={{ width: "80%", animationDelay: `${i * 0.08 + 0.1}s` }} />
        </div>
      ))}
    </>
  );
}
