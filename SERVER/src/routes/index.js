const express = require('express');
const router = express.Router();

// Importar todas las rutas
const authRoutes = require('./authRoutes');
const patientRoutes = require('./patientRoutes');
const appointmentRoutes = require('./appointmentRoutes');
const iaRoutes = require('./iaRoutes');
const medicationRoutes = require('./medicationRoutes');
const examRoutes = require('./examRoutes');
const paymentRoutes = require('./paymentRoutes');
const documentRoutes = require('./documentRoutes');
const entryRoutes = require('./entryRoutes');

// Registrar las rutas con sus prefijos
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/ia', iaRoutes);
router.use('/medications', medicationRoutes);
router.use('/exams', examRoutes);
router.use('/payments', paymentRoutes);
router.use('/documents', documentRoutes);
router.use('/entries', entryRoutes);

module.exports = router; 