const { pool } = require('../../config/db');

class Document {
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM documento WHERE id_documento = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error finding document by ID: ${error.message}`);
    }
  }

  static async create({
    id_paciente,
    id_cita,
    url_archivo,
    uri_gemini,
    tipo,
    nombre_archivo
  }) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO documento (
          id_paciente, id_cita, url_archivo, uri_gemini,
          tipo, nombre_archivo
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id_paciente,
          id_cita,
          url_archivo,
          uri_gemini,
          tipo,
          nombre_archivo
        ]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating document: ${error.message}`);
    }
  }

  static async update(id, {
    url_archivo,
    uri_gemini,
    tipo,
    nombre_archivo
  }) {
    try {
      const [result] = await pool.execute(
        `UPDATE documento SET
          url_archivo = ?, uri_gemini = ?, tipo = ?, nombre_archivo = ?
         WHERE id_documento = ?`,
        [url_archivo, uri_gemini, tipo, nombre_archivo, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating document: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM documento WHERE id_documento = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting document: ${error.message}`);
    }
  }

  static async getPatientDocuments(patientId, options = {}) {
    try {
      let query = 'SELECT * FROM documento WHERE id_paciente = ?';
      const queryParams = [patientId];

      // Add filters
      if (options.tipo) {
        query += ' AND tipo = ?';
        queryParams.push(options.tipo);
      }
      if (options.fromDate) {
        query += ' AND fecha_subida >= ?';
        queryParams.push(options.fromDate);
      }
      if (options.toDate) {
        query += ' AND fecha_subida <= ?';
        queryParams.push(options.toDate);
      }
      if (options.citaId) {
        query += ' AND id_cita = ?';
        queryParams.push(options.citaId);
      }

      // Add order and limit
      query += ' ORDER BY fecha_subida DESC';
      if (options.limit) {
        query += ' LIMIT ?';
        queryParams.push(options.limit);
      }

      const [rows] = await pool.execute(query, queryParams);
      return rows;
    } catch (error) {
      throw new Error(`Error getting patient documents: ${error.message}`);
    }
  }

  static async getAppointmentDocuments(citaId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM documento WHERE id_cita = ? ORDER BY fecha_subida DESC',
        [citaId]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error getting appointment documents: ${error.message}`);
    }
  }

  static async getDocumentsByType(patientId, tipo) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM documento WHERE id_paciente = ? AND tipo = ? ORDER BY fecha_subida DESC',
        [patientId, tipo]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error getting documents by type: ${error.message}`);
    }
  }

  // Método específico para documentos de exámenes
  static async getExamDocuments(examenResultadoId) {
    try {
      const [rows] = await pool.execute(
        `SELECT d.* FROM documento d
         INNER JOIN examen_resultado er ON d.id_documento = er.id_documento_asociado
         WHERE er.id_examen_resultado = ?`,
        [examenResultadoId]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error getting exam documents: ${error.message}`);
    }
  }
}

module.exports = Document; 