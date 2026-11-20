/** series.test.js — Captura de números de serie (renglones o comas). */
import { describe, test, expect } from "vitest";
import { leerSeries } from "../src/components/Inventario/PiezasSerie.jsx";

describe("leerSeries", () => {
  test("una por renglón, por comas o punto y coma; sin vacíos ni espacios", () => {
    expect(leerSeries("5CD1\n 5CD2 \n\n5CD3")).toEqual(["5CD1", "5CD2", "5CD3"]);
    expect(leerSeries("A1, A2;A3")).toEqual(["A1", "A2", "A3"]);
    expect(leerSeries("")).toEqual([]);
  });
});
