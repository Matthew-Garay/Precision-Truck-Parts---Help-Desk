import Modal from "../Modal";
import { Package } from "lucide-react";

const ESTADO_COLOR = {
  Excelente: "#16a34a", Bueno: "#2563eb", Regular: "#d97706", Malo: "#dc2626",
};
const DISP_COLOR = {
  Disponible: "#16a34a", "Stock bajo": "#d97706", "Sin stock": "#dc2626",
};

function Row({ label, value, T }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "120px 1fr",
      gap: "8px", padding: "7px 0",
      borderBottom: `1px solid ${T.border}`,
      alignItems: "start",
    }}>
      <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
        letterSpacing: "0.06em", color: T.textFaint }}>
        {label}
      </span>
      <span style={{ fontSize: "13px", color: T.text, wordBreak: "break-word" }}>
        {value ?? <span style={{ color: T.textFaint }}>—</span>}
      </span>
    </div>
  );
}

function Badge({ value, colorMap }) {
  const color = colorMap[value] ?? "#94a3b8";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "2px 10px", borderRadius: "99px",
      fontSize: "11px", fontWeight: 600,
      background: `${color}18`, color, border: `1px solid ${color}40`,
    }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: color }} />
      {value || "—"}
    </span>
  );
}

export default function ModalDetalleInsumo({ insumo, onClose, T }) {
  if (!insumo) return null;
  return (
    <Modal
      T={T}
      title="Detalle del insumo"
      subtitle={insumo.nombre}
      icon={<Package size={13} style={{ color: "#5eead4" }} />}
      onClose={onClose}
      cancelLabel="Cerrar"
      maxWidth="480px"
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Row label="Nombre"      value={insumo.nombre}      T={T} />
        <Row label="Categoría"   value={insumo.nombre_categoria} T={T} />
        <Row label="Marca"       value={insumo.marca}       T={T} />
        <Row label="Modelo"      value={insumo.modelo}      T={T} />
        <Row label="Núm. serie"  value={insumo.num_serie}   T={T} />
        <Row label="Proveedor"   value={insumo.proveedor}   T={T} />
        <Row label="Stock"       value={insumo.stock ?? 0}  T={T} />
        <Row label="Estado" T={T}
          value={<Badge value={insumo.estado} colorMap={ESTADO_COLOR} />}
        />
        <Row label="Disponibilidad" T={T}
          value={<Badge value={insumo.disponibilidad} colorMap={DISP_COLOR} />}
        />
        {insumo.descripcion && (
          <Row label="Descripción" value={insumo.descripcion} T={T} />
        )}
      </div>
    </Modal>
  );
}
