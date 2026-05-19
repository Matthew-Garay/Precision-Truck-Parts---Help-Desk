/**
 * VistaTicket — Admin
 * Extiende la vista del usuario con:
 *  - Cambio de estatus (En proceso / No Resuelto / Resuelto)
 *  - Comentarios editables del técnico
 *  - Confirmación de cierre con modal
 *  - Generación de reporte PDF
 *  - Sin sección de calificación (es exclusiva del usuario)
 */
import VistaTicketBase from "../Usuario/VistaTicket";

export default function VistaTicketAdmin(props) {
  return <VistaTicketBase {...props} esAdmin />;
}
