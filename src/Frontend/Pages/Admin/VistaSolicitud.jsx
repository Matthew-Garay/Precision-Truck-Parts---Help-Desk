import VistaSolicitudBase from "../Usuario/VistaSolicitud";

export default function VistaSolicitudAdmin(props) {
  return <VistaSolicitudBase {...props} esAdmin />;
}
