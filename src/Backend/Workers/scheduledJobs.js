import pool  from "../Config/db.js";
import Ticket from "../Models/Ticket.js";

/**
 * Inicia todos los trabajos programados del servidor.
 * @param {import("socket.io").Server} io
 */
export function iniciarWorkers(io) {
  // -- Cierre automático de tickets vencidos (+2 días) ----------
  setInterval(async () => {
    try {
      const vencidos = await Ticket.cerrarVencidos();
      if (vencidos.length === 0) return;
      console.log(`⏰ Tickets cerrados automáticamente: ${vencidos.length}`);
      vencidos.forEach(t => {
        io.to(`empleado_${t.id_empleado}`).emit("ticket:actualizado", {
          id_ticket:      t.id_ticket,
          folio_ticket:   t.folio_ticket,
          titulo:         t.titulo,
          estatus:        "No Resuelto",
          fecha_resuelto: new Date().toISOString(),
          resuelto_por:   null,
        });
      });
      io.to("admins").emit("tickets:vencidos", { total: vencidos.length });
    } catch (err) {
      console.error("Error cerrando tickets vencidos:", err.message);
    }
  }, 60 * 60 * 1000);

  // -- Alertas SLA: tickets próximos a vencer (ventana ~47h) ----
  setInterval(async () => {
    try {
      const [proximos] = await pool.query(
        `SELECT t.id_ticket, t.folio_ticket, t.titulo, t.prioridad,
                t.fecha_subido, t.id_empleado,
                TIMESTAMPDIFF(MINUTE, t.fecha_subido, NOW()) AS minutos_abierto
         FROM ticket t
         WHERE t.estatus = 'En proceso'
         AND TIMESTAMPDIFF(MINUTE, t.fecha_subido, NOW()) BETWEEN 2790 AND 2850`
      );
      proximos.forEach(t => {
        const minutosRestantes = 2880 - t.minutos_abierto;
        const horas = Math.floor(minutosRestantes / 60);
        const mins  = minutosRestantes % 60;
        io.to("admins").emit("ticket:sla_warning", {
          id_ticket:       t.id_ticket,
          folio_ticket:    t.folio_ticket,
          titulo:          t.titulo,
          prioridad:       t.prioridad,
          tiempo_restante: horas > 0 ? `${horas}h ${mins}m` : `${mins} min`,
          fecha_subido:    t.fecha_subido,
          mensaje:         `Advertencia: El ticket #${t.folio_ticket} está próximo a superar el tiempo de respuesta acordado (SLA).`,
        });
      });
      if (proximos.length > 0)
        console.log(`⚠️  Alertas SLA enviadas: ${proximos.length} ticket(s)`);
    } catch (err) {
      console.error("Error verificando SLA:", err.message);
    }
  }, 30 * 60 * 1000);

  // -- Limpieza periódica de sesiones huérfanas ----------------
  setInterval(async () => {
    try {
      const [result] = await pool.query(
        `UPDATE historial_acceso
         SET fecha_salida = NOW()
         WHERE fecha_salida IS NULL
         AND fecha_entrada < DATE_SUB(NOW(), INTERVAL 12 HOUR)`
      );
      if (result.affectedRows > 0)
        console.log(`🧹 Sesiones huérfanas cerradas: ${result.affectedRows}`);
    } catch (err) {
      console.error("Error limpiando sesiones huérfanas:", err.message);
    }
  }, 60 * 60 * 1000);
}
