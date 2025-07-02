const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const AppointmentController = require('../controllers/appointmentController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Middleware de validación para ID de cita
const validateAppointmentId = [
  param('id').isInt().withMessage('ID de cita inválido')
];

// Middleware de validación para creación/actualización de cita
const validateAppointment = [
  body('id_usuario')
    .optional()
    .isInt()
    .withMessage('ID de usuario inválido'),
  
  body('id_paciente')
    .optional()
    .isInt()
    .withMessage('ID de paciente inválido'),
  
  body('fecha')
    .optional()
    .isDate()
    .withMessage('Fecha inválida'),
  
  body('hora')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Hora inválida (formato HH:MM)'),
  
  body('tipo_cita')
    .optional()
    .isIn(['presencial', 'virtual'])
    .withMessage('Tipo de cita inválido'),
  
  body('motivo')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Motivo inválido (1-500 caracteres)'),
  
  body('estado')
    .optional()
    .isIn(['programada', 'asistida', 'cancelada', 'reprogramada', 'pendiente_confirmacion'])
    .withMessage('Estado inválido')
];

// Middleware de validación para filtros de búsqueda
const validateFilters = [
  query('fromDate')
    .optional()
    .isDate()
    .withMessage('Fecha inicial inválida'),
  
  query('toDate')
    .optional()
    .isDate()
    .withMessage('Fecha final inválida'),
  
  query('estado')
    .optional()
    .isIn(['programada', 'asistida', 'cancelada', 'reprogramada', 'pendiente_confirmacion'])
    .withMessage('Estado inválido'),
  
  query('tipo_cita')
    .optional()
    .isIn(['presencial', 'virtual'])
    .withMessage('Tipo de cita inválido')
];

// Rutas
router.use(authenticateToken); // Proteger todas las rutas

// Obtener cita por ID
router.get('/:id', validateAppointmentId, AppointmentController.getById);

// Obtener citas de un paciente
router.get(
  '/patient/:patientId',
  [
    param('patientId').isInt().withMessage('ID de paciente inválido'),
    ...validateFilters
  ],
  AppointmentController.getPatientAppointments
);

// Obtener citas de un doctor
router.get(
  '/doctor/:doctorId',
  [
    param('doctorId').isInt().withMessage('ID de doctor inválido'),
    ...validateFilters
  ],
  AppointmentController.getDoctorAppointments
);

// Obtener horarios disponibles de un doctor
router.get(
  '/available-slots/:doctorId/:fecha',
  [
    param('doctorId').isInt().withMessage('ID de doctor inválido'),
    param('fecha').isDate().withMessage('Fecha inválida')
  ],
  AppointmentController.getDoctorAvailableSlots
);

// Crear nueva cita
router.post(
  '/',
  [
    body('id_usuario').isInt().withMessage('ID de usuario requerido'),
    body('id_paciente').isInt().withMessage('ID de paciente requerido'),
    body('fecha').isDate().withMessage('Fecha requerida'),
    body('hora')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Hora requerida (formato HH:MM)'),
    body('tipo_cita')
      .isIn(['presencial', 'virtual'])
      .withMessage('Tipo de cita requerido'),
    body('motivo')
      .isString()
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Motivo requerido (1-500 caracteres)')
  ],
  AppointmentController.create
);

// Actualizar cita
router.put(
  '/:id',
  [
    ...validateAppointmentId,
    ...validateAppointment
  ],
  AppointmentController.update
);

// Eliminar cita
router.delete(
  '/:id',
  validateAppointmentId,
  AppointmentController.delete
);

// Marcar cita como asistida
router.patch(
  '/:id/mark-attended',
  validateAppointmentId,
  AppointmentController.markAsAttended
);

module.exports = router; 