const { pool } = require('../../config/db');

class Appointment {
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        `SELECT c.*, 
                u.nombre as doctor_nombre,
                p.nombre as paciente_nombre,
                p.apellido as paciente_apellido,
                p.email as paciente_email,
                p.telefono as paciente_telefono
         FROM cita c
         INNER JOIN usuario u ON c.id_usuario = u.id_usuario
         INNER JOIN paciente p ON c.id_paciente = p.id_paciente
         WHERE c.id_cita = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error finding appointment by ID: ${error.message}`);
    }
  }

  static async create({
    id_usuario,
    id_paciente,
    fecha,
    hora,
    tipo_cita,
    motivo,
    id_evento_google_calendar = null,
    enlace_meet = null
  }) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO cita (
          id_usuario, id_paciente, fecha, hora,
          tipo_cita, motivo, id_evento_google_calendar,
          enlace_meet, estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'programada')`,
        [
          id_usuario,
          id_paciente,
          fecha,
          hora,
          tipo_cita,
          motivo,
          id_evento_google_calendar,
          enlace_meet
        ]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating appointment: ${error.message}`);
    }
  }

  static async update(id, {
    fecha,
    hora,
    tipo_cita,
    motivo,
    estado,
    id_evento_google_calendar,
    enlace_meet,
    recordatorio_enviado
  }) {
    try {
      const [result] = await pool.execute(
        `UPDATE cita SET
          fecha = COALESCE(?, fecha),
          hora = COALESCE(?, hora),
          tipo_cita = COALESCE(?, tipo_cita),
          motivo = COALESCE(?, motivo),
          estado = COALESCE(?, estado),
          id_evento_google_calendar = COALESCE(?, id_evento_google_calendar),
          enlace_meet = COALESCE(?, enlace_meet),
          recordatorio_enviado = COALESCE(?, recordatorio_enviado)
         WHERE id_cita = ?`,
        [
          fecha,
          hora,
          tipo_cita,
          motivo,
          estado,
          id_evento_google_calendar,
          enlace_meet,
          recordatorio_enviado,
          id
        ]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating appointment: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM cita WHERE id_cita = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting appointment: ${error.message}`);
    }
  }

  static async getPatientAppointments(patientId, options = {}) {
    try {
      let query = `
        SELECT c.*, 
               u.nombre as doctor_nombre,
               p.nombre as paciente_nombre,
               p.apellido as paciente_apellido,
               p.email as paciente_email,
               p.telefono as paciente_telefono
        FROM cita c
        INNER JOIN usuario u ON c.id_usuario = u.id_usuario
        INNER JOIN paciente p ON c.id_paciente = p.id_paciente
        WHERE c.id_paciente = ?
      `;

      const queryParams = [patientId];

      // Add filters
      if (options.estado) {
        query += ' AND c.estado = ?';
        queryParams.push(options.estado);
      }
      if (options.tipo_cita) {
        query += ' AND c.tipo_cita = ?';
        queryParams.push(options.tipo_cita);
      }
      if (options.fromDate) {
        query += ' AND c.fecha >= ?';
        queryParams.push(options.fromDate);
      }
      if (options.toDate) {
        query += ' AND c.fecha <= ?';
        queryParams.push(options.toDate);
      }
      if (options.doctorId) {
        query += ' AND c.id_usuario = ?';
        queryParams.push(options.doctorId);
      }

      // Add order
      query += ' ORDER BY c.fecha DESC, c.hora DESC';

      const [rows] = await pool.execute(query, queryParams);
      return rows;
    } catch (error) {
      throw new Error(`Error getting patient appointments: ${error.message}`);
    }
  }

  static async getDoctorAppointments(doctorId, options = {}) {
    try {
      let query = `
        SELECT c.*, 
               u.nombre as doctor_nombre,
               p.nombre as paciente_nombre,
               p.apellido as paciente_apellido,
               p.email as paciente_email,
               p.telefono as paciente_telefono
        FROM cita c
        INNER JOIN usuario u ON c.id_usuario = u.id_usuario
        INNER JOIN paciente p ON c.id_paciente = p.id_paciente
        WHERE c.id_usuario = ?
      `;

      const queryParams = [doctorId];

      // Add filters
      if (options.estado) {
        query += ' AND c.estado = ?';
        queryParams.push(options.estado);
      }
      if (options.tipo_cita) {
        query += ' AND c.tipo_cita = ?';
        queryParams.push(options.tipo_cita);
      }
      if (options.fromDate) {
        query += ' AND c.fecha >= ?';
        queryParams.push(options.fromDate);
      }
      if (options.toDate) {
        query += ' AND c.fecha <= ?';
        queryParams.push(options.toDate);
      }

      // Add order
      query += ' ORDER BY c.fecha ASC, c.hora ASC';

      const [rows] = await pool.execute(query, queryParams);
      return rows;
    } catch (error) {
      throw new Error(`Error getting doctor appointments: ${error.message}`);
    }
  }

  static async getUpcomingAppointments(options = {}) {
    try {
      let query = `
        SELECT c.*, 
               u.nombre as doctor_nombre,
               p.nombre as paciente_nombre,
               p.apellido as paciente_apellido,
               p.email as paciente_email,
               p.telefono as paciente_telefono
        FROM cita c
        INNER JOIN usuario u ON c.id_usuario = u.id_usuario
        INNER JOIN paciente p ON c.id_paciente = p.id_paciente
        WHERE c.fecha >= CURDATE()
        AND c.estado = 'programada'
      `;

      const queryParams = [];

      // Add filters
      if (options.hoursAhead) {
        query += ' AND TIMESTAMPDIFF(HOUR, NOW(), CONCAT(c.fecha, " ", c.hora)) <= ?';
        queryParams.push(options.hoursAhead);
      }
      if (options.needsReminder) {
        query += ' AND c.recordatorio_enviado = false';
      }

      // Add order
      query += ' ORDER BY c.fecha ASC, c.hora ASC';

      const [rows] = await pool.execute(query, queryParams);
      return rows;
    } catch (error) {
      throw new Error(`Error getting upcoming appointments: ${error.message}`);
    }
  }

  static async checkAvailability(doctorId, fecha, hora) {
    try {
      const [rows] = await pool.execute(
        `SELECT COUNT(*) as count
         FROM cita
         WHERE id_usuario = ?
         AND fecha = ?
         AND hora = ?
         AND estado != 'cancelada'`,
        [doctorId, fecha, hora]
      );
      return rows[0].count === 0;
    } catch (error) {
      throw new Error(`Error checking availability: ${error.message}`);
    }
  }

  static async getDoctorAvailableSlots(doctorId, fecha) {
    try {
      // Asumiendo horario de trabajo de 8:00 a 18:00 con citas cada 30 minutos
      const workingHours = [];
      for (let hour = 8; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          workingHours.push(
            `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          );
        }
      }

      // Obtener citas existentes para ese día
      const [bookedSlots] = await pool.execute(
        `SELECT hora
         FROM cita
         WHERE id_usuario = ?
         AND fecha = ?
         AND estado != 'cancelada'`,
        [doctorId, fecha]
      );

      // Filtrar las horas ocupadas
      const bookedHours = bookedSlots.map(slot => slot.hora);
      const availableSlots = workingHours.filter(
        hour => !bookedHours.includes(hour)
      );

      return availableSlots;
    } catch (error) {
      throw new Error(`Error getting available slots: ${error.message}`);
    }
  }

  static async updateGoogleCalendarEvent(id, eventId, meetLink = null) {
    try {
      const [result] = await pool.execute(
        `UPDATE cita SET
          id_evento_google_calendar = ?,
          enlace_meet = ?
         WHERE id_cita = ?`,
        [eventId, meetLink, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating Google Calendar event: ${error.message}`);
    }
  }

  static async markReminderSent(id) {
    try {
      const [result] = await pool.execute(
        'UPDATE cita SET recordatorio_enviado = true WHERE id_cita = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error marking reminder as sent: ${error.message}`);
    }
  }
}

module.exports = Appointment; 