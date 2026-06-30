/**
 * ToastContext.js
 *
 * Contexto de React para el sistema de toasts.
 * Separado de Feedback.jsx para evitar dependencias circulares.
 *
 * Provisto por ToastProvider en Feedback.jsx.
 * Consumido por useToast (hooks/useToast.js).
 */
import { createContext } from "react";

export const ToastCtx = createContext(null);
