const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticateToken, isDoctor, isEmployee } = require('../middlewares/authMiddleware');

// Validation middleware
const patientValidation = [
  body('nombre').trim().notEmpty().withMessage('Name is required'),
  body('apellido').trim().notEmpty().withMessage('Last name is required'),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('telefono').notEmpty().withMessage('Phone number is required'),
  body('fecha_nacimiento')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid date format'),
  body('genero')
    .optional()
    .isIn(['masculino', 'femenino', 'otro', 'no especificado'])
    .withMessage('Invalid gender'),
  body('grupo_sanguineo')
    .optional()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood type'),
  body('estatura_cm')
    .optional()
    .isInt({ min: 0, max: 300 })
    .withMessage('Height must be between 0 and 300 cm'),
  body('peso_kg')
    .optional()
    .isFloat({ min: 0, max: 500 })
    .withMessage('Weight must be between 0 and 500 kg'),
  body('alergias').optional().isString(),
  body('enfermedades_base').optional().isString(),
  body('observaciones').optional().isString()
];

// Doctor assignment validation
const assignDoctorValidation = [
  body('patientId').isInt().withMessage('Invalid patient ID'),
  body('doctorId').isInt().withMessage('Invalid doctor ID')
];

// Routes that require authentication
router.use(authenticateToken);

// Routes for all authenticated users
router.get('/:id', patientController.getPatient);
router.get('/:id/history', patientController.getPatientHistory);

// Routes for doctors
router.get('/doctor/mypatients', isDoctor, patientController.getMyPatients);

// Routes that require employee access
router.get('/', isEmployee, patientController.getAllPatients);
router.post('/', isEmployee, patientValidation, patientController.createPatient);
router.put('/:id', isEmployee, patientValidation, patientController.updatePatient);
router.delete('/:id', isEmployee, patientController.deletePatient);

// Doctor assignment routes (employee only)
router.post('/assign-doctor', isEmployee, assignDoctorValidation, patientController.assignDoctor);
router.post('/remove-doctor', isEmployee, assignDoctorValidation, patientController.removeDoctor);

module.exports = router; 