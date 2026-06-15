/**
 * StockBar — Indicador visual de stock con soporte dark mode
 */
export default function StockBar({ stock, maxStock = 20, isDark = false }) {
  const pct = maxStock > 0 ? Math.min(100, Math.round((stock / maxStock) * 100)) : 0;

  const barColor =
    stock === 0  ? "#6b7280" :
    stock <= 3   ? "#dc2626" :
    stock <= 8   ? "#d97706" :
                   "#16a34a";

  const trackBg = isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%" }}>
      <div style={{ flex: 1, height: "3px", borderRadius: "99px", background: trackBg, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: "99px", backgroundColor: barColor, transition: "width 0.4s ease" }} />
      </div>
      <span style={{ fontSize: "10px", fontFamily: "monospace", fontWeight: 700, color: barColor, minWidth: "16px", textAlign: "right", lineHeight: 1 }}>
        {stock}
      </span>
    </div>
  );
}
