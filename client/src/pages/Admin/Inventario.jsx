/**
 * Inventario.jsx
 *
 * Gestión del inventario de insumos (solo administrador): alta, edición, baja
 * lógica, visibilidad pública, fotos, entradas y salidas internas, y kardex de
 * movimientos con impresión.
 *
 * Export default: Inventario
 * Endpoints: GET /api/solicitudes/inventario, /api/categorias?tipo=insumo,
 *    /api/solicitudes/movimientos; POST/PUT/DELETE
 *    /api/solicitudes/insumos[/:id], PATCH …/activo y …/visible-publico, POST
 *    /api/solicitudes/salidas.
 * Se refresca con useAutoRefresh y con el evento Socket.io
 *    inventario:movimiento.
 *
 * @module client/pages/Admin/Inventario
 * @requires react
 * @requires ../../hooks/use-auto-refresh.js
 * @requires lucide-react
 * @requires exceljs
 * @requires file-saver
 * @requires ../../services/api-client.js
 * @requires ../../components/FiltrosToolbar.jsx
 * @requires ../../components/Feedback.jsx
 * @requires ../../components/Inventario/ModalInsumo.jsx
 * @requires ../../components/Inventario/ModalDetalleInsumo.jsx
 * @requires ../../components/Inventario/ModalEntradaInsumo.jsx
 * @requires ../../components/Inventario/ModalEditarEntrada.jsx
 * @requires ../../components/Inventario/ModalSalidaInsumo.jsx
 * @requires ../../components/Paginacion.jsx
 * @requires ../../utils/session.js
 * @requires ../../context/theme-context.js
 * @requires ../../utils/tipografia.js
 * @requires ../../components/LogoModal.jsx
 * @exports Inventario (default)
 */
import { useState, useEffect, useRef } from "react";
import { useAutoRefresh } from '../../hooks/use-auto-refresh.js';
import { Package, AlertTriangle, BarChart3, Inbox, Plus, RefreshCw, Layers, Eye, Ban, Trash2, CheckCircle2, Activity, ArrowDownToLine, ArrowUpFromLine, MoreVertical } from "lucide-react";
import { apiFetch, API_ROUTES } from '../../services/api-client.js';
import FiltrosToolbar from '../../components/FiltrosToolbar.jsx';
import { useToast } from '../../components/Feedback.jsx';
import ModalInsumo from '../../components/Inventario/ModalInsumo.jsx';
import ModalDetalleInsumo from '../../components/Inventario/ModalDetalleInsumo.jsx';
import ModalEntradaInsumo from '../../components/Inventario/ModalEntradaInsumo.jsx';
import ModalEditarEntrada from '../../components/Inventario/ModalEditarEntrada.jsx';
import ModalSalidaInsumo from '../../components/Inventario/ModalSalidaInsumo.jsx';
import Paginacion from '../../components/Paginacion.jsx';
import { getUsuario } from '../../utils/session.js';
import { useTheme } from '../../context/theme-context.js';
import { FS } from '../../utils/tipografia.js';
import LogoModal from '../../components/LogoModal.jsx';
import { STOCK_BAJO } from '../../utils/stock.js';
import { DataTable, EntradasTable, KpiCard } from '../../components/Inventario/TablasInventario.jsx';
import { BtnExportar, abrirImpresion } from '../../components/Inventario/ExportarInventario.jsx';
import { ORANGE, TEAL } from '../../components/Inventario/inventario-ui.js';
const ESTADO_OPTS = ["Excelente", "Bueno", "Regular", "Malo", "Dañado"];

const PAGE_SIZE  = 25; // coincide con el selector estándar [10, 25, 50, 100] de <Paginacion/>

// ── Página principal ──────────────────────────────────────────────
export default function Inventario() {
  const [insumos,    setInsumos]    = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [syncing,    setSyncing]    = useState(false);
  const [filtros,    setFiltros]    = useState({ busqueda: "", estado: "Todos", categoria: "Todos", stock: "Todos", activo: "Todos" });
  const [pagina,     setPagina]     = useState(1);
  const [pageSize,   setPageSize]   = useState(PAGE_SIZE);
  const [modal,      setModal]      = useState(null);
  const [detalle,    setDetalle]    = useState(null);
  const [entrada,    setEntrada]    = useState(null);
  const [editarMov,  setEditarMov]  = useState(null);  // entrada que se está corrigiendo
  const [salida,     setSalida]     = useState(null); // true = hoja de salida interna abierta
  const [confirmar,  setConfirmar]  = useState(null); // { tipo: "eliminar"|"activo"|"visible_publico", row, busy }
  const [gestionar,  setGestionar]  = useState(null); // row → panel "Inhabilitar o eliminar" (un solo botón)
  // ── Vista "Entradas" (entradas de material) ──
  const [vista,      setVista]      = useState("insumos");
  const [movs,       setMovs]       = useState([]);
  const [movTotal,   setMovTotal]   = useState(0);
  const [movLoading, setMovLoading] = useState(false);
  const [movPagina,  setMovPagina]  = useState(1);
  const [movPageSize, setMovPageSize] = useState(PAGE_SIZE);
  const [movFiltros, setMovFiltros] = useState({ q: "", fecha_inicio: "", fecha_fin: "", id_insumo: "" });
  const [movInsumo,  setMovInsumo]  = useState(null); // nombre del insumo activo en el chip de filtro
  const prevRef = useRef(null);
  const toast   = useToast();

  const cargarInventario = (esPrimera = false) => {
    if (!esPrimera) setSyncing(true);
    apiFetch("/api/solicitudes/inventario")
      .then(r => r.json())
      .then(d => {
        const lista = Array.isArray(d) ? d : [];
        setInsumos(prev => {
          if (prevRef.current) {
            const prevIds  = new Set(prevRef.current.map(i => i.id_insumo));
            const nuevos   = lista.filter(i => !prevIds.has(i.id_insumo));
            const agotados = lista.filter(i => {
              const ant = prevRef.current.find(p => p.id_insumo === i.id_insumo);
              return ant && ant.stock > 0 && i.stock === 0;
            });
            prevRef._nuevos = nuevos.length;
            prevRef._agotados = agotados.length;
          }
          prevRef.current = lista;
          return JSON.stringify(prev) === JSON.stringify(lista) ? prev : lista;
        });
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setSyncing(false);
        // Toast calls moved out of render phase: notify after state settles
        if (prevRef._nuevos)   toast.info(`${prevRef._nuevos} insumo(s) nuevo(s)`);
        if (prevRef._agotados) toast.warning(`${prevRef._agotados} insumo(s) agotado(s)`);
        prevRef._nuevos = 0;
        prevRef._agotados = 0;
      });
  };

  // ── Movimientos de material — GET /api/solicitudes/movimientos (admin)
  // `tipo` = "Entrada" | "Salida". Misma tabla, filtros y paginación.
  const cargarMovimientos = (tipo = "Entrada") => {
    setMovLoading(true);
    const p = new URLSearchParams({
      page:  String(movPagina),
      limit: String(movPageSize),
      tipo,
    });
    if (movFiltros.q?.trim())    p.set("q", movFiltros.q.trim());
    if (movFiltros.fecha_inicio) p.set("fecha_inicio", movFiltros.fecha_inicio);
    if (movFiltros.fecha_fin)    p.set("fecha_fin", movFiltros.fecha_fin);
    if (movFiltros.id_insumo)    p.set("id_insumo", String(movFiltros.id_insumo));
    apiFetch(`/api/solicitudes/movimientos?${p.toString()}`)
      .then(r => r.json())
      .then(d => {
        setMovs(Array.isArray(d?.rows) ? d.rows : []);
        setMovTotal(Number(d?.total) || 0);
      })
      .catch(() => {})
      .finally(() => setMovLoading(false));
  };

  // Compat: los llamados viejos siguen funcionando (pestaña Entradas).
  const cargarEntradas = () => cargarMovimientos("Entrada");
  // Tipo activo según la pestaña: "entradas" -> Entrada, "salidas" -> Salida.
  const tipoMovActivo = vista === "salidas" ? "Salida" : "Entrada";

  useEffect(() => {
    cargarInventario(true);
    apiFetch("/api/categorias?tipo=insumo").then(r => r.json()).then(d => setCategorias(Array.isArray(d) ? d : [])).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar los movimientos al entrar a Entradas (la pestaña Salidas es solo para CREAR salidas)
  useEffect(() => {
    if (vista !== "entradas") return;
    cargarMovimientos("Entrada");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista, movPagina, movPageSize, movFiltros]);

  useAutoRefresh(() => {
    if (vista === "entradas") cargarMovimientos("Entrada");
    else cargarInventario(false);
  }, 30000);

  const handleSave = (data, isEdit) => {
    setInsumos(prev => isEdit ? prev.map(i => i.id_insumo === data.id_insumo ? data : i) : [...prev, data]);
    setModal(null);
  };

  // Eliminar (borrado físico) e inhabilitar/habilitar (baja lógica).
  const ejecutarConfirmado = async () => {
    if (!confirmar?.row) return;
    const { tipo, row } = confirmar;
    setConfirmar(c => ({ ...c, busy: true }));
    try {
      if (tipo === "eliminar") {
        const r = await apiFetch(`/api/solicitudes/insumos/${row.id_insumo}`, { method: "DELETE" });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d?.error || `Error ${r.status} al eliminar`);
        setInsumos(prev => prev.filter(i => i.id_insumo !== row.id_insumo));
        toast.success(`Insumo "${row.nombre}" eliminado`);
      } else if (tipo === "visible_publico") {
        const nuevo = Number(row.visible_publico ?? 1) === 0;
        const r = await apiFetch(API_ROUTES.INSUMO_VISIBLE(row.id_insumo), {
          method: "PATCH", body: JSON.stringify({ visible: nuevo }),
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d?.error || `Error ${r.status} al cambiar visibilidad`);
        setInsumos(prev => prev.map(i => i.id_insumo === row.id_insumo ? { ...i, visible_publico: nuevo ? 1 : 0 } : i));
        toast.success(nuevo ? `Insumo "${row.nombre}" visible al público` : `Insumo "${row.nombre}" oculto al público`);
      } else {
        const nuevo = Number(row.activo ?? 1) === 0;
        const r = await apiFetch(API_ROUTES.INSUMO_ACTIVO(row.id_insumo), {
          method: "PATCH", body: JSON.stringify({ activo: nuevo }),
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d?.error || `Error ${r.status} al cambiar estado`);
        setInsumos(prev => prev.map(i => i.id_insumo === row.id_insumo ? { ...i, activo: nuevo ? 1 : 0 } : i));
        toast.success(nuevo ? `Insumo "${row.nombre}" habilitado` : `Insumo "${row.nombre}" inhabilitado`);
      }
      setConfirmar(null);
    } catch (err) {
      toast.error(err.message || "No se pudo completar la acción");
      setConfirmar(c => ({ ...c, busy: false }));
    }
  };

  // Ver los movimientos de un insumo puntual → pestaña Entradas/Salidas con filtro id_insumo
  const verMovimientosInsumo = (row, destino = "entradas") => {
    setMovFiltros({ q: "", fecha_inicio: "", fecha_fin: "", id_insumo: row.id_insumo });
    setMovInsumo(row.nombre);
    setMovPagina(1);
    setVista(destino);
  };
  const verEntradasInsumo = (row) => verMovimientosInsumo(row, "entradas");
  const verSalidasInsumo  = (row) => verMovimientosInsumo(row, "salidas");
  const limpiarInsumo = () => {
    setMovFiltros(p => ({ ...p, id_insumo: "" }));
    setMovInsumo(null);
    setMovPagina(1);
  };
  // Al cambiar de pestaña Entradas <-> Salidas se resetea página y filtro por insumo
  const cambiarVistaMov = (id) => {
    // "Salidas" es una ACCIÓN: abre el modal de salida SIN cambiar la vista de
    // fondo, para que no aparezca la pantalla/tarjeta vacía "Registrar salida"
    // detrás del modal. El usuario solo ve el modal.
    if (id === "salidas") {
      setMovFiltros({ q: "", fecha_inicio: "", fecha_fin: "", id_insumo: "" });
      setMovInsumo(null);
      setMovPagina(1);
      setSalida(true);
      return;
    }
    setMovFiltros({ q: "", fecha_inicio: "", fecha_fin: "", id_insumo: "" });
    setMovInsumo(null);
    setMovPagina(1);
    setVista(id);
  };

  // Etiquetas de los filtros activos de la pestaña Insumos (para la hoja impresa)
  const etiquetasInsumos = [];
  if (filtros.busqueda?.trim())                            etiquetasInsumos.push(`Búsqueda: "${filtros.busqueda.trim()}"`);
  if (filtros.estado && filtros.estado !== "Todos")        etiquetasInsumos.push(`Estado: ${filtros.estado}`);
  if (filtros.categoria && filtros.categoria !== "Todos")  etiquetasInsumos.push(`Categoría: ${filtros.categoria}`);
  if (filtros.stock && filtros.stock !== "Todos")          etiquetasInsumos.push(`Stock: ${filtros.stock}`);

  // Hoja de Entradas/Salidas: trae TODOS los movimientos del tipo actual con los filtros.
  // El backend limita a 500 registros por petición → se pagina en bloques de 500.
  // Usa la misma vista de impresión de entradas (PrintEntradasPage) con título dinámico.
  const exportarMovimientosPDF = async (tipo = "Entrada") => {
    const esSalida = tipo === "Salida";
    try {
      const BLOQUE = 500;
      const MAX    = 20000; // tope de seguridad
      let rows = [], total = 0, page = 1, chunk = [];
      do {
        const p = new URLSearchParams({ page: String(page), limit: String(BLOQUE), tipo });
        if (movFiltros.q?.trim())    p.set("q", movFiltros.q.trim());
        if (movFiltros.fecha_inicio) p.set("fecha_inicio", movFiltros.fecha_inicio);
        if (movFiltros.fecha_fin)    p.set("fecha_fin", movFiltros.fecha_fin);
        if (movFiltros.id_insumo)    p.set("id_insumo", String(movFiltros.id_insumo));
        const r = await apiFetch(`/api/solicitudes/movimientos?${p.toString()}`);
        const d = await r.json();
        chunk = Array.isArray(d?.rows) ? d.rows : [];
        rows  = rows.concat(chunk);
        total = Number(d?.total) || rows.length;
        page += 1;
      } while (chunk.length === BLOQUE && rows.length < total && rows.length < MAX);

      const etiquetas = [];
      if (movFiltros.q?.trim())                            etiquetas.push(`Búsqueda: "${movFiltros.q.trim()}"`);
      if (movFiltros.fecha_inicio || movFiltros.fecha_fin) etiquetas.push(`Periodo: ${movFiltros.fecha_inicio || "…"} al ${movFiltros.fecha_fin || "…"}`);
      if (movInsumo)                                       etiquetas.push(`Insumo: ${movInsumo}`);

      sessionStorage.setItem("print_entradas_datos", JSON.stringify({ rows, filtros: etiquetas, total, tipo }));
      abrirImpresion("/print/entradas");
    } catch {
      toast.error(esSalida ? "No se pudo generar la hoja de salidas" : "No se pudo generar la hoja de entradas");
    }
  };
  // Compat: los llamados viejos siguen funcionando (pestaña Entradas).
  const exportarEntradasPDF = () => exportarMovimientosPDF("Entrada");

  // ── Salida interna: guarda el formato que trae el modal y abre la hoja para llenar/firmar
  const salidaGuardada = (d, form) => {
    setSalida(null);
    cargarInventario(false);
    if (vista === "entradas") cargarMovimientos("Entrada");
    try {
      const u = getUsuario() ?? {};
      const registrado = [u.nombre, u.ap_paterno, u.ap_materno].filter(Boolean).join(" ").trim();
      sessionStorage.setItem("print_salida_datos", JSON.stringify({
        folio:     d.folio,
        fecha:     new Date().toISOString(),
        rows:      Array.isArray(d.movimientos) ? d.movimientos : [],
        destino:     form?.destino || "",
        responsable: form?.responsable || "",
        motivo:      form?.motivo || "",
        solicitante: form?.solicitante || "",
        solicitante_puesto:   form?.solicitante_puesto || "",
        solicitante_sucursal: form?.solicitante_sucursal || "",
        solicitante_num:      form?.solicitante_num || "",
        registrado_por: registrado,
      }));
      abrirImpresion("/print/salida");
    } catch {
      toast.error("Salida registrada, pero no se pudo abrir la hoja de impresión");
    }
  };

  const catOpts      = ["Todos", ...Array.from(new Set(insumos.map(i => i.nombre_categoria).filter(Boolean)))];
  const camposFiltro = [
    { key: "busqueda",  label: "Búsqueda Rápida", type: "search", placeholder: "Nombre, marca, modelo…" },
    { key: "estado",    label: "Estado",           type: "select", opts: ["Todos", ...ESTADO_OPTS] },
    { key: "categoria", label: "Categoría",        type: "select", opts: catOpts },
    { key: "stock",     label: "Stock",            type: "select", opts: ["Todos", "Con stock", "Sin stock"] },
    { key: "activo",    label: "Visibilidad",      type: "select", opts: ["Todos", "Activos", "Inhabilitados"] },
  ];

  // Filtros de las pestañas "Entradas" / "Salidas" (misma barra)
  const camposFiltroE = [
    { key: "q",            label: "Búsqueda", type: "search", placeholder: "Insumo, motivo, folio…", debounce: 300 },
    { key: "fecha_inicio", label: "Desde",    type: "date" },
    { key: "fecha_fin",    label: "Hasta",    type: "date" },
  ];

  const filtrados = insumos.filter(i => {
    const q = filtros.busqueda?.toLowerCase();
    if (q && !i.nombre?.toLowerCase().includes(q) && !i.marca?.toLowerCase().includes(q) &&
        !i.modelo?.toLowerCase().includes(q) && !i.num_serie?.toLowerCase().includes(q)) return false;
    if (filtros.estado    !== "Todos" && i.estado           !== filtros.estado)    return false;
    if (filtros.categoria !== "Todos" && i.nombre_categoria !== filtros.categoria) return false;
    if (filtros.stock === "Con stock" && !(i.stock > 0))  return false;
    if (filtros.stock === "Sin stock" &&   i.stock > 0)   return false;
    if (filtros.activo === "Activos" && Number(i.activo ?? 1) === 0) return false;
    if (filtros.activo === "Inhabilitados" && Number(i.activo ?? 1) !== 0) return false;
    return true;
  });

  const hayFiltros    = filtros.busqueda || filtros.estado !== "Todos" || filtros.categoria !== "Todos" || filtros.stock !== "Todos" || filtros.activo !== "Todos";
  const totalPaginas  = Math.max(1, Math.ceil(filtrados.length / pageSize));
  const paginaActual  = Math.min(pagina, totalPaginas);
  const filasPagina   = filtrados.slice((paginaActual - 1) * pageSize, paginaActual * pageSize);
  const irPagina      = p => { if (p >= 1 && p <= totalPaginas) setPagina(p); };
  const totalStock     = insumos.reduce((s, i) => s + (i.stock || 0), 0);
  const categoriasCnt  = new Set(insumos.map(i => i.id_categoria).filter(Boolean)).size;
  const stockBajo      = insumos.filter(i => (i.stock ?? 0) > 0 && (i.stock ?? 0) <= STOCK_BAJO).length;
  const sinStock       = insumos.filter(i => (i.stock ?? 0) === 0).length;
  const criticos       = stockBajo + sinStock;
  const estadoBueno    = insumos.filter(i => i.estado === "Excelente" || i.estado === "Bueno").length;
  // Regular, Malo y Dañado cuentan como estado deficiente para la tasa de salud.
  const estadoMalo     = insumos.filter(i => i.estado === "Malo" || i.estado === "Regular" || i.estado === "Dañado").length;
  const tasaSalud      = insumos.length > 0 ? Math.round((estadoBueno / insumos.length) * 100) : 0;

  // Entradas: paginación del servidor
  const movTotalPaginas = Math.max(1, Math.ceil(movTotal / movPageSize));
  const movPaginaActual = Math.min(movPagina, movTotalPaginas);

  const { T } = useTheme();

  return (
    <div style={{ background: T.bg, height: "100%", display: "flex", flexDirection: "column", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", overflow: "hidden" }}>
      <div style={{ maxWidth: "1400px", width: "100%", margin: "0 auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "10px", flex: 1, minHeight: 0 }}>

        {/* ── Page Header ───────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
          {/* Tabs: Insumos / Entradas / Salidas */}
          <div style={{ display: "flex", gap: "4px" }}>
            {[
              { id: "insumos",  label: "Insumos",  Icon: Package },
              { id: "entradas", label: "Entradas", Icon: ArrowDownToLine },
              { id: "salidas",  label: "Salidas",  Icon: ArrowUpFromLine },
            ].map(({ id, label, Icon }) => {
              const activa = vista === id;
              const esRojo = id === "salidas";
              const esVerde = id === "entradas";
              if (esRojo) {
                return (
                  <button
                    key={id}
                    onClick={() => cambiarVistaMov(id)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "5px",
                      padding: "7px 14px", borderRadius: "6px", cursor: "pointer",
                      fontSize: FS.secundario, fontWeight: 700, transition: "all 0.15s",
                      border: activa ? "1px solid #dc2626" : "1px solid rgba(220,38,38,0.45)",
                      background: activa ? "#dc2626" : "transparent",
                      color: activa ? "#fff" : (T.isDark ? "#f87171" : "#dc2626"),
                    }}
                  >
                    <Icon size={13} /> {label}
                  </button>
                );
              }
              if (esVerde) {
                return (
                  <button
                    key={id}
                    onClick={() => cambiarVistaMov(id)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "5px",
                      padding: "7px 14px", borderRadius: "6px", cursor: "pointer",
                      fontSize: FS.secundario, fontWeight: 700, transition: "all 0.15s",
                      border: activa ? "1px solid #16a34a" : "1px solid rgba(22,163,74,0.45)",
                      background: activa ? "#16a34a" : "transparent",
                      color: activa ? "#fff" : (T.isDark ? "#4ade80" : "#16a34a"),
                    }}
                  >
                    <Icon size={13} /> {label}
                  </button>
                );
              }
              const colorActivo = TEAL.base;
              const fondoActivo = T.isDark ? "rgba(13,148,136,0.18)" : TEAL.light;
              return (
                <button
                  key={id}
                  onClick={() => (id === "entradas" || id === "salidas" ? cambiarVistaMov(id) : setVista(id))}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "5px",
                    padding: "7px 14px", borderRadius: "6px", cursor: "pointer",
                    fontSize: FS.secundario, fontWeight: 700, transition: "all 0.15s",
                    border: `1px solid ${activa ? colorActivo : T.border}`,
                    background: activa ? fondoActivo : "transparent",
                    color: activa ? colorActivo : T.textMuted,
                  }}
                >
                  <Icon size={13} /> {label}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {syncing && <RefreshCw size={11} style={{ color: TEAL.base, animation: "spin 1s linear infinite" }} />}
            {vista === "insumos" && <BtnExportar datos={filtrados} filtros={etiquetasInsumos} T={T} />}
            {vista === "entradas" && <BtnExportar vista="entradas" onPdf={exportarEntradasPDF} T={T} />}
            {/* Pestaña Salidas: el listado vive en Historial de Insumos; el
                botón para HACER la salida queda solo en el panel central. */}
            {vista === "insumos" && (
              <button
                onClick={() => setModal({})}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "8px 14px", borderRadius: "6px", border: "none",
                  background: TEAL.base, color: "#fff",
                  fontSize: FS.secundario, fontWeight: 600, cursor: "pointer",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                <Plus size={14} /> Nuevo insumo
              </button>
            )}
          </div>
        </div>

        {/* ── KPIs (solo pestaña Insumos) ──────────────────────── */}
        {vista === "insumos" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "6px" }}>
          <KpiCard
            label="Total Registrados" value={insumos.length}
            sub={`${categoriasCnt} categoría${categoriasCnt !== 1 ? "s" : ""} · ${insumos.filter(i => i.stock > 0).length} con existencia`}
            icon={Package} color={TEAL.base}
            pct={insumos.length > 0 ? Math.round((insumos.filter(i => i.stock > 0).length / insumos.length) * 100) : 0}
          />
          <KpiCard
            label="Piezas en Stock" value={totalStock}
            sub={`Promedio ${insumos.length > 0 ? (totalStock / insumos.length).toFixed(1) : 0} uds. por insumo`}
            icon={BarChart3} color="#2563eb"
          />
          <KpiCard
            label="Críticos" value={criticos}
            sub={`${stockBajo} stock bajo · ${sinStock} agotado${sinStock !== 1 ? "s" : ""}`}
            icon={AlertTriangle} color={ORANGE.base} highlight={criticos > 0}
            pct={insumos.length > 0 ? Math.round((criticos / insumos.length) * 100) : 0}
          />
          <KpiCard
            label="Salud del Catálogo" value={`${tasaSalud}%`}
            sub={estadoMalo > 0 ? `${estadoMalo} en estado deficiente` : "Todo en buen estado"}
            icon={tasaSalud >= 70 ? CheckCircle2 : Activity}
            color={tasaSalud >= 70 ? "#16a34a" : tasaSalud >= 40 ? "#d97706" : "#dc2626"}
            highlight={tasaSalud < 70} pct={tasaSalud}
          />
        </div>
        )}

        {/* ── Filtros ───────────────────────────────────────────── */}
        {vista === "insumos" ? (
          <FiltrosToolbar
            campos={camposFiltro}
            valores={filtros}
            onChange={(k, v) => { setFiltros(p => ({ ...p, [k]: v })); setPagina(1); }}
            onLimpiar={() => { setFiltros({ busqueda: "", estado: "Todos", categoria: "Todos", stock: "Todos", activo: "Todos" }); setPagina(1); }}
            T={T}
          />
        ) : vista === "entradas" ? (
          <FiltrosToolbar
            campos={camposFiltroE}
            valores={movFiltros}
            onChange={(k, v) => { setMovFiltros(p => ({ ...p, [k]: v })); setMovPagina(1); }}
            onLimpiar={() => { setMovFiltros({ q: "", fecha_inicio: "", fecha_fin: "", id_insumo: "" }); setMovInsumo(null); setMovPagina(1); }}
            loading={movLoading}
            T={T}
          />
        ) : null}

        {/* ── Tabla principal ───────────────────────────────────── */}
        <div style={{ background: T.surface, borderRadius: "8px", border: `1px solid ${T.border}`, boxShadow: T.shadowSm, overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>

          {/* Toolbar de tabla */}
          <div style={{
            padding: "7px 12px", background: T.surfaceAlt, borderBottom: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Layers size={14} style={{ color: TEAL.base }} />
              <span style={{ fontSize: FS.secundario, fontWeight: 700, color: T.text }}>
                {vista === "insumos" ? "Catálogo de Insumos" : vista === "salidas" ? "Registrar salida de material" : "Entradas de material"}
              </span>
              {vista !== "salidas" && (
                <span style={{
                  fontSize: FS.secundario, fontWeight: 600, padding: "2px 8px", borderRadius: "99px",
                  background: T.isDark ? "rgba(13,148,136,0.18)" : "#f0fdfa",
                  color: "#0d9488",
                  border: T.isDark ? "1px solid rgba(13,148,136,0.35)" : "1px solid #99f6e4",
                }}>
                  {vista === "insumos"
                    ? `${filtrados.length} registro${filtrados.length !== 1 ? "s" : ""}`
                    : `${movTotal} entrada${movTotal !== 1 ? "s" : ""}`}
                </span>
              )}
              {vista === "entradas" && movInsumo && (
                <button onClick={limpiarInsumo} title="Quitar filtro por insumo"
                  style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: FS.secundario, fontWeight: 700, padding: "2px 8px", borderRadius: "99px", cursor: "pointer", background: T.isDark ? "rgba(37,99,235,0.18)" : "#eff6ff", color: "#2563eb", border: T.isDark ? "1px solid rgba(37,99,235,0.40)" : "1px solid #bfdbfe" }}>
                  <Package size={10} />
                  {movInsumo}
                  <span style={{ fontSize: FS.secundario, fontWeight: 800, lineHeight: 1 }}>✕</span>
                </button>
              )}
            </div>

          </div>

          {/* Contenido */}
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "auto" }}>
            {vista === "salidas" ? (
              /* La pestaña "Salidas" abre DIRECTO el modal de salida (no lista nada).
                 El modal se dispara en cambiarVistaMov; no hay pantalla intermedia. */
              null
            ) : vista === "entradas" ? (
              movLoading && movs.length === 0 ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
                  <RefreshCw size={24} style={{ color: TEAL.base, animation: "spin 1s linear infinite" }} />
                </div>
              ) : movs.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 24px", gap: "10px" }}>
                  <div style={{ width: "52px", height: "52px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                    <Inbox size={24} style={{ color: T.textFaint }} />
                  </div>
                  <p style={{ margin: 0, fontSize: FS.enfasis, fontWeight: 600, color: T.textMuted }}>
                    {movInsumo ? `Sin entradas de "${movInsumo}" — ajusta los filtros` : "Sin entradas registradas — ajusta los filtros"}
                  </p>
                </div>
              ) : (
                <EntradasTable rows={movs} tipo={tipoMovActivo} onEditar={setEditarMov} />
              )
            ) : loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
                <RefreshCw size={24} style={{ color: TEAL.base, animation: "spin 1s linear infinite" }} />
              </div>
            ) : filtrados.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 24px", gap: "10px" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                  <Inbox size={24} style={{ color: T.textFaint }} />
                </div>
                <p style={{ margin: 0, fontSize: FS.enfasis, fontWeight: 600, color: T.textMuted }}>
                  {hayFiltros ? "Sin resultados — ajusta los filtros" : "No hay insumos registrados"}
                </p>
              </div>
            ) : (
              <DataTable rows={filasPagina} onDetail={setDetalle} onEditar={row => setModal(row)} onEntrada={setEntrada}
                onSalida={(row) => setSalida({ id_insumo: row.id_insumo, nombre: row.nombre })}
                onHistorial={verEntradasInsumo}
                onGestionar={row => setGestionar(row)} />
            )}
          </div>
          {/* Paginación — componente compartido, siempre visible dentro del card */}
          <Paginacion
            variant="table"
            page={vista === "insumos" ? paginaActual : movPaginaActual}
            onPageChange={vista === "insumos" ? irPagina : setMovPagina}
            total={vista === "insumos" ? filtrados.length : movTotal}
            pageSize={vista === "insumos" ? pageSize : movPageSize}
            onPageSizeChange={vista === "insumos" ? setPageSize : setMovPageSize}
            T={T}
          />
        </div>

      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

      {detalle && (
        <ModalDetalleInsumo insumo={detalle} onClose={() => setDetalle(null)} T={T} />
      )}
      {modal !== null && (
        <ModalInsumo insumo={modal} categorias={categorias}
          onClose={() => setModal(null)} onSave={handleSave} T={T} />
      )}
      {editarMov && (
        <ModalEditarEntrada movimiento={editarMov} T={T}
          onClose={() => setEditarMov(null)}
          onSaved={() => { cargarInventario(false); cargarMovimientos("Entrada"); }} />
      )}
      {entrada !== null && (
        <ModalEntradaInsumo insumo={entrada}
          onClose={() => setEntrada(null)}
          onSaved={() => { setEntrada(null); cargarInventario(false); cargarMovimientos(vista === "salidas" ? "Salida" : "Entrada"); }}
          T={T} />
      )}
      {salida !== null && (
        <ModalSalidaInsumo insumos={insumos}
          insumoInicial={typeof salida === "object" ? salida?.id_insumo : null}
          onClose={() => setSalida(null)}
          onSaved={salidaGuardada}
          T={T} />
      )}

      {/* Gestionar insumo: en la tabla hay UN solo botón (⋮) y aquí se elige qué hacer */}
      {gestionar && (
        <div role="dialog" aria-modal="true"
          onMouseDown={e => { if (e.target === e.currentTarget) setGestionar(null); }}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ width: "min(450px, 100%)", maxHeight: "90vh", overflowY: "auto", background: T.surface, borderRadius: "10px",
            border: `1px solid ${T.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10 }}>
              <MoreVertical size={16} style={{ color: T.textMuted }} />
              <strong style={{ fontSize: FS.enfasis, color: T.text }}>Gestionar insumo</strong>
              <LogoModal style={{ marginLeft: "auto" }} />
            </div>
            <div style={{ padding: "14px 18px", fontSize: FS.cuerpo, color: T.textMuted, lineHeight: 1.6 }}>
              ¿Qué quieres hacer con <strong style={{ color: T.text }}>“{gestionar.nombre}”</strong>?
              <ul style={{ margin: "8px 0 0", paddingLeft: "18px" }}>
                <li><strong style={{ color: T.text }}>Inhabilitar/Habilitar:</strong> baja lógica — se oculta de Salidas y solicitudes conservando su historial.</li>
                <li><strong style={{ color: T.text }}>Visible Público:</strong> controla si el insumo aparece en el catalogo público (inventario, reportes). 0 = oculto, 1 = visible.</li>
              </ul>
            </div>
            <div style={{ padding: "10px 18px", borderTop: `1px solid ${T.border}`, background: T.surfaceAlt,
              display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={() => setGestionar(null)}
                style={{ padding: "6px 16px", borderRadius: 6, fontSize: FS.cuerpo, fontWeight: 600, background: "transparent",
                  border: `1px solid ${T.border}`, color: T.textMuted, cursor: "pointer" }}>
                Cancelar
              </button>
              <button type="button"
                onClick={() => { setConfirmar({ tipo: "activo", row: gestionar, busy: false }); setGestionar(null); }}
                style={{ padding: "6px 16px", borderRadius: 6, fontSize: FS.cuerpo, fontWeight: 700, border: "none", color: "#fff",
                  background: Number(gestionar.activo ?? 1) === 0 ? "#16a34a" : "#d97706", cursor: "pointer" }}>
                {Number(gestionar.activo ?? 1) === 0 ? "Habilitar" : "Inhabilitar"}
              </button>
              <button type="button"
                onClick={() => { setConfirmar({ tipo: "visible_publico", row: gestionar, busy: false }); setGestionar(null); }}
                style={{ padding: "6px 16px", borderRadius: 6, fontSize: FS.cuerpo, fontWeight: 700, border: "none", color: "#fff",
                  background: Number(gestionar.visible_publico ?? 1) === 0 ? "#0d9488" : "#0284c7", cursor: "pointer" }}>
                {Number(gestionar.visible_publico ?? 1) === 0 ? "Hacer visible" : "Ocultar público"}</button>
<button type="button"
                onClick={() => { setConfirmar({ tipo: "eliminar", row: gestionar, busy: false }); setGestionar(null); }}
                style={{ padding: "6px 16px", borderRadius: 6, fontSize: FS.cuerpo, fontWeight: 700, border: "none", color: "#fff",
                  background: "#dc2626", cursor: "pointer" }}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar eliminar / inhabilitar / habilitar */}
      {confirmar?.row && (
        <div role="dialog" aria-modal="true"
          onMouseDown={e => { if (e.target === e.currentTarget && !confirmar.busy) setConfirmar(null); }}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ width: "min(420px, 100%)", maxHeight: "90vh", overflowY: "auto", background: T.surface, borderRadius: "10px",
            border: `1px solid ${T.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10 }}>
              {confirmar.tipo === "eliminar"
                ? <Trash2 size={16} style={{ color: "#dc2626" }} />
                : confirmar.tipo === "visible_publico"
                ? <Eye size={16} style={{ color: "#0284c7" }} />
                : <Ban size={16} style={{ color: "#d97706" }} />}
              <strong style={{ fontSize: FS.enfasis, color: T.text }}>
                {confirmar.tipo === "eliminar" ? "Eliminar insumo"
                  : Number(confirmar.row.activo ?? 1) === 0 ? "Habilitar insumo" : "Inhabilitar insumo"}
              </strong>
              <LogoModal style={{ marginLeft: "auto" }} />
            </div>
            <div style={{ padding: "14px 18px", fontSize: FS.cuerpo, color: T.textMuted, lineHeight: 1.6 }}>
              {confirmar.tipo === "eliminar" ? (
                <>¿Eliminar <strong style={{ color: T.text }}>“{confirmar.row.nombre}”</strong> del catálogo?
                Solo se puede si no tiene solicitudes activas ni movimientos. Si tiene historial, inhabilítalo en su lugar.</>
              ) : confirmar.tipo === "visible_publico" ? (
                Number(confirmar.row.visible_publico ?? 1) === 0 ? (
                  <>¿Hacer <strong style={{ color: T.text }}>“{confirmar.row.nombre}”</strong> visible público? Aparecerá en el catálogo público.</>
                ) : (
                  <>¿Ocultar <strong style={{ color: T.text }}>“{confirmar.row.nombre}”</strong> del público? Sólo los administradores podrán verlo.</>
                )
              ) : Number(confirmar.row.activo ?? 1) === 0 ? (
                <>¿Habilitar <strong style={{ color: T.text }}>“{confirmar.row.nombre}”</strong>? Volverá a aparecer en Salidas y solicitudes.</>
              ) : (
                <>¿Inhabilitar <strong style={{ color: T.text }}>“{confirmar.row.nombre}”</strong>? Se ocultará de Salidas y solicitudes, pero se conserva su historial.</>
              )}
            </div>
            <div style={{ padding: "10px 18px", borderTop: `1px solid ${T.border}`, background: T.surfaceAlt,
              display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" disabled={confirmar.busy} onClick={() => setConfirmar(null)}
                style={{ padding: "6px 16px", borderRadius: 6, fontSize: FS.cuerpo, fontWeight: 600, background: "transparent",
                  border: `1px solid ${T.border}`, color: T.textMuted, cursor: "pointer" }}>
                Cancelar
              </button>
              <button type="button" disabled={confirmar.busy} onClick={ejecutarConfirmado}
                style={{ padding: "6px 18px", borderRadius: 6, fontSize: FS.cuerpo, fontWeight: 700, border: "none", color: "#fff",
                  background: confirmar.tipo === "eliminar" ? "#dc2626" : confirmar.tipo === "visible_publico" ? "#0284c7" : "#d97706",
                  cursor: confirmar.busy ? "not-allowed" : "pointer", opacity: confirmar.busy ? 0.6 : 1 }}>
                {confirmar.busy ? "Procesando…" : confirmar.tipo === "eliminar" ? "Eliminar"
                  : confirmar.tipo === "visible_publico"
                  ? Number(confirmar.row.visible_publico ?? 1) === 0 ? "Hacer visible" : "Ocultar público"
                  : Number(confirmar.row.activo ?? 1) === 0 ? "Habilitar" : "Inhabilitar"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
