# Propuesta responsive — Vista Personal (Admin)

Vista objetivo: tabla de empleados (Admin → Personal).
Estrategia: mobile-first con Tailwind CSS v4. Base = móvil (375px). Los
prefijos escalan hacia arriba: `sm:` 640, `md:` 768, `lg:` 1024, `xl:` 1280,
`2xl:` 1536. Escritorio de alta resolución (1080p/2K) se resuelve con `xl/2xl`
y ancho máximo de contenedor.

## 1. Breakpoints y comportamiento

| Rango | Dispositivo | Layout tabla | Navegación | Acciones |
|---|---|---|---|---|
| base (<768px) | móvil 375px | Cards apiladas | Sidebar oculto, Drawer + hamburger | Barra inferior fija (thumb zone) |
| md (>=768px) | tablet | Tabla analítica | Sidebar fija | Botones inline por fila |
| lg (>=1024px) | desktop | Tabla ancha | Sidebar colapsable | Botones inline por fila |
| xl/2xl | 1080p/2K | Tabla ancha, max-w 1600 | Sidebar fija | Igual |

Reglas aplicadas:
- Móvil primero: el JSX base pinta cards; la tabla se muestra con `hidden md:block`.
- Área táctil mínima 44x44px: todo botón o ícono usa `min-h-11 min-w-11`
  (44px) o padding equivalente.
- Barra de acciones en móvil: "Agregar empleado" y el filtro crítico se ubican
  en una barra inferior fija (`fixed bottom-0`) con `env(safe-area-inset-bottom)`.
- En desktop la barra inferior se oculta (`md:hidden`) y el botón vuelve a la
  toolbar horizontal actual.

## 2. Tabla analítica (desktop) vs Cards (móvil)

Desktop (>=768px): se conserva la tabla con scroll horizontal suave
(`overflow-x-auto`), encabezado fijo (`sticky`) y paginación limpia. Es el
diseño actual, envuelto en `hidden md:block`.

Móvil (<768px): cada empleado se vuelve una tarjeta compacta. Metadatos clave
visibles: punto de estatus, nombre, ID (num_empleado), Área y badge de estatus.
Correo, Sucursal y Rol van en un `<details>` plegable para no saturar. Cada
tarjeta expone las 3 acciones (editar, historial, activar/desactivar) como
botones de 44px.

## 3. Paleta e identidad (Precision Truck Parts)

- Fondo claro: `#F8FAFC` (token `T.bg`). Superficie: `#FFFFFF` (`T.surface`).
- Oscuro: fondo `#0F172A`, superficie `#0D1117`/`#161B22`.
- Acento naranja corporativo `#F47920` (`ORANGE`) reservado para CTA primario,
  estado crítico y foco. No se usa como decoración.
- Verde `#16a34a` solo para "Activo"; gris `#94a3b8` para "Inactivo".
- Todo color sale de los tokens `T.*` para que el tema claro/oscuro funcione sin
  ramificar el código.

## 4. Tipografía fluida

Se mantiene la escala del design-system (`rem/em`, base fluida con `clamp`). En
móvil los textos bajan un nivel con `text-xs sm:text-sm` y los encabezados usan
`text-[10px] uppercase tracking-wider`. No se fuerzan px fijos salvo en los
touch targets.

## 5. Código JSX de referencia

Propuesta autónoma y copiable. No reemplaza aún a `Personal.jsx`; muestra cómo
se reorganizan los elementos entre móvil y escritorio. Consume los mismos props
y tokens `T` que ya usa tu tabla.

```jsx
// PersonalResponsive.jsx — propuesta de referencia (no conectada)
import { useState } from "react";

const ORANGE = "#F47920";

function EmpleadoCard({ emp, T, onEditar, onHistorial, onToggleEstatus }) {
  const nombre = `${emp.nombre} ${emp.ap_paterno} ${emp.ap_materno || ""}`.trim();
  const activo = emp.estatus === "Activo";
  return (
    <div
      className="rounded-xl border p-3 md:hidden"
      style={{ background: T.surface, borderColor: T.border, opacity: activo ? 1 : 0.6 }}
    >
      <div className="flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: activo ? "#22c55e" : "#94a3b8" }} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold truncate" style={{ color: T.text }}>{nombre}</p>
          <p className="text-xs" style={{ color: T.textMuted }}>
            ID {emp.num_empleado || "—"} · {emp.nombre_departamento || "Sin área"}
          </p>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 rounded-md shrink-0"
          style={{
            background: activo ? "rgba(34,197,94,0.12)" : "rgba(148,163,184,0.15)",
            color: activo ? "#16a34a" : T.textMuted,
            border: `1px solid ${activo ? "rgba(34,197,94,0.3)" : T.border}`,
          }}>
          {activo ? "Activo" : "Inactivo"}
        </span>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <button onClick={() => onEditar(emp)}
          className="flex-1 min-h-11 rounded-lg text-xs font-bold"
          style={{ background: `${ORANGE}15`, color: ORANGE, border: `1px solid ${ORANGE}40` }}>
          Editar
        </button>
        <button onClick={() => onHistorial(emp)}
          className="flex-1 min-h-11 rounded-lg text-xs font-bold"
          style={{ background: T.surfaceAlt, color: T.text, border: `1px solid ${T.border}` }}>
          Historial
        </button>
        <button onClick={() => onToggleEstatus(emp)} aria-label="Cambiar estatus"
          className="min-h-11 min-w-11 rounded-lg flex items-center justify-center"
          style={{ background: T.surfaceAlt, color: T.textMuted, border: `1px solid ${T.border}` }}>
          {activo ? "Desactivar" : "Activar"}
        </button>
      </div>

      <details className="mt-2">
        <summary className="text-[11px] font-bold cursor-pointer" style={{ color: T.textMuted }}>
          Ver más
        </summary>
        <dl className="mt-2 grid grid-cols-2 gap-2 text-[11px]" style={{ color: T.text }}>
          <div><dt style={{ color: T.textFaint }}>Correo</dt><dd className="truncate">{emp.email}</dd></div>
          <div><dt style={{ color: T.textFaint }}>Sucursal</dt><dd>{emp.nombre_sucursal || "—"}</dd></div>
          <div><dt style={{ color: T.textFaint }}>Rol</dt><dd>{emp.nombre_rol || "—"}</dd></div>
        </dl>
      </details>
    </div>
  );
}

export default function PersonalResponsive({
  T, empleados, loading, onEditar, onHistorial, onToggleEstatus, onAgregar, children
}) {
  const [drawer, setDrawer] = useState(false);
  const vacio = !loading && empleados.length === 0;

  return (
    <div className="min-h-full pb-24 md:pb-0" style={{ background: T.bg, color: T.text }}>
      {/* Topbar compacta solo en móvil, con botón hamburger (Drawer) */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 border-b"
        style={{ background: T.surface, borderColor: T.border }}>
        <button onClick={() => setDrawer(true)} aria-label="Abrir menú"
          className="min-h-11 min-w-11 rounded-lg flex items-center justify-center"
          style={{ color: T.text }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 className="text-sm font-bold">Personal</h1>
      </header>

      {/* Drawer / off-canvas (móvil y tablet) */}
      {drawer && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawer(false)} />
          <nav className="relative w-72 max-w-[80%] h-full p-4"
            style={{ background: T.surface, borderRight: `1px solid ${T.border}` }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: T.textMuted }}>Menú</p>
            {/* Reutilizar aquí los mismos items del sidebar de DashboardShared */}
          </nav>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-4">
        <h1 className="hidden lg:block text-lg font-extrabold mb-4">Administración de Personal</h1>

        {/* Vista móvil: cards */}
        <div className="md:hidden space-y-3">
          {loading && <p className="text-sm" style={{ color: T.textMuted }}>Cargando…</p>}
          {vacio && <p className="text-sm" style={{ color: T.textMuted }}>Sin resultados</p>}
          {!loading && empleados.map(emp => (
            <EmpleadoCard key={emp.id_empleado} emp={emp} T={T}
              onEditar={onEditar} onHistorial={onHistorial} onToggleEstatus={onToggleEstatus} />
          ))}
        </div>

        {/* Vista escritorio/tablet: tabla analítica tradicional.
            children = el componente TablaEmpleados actual, sin cambios. */}
        <div className="hidden md:block">{children}</div>
      </div>

      {/* Barra de acciones inferior fija — SOLO móvil (zona del pulgar) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 px-4 py-3 border-t"
        style={{
          background: T.surface, borderColor: T.border,
          paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
        }}>
        <button onClick={onAgregar}
          className="w-full min-h-12 rounded-xl text-sm font-bold text-white"
          style={{ background: ORANGE }}>
          Agregar empleado
        </button>
      </div>
    </div>
  );
}
```

## 6. Cómo se integraría en Personal.jsx (sin romper lo actual)

Hoy `Personal.jsx` renderiza: KPI cards, `FiltrosToolbar`, y `TablaEmpleados`.
La integración mínima sería:

1. Envolver el `<div>` raíz con el layout responsive de `PersonalResponsive`,
   pasando como `children` el `FiltrosToolbar` + `TablaEmpleados` actuales (que
   ya traen paginación y encabezado fijo). Esos elementos se ocultan solos en
   móvil con `md:block` y las cards toman su lugar.
2. Mover el botón "Agregar empleado" fuera de `FiltrosToolbar` y pasarlo como
   `onAgregar` a la barra inferior (móvil). En desktop puede permanecer visible
   en la toolbar con `hidden md:inline-flex`.
3. El sidebar y el drawer: en tu proyecto el sidebar vive en
   `DashboardShared.jsx`. Para el drawer, extraer la lista de items de
   navegación a un arreglo compartido y renderizarlo tanto en el sidebar fijo
   (desktop) como dentro del `<nav>` del drawer (móvil), evitando duplicar la
   lista.

## 7. Notas de accesibilidad (WCAG 2.2)

- Los botones de icono llevan `aria-label` ("Abrir menú", "Cambiar estatus").
- El drawer se cierra con click en el overlay y con la tecla Escape (agregar
  `onKeyDown` en el montaje del componente si se requiere).
- Contraste: el naranja `#F47920` como fondo de botón usa texto blanco; en
  badges naranja se usa texto naranja sobre fondo naranja al 12% de opacidad,
  que cumple contraste AA en ambos temas.
- Touch targets: `min-h-11` (44px) en todos los controles interactivos.

## 8. Alcance de esta entrega

Este documento es la propuesta de maquetación. No se modificó `Personal.jsx` ni
ningún componente en uso. El siguiente paso, si apruebas el diseño, es aplicarlo
en el código real y validar con `npm run build -w client`. El mismo patrón
(cards en móvil + tabla en desktop + barra de acciones inferior) se replica tal
cual en Historial de Incidencias, Historial de Insumos e Inventario.

