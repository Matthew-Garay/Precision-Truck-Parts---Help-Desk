/**
 * useToast.js
 *
 * Hook de conveniencia para consumir el sistema de toasts.
 * Accede al ToastCtx registrado por ToastProvider.
 *
 * Lanza un Error explicativo si se usa fuera de un ToastProvider
 * para facilitar la depuracion durante el desarrollo.
 *
 * Retorna la misma API que ToastProvider expone:
 *   toast.success(mensaje, { title, duration })
 *   toast.error(mensaje, { title, duration })
 *   toast.warning(mensaje, { title, duration })
 *   toast.info(mensaje, { title, duration })
 *   toast.dismiss(id)
 */
import { useContext } from "react";
import { ToastCtx } from "./toastContext.js";

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
