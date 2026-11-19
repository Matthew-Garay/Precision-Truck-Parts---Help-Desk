/** fechas.test.js — Formato único día/mes/año del sistema. */
import { describe, test, expect } from "vitest";
import { aFecha, fechaCorta, fechaHora, hora, diaMes, mesAnio, isoLocal } from "../src/utils/fechas.js";

describe("fechas", () => {
  test("una fecha sola (AAAA-MM-DD) no se recorre un día por la zona horaria", () => {
    expect(fechaCorta("2026-11-01")).toBe("01/11/2026");
    expect(aFecha("2026-11-01").getDate()).toBe(1);
  });
  test("formato de MySQL e ISO", () => {
    expect(fechaCorta("2026-11-17 13:05:00")).toBe("17/11/2026");
    expect(hora("2026-11-17 13:05:00", { h24: true })).toBe("13:05");
    expect(fechaHora("2026-11-17 08:30:00", { h24: true })).toBe("17/11/2026 08:30");
  });
  test("vacíos e inválidos muestran el texto de respaldo", () => {
    expect(fechaCorta(null)).toBe("-");
    expect(fechaCorta("", "—")).toBe("—");
    expect(fechaCorta("no es fecha")).toBe("-");
    expect(fechaHora(undefined, { vacio: "" })).toBe("");
  });
  test("día/mes y mes/año", () => {
    expect(diaMes("2026-03-09")).toBe("09/03");
    expect(mesAnio("2026-11")).toBe("11/2026");
    expect(mesAnio("2026-02-15")).toBe("02/2026");
  });
  test("isoLocal usa la fecha local, no UTC", () => {
    expect(isoLocal(new Date(2026, 10, 18, 23, 30))).toBe("2026-11-18");
  });
});
