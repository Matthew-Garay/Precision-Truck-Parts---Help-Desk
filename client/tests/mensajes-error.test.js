/** mensajes-error.test.js — Errores en palabras que el usuario entiende. */
import { describe, test, expect, vi, afterEach } from "vitest";
import { textoError, textoExcepcion, apiFetch, MSG_SIN_CONEXION } from "../src/services/api-client.js";

afterEach(() => vi.unstubAllGlobals());

describe("mensajes de error", () => {
  test("usa el mensaje del servidor cuando es entendible", () => {
    expect(textoError({ error: "La contraseña actual es incorrecta" }, 400)).toBe("La contraseña actual es incorrecta");
  });
  test("traduce los códigos comunes", () => {
    expect(textoError({}, 403)).toMatch(/permiso/);
    expect(textoError({}, 413)).toMatch(/pesados/);
    expect(textoError({}, 429)).toMatch(/intentos/);
  });
  test("no muestra mensajes técnicos del servidor", () => {
    expect(textoError({ error: "Internal Server Error" }, 500)).not.toMatch(/Internal/);
  });
  test("sin red, apiFetch avisa 'No hay conexión'", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(apiFetch("/api/ping")).rejects.toThrow(MSG_SIN_CONEXION);
    expect(textoExcepcion(new Error(MSG_SIN_CONEXION))).toBe(MSG_SIN_CONEXION);
  });
});
