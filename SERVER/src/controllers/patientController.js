const { validationResult } = require('express-validator');
const Patient = require('../models/Patient');

// Get all patients (admin/employee access)
const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.getAllPatients();
    res.json({ patients });
  } catch (error) {
    console.error('Get all patients error:', error);
    res.status(500).json({ error: 'Error fetching patients' });
  }
};

// Get patients for a specific doctor
const getMyPatients = async (req, res) => {
  try {
    const doctorId = req.user.id_usuario;
    const patients = await Patient.getPatientsByDoctor(doctorId);
    res.json({ patients });
  } catch (error) {
    console.error('Get doctor patients error:', error);
    res.status(500).json({ error: 'Error fetching your patients' });
  }
};

// Get a single patient by ID
const getPatient = async (req, res) => {
  try {
    const patientId = req.params.id;
    const patient = await Patient.findById(patientId);
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({ patient });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ error: 'Error fetching patient' });
  }
};

// Create a new patient
const createPatient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      nombre,
      apellido,
      email,
      telefono,
      fecha_nacimiento,
      genero,
      grupo_sanguineo,
      estatura_cm,
      peso_kg,
      alergias,
      enfermedades_base,
      observaciones,
      doctorId // Optional: to immediately assign a doctor
    } = req.body;

    // Check if email is provided and if it's already registered
    if (email) {
      const existingPatient = await Patient.findByEmail(email);
      if (existingPatient) {
        return res.status(400).json({ error: 'Email already registered' });
      }
    }

    // Create patient
    const patientId = await Patient.create({
      nombre,
      apellido,
      email,
      telefono,
      fecha_nacimiento,
      genero,
      grupo_sanguineo,
      estatura_cm,
      peso_kg,
      alergias,
      enfermedades_base,
      observaciones
    });

    // If doctorId is provided, assign the doctor
    if (doctorId) {
      await Patient.assignDoctor(patientId, doctorId);
    }

    const newPatient = await Patient.findById(patientId);
    res.status(201).json({
      message: 'Patient created successfully',
      patient: newPatient
    });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ error: 'Error creating patient' });
  }
};

// Update a patient
const updatePatient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const patientId = req.params.id;
    const {
      nombre,
      apellido,
      email,
      telefono,
      fecha_nacimiento,
      genero,
      grupo_sanguineo,
      estatura_cm,
      peso_kg,
      alergias,
      enfermedades_base,
      observaciones
    } = req.body;

    // Check if patient exists
    const existingPatient = await Patient.findById(patientId);
    if (!existingPatient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== existingPatient.email) {
      const emailExists = await Patient.findByEmail(email);
      if (emailExists) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Update patient
    const updated = await Patient.update(patientId, {
      nombre,
      apellido,
      email,
      telefono,
      fecha_nacimiento,
      genero,
      grupo_sanguineo,
      estatura_cm,
      peso_kg,
      alergias,
      enfermedades_base,
      observaciones
    });

    if (!updated) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const updatedPatient = await Patient.findById(patientId);
    res.json({
      message: 'Patient updated successfully',
      patient: updatedPatient
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ error: 'Error updating patient' });
  }
};

// Delete a patient
const deletePatient = async (req, res) => {
  try {
    const patientId = req.params.id;
    
    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Delete patient
    const deleted = await Patient.delete(patientId);
    if (!deleted) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ error: 'Error deleting patient' });
  }
};

// Assign a doctor to a patient
const assignDoctor = async (req, res) => {
  try {
    const { patientId, doctorId } = req.body;

    const assigned = await Patient.assignDoctor(patientId, doctorId);
    if (!assigned) {
      return res.status(400).json({ error: 'Could not assign doctor to patient' });
    }

    res.json({ message: 'Doctor assigned successfully' });
  } catch (error) {
    console.error('Assign doctor error:', error);
    res.status(500).json({ error: 'Error assigning doctor' });
  }
};

// Remove a doctor from a patient
const removeDoctor = async (req, res) => {
  try {
    const { patientId, doctorId } = req.body;

    const removed = await Patient.removeDoctor(patientId, doctorId);
    if (!removed) {
      return res.status(400).json({ error: 'Could not remove doctor from patient' });
    }

    res.json({ message: 'Doctor removed successfully' });
  } catch (error) {
    console.error('Remove doctor error:', error);
    res.status(500).json({ error: 'Error removing doctor' });
  }
};

// Get patient's full medical history
const getPatientHistory = async (req, res) => {
  try {
    const patientId = req.params.id;
    
    // Check if patient exists
    const patientExists = await Patient.findById(patientId);
    if (!patientExists) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const history = await Patient.getPatientFullHistory(patientId);
    res.json(history);
  } catch (error) {
    console.error('Get patient history error:', error);
    res.status(500).json({ error: 'Error fetching patient history' });
  }
};

module.exports = {
  getAllPatients,
  getMyPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  assignDoctor,
  removeDoctor,
  getPatientHistory
};