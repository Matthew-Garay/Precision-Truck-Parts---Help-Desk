/**
 * Personal.jsx
 *
 * Gestión del personal (solo administrador): alta y edición de empleados, rol,
 * puesto, sucursal y estatus, e historial de accesos imprimible.
 *
 * Export default: Personal
 * Props: T.
 * Endpoints: GET/POST /api/auth/empleados, PUT /api/auth/empleados/:id, GET
 *    /api/auth/accesos/:id, catálogos
 *    /api/auth/roles|departamentos|sucursales.
 *
 * @module client/pages/Admin/Personal
 * @requires react
 * @requires ../../hooks/use-auto-refresh.js
 * @requires ../../services/api-client.js
 * @requires ../../utils/email.js
 * @requires ../../utils/password.js
 * @requires ../../components/FiltrosToolbar.jsx
 * @requires ../../components/Paginacion.jsx
 * @requires lucide-react
 * @requires ../../components/Card.jsx
 * @requires ../../utils/tipografia.js
 * @requires ../../components/LogoModal.jsx
 * @exports Personal (default)
 */
import { useState, useEffect, useCallback } from "react";
import { useAutoRefresh } from '../../hooks/use-auto-refresh.js';
import { apiFetch } from '../../services/api-client.js';
import FiltrosToolbar from '../../components/FiltrosToolbar.jsx';
import { FS } from '../../utils/tipografia.js';
import { ModalConfirm, useToast } from '../../components/Feedback.jsx';
import { ModalEmpleado, ORANGE } from '../../components/Personal/ModalEmpleado.jsx';
import { ModalHistorial } from '../../components/Personal/ModalHistorialAccesos.jsx';
import { TablaEmpleados, normalizar } from '../../components/Personal/TablaEmpleados.jsx';
import ModalAreas from '../../components/Personal/ModalAreas.jsx';

const FILTROS_INIT = { busqueda: "", departamento: "Todos", sucursal: "Todos", estatus: "Todos" };

// ── Personal (página principal) ───────────────────────────────────
export default function Personal({ T }) {
  const isDark = T.isDark;
  const [empleados, setEmpleados] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [roles, setRoles] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState(FILTROS_INIT);
  const [modal, setModal] = useState(null);
  const [modalHistorial, setModalHistorial] = useState(null);
  const [verAreas, setVerAreas] = useState(false);
  const cargar = useCallback((mostrarLoading = true) => {
    if (mostrarLoading) setLoading(true);
    Promise.all([
      apiFetch(`/api/auth/empleados`).then(r => r.ok ? r.json() : []),
      apiFetch(`/api/auth/departamentos`).then(r => r.ok ? r.json() : []),
      apiFetch(`/api/auth/roles`).then(r => r.ok ? r.json() : []),
      apiFetch(`/api/auth/sucursales`).then(r => r.ok ? r.json() : []),
    ]).then(([emps, deps, rols, sucs]) => {
      setEmpleados(Array.isArray(emps) ? emps : []);
      setDepartamentos(Array.isArray(deps) ? deps : []);
      setRoles(Array.isArray(rols) ? rols : []);
      setSucursales(Array.isArray(sucs) ? sucs : []);
    }).catch(err => console.error("Error cargando personal:", err))
      .finally(() => { if (mostrarLoading) setLoading(false); });
  }, []);
  useEffect(() => { cargar(); }, [cargar]);
  useAutoRefresh(() => cargar(false), 120000);
  const filtrados = empleados.filter(e => {
    // Búsqueda sin acentos ni mayúsculas, por nombre completo, correo o número de empleado.
    const q = normalizar(filtros.busqueda).replace(/\s+/g, " ");
    if (q) {
      const heno = normalizar(`${e.nombre} ${e.ap_paterno} ${e.ap_materno || ""} ${e.email || ""} ${e.num_empleado || ""}`).replace(/\s+/g, " ");
      if (!heno.includes(q)) return false;
    }
    if (filtros.departamento !== "Todos" && String(e.id_departamento) !== filtros.departamento) return false;
    if (filtros.sucursal !== "Todos" && String(e.id_sucursal) !== filtros.sucursal) return false;
    if (filtros.estatus !== "Todos" && e.estatus !== filtros.estatus) return false;
    return true;
  });
  const camposFiltro = [
    { key: "busqueda", label: "Búsqueda Rápida", type: "search", placeholder: "Nombre, correo o núm. de empleado..." },
    { key: "departamento", label: "Puesto", type: "select", opts: [{ value: "Todos", label: "Todos" }, ...departamentos.map(d => ({ value: String(d.id_departamento), label: d.nombre_departamento }))] },
    { key: "sucursal", label: "Sucursal", type: "select", minWidth: "130px", opts: [{ value: "Todos", label: "Todas" }, ...sucursales.map(s => ({ value: String(s.id_sucursal), label: s.nombre_sucursal }))] },
    { key: "estatus", label: "Estatus", type: "select", opts: ["Todos", "Activo", "Inactivo"] },
  ];
  const activos = empleados.filter(e => e.estatus === "Activo").length;
  const inactivos = empleados.filter(e => e.estatus !== "Activo").length;
  const guardarEmpleado = async (form, modo, empleadoId) => {
    const esEditar = modo === "editar";
    const url = esEditar ? `/api/auth/empleados/${empleadoId}` : `/api/auth/empleados`;
    const pass = String(form.password_nueva ?? "").trim();
    const numEmp = String(form.num_empleado ?? "").trim();
    const body = esEditar
      ? { num_empleado: numEmp ? numEmp : null, nombre: form.nombre.trim(), ap_paterno: form.ap_paterno.trim(), ap_materno: form.ap_materno.trim(), email: form.email.trim(), id_rol: Number(form.id_rol), id_departamento: Number(form.id_departamento), id_sucursal: form.id_sucursal !== "" ? Number(form.id_sucursal) : null, estatus: form.estatus, ...(pass ? { password_nueva: pass } : {}) }
      : { num_empleado: numEmp ? numEmp : null, nombre: form.nombre.trim(), ap_paterno: form.ap_paterno.trim(), ap_materno: form.ap_materno.trim(), email: form.email.trim(), password: pass, id_rol: Number(form.id_rol), id_departamento: Number(form.id_departamento), id_sucursal: form.id_sucursal ? Number(form.id_sucursal) : null };
    const res = await apiFetch(url, { method: esEditar ? "PUT" : "POST", body });
    const data = await res.json();
    if (!res.ok) throw new Error((data.errores?.[0]?.mensaje) || data.error || "Error al guardar");
    cargar();
    setTimeout(() => setModal(null), 1200);
  };
  // Eliminar = borrado lógico: el empleado se oculta de Personal pero su
  // registro e historial se quedan en la base de datos.
  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const toast = useToast();
  const eliminarEmpleado = async () => {
    if (!aEliminar) return;
    setEliminando(true);
    try {
      const res = await apiFetch(`/api/auth/empleados/${aEliminar.id_empleado}`, { method: "DELETE" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || `HTTP ${res.status}`);
      toast.success("Empleado eliminado");
      setAEliminar(null);
      cargar();
    } catch (err) {
      toast.error(err.message || "No se pudo eliminar el empleado");
    } finally {
      setEliminando(false);
    }
  };
  const toggleEstatus = async (emp) => {
    const nuevoEstatus = emp.estatus === "Activo" ? "Inactivo" : "Activo";
    try {
      const res = await apiFetch(`/api/auth/empleados/${emp.id_empleado}`, { method: "PUT", body: { estatus: nuevoEstatus } });
      if (!res.ok) { const d = await res.json(); console.error("Error estatus:", d.error); return; }
      cargar();
    } catch (err) { console.error("Error estatus:", err.message); }
  };
  return (
    <div style={{ background: T.bg, height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ maxWidth: 1400, width: "100%", margin: "0 auto", padding: "16px 16px 0", display: "flex", flexDirection: "column", flex: 1, minHeight: 0, mb: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: FS.titulo, fontWeight: 800, color: T.textMain, letterSpacing: "-0.02em" }}>Personal</h2>
            <p style={{ margin: "2px 0 0", fontSize: FS.cuerpo, color: T.textMuted }}>Administración de empleados y accesos</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ fontSize: FS.etiqueta, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.textMuted, padding: "4px 10px", borderRadius: 20, border: `1px solid ${T.border}`, background: T.surfaceAlt }}>
              {empleados.length} empleados
            </span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 14 }}>
          {[
            { label: "Total", val: empleados.length, color: "#3b82f6", bgL: "#eff6ff", bgD: "#0f1f3d" },
            { label: "Activos", val: activos, color: "#16a34a", bgL: "#f0fdf4", bgD: "#071a0e" },
            { label: "Inactivos", val: inactivos, color: "#94a3b8", bgL: "#f8fafc", bgD: "#1a1f2e" },
          ].map(s => (
            <div key={s.label} style={{ borderRadius: 8, padding: "10px 14px", background: isDark ? s.bgD : s.bgL, border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "#e5e7eb"}` }}>
              <p style={{ fontSize: FS.etiqueta, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: isDark ? "rgba(255,255,255,0.4)" : "#6b7280", margin: 0 }}>{s.label}</p>
              <p style={{ fontSize: FS.kpi, fontWeight: 800, color: s.color, margin: "2px 0 0" }}>{s.val}</p>
            </div>
          ))}
        </div>
        <FiltrosToolbar
          campos={camposFiltro}
          valores={filtros}
          onChange={(k, v) => setFiltros(p => ({ ...p, [k]: v }))}
          onLimpiar={() => setFiltros({ busqueda: "", departamento: "Todos", sucursal: "Todos", estatus: "Todos" })}
          T={T}>
          <button
            onClick={() => setVerAreas(true)}
            title="Asignar cada puesto a su área (reportes por área)"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, fontSize: FS.cuerpo, fontWeight: 700, background: "transparent", color: ORANGE, border: `1px solid ${ORANGE}`, cursor: "pointer", whiteSpace: "nowrap" }}>
            Áreas
          </button>
          <button
            onClick={() => setModal({ modo: "crear" })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 6, fontSize: FS.cuerpo, fontWeight: 700, background: ORANGE, color: "#fff", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
            onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.08)"}
            onMouseLeave={e => e.currentTarget.style.filter = "none"}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Agregar empleado
          </button>
        </FiltrosToolbar>
        <div style={{ marginTop: 10, flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
              <svg className="animate-spin" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            </div>
          ) : filtrados.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 8 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={T.textFaint} strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              <p style={{ fontSize: FS.cuerpo, fontWeight: 600, color: T.textMuted, margin: 0 }}>Sin resultados</p>
              <p style={{ fontSize: FS.secundario, color: T.textFaint, margin: 0 }}>Ajusta los filtros o agrega un nuevo empleado</p>
            </div>
          ) : (
            <TablaEmpleados
              empleados={filtrados}
              filtrosKey={JSON.stringify(filtros)}
              T={T}
              isDark={isDark}
              onEditar={e => setModal({ modo: "editar", empleado: e })}
              onToggleEstatus={toggleEstatus}
              onEliminar={e => setAEliminar(e)}
              onHistorial={e => setModalHistorial(e)}
            />
          )}
        </div>
      </div>
      <ModalConfirm
        T={T}
        open={!!aEliminar}
        loading={eliminando}
        onClose={() => !eliminando && setAEliminar(null)}
        onConfirm={eliminarEmpleado}
        title="Eliminar empleado"
        message={aEliminar ? `¿Eliminar a ${[aEliminar.nombre, aEliminar.ap_paterno, aEliminar.ap_materno].filter(Boolean).join(" ")}? Dejará de aparecer en Personal y no podrá iniciar sesión. Su historial (tickets, solicitudes, salidas y accesos) se conserva.` : ""}
      />
      {modalHistorial && (
        <ModalHistorial T={T} isDark={isDark} empleado={modalHistorial} onCerrar={() => setModalHistorial(null)} />
      )}
      {modal && (
        <ModalEmpleado
          T={T} isDark={isDark}
          modo={modal.modo}
          empleado={modal.empleado}
          departamentos={departamentos}
          roles={roles}
          sucursales={sucursales}
          onGuardar={(form) => guardarEmpleado(form, modal.modo, modal.empleado?.id_empleado)}
          onCerrar={() => setModal(null)}
        />
      )}
      {verAreas && <ModalAreas T={T} onClose={() => setVerAreas(false)} />}
    </div>
  );
}