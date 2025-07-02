const { google } = require('googleapis');
const moment = require('moment');

// Configuración de autenticación con Google
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ]
});

// Crear cliente de Calendar
const calendar = google.calendar({ version: 'v3', auth });

class GoogleCalendarService {
  /**
   * Crea un evento en Google Calendar con opción de Meet
   */
  static async createEvent({
    summary,
    description,
    startDateTime,
    endDateTime,
    attendees,
    isVirtual = false
  }) {
    try {
      const event = {
        summary,
        description,
        start: {
          dateTime: startDateTime,
          timeZone: 'America/Lima'
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'America/Lima'
        },
        attendees: attendees.map(email => ({ email })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 24 horas antes
            { method: 'popup', minutes: 30 } // 30 minutos antes
          ]
        }
      };

      // Si es cita virtual, agregar conferencia de Meet
      if (isVirtual) {
        event.conferenceData = {
          createRequest: {
            requestId: `meet_${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        };
      }

      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: isVirtual ? 1 : 0,
        sendUpdates: 'all' // Enviar emails a los participantes
      });

      return {
        eventId: response.data.id,
        meetLink: isVirtual ? response.data.hangoutLink : null,
        htmlLink: response.data.htmlLink
      };
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      throw new Error(`Error creating calendar event: ${error.message}`);
    }
  }

  /**
   * Actualiza un evento existente en Google Calendar
   */
  static async updateEvent(eventId, {
    summary,
    description,
    startDateTime,
    endDateTime,
    attendees,
    isVirtual = false
  }) {
    try {
      const event = {
        summary,
        description,
        start: {
          dateTime: startDateTime,
          timeZone: 'America/Lima'
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'America/Lima'
        },
        attendees: attendees.map(email => ({ email }))
      };

      // Si es cita virtual y no tiene link de Meet, crear uno
      if (isVirtual) {
        const existingEvent = await calendar.events.get({
          calendarId: 'primary',
          eventId
        });

        if (!existingEvent.data.hangoutLink) {
          event.conferenceData = {
            createRequest: {
              requestId: `meet_${Date.now()}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' }
            }
          };
        }
      }

      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId,
        resource: event,
        conferenceDataVersion: isVirtual ? 1 : 0,
        sendUpdates: 'all'
      });

      return {
        eventId: response.data.id,
        meetLink: response.data.hangoutLink,
        htmlLink: response.data.htmlLink
      };
    } catch (error) {
      console.error('Error updating Google Calendar event:', error);
      throw new Error(`Error updating calendar event: ${error.message}`);
    }
  }

  /**
   * Cancela/elimina un evento de Google Calendar
   */
  static async deleteEvent(eventId) {
    try {
      await calendar.events.delete({
        calendarId: 'primary',
        eventId,
        sendUpdates: 'all'
      });
      return true;
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error);
      throw new Error(`Error deleting calendar event: ${error.message}`);
    }
  }

  /**
   * Verifica disponibilidad en un rango de fechas
   */
  static async checkAvailability(startDateTime, endDateTime) {
    try {
      const response = await calendar.freebusy.query({
        resource: {
          timeMin: startDateTime,
          timeMax: endDateTime,
          items: [{ id: 'primary' }]
        }
      });

      const busySlots = response.data.calendars.primary.busy;
      return busySlots.length === 0;
    } catch (error) {
      console.error('Error checking Google Calendar availability:', error);
      throw new Error(`Error checking calendar availability: ${error.message}`);
    }
  }

  /**
   * Obtiene los eventos próximos
   */
  static async getUpcomingEvents(maxResults = 10) {
    try {
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: (new Date()).toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items;
    } catch (error) {
      console.error('Error getting upcoming Google Calendar events:', error);
      throw new Error(`Error getting upcoming events: ${error.message}`);
    }
  }

  /**
   * Formatea una cita para Google Calendar
   */
  static formatAppointmentForCalendar(appointment, doctor, patient) {
    const startDateTime = moment(`${appointment.fecha} ${appointment.hora}`)
      .format('YYYY-MM-DD[T]HH:mm:ss');
    
    // Asumimos citas de 30 minutos
    const endDateTime = moment(`${appointment.fecha} ${appointment.hora}`)
      .add(30, 'minutes')
      .format('YYYY-MM-DD[T]HH:mm:ss');

    const summary = `Cita médica: ${patient.nombre} ${patient.apellido}`;
    const description = `
      Cita médica con ${doctor.nombre}
      Paciente: ${patient.nombre} ${patient.apellido}
      Tipo: ${appointment.tipo_cita}
      Motivo: ${appointment.motivo}
      
      ${appointment.tipo_cita === 'virtual' ? 'El enlace de Meet se enviará por correo.' : ''}
    `.trim();

    const attendees = [
      doctor.email,
      patient.email
    ].filter(Boolean); // Filtrar emails nulos

    return {
      summary,
      description,
      startDateTime,
      endDateTime,
      attendees,
      isVirtual: appointment.tipo_cita === 'virtual'
    };
  }
}

module.exports = GoogleCalendarService; 