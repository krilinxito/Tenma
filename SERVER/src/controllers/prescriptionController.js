const { validationResult } = require('express-validator');
const Prescription = require('../models/Prescription');

// Get all prescriptions for a patient
const getPatientPrescriptions = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const { activo, fromDate, toDate, medicamentoId, doctorId, limit } = req.query;

    const prescriptions = await Prescription.getPatientPrescriptionHistory(patientId, {
      activo: activo === 'true',
      fromDate,
      toDate,
      medicamentoId: parseInt(medicamentoId) || undefined,
      doctorId: parseInt(doctorId) || undefined,
      limit: parseInt(limit) || undefined
    });

    res.json({ prescriptions });
  } catch (error) {
    console.error('Get patient prescriptions error:', error);
    res.status(500).json({ error: 'Error fetching patient prescriptions' });
  }
};

// Get active prescriptions for a patient
const getActivePatientPrescriptions = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const prescriptions = await Prescription.getActiveByPatient(patientId);
    res.json({ prescriptions });
  } catch (error) {
    console.error('Get active prescriptions error:', error);
    res.status(500).json({ error: 'Error fetching active prescriptions' });
  }
};

// Get a single prescription
const getPrescription = async (req, res) => {
  try {
    const prescriptionId = req.params.id;
    const prescription = await Prescription.findById(prescriptionId);
    
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    res.json({ prescription });
  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({ error: 'Error fetching prescription' });
  }
};

// Create a new prescription
const createPrescription = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      id_entry,
      id_medicamento,
      dosis,
      frecuencia,
      duracion,
      instrucciones_adicionales,
      activo,
      deactivatePrevious
    } = req.body;

    // If requested, deactivate previous prescriptions for this medication
    if (deactivatePrevious) {
      // We need to get the patient ID from the entry
      const entry = await Entry.findById(id_entry);
      if (entry) {
        await Prescription.deactivateAllForMedication(
          entry.id_paciente,
          id_medicamento
        );
      }
    }

    const prescriptionId = await Prescription.create({
      id_entry,
      id_medicamento,
      dosis,
      frecuencia,
      duracion,
      instrucciones_adicionales,
      activo
    });

    const createdPrescription = await Prescription.findById(prescriptionId);
    res.status(201).json({
      message: 'Prescription created successfully',
      prescription: createdPrescription
    });
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({ error: 'Error creating prescription' });
  }
};

// Update a prescription
const updatePrescription = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const prescriptionId = req.params.id;
    const {
      dosis,
      frecuencia,
      duracion,
      instrucciones_adicionales,
      activo
    } = req.body;

    // Check if prescription exists
    const existingPrescription = await Prescription.findById(prescriptionId);
    if (!existingPrescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Update prescription
    const updated = await Prescription.update(prescriptionId, {
      dosis,
      frecuencia,
      duracion,
      instrucciones_adicionales,
      activo
    });

    if (!updated) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const updatedPrescription = await Prescription.findById(prescriptionId);
    res.json({
      message: 'Prescription updated successfully',
      prescription: updatedPrescription
    });
  } catch (error) {
    console.error('Update prescription error:', error);
    res.status(500).json({ error: 'Error updating prescription' });
  }
};

// Delete a prescription
const deletePrescription = async (req, res) => {
  try {
    const prescriptionId = req.params.id;
    
    // Check if prescription exists
    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Delete prescription
    const deleted = await Prescription.delete(prescriptionId);
    if (!deleted) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    res.json({ message: 'Prescription deleted successfully' });
  } catch (error) {
    console.error('Delete prescription error:', error);
    res.status(500).json({ error: 'Error deleting prescription' });
  }
};

// Get prescriptions for a specific entry
const getEntryPrescriptions = async (req, res) => {
  try {
    const entryId = req.params.entryId;
    const prescriptions = await Prescription.getByEntry(entryId);
    res.json({ prescriptions });
  } catch (error) {
    console.error('Get entry prescriptions error:', error);
    res.status(500).json({ error: 'Error fetching entry prescriptions' });
  }
};

module.exports = {
  getPatientPrescriptions,
  getActivePatientPrescriptions,
  getPrescription,
  createPrescription,
  updatePrescription,
  deletePrescription,
  getEntryPrescriptions
}; 