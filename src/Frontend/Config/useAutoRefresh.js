import { useEffect, useRef, useCallback } from "react";

/**
 * useAutoRefresh — ejecuta `fn` al montar y cada `intervaloMs` ms.
 * - Se pausa automáticamente cuando la pestaña está oculta (visibilitychange)
 *   para evitar requests innecesarios y ahorrar recursos.
 * - Se reactiva y ejecuta inmediatamente al volver a la pestaña si pasó
 *   más tiempo del intervalo mientras estuvo oculta.
 * - Cancela el intervalo al desmontar.
 *
 * @param {function} fn          - función async o sync a ejecutar
 * @param {number}   intervaloMs - intervalo en ms (default 30000)
 * @param {Array}    deps        - dependencias extra (como useEffect)
 */
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
        // Si pasó más tiempo del intervalo mientras estuvo oculta, refresca ya
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervaloMs, ...deps]);
}
