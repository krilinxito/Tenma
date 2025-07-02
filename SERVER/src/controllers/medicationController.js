const Medication = require('../models/Medication');

class MedicationController {
  /**
   * Crea un nuevo medicamento
   */
  static async create(req, res) {
    try {
      const { nombre, descripcion, principio_activo, presentacion } = req.body;
      
      const medicationId = await Medication.create({
        nombre,
        descripcion,
        principio_activo,
        presentacion
      });

      const medication = await Medication.findById(medicationId);
      
      res.status(201).json({
        message: 'Medicamento creado exitosamente',
        medication
      });
    } catch (error) {
      console.error('Error creating medication:', error);
      res.status(500).json({
        error: 'Error al crear medicamento',
        details: error.message
      });
    }
  }

  /**
   * Obtiene un medicamento por ID
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const medication = await Medication.findById(id);
      
      if (!medication) {
        return res.status(404).json({
          error: 'Medicamento no encontrado'
        });
      }

      res.status(200).json({
        message: 'Medicamento encontrado',
        medication
      });
    } catch (error) {
      console.error('Error getting medication:', error);
      res.status(500).json({
        error: 'Error al obtener medicamento',
        details: error.message
      });
    }
  }

  /**
   * Busca medicamentos por nombre o principio activo
   */
  static async search(req, res) {
    try {
      const { query } = req.query;
      const medications = await Medication.search(query);

      res.status(200).json({
        message: 'Búsqueda realizada exitosamente',
        medications
      });
    } catch (error) {
      console.error('Error searching medications:', error);
      res.status(500).json({
        error: 'Error al buscar medicamentos',
        details: error.message
      });
    }
  }

  /**
   * Actualiza un medicamento
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion, principio_activo, presentacion } = req.body;

      const success = await Medication.update(id, {
        nombre,
        descripcion,
        principio_activo,
        presentacion
      });

      if (!success) {
        return res.status(404).json({
          error: 'Medicamento no encontrado'
        });
      }

      const medication = await Medication.findById(id);

      res.status(200).json({
        message: 'Medicamento actualizado exitosamente',
        medication
      });
    } catch (error) {
      console.error('Error updating medication:', error);
      res.status(500).json({
        error: 'Error al actualizar medicamento',
        details: error.message
      });
    }
  }

  /**
   * Elimina un medicamento
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const success = await Medication.delete(id);

      if (!success) {
        return res.status(404).json({
          error: 'Medicamento no encontrado'
        });
      }

      res.status(200).json({
        message: 'Medicamento eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error deleting medication:', error);
      res.status(500).json({
        error: 'Error al eliminar medicamento',
        details: error.message
      });
    }
  }

  /**
   * Lista todos los medicamentos
   */
  static async getAll(req, res) {
    try {
      const medications = await Medication.findAll();

      res.status(200).json({
        message: 'Medicamentos recuperados exitosamente',
        medications
      });
    } catch (error) {
      console.error('Error listing medications:', error);
      res.status(500).json({
        error: 'Error al listar medicamentos',
        details: error.message
      });
    }
  }

  /**
   * Obtiene las prescripciones de un medicamento
   */
  static async getPrescriptions(req, res) {
    try {
      const { id } = req.params;
      const prescriptions = await Medication.getPrescriptions(id);

      res.status(200).json({
        message: 'Prescripciones recuperadas exitosamente',
        prescriptions
      });
    } catch (error) {
      console.error('Error getting medication prescriptions:', error);
      res.status(500).json({
        error: 'Error al obtener prescripciones',
        details: error.message
      });
    }
  }

  /**
   * Obtiene estadísticas de uso de un medicamento
   */
  static async getStats(req, res) {
    try {
      const { id } = req.params;
      const stats = await Medication.getUsageStats(id);

      res.status(200).json({
        message: 'Estadísticas recuperadas exitosamente',
        stats
      });
    } catch (error) {
      console.error('Error getting medication stats:', error);
      res.status(500).json({
        error: 'Error al obtener estadísticas',
        details: error.message
      });
    }
  }
}

module.exports = MedicationController; 