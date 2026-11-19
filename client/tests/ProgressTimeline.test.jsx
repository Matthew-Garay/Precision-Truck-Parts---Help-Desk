/** ProgressTimeline.test.jsx — Lo que el usuario ve en el avance de su ticket. */
import { describe, test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import ProgressTimeline from "../src/components/ProgressTimeline.jsx";

const T = { isDark: false, text: "#000", textMuted: "#666", textFaint: "#999", border: "#ddd", surface: "#fff" };
afterEach(cleanup);

describe("ProgressTimeline", () => {
  test("sin técnico asignado dice 'Esperando técnico'", () => {
    render(<ProgressTimeline T={T} pasoActual={1} estatus="En proceso" />);
    expect(screen.getByText("Esperando técnico")).toBeTruthy();
  });
  test("un ticket No Resuelto no aparece como resuelto", () => {
    render(<ProgressTimeline T={T} pasoActual={3} estatus="No Resuelto" />);
    expect(screen.getByText("Cerrado sin solución")).toBeTruthy();
  });
  test("un ticket cancelado dice 'Cancelado'", () => {
    render(<ProgressTimeline T={T} pasoActual={3} estatus="Cancelado" />);
    expect(screen.getAllByText("Cancelado").length).toBeGreaterThan(0);
  });
});
