/**
 * SkeletonTable.jsx
 *
 * Componentes de esqueleto de carga para tablas y tarjetas.
 * Implementan la heuristica de Nielsen numero 1 (visibilidad del estado del sistema)
 * mostrando placeholders animados que preservan el layout mientras los datos cargan.
 *
 * Usar skeletons en lugar de spinners en tablas y listas para reducir el layout
 * shift y mejorar la percepcion del tiempo de carga por parte del usuario.
 *
 * SkeletonTable (exportacion por defecto)
 *   Renderiza filas de tabla con celdas que contienen barras animadas.
 *   Los anchos de las barras varian entre celdas para simular contenido real.
 *   La ultima columna puede ser de acciones (hasActions=true) mostrando
 *   dos botones cuadrados skeleton en lugar de una barra de texto.
 *   Se inyecta directamente dentro de un elemento tbody existente.
 *
 *   Props:
 *     cols       - numero de columnas de la tabla
 *     rows       - filas skeleton a renderizar (default 6)
 *     hasActions - si true la ultima columna muestra botones skeleton
 *
 * SkeletonCards
 *   Renderiza tarjetas skeleton para vistas de KPI o listas en modo movil.
 *   Cada tarjeta tiene tres barras de diferente ancho para simular
 *   una etiqueta, un valor principal y una descripcion.
 *
 *   Props:
 *     count - numero de cards skeleton a renderizar (default 4)
 *
 * Las animaciones usan la clase CSS .skeleton definida en design-system.css
 * y las variables CSS --ptp-border y --ptp-surface para adaptarse al tema activo.
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
