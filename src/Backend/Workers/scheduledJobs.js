/**
 * scheduledJobs.js
 *
 * Modulo que inicia y gestiona todos los trabajos periodicos en segundo plano
 * del servidor. Se invoca una sola vez desde server.js al arrancar, recibiendo
 * la instancia de Socket.io para poder emitir eventos en tiempo real.
 *
 * Trabajos registrados:
 *
 * 1. Alertas SLA (cada 30 minutos)
 *    Busca tickets en estado "En proceso" que llevan mas de 2790 minutos
 *    abiertos (equivalente a ~46.5 horas, anticipando el vencimiento a las 48h).
 *    Calcula el tiempo restante y emite el evento "ticket:sla_warning" a la
 *    sala "admins" por Socket.io. Usa el Set slaAlertados para no emitir la
 *    misma alerta mas de una vez por ticket dentro de su ciclo de vida.
 *
 * 2. Cierre automatico de tickets vencidos (cada hora)
 *    Busca tickets en proceso que superaron las 48 horas sin resolverse y
 *    los cierra automaticamente como "No Resuelto" via Ticket.cerrarVencidos().
 *    Notifica al empleado dueno por Socket.io y por correo electronico.
 *    Emite "tickets:vencidos" a los admins con el total cerrado.
 *    Se ejecuta DESPUES del worker SLA para que la alerta se emita antes
 *    de que el ticket sea marcado como cerrado.
 *
 * 3. Limpieza de sesiones huerfanas (cada hora)
 *    Cierra registros de historial_acceso que tienen mas de 12 horas sin
 *    fecha de salida. Esto ocurre cuando el navegador se cierra abruptamente
 *    sin que el logout llegue al servidor.
 *
 * 4. Alertas de stock critico (cada hora)
 *    Busca insumos con 5 o menos unidades en stock y emite el evento
 *    "insumo:stock_critico" a los admins por cada uno no alertado previamente.
 *    Usa el Set stockAlertados para no repetir alertas del mismo insumo.
 *
 * 5. Tickets sin atender en 24 horas (cada hora)
 *    Busca tickets en proceso sin tecnico asignado que llevan mas de 24 horas
 *    creados y emite el evento "ticket:sin_atender" a los admins.
 *    Usa el Set sinAtenderAlertados para evitar alertas repetidas.
 *
 * Todos los intervalos usan .unref() para que no impidan el cierre
 * natural del proceso de Node.js cuando se recibe una senal de terminacion.
 * Los Sets de deduplicacion provienen de alertState.js y sobreviven reinicios.
 */
import pool   from "../Config/db.js";
import Ticket from "../Models/Ticket.js";
import Insumo from "../Models/Insumo.js";
import { enviarNotificacionTicket } from "../Config/mailer.js";
import { crearSetsPresistentes }    from "./alertState.js";

export function iniciarWorkers(io) {
  // Sets persistentes en disco — sobreviven reinicios del servidor
  const { slaAlertados, sinAtenderAlertados, stockAlertados } = crearSetsPresistentes();

  // -- Alertas SLA: tickets próximos a vencer (~47h) ------------
  const ivSLA = setInterval(async () => {
    try {
      const [proximos] = await pool.query(
        `SELECT t.id_ticket, t.folio_ticket, t.titulo, t.prioridad,
                t.fecha_subido,
                TIMESTAMPDIFF(MINUTE, t.fecha_subido, NOW()) AS minutos_abierto
         FROM ticket t
         WHERE t.estatus = 'En proceso'
         AND TIMESTAMPDIFF(MINUTE, t.fecha_subido, NOW()) >= 2790`
      );

      // Limpiar del Set tickets ya cerrados
      const activosIds = new Set(proximos.map(t => t.id_ticket));
      for (const id of slaAlertados) {
        if (!activosIds.has(id)) slaAlertados.delete(id);
      }

      const nuevos = proximos.filter(t => !slaAlertados.has(t.id_ticket));
      if (nuevos.length === 0) return;

      for (const t of nuevos) {
        const minutosRestantes = 2880 - t.minutos_abierto;
        const horas = Math.floor(minutosRestantes / 60);
        const mins  = minutosRestantes % 60;
        try {
          io.to("admins").emit("ticket:sla_warning", {
            id_ticket:       t.id_ticket,
            folio_ticket:    t.folio_ticket,
            titulo:          t.titulo,
            prioridad:       t.prioridad,
            tiempo_restante: horas > 0 ? `${horas}h ${mins}m` : `${mins} min`,
            fecha_subido:    t.fecha_subido,
            mensaje:         `Advertencia: El ticket #${t.folio_ticket} está próximo a superar el SLA.`,
          });
          slaAlertados.add(t.id_ticket);
        } catch (emitErr) {
          console.error("[SLA emit]", emitErr.message);
        }
      }
      console.log(`Alertas SLA enviadas: ${nuevos.length} ticket(s)`);
    } catch (err) {
      console.error("Error verificando SLA:", err.message);
    }
  }, 30 * 60 * 1000);
  ivSLA.unref();

  // -- Cierre automático de tickets vencidos (+2 días) ----------
  // Se ejecuta DESPUÉS del worker SLA para que la alerta siempre
  // se emita antes de que el ticket sea marcado como cerrado.
  const ivVencidos = setInterval(async () => {
    try {
      const vencidos = await Ticket.cerrarVencidos();
      if (vencidos.length === 0) return;
      console.log(`Tickets cerrados automaticamente: ${vencidos.length}`);
      vencidos.forEach(t => {
        io.to(`empleado_${t.id_empleado}`).emit("ticket:actualizado", {
          id_ticket:      t.id_ticket,
          folio_ticket:   t.folio_ticket,
          titulo:         t.titulo,
          estatus:        "No Resuelto",
          fecha_resuelto: new Date().toISOString(),
          resuelto_por:   null,
        });
        if (t.email_empleado) {
          enviarNotificacionTicket({
            to:         t.email_empleado,
            nombre:     t.nombre_empleado,
            folio:      t.folio_ticket,
            titulo:     t.titulo,
            estatus:    "No Resuelto",
            comentario: "El ticket fue cerrado automáticamente por vencimiento de tiempo.",
          }).catch(err => console.error("[mailer vencido]", err.message));
        }
      });
      io.to("admins").emit("tickets:vencidos", { total: vencidos.length });
    } catch (err) {
      console.error("Error cerrando tickets vencidos:", err.message);
    }
  }, 60 * 60 * 1000);
  ivVencidos.unref();

  // -- Limpieza periódica de sesiones huérfanas ----------------
  const ivSesiones = setInterval(async () => {
    try {
      const [result] = await pool.query(
        `UPDATE historial_acceso
         SET fecha_salida = NOW()
         WHERE fecha_salida IS NULL
         AND fecha_entrada < DATE_SUB(NOW(), INTERVAL 12 HOUR)`
      );
      if (result.affectedRows > 0)
        console.log(`Sesiones huerfanas cerradas: ${result.affectedRows}`);
    } catch (err) {
      console.error("Error limpiando sesiones huérfanas:", err.message);
    }
  }, 60 * 60 * 1000);
  ivSesiones.unref();

  // -- Alerta de stock crítico (≤ 5 unidades) -----------------
  const ivStock = setInterval(async () => {
    try {
      const criticos = await Insumo.getStockBajo(5);
      // Limpiar insumos que ya no son críticos
      const criticosIds = new Set(criticos.map(i => i.id_insumo));
      for (const id of stockAlertados) {
        if (!criticosIds.has(id)) stockAlertados.delete(id);
      }
      const nuevos = criticos.filter(i => !stockAlertados.has(i.id_insumo));
      if (nuevos.length === 0) return;
      nuevos.forEach(ins => {
        io.to("admins").emit("insumo:stock_critico", {
          id_insumo: ins.id_insumo,
          nombre:    ins.nombre,
          stock:     ins.stock,
          nivel:     ins.nivel_alerta,
        });
        stockAlertados.add(ins.id_insumo);
      });
      console.log(`Stock critico: ${nuevos.length} insumo(s)`);
    } catch (err) {
      console.error("Error verificando stock crítico:", err.message);
    }
  }, 60 * 60 * 1000);
  ivStock.unref();

  // -- Tickets sin atender en 24h: recordatorio al admin -------
  const ivSinAtender = setInterval(async () => {
    try {
      const [pendientes] = await pool.query(
        `SELECT id_ticket, folio_ticket, titulo, prioridad, fecha_subido
         FROM ticket
         WHERE estatus = 'En proceso'
         AND id_tecnico IS NULL
         AND TIMESTAMPDIFF(HOUR, fecha_subido, NOW()) >= 24`
      );
      // Limpiar del Set tickets que ya fueron atendidos o cerrados
      const pendientesIds = new Set(pendientes.map(t => t.id_ticket));
      for (const id of sinAtenderAlertados) {
        if (!pendientesIds.has(id)) sinAtenderAlertados.delete(id);
      }
      const nuevos = pendientes.filter(t => !sinAtenderAlertados.has(t.id_ticket));
      if (nuevos.length === 0) return;
      nuevos.forEach(t => {
        io.to("admins").emit("ticket:sin_atender", {
          id_ticket:    t.id_ticket,
          folio_ticket: t.folio_ticket,
          titulo:       t.titulo,
          prioridad:    t.prioridad,
          horas:        Math.floor((Date.now() - new Date(t.fecha_subido)) / 3600000),
        });
        sinAtenderAlertados.add(t.id_ticket);
      });
      console.log(`Tickets sin atender >24h: ${nuevos.length}`);
    } catch (err) {
      console.error("Error verificando tickets sin atender:", err.message);
    }
  }, 60 * 60 * 1000);
  ivSinAtender.unref();

}
