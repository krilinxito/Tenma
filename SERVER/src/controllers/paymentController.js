const Payment = require('../models/Payment');
const googleGmailService = require('../services/googleGmailService');

class PaymentController {
  /**
   * Registra un nuevo pago
   */
  static async create(req, res) {
    try {
      const { id_cita, id_usuario, monto, saldo_pendiente, metodo } = req.body;
      
      const paymentId = await Payment.create({
        id_cita,
        id_usuario,
        monto,
        saldo_pendiente,
        metodo
      });

      const payment = await Payment.findById(paymentId);

      // Enviar recibo por correo si el pago fue exitoso
      if (payment) {
        try {
          await googleGmailService.sendPaymentReceipt(payment);
        } catch (emailError) {
          console.error('Error sending payment receipt email:', emailError);
          // No fallamos la operación si el correo falla
        }
      }
      
      res.status(201).json({
        message: 'Pago registrado exitosamente',
        payment
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({
        error: 'Error al registrar pago',
        details: error.message
      });
    }
  }

  /**
   * Obtiene un pago por ID
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const payment = await Payment.findById(id);
      
      if (!payment) {
        return res.status(404).json({
          error: 'Pago no encontrado'
        });
      }

      res.status(200).json({
        message: 'Pago encontrado',
        payment
      });
    } catch (error) {
      console.error('Error getting payment:', error);
      res.status(500).json({
        error: 'Error al obtener pago',
        details: error.message
      });
    }
  }

  /**
   * Obtiene el pago asociado a una cita
   */
  static async getByAppointment(req, res) {
    try {
      const { appointmentId } = req.params;
      const payment = await Payment.findByAppointment(appointmentId);

      if (!payment) {
        return res.status(404).json({
          error: 'Pago no encontrado para esta cita'
        });
      }

      res.status(200).json({
        message: 'Pago encontrado',
        payment
      });
    } catch (error) {
      console.error('Error getting payment by appointment:', error);
      res.status(500).json({
        error: 'Error al obtener pago por cita',
        details: error.message
      });
    }
  }

  /**
   * Actualiza un pago
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { monto, saldo_pendiente, metodo } = req.body;

      const success = await Payment.update(id, {
        monto,
        saldo_pendiente,
        metodo
      });

      if (!success) {
        return res.status(404).json({
          error: 'Pago no encontrado'
        });
      }

      const payment = await Payment.findById(id);

      res.status(200).json({
        message: 'Pago actualizado exitosamente',
        payment
      });
    } catch (error) {
      console.error('Error updating payment:', error);
      res.status(500).json({
        error: 'Error al actualizar pago',
        details: error.message
      });
    }
  }

  /**
   * Obtiene pagos por período
   */
  static async getByPeriod(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const payments = await Payment.getByPeriod(startDate, endDate);

      res.status(200).json({
        message: 'Pagos recuperados exitosamente',
        payments
      });
    } catch (error) {
      console.error('Error getting payments by period:', error);
      res.status(500).json({
        error: 'Error al obtener pagos por período',
        details: error.message
      });
    }
  }

  /**
   * Obtiene pagos pendientes
   */
  static async getPendingPayments(req, res) {
    try {
      const pendingPayments = await Payment.getPendingPayments();

      res.status(200).json({
        message: 'Pagos pendientes recuperados exitosamente',
        pendingPayments
      });
    } catch (error) {
      console.error('Error getting pending payments:', error);
      res.status(500).json({
        error: 'Error al obtener pagos pendientes',
        details: error.message
      });
    }
  }

  /**
   * Obtiene estadísticas de pagos
   */
  static async getStats(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const stats = await Payment.getStats(startDate, endDate);

      res.status(200).json({
        message: 'Estadísticas recuperadas exitosamente',
        stats
      });
    } catch (error) {
      console.error('Error getting payment stats:', error);
      res.status(500).json({
        error: 'Error al obtener estadísticas de pagos',
        details: error.message
      });
    }
  }

  /**
   * Obtiene pagos por doctor
   */
  static async getByDoctor(req, res) {
    try {
      const { doctorId } = req.params;
      const { startDate, endDate } = req.query;
      const payments = await Payment.getByDoctor(doctorId, startDate, endDate);

      res.status(200).json({
        message: 'Pagos por doctor recuperados exitosamente',
        payments
      });
    } catch (error) {
      console.error('Error getting payments by doctor:', error);
      res.status(500).json({
        error: 'Error al obtener pagos por doctor',
        details: error.message
      });
    }
  }

  /**
   * Obtiene pagos por paciente
   */
  static async getByPatient(req, res) {
    try {
      const { patientId } = req.params;
      const { startDate, endDate } = req.query;
      const payments = await Payment.getByPatient(patientId, startDate, endDate);

      res.status(200).json({
        message: 'Pagos por paciente recuperados exitosamente',
        payments
      });
    } catch (error) {
      console.error('Error getting payments by patient:', error);
      res.status(500).json({
        error: 'Error al obtener pagos por paciente',
        details: error.message
      });
    }
  }
}

module.exports = PaymentController; 