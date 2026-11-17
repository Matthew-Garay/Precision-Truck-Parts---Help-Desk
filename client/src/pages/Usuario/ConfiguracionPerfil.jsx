/**
 * ConfiguracionPerfil.jsx
 *
 * Página de configuración de perfil para el rol Usuario. Envoltorio del
 * componente compartido ConfiguracionPerfilShared.
 *
 * Export default: ConfiguracionPerfilUsuario
 *
 * @module client/pages/Usuario/ConfiguracionPerfil
 * @requires ../../components/ConfiguracionPerfilShared.jsx
 * @exports ConfiguracionPerfilUsuario (default)
 */
import ConfiguracionPerfilShared from '../../components/ConfiguracionPerfilShared.jsx';

export default function ConfiguracionPerfilUsuario(props) {
  return <ConfiguracionPerfilShared {...props} rol="Usuario" />;
}
