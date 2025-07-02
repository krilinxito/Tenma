const { google } = require('googleapis');
const moment = require('moment');

// Configuración de autenticación con Google
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/gmail.send']
});

// Crear cliente de Gmail
const gmail = google.gmail({ version: 'v1', auth });

class GoogleGmailService {
  /**
   * Envía un correo electrónico usando Gmail API
   */
  static async sendEmail({ to, subject, body }) {
    try {
      // Construir el mensaje en formato RFC 2822
      const email = [
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        body
      ].join('\r\n');

      // Codificar el mensaje en base64
      const encodedMessage = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Enviar el correo
      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error(`Error sending email: ${error.message}`);
    }
  }

  /**
   * Envía un recordatorio de cita
   */
  static async sendAppointmentReminder(appointment, doctor, patient) {
    const appointmentDate = moment(`${appointment.fecha} ${appointment.hora}`);
    const formattedDate = appointmentDate.format('dddd D [de] MMMM [de] YYYY');
    const formattedTime = appointmentDate.format('h:mm A');

    const subject = `Recordatorio: Cita médica con Dr. ${doctor.nombre} - ${formattedDate}`;
    
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Recordatorio de Cita Médica</h2>
        
        <p>Estimado/a ${patient.nombre} ${patient.apellido},</p>
        
        <p>Le recordamos su cita médica programada para:</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Fecha:</strong> ${formattedDate}</p>
          <p><strong>Hora:</strong> ${formattedTime}</p>
          <p><strong>Doctor:</strong> Dr. ${doctor.nombre}</p>
          <p><strong>Tipo de cita:</strong> ${appointment.tipo_cita}</p>
          ${appointment.motivo ? `<p><strong>Motivo:</strong> ${appointment.motivo}</p>` : ''}
          ${appointment.enlace_meet ? `
            <p><strong>Enlace de Google Meet:</strong><br>
            <a href="${appointment.enlace_meet}" style="color: #3498db;">${appointment.enlace_meet}</a></p>
          ` : ''}
        </div>
        
        ${appointment.tipo_cita === 'virtual' ? `
          <div style="background-color: #e8f4fd; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p><strong>Instrucciones para la cita virtual:</strong></p>
            <ol>
              <li>Haga clic en el enlace de Google Meet 5 minutos antes de su cita</li>
              <li>Asegúrese de tener una buena conexión a internet</li>
              <li>Verifique que su cámara y micrófono funcionen correctamente</li>
              <li>Busque un lugar tranquilo y bien iluminado para la consulta</li>
            </ol>
          </div>
        ` : `
          <div style="background-color: #e8f4fd; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p><strong>Recordatorios importantes:</strong></p>
            <ul>
              <li>Llegue 10 minutos antes de su cita</li>
              <li>Traiga sus exámenes o documentos médicos relevantes</li>
              <li>Si no puede asistir, por favor avísenos con anticipación</li>
            </ul>
          </div>
        `}
        
        <p>Si necesita reprogramar o cancelar su cita, por favor contáctenos lo antes posible.</p>
        
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        
        <p style="color: #7f8c8d; font-size: 12px;">
          Este es un correo automático, por favor no responda a este mensaje.<br>
          Para cualquier consulta, comuníquese directamente con el consultorio.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: patient.email,
      subject,
      body
    });
  }

  /**
   * Envía una confirmación de cita agendada
   */
  static async sendAppointmentConfirmation(appointment, doctor, patient) {
    const appointmentDate = moment(`${appointment.fecha} ${appointment.hora}`);
    const formattedDate = appointmentDate.format('dddd D [de] MMMM [de] YYYY');
    const formattedTime = appointmentDate.format('h:mm A');

    const subject = `Confirmación: Cita médica agendada con Dr. ${doctor.nombre}`;
    
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Confirmación de Cita Médica</h2>
        
        <p>Estimado/a ${patient.nombre} ${patient.apellido},</p>
        
        <p>Su cita médica ha sido agendada exitosamente:</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Fecha:</strong> ${formattedDate}</p>
          <p><strong>Hora:</strong> ${formattedTime}</p>
          <p><strong>Doctor:</strong> Dr. ${doctor.nombre}</p>
          <p><strong>Tipo de cita:</strong> ${appointment.tipo_cita}</p>
          ${appointment.motivo ? `<p><strong>Motivo:</strong> ${appointment.motivo}</p>` : ''}
          ${appointment.enlace_meet ? `
            <p><strong>Enlace de Google Meet:</strong><br>
            <a href="${appointment.enlace_meet}" style="color: #3498db;">${appointment.enlace_meet}</a></p>
          ` : ''}
        </div>
        
        ${appointment.tipo_cita === 'virtual' ? `
          <div style="background-color: #e8f4fd; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p><strong>Instrucciones para la cita virtual:</strong></p>
            <ol>
              <li>El día de su cita, haga clic en el enlace de Google Meet 5 minutos antes</li>
              <li>Asegúrese de tener una buena conexión a internet</li>
              <li>Verifique que su cámara y micrófono funcionen correctamente</li>
              <li>Busque un lugar tranquilo y bien iluminado para la consulta</li>
            </ol>
          </div>
        ` : `
          <div style="background-color: #e8f4fd; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p><strong>Información importante:</strong></p>
            <ul>
              <li>Llegue 10 minutos antes de su cita</li>
              <li>Traiga sus exámenes o documentos médicos relevantes</li>
              <li>Si no puede asistir, por favor avísenos con anticipación</li>
            </ul>
          </div>
        `}
        
        <p>La cita ha sido agregada a su calendario de Google. Recibirá un recordatorio 24 horas antes.</p>
        
        <p>Si necesita reprogramar o cancelar su cita, por favor contáctenos lo antes posible.</p>
        
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        
        <p style="color: #7f8c8d; font-size: 12px;">
          Este es un correo automático, por favor no responda a este mensaje.<br>
          Para cualquier consulta, comuníquese directamente con el consultorio.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: patient.email,
      subject,
      body
    });
  }

  /**
   * Envía una notificación de cita cancelada
   */
  static async sendAppointmentCancellation(appointment, doctor, patient, reason) {
    const appointmentDate = moment(`${appointment.fecha} ${appointment.hora}`);
    const formattedDate = appointmentDate.format('dddd D [de] MMMM [de] YYYY');
    const formattedTime = appointmentDate.format('h:mm A');

    const subject = `Cancelación: Cita médica con Dr. ${doctor.nombre}`;
    
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Cancelación de Cita Médica</h2>
        
        <p>Estimado/a ${patient.nombre} ${patient.apellido},</p>
        
        <p>La siguiente cita médica ha sido cancelada:</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Fecha:</strong> ${formattedDate}</p>
          <p><strong>Hora:</strong> ${formattedTime}</p>
          <p><strong>Doctor:</strong> Dr. ${doctor.nombre}</p>
          ${reason ? `<p><strong>Motivo de cancelación:</strong> ${reason}</p>` : ''}
        </div>
        
        <p>Si desea reagendar su cita, por favor contáctenos lo antes posible.</p>
        
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        
        <p style="color: #7f8c8d; font-size: 12px;">
          Este es un correo automático, por favor no responda a este mensaje.<br>
          Para cualquier consulta, comuníquese directamente con el consultorio.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: patient.email,
      subject,
      body
    });
  }
}

module.exports = GoogleGmailService; 