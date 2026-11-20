/** frecuencia.test.js — Texto de la frecuencia en el reporte de consumo. */
import { describe, test, expect } from "vitest";
import { textoFrecuencia } from "../src/components/Inventario/ModalConsumo.jsx";

describe("textoFrecuencia", () => {
  test("días, semanas y meses", () => {
    expect(textoFrecuencia(1)).toBe("cada 1 día");
    expect(textoFrecuencia(5)).toBe("cada 5 días");
    expect(textoFrecuencia(28)).toBe("cada ~4 semanas");
    expect(textoFrecuencia(23)).toBe("cada ~3 semanas");
    expect(textoFrecuencia(90)).toBe("cada ~3 meses");
    expect(textoFrecuencia(null)).toBe("—");
  });
});
