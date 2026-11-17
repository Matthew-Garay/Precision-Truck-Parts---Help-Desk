/**
 * ecosystem.config.cjs
 *
 * Configuración de PM2 para el servidor de producción: mantiene el backend
 * siempre encendido, lo reinicia si falla o si usa demasiada memoria, y lo
 * vuelve a levantar al reiniciar el equipo (pm2 startup + pm2 save).
 * Los registros llevan fecha y hora (dd/MM/yyyy HH:mm:ss).
 *
 * Uso (desde la raíz del proyecto):
 *   pm2 start deploy/ecosystem.config.cjs
 *   pm2 save
 *   pm2 logs helpdesk      ← ver registros en vivo
 *   pm2 restart helpdesk   ← tras actualizar el código
 *
 * @module deploy/ecosystem.config
 * @exports apps
 */
const path = require("path");

module.exports = {
  apps: [
    {
      name: "helpdesk",
      cwd: path.resolve(__dirname, ".."),
      script: "server/server.js",
      node_args: "--import ./server/load-env.js",
      env: { NODE_ENV: "production" },
      instances: 1,                 // Socket.io y los workers asumen un solo proceso
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      max_memory_restart: "450M",
      log_date_format: "DD/MM/YYYY HH:mm:ss",
      merge_logs: true,
    },
  ],
};
