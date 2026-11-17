/**
 * ConfiguracionPerfil.jsx
 *
 * Página de configuración de perfil para el rol Administrador. Envoltorio del
 * componente compartido ConfiguracionPerfilShared.
 *
 * Export default: ConfiguracionPerfilAdmin
 *
 * @module client/pages/Admin/ConfiguracionPerfil
 * @requires ../../components/ConfiguracionPerfilShared.jsx
 * @exports ConfiguracionPerfilAdmin (default)
 */
import ConfiguracionPerfilShared from '../../components/ConfiguracionPerfilShared.jsx';

export default function ConfiguracionPerfilAdmin(props) {
  return <ConfiguracionPerfilShared {...props} rol="Administrador" />;
}
