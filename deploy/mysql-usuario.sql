-- =============================================================================
--  mysql-usuario.sql — Usuario de MySQL exclusivo para la aplicación
-- =============================================================================
--  La aplicación NO debe conectarse como root. Este usuario solo puede leer y
--  escribir datos en precision_helpdesk: no puede borrar tablas, crear
--  usuarios ni tocar otras bases. Si alguien robara sus credenciales, el daño
--  quedaría limitado a los datos (que además están respaldados a diario).
--
--  Uso (en el servidor, como administrador de MySQL):
--    1. Cambia 'CAMBIA_ESTA_CONTRASEÑA' por una contraseña larga y aleatoria:
--         openssl rand -base64 24
--    2. sudo mysql < deploy/mysql-usuario.sql
--    3. Pon el mismo usuario y contraseña en server/.env (DB_USER / DB_PASSWORD).
-- =============================================================================

CREATE DATABASE IF NOT EXISTS precision_helpdesk
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'helpdesk_app'@'localhost' IDENTIFIED BY 'CAMBIA_ESTA_CONTRASEÑA';

-- Permisos mínimos: datos (CRUD), tablas temporales y bloqueos (usados por el
-- respaldo con mysqldump). Sin CREATE/ALTER/DROP: el backend no modifica el
-- esquema mientras corre.
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE TEMPORARY TABLES, LOCK TABLES, SHOW VIEW
  ON precision_helpdesk.* TO 'helpdesk_app'@'localhost';

FLUSH PRIVILEGES;
