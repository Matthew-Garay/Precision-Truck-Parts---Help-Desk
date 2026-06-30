/**
 * useToast.js
 *
 * Hook para consumir el sistema de toasts desde cualquier componente
 * envuelto por ToastProvider (Feedback.jsx).
 *
 * @returns {{ success, error, warning, info, dismiss }}
 */
import { useContext } from "react";
import { ToastCtx } from "../context/ToastContext.js";

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
