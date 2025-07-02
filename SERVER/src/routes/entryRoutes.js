const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const entryController = require('../controllers/entryController');
const { authenticateToken, isDoctor } = require('../middlewares/authMiddleware');

// Validation middleware
const entryValidation = [
  body('id_paciente').isInt().withMessage('Invalid patient ID'),
  body('id_cita').optional().isInt().withMessage('Invalid appointment ID'),
  body('descripcion').notEmpty().withMessage('Description is required'),
  body('destacada').optional().isBoolean().withMessage('Invalid highlight flag'),
  body('prescriptions').optional().isArray().withMessage('Prescriptions must be an array'),
  body('prescriptions.*.id_medicamento').optional().isInt().withMessage('Invalid medication ID'),
  body('prescriptions.*.dosis').optional().notEmpty().withMessage('Dose is required'),
  body('prescriptions.*.frecuencia').optional().notEmpty().withMessage('Frequency is required'),
  body('prescriptions.*.duracion').optional().notEmpty().withMessage('Duration is required'),
  body('prescriptions.*.instrucciones_adicionales').optional().isString(),
  body('prescriptions.*.activo').optional().isBoolean(),
  body('prescriptions.*.deactivatePrevious').optional().isBoolean(),
  body('documents').optional().isArray().withMessage('Documents must be an array'),
  body('documents.*.url_archivo').optional().isURL().withMessage('Invalid file URL'),
  body('documents.*.uri_gemini').optional().isString(),
  body('documents.*.tipo').optional().isIn(['receta', 'examen', 'imagen', 'informe', 'otros']).withMessage('Invalid document type'),
  body('documents.*.nombre_archivo').optional().notEmpty().withMessage('File name is required')
];

const updateEntryValidation = [
  body('descripcion').notEmpty().withMessage('Description is required'),
  body('destacada').optional().isBoolean().withMessage('Invalid highlight flag')
];

// All routes require authentication
router.use(authenticateToken);

// Routes that require doctor access
router.use(isDoctor);

// Get all entries for a patient
router.get('/patient/:patientId', entryController.getPatientEntries);

// Get entries with prescriptions for a patient
router.get('/patient/:patientId/prescriptions', entryController.getPatientPrescriptionEntries);

// Get entries for a specific appointment
router.get('/appointment/:citaId', entryController.getAppointmentEntries);

// Get a single entry with its prescriptions and documents
router.get('/:id', entryController.getEntry);

// Create a new entry
router.post('/', entryValidation, entryController.createEntry);

// Update an entry
router.put('/:id', updateEntryValidation, entryController.updateEntry);

// Delete an entry
router.delete('/:id', entryController.deleteEntry);

module.exports = router; 