const { pool } = require('../../config/db');

class Prescription {
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        `SELECT rd.*, m.nombre as medicamento_nombre, 
                m.descripcion as medicamento_descripcion,
                m.principio_activo, m.presentacion,
                e.fecha as fecha_receta,
                u.nombre as doctor_nombre
         FROM receta_detalle rd
         INNER JOIN medicamento m ON rd.id_medicamento = m.id_medicamento
         INNER JOIN entry e ON rd.id_entry = e.id_entry
         INNER JOIN usuario u ON e.id_usuario = u.id_usuario
         WHERE rd.id_receta_detalle = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error finding prescription by ID: ${error.message}`);
    }
  }

  static async create({
    id_entry,
    id_medicamento,
    dosis,
    frecuencia,
    duracion,
    instrucciones_adicionales,
    activo = true
  }) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO receta_detalle (
          id_entry, id_medicamento, dosis, frecuencia,
          duracion, instrucciones_adicionales, activo
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id_entry,
          id_medicamento,
          dosis,
          frecuencia,
          duracion,
          instrucciones_adicionales,
          activo
        ]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating prescription: ${error.message}`);
    }
  }

  static async update(id, {
    dosis,
    frecuencia,
    duracion,
    instrucciones_adicionales,
    activo
  }) {
    try {
      const [result] = await pool.execute(
        `UPDATE receta_detalle SET
          dosis = ?, frecuencia = ?, duracion = ?,
          instrucciones_adicionales = ?, activo = ?
         WHERE id_receta_detalle = ?`,
        [dosis, frecuencia, duracion, instrucciones_adicionales, activo, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating prescription: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM receta_detalle WHERE id_receta_detalle = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting prescription: ${error.message}`);
    }
  }

  static async getByEntry(entryId) {
    try {
      const [rows] = await pool.execute(
        `SELECT rd.*, m.nombre as medicamento_nombre,
                m.descripcion as medicamento_descripcion,
                m.principio_activo, m.presentacion
         FROM receta_detalle rd
         INNER JOIN medicamento m ON rd.id_medicamento = m.id_medicamento
         WHERE rd.id_entry = ?
         ORDER BY rd.id_receta_detalle ASC`,
        [entryId]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error getting prescriptions by entry: ${error.message}`);
    }
  }

  static async getActiveByPatient(patientId) {
    try {
      const [rows] = await pool.execute(
        `SELECT rd.*, m.nombre as medicamento_nombre,
                m.descripcion as medicamento_descripcion,
                m.principio_activo, m.presentacion,
                e.fecha as fecha_receta,
                u.nombre as doctor_nombre
         FROM receta_detalle rd
         INNER JOIN entry e ON rd.id_entry = e.id_entry
         INNER JOIN medicamento m ON rd.id_medicamento = m.id_medicamento
         INNER JOIN usuario u ON e.id_usuario = u.id_usuario
         WHERE e.id_paciente = ? AND rd.activo = true
         ORDER BY e.fecha DESC`,
        [patientId]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error getting active prescriptions: ${error.message}`);
    }
  }

  static async getPatientPrescriptionHistory(patientId, options = {}) {
    try {
      let query = `
        SELECT rd.*, m.nombre as medicamento_nombre,
               m.descripcion as medicamento_descripcion,
               m.principio_activo, m.presentacion,
               e.fecha as fecha_receta,
               u.nombre as doctor_nombre
        FROM receta_detalle rd
        INNER JOIN entry e ON rd.id_entry = e.id_entry
        INNER JOIN medicamento m ON rd.id_medicamento = m.id_medicamento
        INNER JOIN usuario u ON e.id_usuario = u.id_usuario
        WHERE e.id_paciente = ?
      `;

      const queryParams = [patientId];

      // Add filters
      if (options.activo !== undefined) {
        query += ' AND rd.activo = ?';
        queryParams.push(options.activo);
      }
      if (options.fromDate) {
        query += ' AND e.fecha >= ?';
        queryParams.push(options.fromDate);
      }
      if (options.toDate) {
        query += ' AND e.fecha <= ?';
        queryParams.push(options.toDate);
      }
      if (options.medicamentoId) {
        query += ' AND rd.id_medicamento = ?';
        queryParams.push(options.medicamentoId);
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
      throw new Error(`Error getting prescription history: ${error.message}`);
    }
  }

  // Método para marcar todas las recetas activas de un medicamento específico como inactivas
  static async deactivateAllForMedication(patientId, medicamentoId) {
    try {
      const [result] = await pool.execute(
        `UPDATE receta_detalle rd
         INNER JOIN entry e ON rd.id_entry = e.id_entry
         SET rd.activo = false
         WHERE e.id_paciente = ? AND rd.id_medicamento = ? AND rd.activo = true`,
        [patientId, medicamentoId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deactivating prescriptions: ${error.message}`);
    }
  }
}

module.exports = Prescription; 