const IaSession = require('../models/IaSession');
const GeminiService = require('../services/geminiService');

class IaController {
  /**
   * Inicia una nueva sesión de chat con IA
   */
  static async startSession(req, res) {
    try {
      const { id_usuario, id_paciente, rol_ia_custom } = req.body;

      // Verificar si ya existe una sesión activa
      const activeSession = await IaSession.findActiveSession(id_usuario, id_paciente);
      if (activeSession) {
        return res.status(200).json({
          message: 'Sesión activa encontrada',
          session: activeSession
        });
      }

      // Crear nueva sesión
      const sessionId = await IaSession.create({
        id_usuario,
        id_paciente,
        rol_ia_custom
      });

      const session = await IaSession.findById(sessionId);
      res.status(201).json({
        message: 'Sesión iniciada correctamente',
        session
      });
    } catch (error) {
      console.error('Error starting IA session:', error);
      res.status(500).json({
        error: 'Error al iniciar sesión de IA',
        details: error.message
      });
    }
  }

  /**
   * Maneja un mensaje en el chat de IA
   */
  static async handleChat(req, res) {
    try {
      const { id_sesion, mensaje } = req.body;

      // Obtener la sesión
      const session = await IaSession.findById(id_sesion);
      if (!session) {
        return res.status(404).json({
          error: 'Sesión no encontrada'
        });
      }

      // Construir el contexto del paciente
      const context = await GeminiService.buildPatientContext(session.id_paciente);

      // Enviar mensaje a Gemini
      const response = await GeminiService.sendMessage(
        mensaje,
        context,
        session.rol_ia_custom
      );

      // Guardar la interacción en el historial
      await IaSession.addChatEntry(id_sesion, mensaje, response);

      res.status(200).json({
        message: 'Mensaje procesado correctamente',
        response
      });
    } catch (error) {
      console.error('Error handling IA chat:', error);
      res.status(500).json({
        error: 'Error al procesar mensaje de IA',
        details: error.message
      });
    }
  }

  /**
   * Finaliza una sesión de chat
   */
  static async endSession(req, res) {
    try {
      const { id_sesion } = req.params;

      const success = await IaSession.endSession(id_sesion);
      if (!success) {
        return res.status(404).json({
          error: 'Sesión no encontrada'
        });
      }

      res.status(200).json({
        message: 'Sesión finalizada correctamente'
      });
    } catch (error) {
      console.error('Error ending IA session:', error);
      res.status(500).json({
        error: 'Error al finalizar sesión de IA',
        details: error.message
      });
    }
  }

  /**
   * Obtiene el historial de chat de una sesión
   */
  static async getChatHistory(req, res) {
    try {
      const { id_sesion } = req.params;

      const history = await IaSession.getChatHistory(id_sesion);
      res.status(200).json({
        message: 'Historial recuperado correctamente',
        history
      });
    } catch (error) {
      console.error('Error getting chat history:', error);
      res.status(500).json({
        error: 'Error al obtener historial de chat',
        details: error.message
      });
    }
  }

  /**
   * Actualiza el rol personalizado de la IA para una sesión
   */
  static async updateCustomRole(req, res) {
    try {
      const { id_sesion } = req.params;
      const { rol_ia_custom } = req.body;

      const success = await IaSession.updateCustomRole(id_sesion, rol_ia_custom);
      if (!success) {
        return res.status(404).json({
          error: 'Sesión no encontrada'
        });
      }

      res.status(200).json({
        message: 'Rol de IA actualizado correctamente'
      });
    } catch (error) {
      console.error('Error updating IA role:', error);
      res.status(500).json({
        error: 'Error al actualizar rol de IA',
        details: error.message
      });
    }
  }

  /**
   * Analiza un documento médico usando Gemini
   */
  static async analyzeDocument(req, res) {
    try {
      const { id_documento } = req.params;

      const analysis = await GeminiService.analyzeDocument(id_documento);
      res.status(200).json({
        message: 'Documento analizado correctamente',
        analysis
      });
    } catch (error) {
      console.error('Error analyzing document:', error);
      res.status(500).json({
        error: 'Error al analizar documento',
        details: error.message
      });
    }
  }
}

module.exports = IaController; 