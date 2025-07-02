const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas CRUD básicas
router.post('/', PaymentController.create);
router.get('/:id', PaymentController.getById);
router.put('/:id', PaymentController.update);

// Rutas para obtener pagos por diferentes criterios
router.get('/appointment/:appointmentId', PaymentController.getByAppointment);
router.get('/period', PaymentController.getByPeriod);
router.get('/pending', PaymentController.getPendingPayments);
router.get('/stats', PaymentController.getStats);
router.get('/doctor/:doctorId', PaymentController.getByDoctor);
router.get('/patient/:patientId', PaymentController.getByPatient);

module.exports = router; 