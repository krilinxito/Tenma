const { pool } = require('../../config/db');
const bcrypt = require('bcryptjs');

class User {
  /**
   * Crea un nuevo usuario
   */
  static async create({ nombre, cargo, email, rol_ia = null }) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO usuario (nombre, cargo, email, rol_ia) VALUES (?, ?, ?, ?)',
        [nombre, cargo, email, rol_ia]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  /**
   * Encuentra un usuario por ID
   */
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM usuario WHERE id_usuario = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  /**
   * Encuentra un usuario por email
   */
  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM usuario WHERE email = ?',
        [email]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  }

  /**
   * Actualiza un usuario
   */
  static async update(id, { nombre, cargo, email, rol_ia }) {
    try {
      const [result] = await pool.execute(
        'UPDATE usuario SET nombre = ?, cargo = ?, email = ?, rol_ia = ? WHERE id_usuario = ?',
        [nombre, cargo, email, rol_ia, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  /**
   * Elimina un usuario
   */
  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM usuario WHERE id_usuario = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  /**
   * Lista todos los usuarios
   */
  static async findAll() {
    try {
      const [rows] = await pool.execute('SELECT * FROM usuario');
      return rows;
    } catch (error) {
      throw new Error(`Error listing users: ${error.message}`);
    }
  }

  /**
   * Lista todos los doctores
   */
  static async findAllDoctors() {
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM usuario WHERE cargo = 'doctor'"
      );
      return rows;
    } catch (error) {
      throw new Error(`Error listing doctors: ${error.message}`);
    }
  }

  /**
   * Obtiene los pacientes de un doctor
   */
  static async getPatients(doctorId) {
    try {
      const [rows] = await pool.execute(
        `SELECT p.* 
         FROM paciente p
         INNER JOIN atiende a ON p.id_paciente = a.id_paciente
         WHERE a.id_usuario = ?`,
        [doctorId]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error getting doctor's patients: ${error.message}`);
    }
  }

  /**
   * Asigna un paciente a un doctor
   */
  static async assignPatient(doctorId, patientId) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO atiende (id_usuario, id_paciente) VALUES (?, ?)',
        [doctorId, patientId]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error assigning patient: ${error.message}`);
    }
  }

  /**
   * Desasigna un paciente de un doctor
   */
  static async unassignPatient(doctorId, patientId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM atiende WHERE id_usuario = ? AND id_paciente = ?',
        [doctorId, patientId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error unassigning patient: ${error.message}`);
    }
  }

  /**
   * Registra un evento de login/logout
   */
  static async logUserEvent(userId, eventType, ipAddress, userAgent) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO user_logs (id_usuario, tipo_evento, ip_address, user_agent) VALUES (?, ?, ?, ?)',
        [userId, eventType, ipAddress, userAgent]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error logging user event: ${error.message}`);
    }
  }

  /**
   * Obtiene el historial de eventos de un usuario
   */
  static async getUserEventHistory(userId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM user_logs WHERE id_usuario = ? ORDER BY timestamp DESC',
        [userId]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error getting user event history: ${error.message}`);
    }
  }

  static async updatePassword(id, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const [result] = await pool.execute(
        'UPDATE usuario SET password_hash = ? WHERE id_usuario = ?',
        [hashedPassword, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating password: ${error.message}`);
    }
  }

  static async verifyPassword(hashedPassword, password) {
    return bcrypt.compare(password, hashedPassword);
  }
}

module.exports = User; 