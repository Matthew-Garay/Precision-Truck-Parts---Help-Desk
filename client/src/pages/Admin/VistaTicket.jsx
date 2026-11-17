/**
 * VistaTicket.jsx
 *
 * VistaTicket - Admin
 * Extiende la vista del usuario con:
 *  - Cambio de estatus (En proceso / No Resuelto / Resuelto)
 *  - Comentarios editables del técnico
 *  - Confirmación de cierre con modal
 *  - Generación de reporte PDF
 *  - Sin sección de calificación (es exclusiva del usuario)
 *
 * @module client/pages/Admin/VistaTicket
 * @requires ../Usuario/VistaTicket.jsx
 * @exports VistaTicketAdmin (default)
 */
import VistaTicketBase from '../Usuario/VistaTicket.jsx';

export default function VistaTicketAdmin(props) {
  return <VistaTicketBase {...props} esAdmin />;
}
