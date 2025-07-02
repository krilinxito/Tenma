const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { authenticateToken, isDoctor } = require('../middlewares/authMiddleware');

// Validation middleware
const prescriptionValidation = [
  body('id_entry').isInt().withMessage('Invalid entry ID'),
  body('id_medicamento').isInt().withMessage('Invalid medication ID'),
  body('dosis').notEmpty().withMessage('Dose is required'),
  body('frecuencia').notEmpty().withMessage('Frequency is required'),
  body('duracion').notEmpty().withMessage('Duration is required'),
  body('instrucciones_adicionales').optional().isString(),
  body('activo').optional().isBoolean(),
  body('deactivatePrevious').optional().isBoolean()
];

const updatePrescriptionValidation = [
  body('dosis').optional().notEmpty().withMessage('Dose is required'),
  body('frecuencia').optional().notEmpty().withMessage('Frequency is required'),
  body('duracion').optional().notEmpty().withMessage('Duration is required'),
  body('instrucciones_adicionales').optional().isString(),
  body('activo').optional().isBoolean()
];

// All routes require authentication
router.use(authenticateToken);

// Routes that require doctor access
router.use(isDoctor);

// Get all prescriptions for a patient
router.get('/patient/:patientId', prescriptionController.getPatientPrescriptions);

// Get active prescriptions for a patient
router.get('/patient/:patientId/active', prescriptionController.getActivePatientPrescriptions);

// Get prescriptions for a specific entry
router.get('/entry/:entryId', prescriptionController.getEntryPrescriptions);

// Get a single prescription
router.get('/:id', prescriptionController.getPrescription);

// Create a new prescription
router.post('/', prescriptionValidation, prescriptionController.createPrescription);

// Update a prescription
router.put('/:id', updatePrescriptionValidation, prescriptionController.updatePrescription);

// Delete a prescription
router.delete('/:id', prescriptionController.deletePrescription);

module.exports = router; 