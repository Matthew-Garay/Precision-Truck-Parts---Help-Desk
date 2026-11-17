/**
 * use-toast.js
 *
 * Hook para consumir el sistema de toasts desde cualquier componente
 * envuelto por ToastProvider (Feedback.jsx).
 *
 * @returns {{ success, error, warning, info, dismiss }}
 *
 * @module client/hooks/use-toast
 * @requires react
 * @requires ../context/toast-context.jsx
 * @exports useToast
 */
import { useContext } from "react";
import { ToastCtx } from '../context/toast-context.jsx';

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
