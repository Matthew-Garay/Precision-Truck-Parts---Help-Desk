/**
 * ResponsiveTable.jsx — Design System PTP
 *
 * Tabla de datos que se convierte en tarjetas apiladas en móvil (<768px).
 * En móvil solo se muestra la información crítica (Folio, Estatus, Fecha);
 * el resto se oculta bajo un botón "Ver detalle" que alterna la visibilidad
 * de las celdas extendidas dentro de la misma tarjeta.
 *
 * Requisitos de marcado:
 *   - El <thead> debe contener <th scope="col">.
 *   - Cada <td> del <tbody> debe llevar data-label="Nombre de columna".
 *   - Las celdas que solo son relevantes en escritorio llevan
 *     data-hidden-mobile="true".
 *
 * Props:
 *   columns   — array de { key, label, hiddenMobile?: boolean }
 *   data      — array de objetos con las claves de columns
 *   rowClass  — (row) => string opcional (ej. "row-danger" / "row-warning")
 *   onDetail  — (row) => void; se dispara al pulsar "Ver detalle"
 *   detailLabel — texto del botón detalle (default "Ver detalle")
 *   T         — tokens del tema (opcional, para colores de estado)
 */
export default function ResponsiveTable({
  columns,
  data,
  rowClass,
  onDetail,
  detailLabel = "Ver detalle",
  T,
}) {
  const [expanded, setExpanded] = new Map(); // row index → boolean

  const toggleDetail = (index) => {
    setExpanded(!expanded.get(index));
  };

  return (
    <div className="ptp-table-wrap" style={{ width: "100%", overflowX: "auto" }}>
      <table className="ptp-table-data" role="grid" aria-label="Tabla de datos">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const isOpen = expanded.get(i) === true;
            const cls = rowClass ? rowClass(row) : "";
            return (
              <tr key={row.id_insumo || row.folio || row.id_solicitud || i} className={cls} role="row">
                {columns.map((col) => {
                  const hidden = col.hiddenMobile ? 'data-hidden-mobile="true"' : "";
                  const value = row[col.key] ?? "";
                  return (
                    <td
                      key={col.key}
                      data-label={col.label}
                      {...(col.hiddenMobile ? { "data-hidden-mobile": true } : {})}
                    >
                      {value}
                    </td>
                  );
                })}
                {/* Celda de acción detalle solo en móvil (desktop la oculta vía CSS) */}
                <td
                  data-label="Detalle"
                  style={{ textAlign: "right", paddingRight: "16px" }}
                >
                  <button
                    type="button"
                    className="ptp-detail-btn"
                    onClick={() => toggleDetail(i)}
                    aria-expanded={isOpen}
                  >
                    {isOpen ? "Ocultar detalle" : detailLabel}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
