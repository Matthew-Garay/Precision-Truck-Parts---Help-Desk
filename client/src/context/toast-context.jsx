/**
 * toast-context.jsx
 *
 * Contexto de React para el sistema de toasts.
 * Separado de Feedback.jsx para evitar dependencias circulares.
 *
 * Provisto por ToastProvider en Feedback.jsx.
 * Consumido por useToast (hooks/useToast.js).
 *
 * @module client/context/toast-context
 * @requires react
 * @exports ToastCtx
 */
import { createContext } from "react";

export const ToastCtx = createContext(null);
