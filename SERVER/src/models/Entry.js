const { pool } = require('../../config/db');

class Entry {
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        `SELECT e.*, u.nombre as doctor_nombre 
         FROM entry e
         INNER JOIN usuario u ON e.id_usuario = u.id_usuario
         WHERE e.id_entry = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error finding entry by ID: ${error.message}`);
    }
  }

  static async create({
    id_cita,
    id_usuario,
    id_paciente,
    descripcion,
    destacada = false
  }) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO entry (
          id_cita, id_usuario, id_paciente, descripcion, destacada
        ) VALUES (?, ?, ?, ?, ?)`,
        [id_cita, id_usuario, id_paciente, descripcion, destacada]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating entry: ${error.message}`);
    }
  }

  static async update(id, { descripcion, destacada }) {
    try {
      const [result] = await pool.execute(
        'UPDATE entry SET descripcion = ?, destacada = ? WHERE id_entry = ?',
        [descripcion, destacada, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating entry: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM entry WHERE id_entry = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting entry: ${error.message}`);
    }
  }

  static async getPatientEntries(patientId, options = {}) {
    try {
      let query = `
        SELECT e.*, u.nombre as doctor_nombre 
        FROM entry e
        INNER JOIN usuario u ON e.id_usuario = u.id_usuario
        WHERE e.id_paciente = ?
      `;

      const queryParams = [patientId];

      // Add filters
      if (options.destacada) {
        query += ' AND e.destacada = true';
      }
      if (options.fromDate) {
        query += ' AND e.fecha >= ?';
        queryParams.push(options.fromDate);
      }
      if (options.toDate) {
        query += ' AND e.fecha <= ?';
        queryParams.push(options.toDate);
      }
      if (options.doctorId) {
        query += ' AND e.id_usuario = ?';
        queryParams.push(options.doctorId);
      }

      // Add order and limit
      query += ' ORDER BY e.fecha DESC';
      if (options.limit) {
        query += ' LIMIT ?';
        queryParams.push(options.limit);
      }

      const [rows] = await pool.execute(query, queryParams);
      return rows;
    } catch (error) {
      throw new Error(`Error getting patient entries: ${error.message}`);
    }
  }

  static async getEntriesByCita(citaId) {
    try {
      const [rows] = await pool.execute(
        `SELECT e.*, u.nombre as doctor_nombre 
         FROM entry e
         INNER JOIN usuario u ON e.id_usuario = u.id_usuario
         WHERE e.id_cita = ?
         ORDER BY e.fecha DESC`,
        [citaId]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error getting entries by appointment: ${error.message}`);
    }
  }

  // Método específico para obtener entries con recetas
  static async getEntriesWithPrescriptions(patientId) {
    try {
      const [rows] = await pool.execute(
        `SELECT DISTINCT e.*, u.nombre as doctor_nombre 
         FROM entry e
         INNER JOIN usuario u ON e.id_usuario = u.id_usuario
         INNER JOIN receta_detalle rd ON e.id_entry = rd.id_entry
         WHERE e.id_paciente = ?
         ORDER BY e.fecha DESC`,
        [patientId]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error getting entries with prescriptions: ${error.message}`);
    }
  }
}

module.exports = Entry; 