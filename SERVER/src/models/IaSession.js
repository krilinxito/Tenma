const { pool } = require('../../config/db');

class IaSession {
  /**
   * Crea una nueva sesión de chat con IA
   */
  static async create({ id_usuario, id_paciente, rol_ia_custom = null }) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO ia_sesion (id_usuario, id_paciente, rol_ia_custom) VALUES (?, ?, ?)',
        [id_usuario, id_paciente, rol_ia_custom]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating IA session: ${error.message}`);
    }
  }

  /**
   * Obtiene una sesión por su ID
   */
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        `SELECT s.*, 
                u.nombre as doctor_nombre,
                p.nombre as paciente_nombre,
                p.apellido as paciente_apellido
         FROM ia_sesion s
         INNER JOIN usuario u ON s.id_usuario = u.id_usuario
         INNER JOIN paciente p ON s.id_paciente = p.id_paciente
         WHERE s.id_sesion = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error finding IA session: ${error.message}`);
    }
  }

  /**
   * Obtiene la última sesión activa para un paciente y doctor
   */
  static async findActiveSession(id_usuario, id_paciente) {
    try {
      const [rows] = await pool.execute(
        `SELECT s.*, 
                u.nombre as doctor_nombre,
                p.nombre as paciente_nombre,
                p.apellido as paciente_apellido
         FROM ia_sesion s
         INNER JOIN usuario u ON s.id_usuario = u.id_usuario
         INNER JOIN paciente p ON s.id_paciente = p.id_paciente
         WHERE s.id_usuario = ? 
         AND s.id_paciente = ?
         AND s.fin IS NULL
         ORDER BY s.inicio DESC
         LIMIT 1`,
        [id_usuario, id_paciente]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error finding active IA session: ${error.message}`);
    }
  }

  /**
   * Obtiene todas las sesiones de un paciente
   */
  static async findByPatient(id_paciente) {
    try {
      const [rows] = await pool.execute(
        `SELECT s.*, 
                u.nombre as doctor_nombre,
                p.nombre as paciente_nombre,
                p.apellido as paciente_apellido
         FROM ia_sesion s
         INNER JOIN usuario u ON s.id_usuario = u.id_usuario
         INNER JOIN paciente p ON s.id_paciente = p.id_paciente
         WHERE s.id_paciente = ?
         ORDER BY s.inicio DESC`,
        [id_paciente]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error finding patient IA sessions: ${error.message}`);
    }
  }

  /**
   * Finaliza una sesión
   */
  static async endSession(id) {
    try {
      const [result] = await pool.execute(
        'UPDATE ia_sesion SET fin = CURRENT_TIMESTAMP WHERE id_sesion = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error ending IA session: ${error.message}`);
    }
  }

  /**
   * Actualiza el rol personalizado de la IA
   */
  static async updateCustomRole(id, rol_ia_custom) {
    try {
      const [result] = await pool.execute(
        'UPDATE ia_sesion SET rol_ia_custom = ? WHERE id_sesion = ?',
        [rol_ia_custom, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating IA custom role: ${error.message}`);
    }
  }

  /**
   * Obtiene el historial de chat de una sesión
   */
  static async getChatHistory(id_sesion) {
    try {
      const [rows] = await pool.execute(
        `SELECT *
         FROM ia_chat_log
         WHERE id_sesion = ?
         ORDER BY timestamp ASC`,
        [id_sesion]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error getting chat history: ${error.message}`);
    }
  }

  /**
   * Agrega una entrada al historial de chat
   */
  static async addChatEntry(id_sesion, pregunta, respuesta) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO ia_chat_log (id_sesion, pregunta, respuesta) VALUES (?, ?, ?)',
        [id_sesion, pregunta, respuesta]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error adding chat entry: ${error.message}`);
    }
  }
}

module.exports = IaSession; 