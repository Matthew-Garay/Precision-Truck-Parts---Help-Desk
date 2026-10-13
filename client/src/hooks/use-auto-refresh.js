/**
 * useAutoRefresh.js
 *
 * Hook de React que ejecuta una funcion de forma periodica y se pausa
 * automaticamente cuando la pestana del navegador no esta visible.
 *
 * Comportamiento:
 *   - Ejecuta fn() inmediatamente al montar el componente.
 *   - Repite la ejecucion cada intervaloMs milisegundos.
 *   - Cuando el usuario cambia de pestana (visibilitychange a "hidden")
 *     cancela el intervalo para evitar peticiones HTTP innecesarias.
 *   - Cuando el usuario vuelve a la pestana, si paso mas tiempo del
 *     intervalo desde la ultima ejecucion, ejecuta fn() de inmediato
 *     para que los datos esten frescos. Luego reinicia el intervalo.
 *   - Cancela el intervalo y el listener al desmontar el componente.
 *
 * Parametros:
 *   fn          - funcion a ejecutar (puede ser async, los errores no se capturan aqui)
 *   intervaloMs - intervalo en milisegundos (default: 30000 = 30 segundos)
 *   deps        - arreglo de dependencias adicionales que reinician el hook
 *                 (igual que el segundo argumento de useEffect)
 *
 * Uso tipico:
 *   useAutoRefresh(() => cargarTickets(), 30000);
 */
import { useEffect, useRef, useCallback } from "react";
export function useAutoRefresh(fn, intervaloMs = 30000, deps = []) {
  const fnRef        = useRef(fn);
  const intervalRef  = useRef(null);
  const ultimaRef    = useRef(null);
  fnRef.current      = fn;

  const ejecutar = useCallback(() => {
    fnRef.current();
    ultimaRef.current = Date.now();
  }, []);

  const iniciar = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(ejecutar, intervaloMs);
  }, [ejecutar, intervaloMs]);

  const detener = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    ejecutar();
    iniciar();

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        detener();
      } else {
        if (!ultimaRef.current || Date.now() - ultimaRef.current >= intervaloMs) {
          ejecutar();
        }
        iniciar();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      detener();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [ejecutar, iniciar, detener, intervaloMs, ...deps]);
}
