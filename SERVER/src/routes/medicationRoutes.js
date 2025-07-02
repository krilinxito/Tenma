const express = require('express');
const router = express.Router();
const MedicationController = require('../controllers/medicationController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas CRUD básicas
router.post('/', MedicationController.create);
router.get('/', MedicationController.getAll);
router.get('/:id', MedicationController.getById);
router.put('/:id', MedicationController.update);
router.delete('/:id', MedicationController.delete);

// Rutas adicionales
router.get('/search', MedicationController.search);
router.get('/:id/prescriptions', MedicationController.getPrescriptions);
router.get('/:id/stats', MedicationController.getStats);

module.exports = router; 