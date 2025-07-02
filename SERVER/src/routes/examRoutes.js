const express = require('express');
const router = express.Router();
const ExamController = require('../controllers/examController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas para tipos de exámenes
router.post('/types', ExamController.createType);
router.get('/types', ExamController.getAllTypes);

// Rutas para solicitudes de exámenes
router.post('/request', ExamController.requestExam);
router.get('/request/:id', ExamController.getRequestById);
router.get('/patient/:patientId', ExamController.getPatientExams);
router.get('/pending', ExamController.getPendingExams);

// Rutas para resultados de exámenes
router.post('/result', ExamController.registerResult);
router.get('/result/:id', ExamController.getResultById);
router.put('/result/:id', ExamController.updateResult);

module.exports = router; 