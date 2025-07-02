const Exam = require('../models/Exam');

class ExamController {
  /**
   * Crea un nuevo tipo de examen
   */
  static async createType(req, res) {
    try {
      const { nombre, descripcion } = req.body;
      
      const examTypeId = await Exam.createType({
        nombre,
        descripcion
      });

      const examType = await Exam.findTypeById(examTypeId);
      
      res.status(201).json({
        message: 'Tipo de examen creado exitosamente',
        examType
      });
    } catch (error) {
      console.error('Error creating exam type:', error);
      res.status(500).json({
        error: 'Error al crear tipo de examen',
        details: error.message
      });
    }
  }

  /**
   * Lista todos los tipos de exámenes
   */
  static async getAllTypes(req, res) {
    try {
      const examTypes = await Exam.findAllTypes();

      res.status(200).json({
        message: 'Tipos de exámenes recuperados exitosamente',
        examTypes
      });
    } catch (error) {
      console.error('Error listing exam types:', error);
      res.status(500).json({
        error: 'Error al listar tipos de exámenes',
        details: error.message
      });
    }
  }

  /**
   * Solicita un nuevo examen
   */
  static async requestExam(req, res) {
    try {
      const { id_entry, id_examen_tipo, observaciones } = req.body;
      
      const examRequestId = await Exam.requestExam({
        id_entry,
        id_examen_tipo,
        observaciones
      });

      const examRequest = await Exam.findRequestById(examRequestId);
      
      res.status(201).json({
        message: 'Examen solicitado exitosamente',
        examRequest
      });
    } catch (error) {
      console.error('Error requesting exam:', error);
      res.status(500).json({
        error: 'Error al solicitar examen',
        details: error.message
      });
    }
  }

  /**
   * Registra el resultado de un examen
   */
  static async registerResult(req, res) {
    try {
      const {
        id_examen_solicitado,
        valor_resultado,
        unidad,
        rango_referencia,
        interpretacion,
        id_documento_asociado,
        fecha_resultado
      } = req.body;

      const resultId = await Exam.registerResult({
        id_examen_solicitado,
        valor_resultado,
        unidad,
        rango_referencia,
        interpretacion,
        id_documento_asociado,
        fecha_resultado
      });

      const result = await Exam.findResultById(resultId);

      res.status(201).json({
        message: 'Resultado registrado exitosamente',
        result
      });
    } catch (error) {
      console.error('Error registering exam result:', error);
      res.status(500).json({
        error: 'Error al registrar resultado',
        details: error.message
      });
    }
  }

  /**
   * Obtiene un examen solicitado por ID
   */
  static async getRequestById(req, res) {
    try {
      const { id } = req.params;
      const examRequest = await Exam.findRequestById(id);

      if (!examRequest) {
        return res.status(404).json({
          error: 'Examen solicitado no encontrado'
        });
      }

      res.status(200).json({
        message: 'Examen solicitado encontrado',
        examRequest
      });
    } catch (error) {
      console.error('Error getting exam request:', error);
      res.status(500).json({
        error: 'Error al obtener examen solicitado',
        details: error.message
      });
    }
  }

  /**
   * Obtiene un resultado de examen por ID
   */
  static async getResultById(req, res) {
    try {
      const { id } = req.params;
      const result = await Exam.findResultById(id);

      if (!result) {
        return res.status(404).json({
          error: 'Resultado no encontrado'
        });
      }

      res.status(200).json({
        message: 'Resultado encontrado',
        result
      });
    } catch (error) {
      console.error('Error getting exam result:', error);
      res.status(500).json({
        error: 'Error al obtener resultado',
        details: error.message
      });
    }
  }

  /**
   * Obtiene todos los exámenes de un paciente
   */
  static async getPatientExams(req, res) {
    try {
      const { patientId } = req.params;
      const exams = await Exam.getPatientExams(patientId);

      res.status(200).json({
        message: 'Exámenes recuperados exitosamente',
        exams
      });
    } catch (error) {
      console.error('Error getting patient exams:', error);
      res.status(500).json({
        error: 'Error al obtener exámenes del paciente',
        details: error.message
      });
    }
  }

  /**
   * Obtiene exámenes pendientes de resultado
   */
  static async getPendingExams(req, res) {
    try {
      const pendingExams = await Exam.getPendingExams();

      res.status(200).json({
        message: 'Exámenes pendientes recuperados exitosamente',
        pendingExams
      });
    } catch (error) {
      console.error('Error getting pending exams:', error);
      res.status(500).json({
        error: 'Error al obtener exámenes pendientes',
        details: error.message
      });
    }
  }

  /**
   * Actualiza el resultado de un examen
   */
  static async updateResult(req, res) {
    try {
      const { id } = req.params;
      const {
        valor_resultado,
        unidad,
        rango_referencia,
        interpretacion,
        id_documento_asociado,
        fecha_resultado
      } = req.body;

      const success = await Exam.updateResult(id, {
        valor_resultado,
        unidad,
        rango_referencia,
        interpretacion,
        id_documento_asociado,
        fecha_resultado
      });

      if (!success) {
        return res.status(404).json({
          error: 'Resultado no encontrado'
        });
      }

      const result = await Exam.findResultById(id);

      res.status(200).json({
        message: 'Resultado actualizado exitosamente',
        result
      });
    } catch (error) {
      console.error('Error updating exam result:', error);
      res.status(500).json({
        error: 'Error al actualizar resultado',
        details: error.message
      });
    }
  }
}

module.exports = ExamController; 