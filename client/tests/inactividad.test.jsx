/** inactividad.test.jsx — Cierre de sesión tras 30 minutos sin actividad. */
import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  MINUTOS_INACTIVIDAD, marcarActividad, vencidaPorInactividad, limpiarSesionInactiva, useCierreInactividad, minutosPara,
} from "../src/utils/inactividad.js";

const MIN = 60 * 1000;

describe("inactividad", () => {
  beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 10, 18, 9, 0)); });
  afterEach(() => { vi.useRealTimers(); });

  test("el límite es de 30 minutos", () => expect(MINUTOS_INACTIVIDAD).toBe(30));

  test("sin marca no se considera vencida; con 31 min sin uso sí", () => {
    expect(vencidaPorInactividad()).toBe(false);
    marcarActividad();
    expect(vencidaPorInactividad(Date.now() + 29 * MIN)).toBe(false);
    expect(vencidaPorInactividad(Date.now() + 31 * MIN)).toBe(true);
  });

  test("al abrir la app con la sesión vencida se borran token y usuario", () => {
    localStorage.setItem("_tk", "abc");
    localStorage.setItem("usuario", "{}");
    marcarActividad();
    vi.setSystemTime(Date.now() + 31 * MIN);
    expect(limpiarSesionInactiva()).toBe(true);
    expect(localStorage.getItem("_tk")).toBeNull();
    expect(localStorage.getItem("usuario")).toBeNull();
  });

  test("con la sesión vigente no se borra nada", () => {
    localStorage.setItem("_tk", "abc");
    marcarActividad();
    vi.setSystemTime(Date.now() + 10 * MIN);
    expect(limpiarSesionInactiva()).toBe(false);
    expect(localStorage.getItem("_tk")).toBe("abc");
  });

  test("avisa el último minuto y cierra la sesión al vencer", () => {
    const onExpirar = vi.fn();
    const { result } = renderHook(() => useCierreInactividad(true, onExpirar));
    expect(result.current.segundosRestantes).toBeNull();
    act(() => { vi.advanceTimersByTime(29 * MIN + 15 * 1000); });
    expect(result.current.segundosRestantes).toBeGreaterThan(0);
    expect(result.current.segundosRestantes).toBeLessThanOrEqual(60);
    act(() => { vi.advanceTimersByTime(MIN); });
    expect(onExpirar).toHaveBeenCalled();
  });

  test("usar el mouse o el teclado reinicia el reloj", () => {
    const onExpirar = vi.fn();
    renderHook(() => useCierreInactividad(true, onExpirar));
    act(() => { vi.advanceTimersByTime(20 * MIN); });
    act(() => { window.dispatchEvent(new Event("keydown")); });
    act(() => { vi.advanceTimersByTime(20 * MIN); });
    expect(onExpirar).not.toHaveBeenCalled();
  });

  test("'Seguir trabajando' quita el aviso", () => {
    const onExpirar = vi.fn();
    const { result } = renderHook(() => useCierreInactividad(true, onExpirar));
    act(() => { vi.advanceTimersByTime(29 * MIN + 30 * 1000); });
    expect(result.current.segundosRestantes).not.toBeNull();
    act(() => { result.current.seguir(); });
    expect(result.current.segundosRestantes).toBeNull();
    act(() => { vi.advanceTimersByTime(5 * MIN); });
    expect(onExpirar).not.toHaveBeenCalled();
  });
  test("administradores: 8 horas; usuarios: 30 minutos", () => {
    expect(minutosPara({ rol: "admin" })).toBe(480);
    expect(minutosPara({ rol: "usuario" })).toBe(30);
    localStorage.setItem("_tk", "abc");
    localStorage.setItem("usuario", JSON.stringify({ rol: "admin" }));
    marcarActividad();
    vi.setSystemTime(Date.now() + 2 * 60 * MIN);   // 2 h sin uso: el admin sigue dentro
    expect(limpiarSesionInactiva()).toBe(false);
    vi.setSystemTime(Date.now() + 7 * 60 * MIN);   // 9 h: se cierra
    expect(limpiarSesionInactiva()).toBe(true);
  });
});
