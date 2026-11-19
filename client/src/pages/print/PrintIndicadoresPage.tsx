/**
 * PrintIndicadoresPage.tsx — Reporte mensual de indicadores para dirección.
 *
 * Página /print/indicadores?mes=AAAA-MM (se abre en ventana pequeña desde el
 * Dashboard del administrador). Datos: GET /api/tickets/indicadores.
 *
 * Contenido (hoja carta horizontal, lista para imprimir o guardar en PDF):
 *   - Cifras del mes con la comparación contra el mes anterior.
 *   - Tickets por mes y tiempo promedio de resolución (12 meses, con la
 *     meta de 2 días marcada).
 *   - Tickets por categoría y por sucursal; consumo de insumos por sucursal
 *     y los 5 insumos más usados.
 *   - Tabla con todas las cifras de los 12 meses.
 *
 * Gráficas de una sola serie: un solo color; el mes elegido se resalta en
 * naranja y el resto en gris. Al pasar el mouse cada barra muestra su valor.
 *
 * @module client/pages/print/PrintIndicadoresPage
 */
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiFetch } from "../../services/api-client.js";
import { mesAnio, hoyISO } from "../../utils/fechas.js";
import { PageHeader, PageFooter, PageSize, Section, KpiStrip, nowFechaGen, LoadingPrint, ErrorPrint } from "../../components/PrintShared.tsx";
import "../../components/print/print-report.css";

interface MesTendencia {
  mes: string; tickets: number; resueltos: number; no_resueltos: number; cancelados: number; abiertos: number;
  horas_promedio: number | null; pct_meta: number | null; calificacion: number | null; piezas: number;
}
interface Indicadores {
  mes: string; meta_horas: number;
  resumen: MesTendencia & { anterior?: MesTendencia };
  tendencia: MesTendencia[];
  por_categoria: { nombre: string; tickets: number }[];
  por_sucursal: { nombre: string; tickets: number }[];
  consumo_sucursal: { nombre: string; piezas: number }[];
  top_insumos: { nombre: string; piezas: number }[];
}

const DESTACADO = "#F47920";   // mes elegido
const BASE      = "#94a3b8";   // demás meses / barras
const TINTA     = "#1D1D1B";
const TENUE     = "#64748b";

const nowISOmes = () => hoyISO().slice(0, 7);
const horasTxt = (h: number | null) => h == null ? "—" : h < 24 ? `${h.toFixed(1)} h` : `${(h / 24).toFixed(1)} días`;

/** "+3 vs mes anterior" con el sentido (mejor/peor) en palabras, no solo color. */
function cambio(actual: number | null, antes: number | null | undefined, unidad = "", menorEsMejor = false) {
  if (actual == null || antes == null) return "";
  const d = Math.round((actual - antes) * 10) / 10;
  if (d === 0) return "igual que el mes anterior";
  const mejor = menorEsMejor ? d < 0 : d > 0;
  return `${d > 0 ? "+" : ""}${d}${unidad} vs mes anterior${menorEsMejor || unidad === "%" ? (mejor ? " (mejor)" : " (peor)") : ""}`;
}

/** Barras verticales de 12 meses (una serie). `linea` dibuja una referencia (la meta). */
function BarrasMes({ datos, valor, formato, actual, linea, alto = 120 }: {
  datos: MesTendencia[]; valor: (m: MesTendencia) => number | null; formato: (v: number) => string;
  actual: string; linea?: { valor: number; etiqueta: string }; alto?: number;
}) {
  const vals = datos.map(valor);
  const max = Math.max(1, linea?.valor ?? 0, ...vals.map(v => v ?? 0)) * 1.15;
  const ancho = 100 / datos.length;
  const y = (v: number) => alto - (v / max) * alto;
  return (
    <svg viewBox={`0 0 100 ${alto + 16}`} preserveAspectRatio="none" style={{ width: "100%", height: alto + 16, display: "block" }} role="img">
      <line x1="0" x2="100" y1={alto} y2={alto} stroke="#cbd5e1" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
      {datos.map((m, i) => {
        const v = vals[i];
        const sel = m.mes === actual;
        const h = v ? (v / max) * alto : 0;
        return (
          <g key={m.mes}>
            <title>{`${mesAnio(m.mes)}: ${v == null ? "sin datos" : formato(v)}`}</title>
            <rect x={i * ancho} y={0} width={ancho} height={alto} fill="transparent" />
            {h > 0 && <rect x={i * ancho + ancho * 0.18} y={alto - h} width={ancho * 0.64} height={h} rx="0.8" fill={sel ? DESTACADO : BASE} />}
            {sel && v != null && (
              <text x={i * ancho + ancho / 2} y={Math.max(7, alto - h - 2)} textAnchor="middle" fontSize="5" fontWeight="700" fill={TINTA}>{formato(v)}</text>
            )}
            <text x={i * ancho + ancho / 2} y={alto + 10} textAnchor="middle" fontSize="4" fill={TENUE}>{m.mes.slice(5)}/{m.mes.slice(2, 4)}</text>
          </g>
        );
      })}
      {linea && (
        <g>
          <line x1="0" x2="100" y1={y(linea.valor)} y2={y(linea.valor)} stroke={TINTA} strokeWidth="1" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
          <text x="99.5" y={y(linea.valor) - 1.5} textAnchor="end" fontSize="4" fill={TINTA}>{linea.etiqueta}</text>
        </g>
      )}
    </svg>
  );
}

/** Barras horizontales (ranking) con el valor al final de cada barra. */
function Ranking({ filas, unidad, vacio }: { filas: { nombre: string; valor: number }[]; unidad: string; vacio: string }) {
  if (!filas.length) return <p style={{ margin: 0, fontSize: "8pt", color: TENUE }}>{vacio}</p>;
  const lista = filas.slice(0, 6);
  const max = Math.max(...lista.map(f => f.valor), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {lista.map(f => (
        <div key={f.nombre} title={`${f.nombre}: ${f.valor} ${unidad}`}
          style={{ display: "grid", gridTemplateColumns: "38% 1fr 34px", alignItems: "center", gap: 6, fontSize: "7.5pt" }}>
          <span style={{ color: TINTA, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.nombre}</span>
          <span style={{ height: 8, background: "#f1f5f9", borderRadius: 4 }}>
            <span style={{ display: "block", height: 8, width: `${(f.valor / max) * 100}%`, background: BASE, borderRadius: 4 }} />
          </span>
          <span style={{ textAlign: "right", fontWeight: 700, color: TINTA }}>{f.valor}</span>
        </div>
      ))}
      {filas.length > 6 && <span style={{ fontSize: "7pt", color: TENUE }}>y {filas.length - 6} más</span>}
    </div>
  );
}

export default function PrintIndicadoresPage() {
  const [params, setParams] = useSearchParams();
  const mes = /^\d{4}-\d{2}$/.test(params.get("mes") || "") ? String(params.get("mes")) : nowISOmes();
  const [datos, setDatos] = useState<Indicadores | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#ffffff";
    return () => { document.body.style.backgroundColor = prev; };
  }, []);

  useEffect(() => {
    let vivo = true;
    setDatos(null); setError("");
    apiFetch(`/api/tickets/indicadores?mes=${encodeURIComponent(mes)}`)
      .then(async r => {
        const d = await r.json().catch(() => ({}));
        if (!vivo) return;
        if (!r.ok) setError(d?.error || "No se pudieron cargar los indicadores.");
        else setDatos(d);
      })
      .catch((e: Error) => { if (vivo) setError(e.message || "No se pudieron cargar los indicadores."); });
    return () => { vivo = false; };
  }, [mes]);

  if (error) return <ErrorPrint message={error} />;
  if (!datos) return <LoadingPrint />;

  const r = datos.resumen, a = r.anterior;
  const cerrados = r.resueltos + r.no_resueltos;
  const fechaGen = nowFechaGen();

  return (
    <>
      <div className="pr-toolbar">
        <span className="pr-toolbar-title">Vista previa — Indicadores de {mesAnio(mes)}</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontSize: 12, color: "#fff", display: "flex", gap: 6, alignItems: "center" }}>
            Mes
            <input type="month" value={mes} max={nowISOmes()}
              onChange={e => e.target.value && setParams({ mes: e.target.value })}
              style={{ padding: "4px 6px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }} />
          </label>
          <button className="pr-btn pr-btn--outline" onClick={() => window.close()}>Cerrar</button>
          <button className="pr-btn pr-btn--primary" onClick={() => window.print()}>🖨  Imprimir / Guardar PDF</button>
        </div>
      </div>

      <div className="pr-root pr-landscape" data-ready="true" style={{ background: "#ffffff" }}>
        <PageSize landscape />
        <div className="pr-content">
          <PageHeader titulo="Indicadores mensuales" subtitulo="Soporte Técnico — reporte para dirección"
            metaRows={[{ label: "Periodo", value: mesAnio(mes), mono: true }, { label: "Generado", value: fechaGen }]} />

          <KpiStrip items={[
            { label: "Tickets levantados", value: r.tickets, color: TINTA },
            { label: "Resueltos", value: cerrados ? `${r.resueltos} de ${cerrados}` : r.resueltos, color: TINTA },
            { label: `Dentro de la meta (${datos.meta_horas / 24} días)`, value: r.pct_meta == null ? "—" : `${r.pct_meta}%`, color: TINTA },
            { label: "Tiempo prom. de resolución", value: horasTxt(r.horas_promedio), color: TINTA },
            { label: "Calificación promedio", value: r.calificacion == null ? "—" : `${r.calificacion} / 5`, color: TINTA },
            { label: "Piezas de insumos entregadas", value: r.piezas, color: TINTA },
          ]} />
          <p style={{ margin: "-2px 0 8px", fontSize: "7pt", color: TENUE }}>
            {[
              a && `Tickets: ${cambio(r.tickets, a.tickets)}`,
              a && a.pct_meta != null && r.pct_meta != null && `Meta: ${cambio(r.pct_meta, a.pct_meta, "%")}`,
              a && a.horas_promedio != null && r.horas_promedio != null && `Tiempo: ${cambio(r.horas_promedio, a.horas_promedio, " h", true)}`,
              a && `Piezas: ${cambio(r.piezas, a.piezas)}`,
              r.abiertos ? `${r.abiertos} ticket${r.abiertos !== 1 ? "s" : ""} del mes siguen abiertos` : "",
            ].filter(Boolean).join(" · ")}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Section title="Tickets levantados por mes">
              <BarrasMes datos={datos.tendencia} valor={m => m.tickets} formato={v => String(v)} actual={mes} />
            </Section>
            <Section title="Tiempo promedio de resolución (horas)">
              <BarrasMes datos={datos.tendencia} valor={m => m.horas_promedio} formato={v => `${v.toFixed(1)} h`} actual={mes}
                linea={{ valor: datos.meta_horas, etiqueta: `Meta ${datos.meta_horas} h` }} />
            </Section>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            <Section title="Tickets por categoría">
              <Ranking filas={datos.por_categoria.map(x => ({ nombre: x.nombre, valor: x.tickets }))} unidad="tickets" vacio="Sin tickets este mes." />
            </Section>
            <Section title="Tickets por sucursal">
              <Ranking filas={datos.por_sucursal.map(x => ({ nombre: x.nombre, valor: x.tickets }))} unidad="tickets" vacio="Sin tickets este mes." />
            </Section>
            <Section title="Consumo de insumos por sucursal (piezas)">
              <Ranking filas={datos.consumo_sucursal.map(x => ({ nombre: x.nombre, valor: x.piezas }))} unidad="piezas" vacio="Sin salidas de insumos este mes." />
            </Section>
            <Section title="Insumos más usados (piezas)">
              <Ranking filas={datos.top_insumos.map(x => ({ nombre: x.nombre, valor: x.piezas }))} unidad="piezas" vacio="Sin salidas de insumos este mes." />
            </Section>
          </div>

          <Section title="Cifras de los últimos 12 meses" noPad>
            <table className="pr-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "7pt" }}>
              <thead>
                <tr>{["Mes", "Tickets", "Resueltos", "No resueltos", "Cancelados", "Abiertos", "Tiempo prom.", "En meta", "Calificación", "Piezas"].map(h =>
                  <th key={h} style={{ textAlign: h === "Mes" ? "left" : "right", padding: "3px 6px", borderBottom: "1px solid #000" }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {datos.tendencia.map(m => (
                  <tr key={m.mes} style={{ fontWeight: m.mes === mes ? 700 : 400 }}>
                    <td style={{ padding: "2px 6px" }}>{mesAnio(m.mes)}</td>
                    {[m.tickets, m.resueltos, m.no_resueltos, m.cancelados, m.abiertos, horasTxt(m.horas_promedio),
                      m.pct_meta == null ? "—" : `${m.pct_meta}%`, m.calificacion == null ? "—" : m.calificacion, m.piezas]
                      .map((v, i) => <td key={i} style={{ padding: "2px 6px", textAlign: "right" }}>{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
          <p style={{ margin: "4px 0 0", fontSize: "6.5pt", color: TENUE }}>
            Los tickets cuentan en el mes en que se levantaron; el tiempo de resolución, la meta y la calificación, en el mes en que se resolvieron.
            Piezas = insumos que salieron del inventario (salidas internas y solicitudes aceptadas; las salidas anuladas no cuentan).
          </p>
        </div>
        <PageFooter right={`Indicadores ${mesAnio(mes)} · ${fechaGen}`} />
      </div>
    </>
  );
}
