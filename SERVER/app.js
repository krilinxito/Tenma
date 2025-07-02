const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const { expressjwt: jwt } = require('express-jwt');
require('dotenv').config();

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const patientRoutes = require('./src/routes/patientRoutes');
const entryRoutes = require('./src/routes/entryRoutes');
const documentRoutes = require('./src/routes/documentRoutes');
const prescriptionRoutes = require('./src/routes/prescriptionRoutes');
const appointmentRoutes = require('./src/routes/appointmentRoutes');
const iaRoutes = require('./src/routes/iaRoutes');

// Import database connection
const { testConnection } = require('./config/db');

// Import services
const ReminderService = require('./src/services/reminderService');

// Create Express app
const app = express();

// Test database connection
testConnection();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Proteger rutas con JWT excepto las de autenticación
app.use(
  jwt({
    secret: process.env.JWT_SECRET,
    algorithms: ['HS256']
  }).unless({
    path: [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/refresh-token'
    ]
  })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/ia', iaRoutes);

// Basic route for testing
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      message: 'Token inválido o no proporcionado'
    });
  }

  res.status(500).json({
    error: 'Error interno del servidor',
    details: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Not Found',
      status: 404
    }
  });
});

// Iniciar servicio de recordatorios
ReminderService.startReminderService();

module.exports = app;
