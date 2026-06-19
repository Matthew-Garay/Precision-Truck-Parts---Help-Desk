/**
 * toastContext.js
 *
 * Contexto de React para el sistema de toasts.
 * Contiene exclusivamente la creacion del contexto para evitar
 * dependencias circulares entre Feedback.jsx y useToast.js.
 *
 * ToastCtx
 *   Contexto que expone la API de toasts:
 *   { success, error, warning, info, dismiss }
 *   Se provee mediante ToastProvider en Feedback.jsx.
 */
import { createContext } from "react";

export const ToastCtx = createContext(null);
