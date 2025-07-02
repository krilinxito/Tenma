const { pool } = require('../../config/db');

class Medication {
  /**
   * Crea un nuevo medicamento en el catálogo
   */
  static async create({ nombre, descripcion, principio_activo, presentacion }) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO medicamento (nombre, descripcion, principio_activo, presentacion) VALUES (?, ?, ?, ?)',
        [nombre, descripcion, principio_activo, presentacion]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating medication: ${error.message}`);
    }
  }

  /**
   * Encuentra un medicamento por ID
   */
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM medicamento WHERE id_medicamento = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error finding medication: ${error.message}`);
    }
  }

  /**
   * Busca medicamentos por nombre o principio activo
   */
  static async search(query) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM medicamento WHERE nombre LIKE ? OR principio_activo LIKE ?',
        [`%${query}%`, `%${query}%`]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error searching medications: ${error.message}`);
    }
  }

  /**
   * Actualiza un medicamento
   */
  static async update(id, { nombre, descripcion, principio_activo, presentacion }) {
    try {
      const [result] = await pool.execute(
        'UPDATE medicamento SET nombre = ?, descripcion = ?, principio_activo = ?, presentacion = ? WHERE id_medicamento = ?',
        [nombre, descripcion, principio_activo, presentacion, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating medication: ${error.message}`);
    }
  }

  /**
   * Elimina un medicamento
   */
  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM medicamento WHERE id_medicamento = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting medication: ${error.message}`);
    }
  }

  /**
   * Lista todos los medicamentos
   */
  static async findAll() {
    try {
      const [rows] = await pool.execute('SELECT * FROM medicamento ORDER BY nombre');
      return rows;
    } catch (error) {
      throw new Error(`Error listing medications: ${error.message}`);
    }
  }

  /**
   * Obtiene las recetas que incluyen este medicamento
   */
  static async getPrescriptions(medicationId) {
    try {
      const [rows] = await pool.execute(
        `SELECT rd.*, e.fecha as fecha_receta, e.descripcion as nota_medica,
                u.nombre as doctor_nombre, p.nombre as paciente_nombre
         FROM receta_detalle rd
         INNER JOIN entry e ON rd.id_entry = e.id_entry
         INNER JOIN usuario u ON e.id_usuario = u.id_usuario
         INNER JOIN cita c ON e.id_cita = c.id_cita
         INNER JOIN paciente p ON c.id_paciente = p.id_paciente
         WHERE rd.id_medicamento = ?
         ORDER BY e.fecha DESC`,
        [medicationId]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error getting medication prescriptions: ${error.message}`);
    }
  }

  /**
   * Obtiene estadísticas de uso del medicamento
   */
  static async getUsageStats(medicationId) {
    try {
      const [rows] = await pool.execute(
        `SELECT 
           COUNT(DISTINCT rd.id_receta_detalle) as total_prescriptions,
           COUNT(DISTINCT c.id_paciente) as total_patients,
           COUNT(DISTINCT e.id_usuario) as total_doctors
         FROM receta_detalle rd
         INNER JOIN entry e ON rd.id_entry = e.id_entry
         INNER JOIN cita c ON e.id_cita = c.id_cita
         WHERE rd.id_medicamento = ?`,
        [medicationId]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error getting medication usage stats: ${error.message}`);
    }
  }
}

module.exports = Medication; 