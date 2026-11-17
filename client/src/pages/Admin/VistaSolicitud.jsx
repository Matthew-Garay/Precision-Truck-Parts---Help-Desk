/**
 * VistaSolicitud.jsx
 *
 * Vista de detalle de una solicitud para el administrador. Reutiliza
 * pages/Usuario/VistaSolicitud.jsx con esAdmin = true (aprobar/negar ítems,
 * ruta y aceptar/rechazar).
 *
 * Export default: VistaSolicitudAdmin
 *
 * @module client/pages/Admin/VistaSolicitud
 * @requires ../Usuario/VistaSolicitud.jsx
 * @exports VistaSolicitudAdmin (default)
 */
import VistaSolicitudBase from '../Usuario/VistaSolicitud.jsx';

export default function VistaSolicitudAdmin(props) {
  return <VistaSolicitudBase {...props} esAdmin />;
}
