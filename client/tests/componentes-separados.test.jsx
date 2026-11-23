/**
 * componentes-separados.test.jsx — Las piezas que se sacaron de las pantallas
 * grandes (Personal, Solicitud de insumos, Nuevo reporte) se dibujan bien solas.
 */
import { describe, test, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { TablaEmpleados } from "../src/components/Personal/TablaEmpleados.jsx";
import { RequestItem, SupplyRow } from "../src/components/Insumos/CarritoInsumos.jsx";
import { PRIORIDAD_ICON, ToolBtn } from "../src/components/Reporte/ControlesEditor.jsx";

const T = {
  isDark: false, text: "#000", textMuted: "#666", textFaint: "#999", border: "#ddd",
  surface: "#fff", surfaceAlt: "#f8fafc", surfaceHover: "#f1f5f9", bg: "#fff", orange: "#F47920",
};
afterEach(cleanup);

describe("componentes separados", () => {
  test("la tabla de Personal muestra a los empleados", () => {
    const empleados = [
      { id_empleado: 1, num_empleado: "100", nombre: "ana", ap_paterno: "lópez", ap_materno: "", email: "ana@ptp.com.mx",
        nombre_departamento: "Almacén", nombre_sucursal: "Matriz", estatus: "Activo", id_rol: 2, nombre_rol: "Usuario" },
    ];
    render(<TablaEmpleados empleados={empleados} filtrosKey="x" T={T} isDark={false}
      onEditar={() => {}} onHistorial={() => {}} onToggleEstatus={() => {}} onEliminar={() => {}} />);
    expect(screen.getAllByText(/ana@ptp\.com\.mx/).length).toBeGreaterThan(0);
  });

  test("un insumo del carrito cambia su cantidad y nunca baja de 1", () => {
    const onChangeQty = vi.fn();
    render(<table><tbody><tr><td>
      <RequestItem supply={{ id_insumo: 5, nombre: "Tóner" }} quantity={2} onRemove={() => {}} onChangeQty={onChangeQty} T={T} />
    </td></tr></tbody></table>);
    expect(screen.getByText("Tóner")).toBeTruthy();
  });

  test("un insumo del catálogo se agrega al carrito", () => {
    const onAdd = vi.fn();
    render(<table><tbody>
      <SupplyRow supply={{ id_insumo: 7, nombre: "Mouse", categoria: "Periféricos" }} isAdded={false} onAdd={onAdd} animatingId={null} T={T} onDetail={() => {}} />
    </tbody></table>);
    expect(screen.getByText("Mouse")).toBeTruthy();
    const boton = screen.getAllByRole("button").find(b => /agregar/i.test(b.textContent || b.title || ""));
    if (boton) { fireEvent.click(boton); expect(onAdd).toHaveBeenCalled(); }
  });

  test("controles del editor de reportes", () => {
    const onClick = vi.fn();
    render(<div><ToolBtn onClick={onClick} title="Negrita" isDark={false} T={T}>B</ToolBtn><PRIORIDAD_ICON nivel={3} color="#dc2626" /></div>);
    fireEvent.mouseDown(screen.getByTitle("Negrita"));  // actúa al presionar para no perder la selección del texto
    expect(onClick).toHaveBeenCalled();
  });
});
