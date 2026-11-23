/**
 * estadisticas-solicitudes.test.jsx — "Reportes por Prioridad" del tablero del
 * administrador cuenta TODAS las solicitudes y salidas internas (métricas del
 * servidor), no solo las pendientes que trae la lista del tablero.
 */
import { describe, test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { SeccionEstadisticas } from "../src/components/DashboardShared.jsx";

const T = {
  isDark: false, text: "#000", textMuted: "#666", textFaint: "#999", border: "#ddd",
  surface: "#fff", surfaceAlt: "#f8fafc", surfaceHover: "#f1f5f9", bg: "#fff", orange: "#F47920",
};
afterEach(cleanup);

/** Texto de la fila de una prioridad (etiqueta + números + porcentaje). */
const fila = (label) => screen.getByText(label).closest("div.flex.flex-col").textContent;

describe("estadísticas por prioridad", () => {
  test("con métricas del servidor cuenta lo aceptado y las salidas internas", () => {
    // Caso real: sin tickets, ninguna solicitud pendiente y 46 salidas internas.
    const metricas = { total: 46, p_urgente: 1, p_alta: 0, p_media: 45, p_baja: 0 };
    render(<SeccionEstadisticas T={T} tickets={[]} solicitudes={[]} metricasSolicitudes={metricas} />);
    expect(fila("Media")).toContain("45");
    expect(fila("Media")).toContain("98%");
    expect(fila("Urgente")).toContain("2%");
    expect(fila("Alta")).toContain("Sin registros");
  });

  test("tickets y solicitudes se reparten sobre el gran total", () => {
    const tickets = [{ prioridad: "Alta", estatus: "Resuelto" }, { prioridad: "Alta", estatus: "En proceso" }];
    const metricas = { total: 2, p_urgente: 0, p_alta: 0, p_media: 2, p_baja: 0 };
    render(<SeccionEstadisticas T={T} tickets={tickets} solicitudes={[]} metricasSolicitudes={metricas} />);
    expect(fila("Alta")).toContain("50%");
    expect(fila("Media")).toContain("50%");
  });

  test("sin métricas (tablero del usuario) usa la lista recibida", () => {
    const solicitudes = [{ prioridad: "Baja" }, { prioridad: "Baja" }];
    render(<SeccionEstadisticas T={T} tickets={[]} solicitudes={solicitudes} />);
    expect(fila("Baja")).toContain("100%");
  });
});
