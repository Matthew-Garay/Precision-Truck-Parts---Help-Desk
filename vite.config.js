/**
 * vite.config.js
 *
 * Configuracion de Vite para el frontend de PrecisionTrucks HelpDesk.
 *
 * Plugins:
 *   react       - soporte JSX, Fast Refresh y React DevTools
 *   tailwindcss - procesamiento de estilos Tailwind CSS v4 via plugin nativo
 *
 * optimizeDeps:
 *   pdfjs-dist se pre-optimiza explicitamente porque usa un worker de Web Worker
 *   que Vite necesita preparar antes de la primera ejecucion.
 *
 * Servidor de desarrollo (puerto 5173):
 *   Proxy transparente hacia el servidor Express en localhost:3001 para:
 *     /api       - peticiones REST del backend
 *     /storage   - archivos estaticos (evidencias, manuales, fotos)
 *     /fotos     - fotos de perfil con autenticacion JWT
 *     /socket.io - conexion WebSocket de Socket.io (ws: true activa el proxy WS)
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api':       { target: 'http://localhost:3001', changeOrigin: true },
      '/storage':   { target: 'http://localhost:3001', changeOrigin: true },
      '/fotos':     { target: 'http://localhost:3001', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:3001', changeOrigin: true, ws: true },
    },
  },
})
