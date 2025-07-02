const { pool } = require('../../config/db');

class Payment {
  /**
   * Registra un nuevo pago
   */
  static async create({ id_cita, id_usuario, monto, saldo_pendiente, metodo }) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO pago (id_cita, id_usuario, monto, saldo_pendiente, metodo) VALUES (?, ?, ?, ?, ?)',
        [id_cita, id_usuario, monto, saldo_pendiente, metodo]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating payment: ${error.message}`);
    }
  }

  /**
   * Encuentra un pago por ID
   */
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        `SELECT p.*, 
                u.nombre as registrado_por,
                c.fecha as fecha_cita,
                pa.nombre as paciente_nombre,
                pa.apellido as paciente_apellido,
                d.nombre as doctor_nombre
         FROM pago p
         INNER JOIN usuario u ON p.id_usuario = u.id_usuario
         INNER JOIN cita c ON p.id_cita = c.id_cita
         INNER JOIN paciente pa ON c.id_paciente = pa.id_paciente
         INNER JOIN usuario d ON c.id_usuario = d.id_usuario
         WHERE p.id_pago = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error finding payment: ${error.message}`);
    }
  }

  /**
   * Encuentra el pago de una cita específica
   */
  static async findByAppointment(id_cita) {
    try {
      const [rows] = await pool.execute(
        `SELECT p.*, 
                u.nombre as registrado_por,
                c.fecha as fecha_cita,
                pa.nombre as paciente_nombre,
                pa.apellido as paciente_apellido,
                d.nombre as doctor_nombre
         FROM pago p
         INNER JOIN usuario u ON p.id_usuario = u.id_usuario
         INNER JOIN cita c ON p.id_cita = c.id_cita
         INNER JOIN paciente pa ON c.id_paciente = pa.id_paciente
         INNER JOIN usuario d ON c.id_usuario = d.id_usuario
         WHERE p.id_cita = ?`,
        [id_cita]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error finding appointment payment: ${error.message}`);
    }
  }

  /**
   * Actualiza un pago
   */
  static async update(id, { monto, saldo_pendiente, metodo }) {
    try {
      const [result] = await pool.execute(
        'UPDATE pago SET monto = ?, saldo_pendiente = ?, metodo = ? WHERE id_pago = ?',
        [monto, saldo_pendiente, metodo, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating payment: ${error.message}`);
    }
  }

  /**
   * Elimina un pago
   */
  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM pago WHERE id_pago = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting payment: ${error.message}`);
    }
  }

  /**
   * Obtiene todos los pagos de un paciente
   */
  static async getPatientPayments(patientId) {
    try {
      const [rows] = await pool.execute(
        `SELECT p.*, 
                u.nombre as registrado_por,
                c.fecha as fecha_cita,
                d.nombre as doctor_nombre
         FROM pago p
         INNER JOIN usuario u ON p.id_usuario = u.id_usuario
         INNER JOIN cita c ON p.id_cita = c.id_cita
         INNER JOIN usuario d ON c.id_usuario = d.id_usuario
         WHERE c.id_paciente = ?
         ORDER BY p.fecha_pago DESC`,
        [patientId]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error getting patient payments: ${error.message}`);
    }
  }

  /**
   * Obtiene todos los pagos de un doctor
   */
  static async getDoctorPayments(doctorId) {
    try {
      const [rows] = await pool.execute(
        `SELECT p.*, 
                u.nombre as registrado_por,
                c.fecha as fecha_cita,
                pa.nombre as paciente_nombre,
                pa.apellido as paciente_apellido
         FROM pago p
         INNER JOIN usuario u ON p.id_usuario = u.id_usuario
         INNER JOIN cita c ON p.id_cita = c.id_cita
         INNER JOIN paciente pa ON c.id_paciente = pa.id_paciente
         WHERE c.id_usuario = ?
         ORDER BY p.fecha_pago DESC`,
        [doctorId]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error getting doctor payments: ${error.message}`);
    }
  }

  /**
   * Obtiene estadísticas de pagos por período
   */
  static async getPaymentStats(startDate, endDate, doctorId = null) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_payments,
          SUM(monto) as total_amount,
          SUM(saldo_pendiente) as total_pending,
          AVG(monto) as average_amount
        FROM pago p
        INNER JOIN cita c ON p.id_cita = c.id_cita
        WHERE p.fecha_pago BETWEEN ? AND ?
      `;
      
      const params = [startDate, endDate];
      
      if (doctorId) {
        query += ' AND c.id_usuario = ?';
        params.push(doctorId);
      }

      const [rows] = await pool.execute(query, params);
      return rows[0];
    } catch (error) {
      throw new Error(`Error getting payment statistics: ${error.message}`);
    }
  }

  /**
   * Obtiene pagos pendientes (con saldo pendiente > 0)
   */
  static async getPendingPayments() {
    try {
      const [rows] = await pool.execute(
        `SELECT p.*, 
                u.nombre as registrado_por,
                c.fecha as fecha_cita,
                pa.nombre as paciente_nombre,
                pa.apellido as paciente_apellido,
                d.nombre as doctor_nombre
         FROM pago p
         INNER JOIN usuario u ON p.id_usuario = u.id_usuario
         INNER JOIN cita c ON p.id_cita = c.id_cita
         INNER JOIN paciente pa ON c.id_paciente = pa.id_paciente
         INNER JOIN usuario d ON c.id_usuario = d.id_usuario
         WHERE p.saldo_pendiente > 0
         ORDER BY p.fecha_pago ASC`
      );
      return rows;
    } catch (error) {
      throw new Error(`Error getting pending payments: ${error.message}`);
    }
  }
}

module.exports = Payment; 