const express = require('express');
const router = express.Router();
const iaController = require('../controllers/iaController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Iniciar una nueva sesión de chat
router.post('/sessions', iaController.startSession);

// Enviar un mensaje al chat
router.post('/chat', iaController.handleChat);

// Finalizar una sesión de chat
router.post('/sessions/:id_sesion/end', iaController.endSession);

// Obtener historial de chat de una sesión
router.get('/sessions/:id_sesion/history', iaController.getChatHistory);

// Actualizar el rol personalizado de la IA para una sesión
router.put('/sessions/:id_sesion/role', iaController.updateCustomRole);

// Analizar un documento médico con IA
router.post('/documents/:id_documento/analyze', iaController.analyzeDocument);

module.exports = router; 