const { validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const GoogleCalendarService = require('../services/googleCalendarService');
const GoogleGmailService = require('../services/googleGmailService');

class AppointmentController {
  /**
   * Obtiene una cita por su ID
   */
  static async getById(req, res) {
    try {
      const appointment = await Appointment.findById(req.params.id);
      if (!appointment) {
        return res.status(404).json({ message: 'Cita no encontrada' });
      }
      res.json(appointment);
    } catch (error) {
      console.error('Error getting appointment:', error);
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Obtiene las citas de un paciente
   */
  static async getPatientAppointments(req, res) {
    try {
      const appointments = await Appointment.getPatientAppointments(
        req.params.patientId,
        req.query // Pasar los filtros desde query params
      );
      res.json(appointments);
    } catch (error) {
      console.error('Error getting patient appointments:', error);
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Obtiene las citas de un doctor
   */
  static async getDoctorAppointments(req, res) {
    try {
      const appointments = await Appointment.getDoctorAppointments(
        req.params.doctorId,
        req.query // Pasar los filtros desde query params
      );
      res.json(appointments);
    } catch (error) {
      console.error('Error getting doctor appointments:', error);
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Crea una nueva cita
   */
  static async create(req, res) {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        id_usuario,
        id_paciente,
        fecha,
        hora,
        tipo_cita,
        motivo
      } = req.body;

      // Verificar disponibilidad
      const isAvailable = await Appointment.checkAvailability(id_usuario, fecha, hora);
      if (!isAvailable) {
        return res.status(400).json({
          message: 'El horario seleccionado no está disponible'
        });
      }

      // Crear la cita en la base de datos
      const appointmentId = await Appointment.create({
        id_usuario,
        id_paciente,
        fecha,
        hora,
        tipo_cita,
        motivo
      });

      // Obtener los detalles completos de la cita creada
      const appointment = await Appointment.findById(appointmentId);

      // Crear evento en Google Calendar
      const calendarEvent = await GoogleCalendarService.createEvent(
        GoogleCalendarService.formatAppointmentForCalendar(
          appointment,
          { nombre: appointment.doctor_nombre, email: appointment.doctor_email },
          {
            nombre: appointment.paciente_nombre,
            apellido: appointment.paciente_apellido,
            email: appointment.paciente_email
          }
        )
      );

      // Actualizar la cita con los IDs de Google Calendar y Meet
      await Appointment.updateGoogleCalendarEvent(
        appointmentId,
        calendarEvent.eventId,
        calendarEvent.meetLink
      );

      // Enviar correo de confirmación
      if (appointment.paciente_email) {
        await GoogleGmailService.sendAppointmentConfirmation(
          { ...appointment, enlace_meet: calendarEvent.meetLink },
          { nombre: appointment.doctor_nombre },
          {
            nombre: appointment.paciente_nombre,
            apellido: appointment.paciente_apellido,
            email: appointment.paciente_email
          }
        );
      }

      // Obtener la cita actualizada con todos los datos
      const updatedAppointment = await Appointment.findById(appointmentId);
      res.status(201).json(updatedAppointment);
    } catch (error) {
      console.error('Error creating appointment:', error);
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Actualiza una cita existente
   */
  static async update(req, res) {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const appointmentId = req.params.id;
      const {
        fecha,
        hora,
        tipo_cita,
        motivo,
        estado
      } = req.body;

      // Verificar que la cita existe
      const existingAppointment = await Appointment.findById(appointmentId);
      if (!existingAppointment) {
        return res.status(404).json({ message: 'Cita no encontrada' });
      }

      // Si se está cambiando la fecha/hora, verificar disponibilidad
      if ((fecha && fecha !== existingAppointment.fecha) ||
          (hora && hora !== existingAppointment.hora)) {
        const isAvailable = await Appointment.checkAvailability(
          existingAppointment.id_usuario,
          fecha || existingAppointment.fecha,
          hora || existingAppointment.hora
        );
        if (!isAvailable) {
          return res.status(400).json({
            message: 'El nuevo horario seleccionado no está disponible'
          });
        }
      }

      // Actualizar la cita en la base de datos
      await Appointment.update(appointmentId, {
        fecha,
        hora,
        tipo_cita,
        motivo,
        estado
      });

      // Obtener la cita actualizada
      const updatedAppointment = await Appointment.findById(appointmentId);

      // Actualizar evento en Google Calendar
      if (existingAppointment.id_evento_google_calendar) {
        const calendarEvent = await GoogleCalendarService.updateEvent(
          existingAppointment.id_evento_google_calendar,
          GoogleCalendarService.formatAppointmentForCalendar(
            updatedAppointment,
            { nombre: updatedAppointment.doctor_nombre, email: updatedAppointment.doctor_email },
            {
              nombre: updatedAppointment.paciente_nombre,
              apellido: updatedAppointment.paciente_apellido,
              email: updatedAppointment.paciente_email
            }
          )
        );

        // Actualizar enlace de Meet si cambió
        if (calendarEvent.meetLink !== existingAppointment.enlace_meet) {
          await Appointment.updateGoogleCalendarEvent(
            appointmentId,
            calendarEvent.eventId,
            calendarEvent.meetLink
          );
        }
      }

      // Enviar correo de actualización si cambió el estado
      if (estado && estado !== existingAppointment.estado && updatedAppointment.paciente_email) {
        if (estado === 'cancelada') {
          await GoogleGmailService.sendAppointmentCancellation(
            updatedAppointment,
            { nombre: updatedAppointment.doctor_nombre },
            {
              nombre: updatedAppointment.paciente_nombre,
              apellido: updatedAppointment.paciente_apellido,
              email: updatedAppointment.paciente_email
            },
            motivo
          );
        } else {
          await GoogleGmailService.sendAppointmentConfirmation(
            updatedAppointment,
            { nombre: updatedAppointment.doctor_nombre },
            {
              nombre: updatedAppointment.paciente_nombre,
              apellido: updatedAppointment.paciente_apellido,
              email: updatedAppointment.paciente_email
            }
          );
        }
      }

      res.json(updatedAppointment);
    } catch (error) {
      console.error('Error updating appointment:', error);
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Elimina una cita
   */
  static async delete(req, res) {
    try {
      const appointmentId = req.params.id;

      // Verificar que la cita existe
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: 'Cita no encontrada' });
      }

      // Eliminar evento de Google Calendar
      if (appointment.id_evento_google_calendar) {
        await GoogleCalendarService.deleteEvent(appointment.id_evento_google_calendar);
      }

      // Eliminar la cita de la base de datos
      await Appointment.delete(appointmentId);

      // Enviar correo de cancelación
      if (appointment.paciente_email) {
        await GoogleGmailService.sendAppointmentCancellation(
          appointment,
          { nombre: appointment.doctor_nombre },
          {
            nombre: appointment.paciente_nombre,
            apellido: appointment.paciente_apellido,
            email: appointment.paciente_email
          }
        );
      }

      res.json({ message: 'Cita eliminada exitosamente' });
    } catch (error) {
      console.error('Error deleting appointment:', error);
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Obtiene los horarios disponibles de un doctor
   */
  static async getDoctorAvailableSlots(req, res) {
    try {
      const { doctorId, fecha } = req.params;
      const slots = await Appointment.getDoctorAvailableSlots(doctorId, fecha);
      res.json(slots);
    } catch (error) {
      console.error('Error getting available slots:', error);
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Marca una cita como asistida
   */
  static async markAsAttended(req, res) {
    try {
      const appointmentId = req.params.id;
      await Appointment.update(appointmentId, { estado: 'asistida' });
      const appointment = await Appointment.findById(appointmentId);
      res.json(appointment);
    } catch (error) {
      console.error('Error marking appointment as attended:', error);
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = AppointmentController; 