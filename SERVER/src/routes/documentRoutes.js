const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { authenticateToken, isDoctor } = require('../middlewares/authMiddleware');

// Validation middleware
const documentValidation = [
  body('id_paciente').isInt().withMessage('Invalid patient ID'),
  body('id_cita').optional().isInt().withMessage('Invalid appointment ID'),
  body('url_archivo').isURL().withMessage('Invalid file URL'),
  body('uri_gemini').optional().isString(),
  body('tipo').isIn(['receta', 'examen', 'imagen', 'informe', 'otros']).withMessage('Invalid document type'),
  body('nombre_archivo').notEmpty().withMessage('File name is required')
];

const updateDocumentValidation = [
  body('url_archivo').optional().isURL().withMessage('Invalid file URL'),
  body('uri_gemini').optional().isString(),
  body('tipo').optional().isIn(['receta', 'examen', 'imagen', 'informe', 'otros']).withMessage('Invalid document type'),
  body('nombre_archivo').optional().notEmpty().withMessage('File name is required')
];

// All routes require authentication
router.use(authenticateToken);

// Routes that require doctor access
router.use(isDoctor);

// Get all documents for a patient
router.get('/patient/:patientId', documentController.getPatientDocuments);

// Get documents by type for a patient
router.get('/patient/:patientId/type/:tipo', documentController.getDocumentsByType);

// Get documents for a specific appointment
router.get('/appointment/:citaId', documentController.getAppointmentDocuments);

// Get documents associated with an exam result
router.get('/exam/:examenResultadoId', documentController.getExamDocuments);

// Get a single document
router.get('/:id', documentController.getDocument);

// Create a new document
router.post('/', documentValidation, documentController.createDocument);

// Update a document
router.put('/:id', updateDocumentValidation, documentController.updateDocument);

// Delete a document
router.delete('/:id', documentController.deleteDocument);

module.exports = router; 