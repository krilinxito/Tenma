const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const GoogleGmailService = require('./googleGmailService');

class ReminderService {
  /**
   * Inicia el servicio de recordatorios
   */
  static startReminderService() {
    // Ejecutar cada 30 minutos
    cron.schedule('*/30 * * * *', async () => {
      try {
        console.log('Running appointment reminder service...');
        await this.sendAppointmentReminders();
      } catch (error) {
        console.error('Error in reminder service:', error);
      }
    });

    console.log('Reminder service started');
  }

  /**
   * Envía recordatorios para las citas próximas
   */
  static async sendAppointmentReminders() {
    try {
      // Obtener citas que necesitan recordatorio (24 horas antes)
      const appointments = await Appointment.getUpcomingAppointments({
        hoursAhead: 24,
        needsReminder: true
      });

      console.log(`Found ${appointments.length} appointments needing reminders`);

      // Enviar recordatorios
      for (const appointment of appointments) {
        try {
          // Solo enviar si hay email del paciente
          if (appointment.paciente_email) {
            await GoogleGmailService.sendAppointmentReminder(
              appointment,
              { nombre: appointment.doctor_nombre },
              {
                nombre: appointment.paciente_nombre,
                apellido: appointment.paciente_apellido,
                email: appointment.paciente_email
              }
            );

            // Marcar recordatorio como enviado
            await Appointment.markReminderSent(appointment.id_cita);
            console.log(`Reminder sent for appointment ${appointment.id_cita}`);
          }
        } catch (error) {
          console.error(
            `Error sending reminder for appointment ${appointment.id_cita}:`,
            error
          );
          // Continuar con la siguiente cita si hay error
          continue;
        }
      }
    } catch (error) {
      console.error('Error in sendAppointmentReminders:', error);
      throw error;
    }
  }

  /**
   * Envía recordatorios inmediatos para citas específicas
   */
  static async sendImmediateReminders(appointmentIds) {
    try {
      for (const id of appointmentIds) {
        const appointment = await Appointment.findById(id);
        if (!appointment || !appointment.paciente_email) continue;

        await GoogleGmailService.sendAppointmentReminder(
          appointment,
          { nombre: appointment.doctor_nombre },
          {
            nombre: appointment.paciente_nombre,
            apellido: appointment.paciente_apellido,
            email: appointment.paciente_email
          }
        );

        await Appointment.markReminderSent(id);
        console.log(`Immediate reminder sent for appointment ${id}`);
      }
    } catch (error) {
      console.error('Error sending immediate reminders:', error);
      throw error;
    }
  }
}

module.exports = ReminderService; 