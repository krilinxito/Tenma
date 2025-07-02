const { validationResult } = require('express-validator');
const Entry = require('../models/Entry');
const Prescription = require('../models/Prescription');
const Document = require('../models/Document');

// Get all entries for a patient
const getPatientEntries = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const { destacada, fromDate, toDate, doctorId, limit } = req.query;

    const entries = await Entry.getPatientEntries(patientId, {
      destacada: destacada === 'true',
      fromDate,
      toDate,
      doctorId,
      limit: parseInt(limit) || undefined
    });

    res.json({ entries });
  } catch (error) {
    console.error('Get patient entries error:', error);
    res.status(500).json({ error: 'Error fetching patient entries' });
  }
};

// Get a single entry
const getEntry = async (req, res) => {
  try {
    const entryId = req.params.id;
    const entry = await Entry.findById(entryId);
    
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // Get associated prescriptions if any
    const prescriptions = await Prescription.getByEntry(entryId);
    
    // Get associated documents if any
    const documents = await Document.getAppointmentDocuments(entry.id_cita);

    res.json({
      entry,
      prescriptions,
      documents
    });
  } catch (error) {
    console.error('Get entry error:', error);
    res.status(500).json({ error: 'Error fetching entry' });
  }
};

// Create a new entry with optional prescriptions and documents
const createEntry = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      id_cita,
      id_paciente,
      descripcion,
      destacada,
      prescriptions,
      documents
    } = req.body;

    // Create entry
    const entryId = await Entry.create({
      id_cita,
      id_usuario: req.user.id_usuario,
      id_paciente,
      descripcion,
      destacada
    });

    // Add prescriptions if provided
    let createdPrescriptions = [];
    if (prescriptions && prescriptions.length > 0) {
      for (const prescription of prescriptions) {
        // If this is a new prescription for a medication that's already active,
        // deactivate all previous prescriptions for this medication
        if (prescription.deactivatePrevious) {
          await Prescription.deactivateAllForMedication(
            id_paciente,
            prescription.id_medicamento
          );
        }

        const prescriptionId = await Prescription.create({
          id_entry: entryId,
          ...prescription
        });

        const createdPrescription = await Prescription.findById(prescriptionId);
        createdPrescriptions.push(createdPrescription);
      }
    }

    // Add documents if provided
    let createdDocuments = [];
    if (documents && documents.length > 0) {
      for (const document of documents) {
        const documentId = await Document.create({
          id_paciente,
          id_cita,
          ...document
        });

        const createdDocument = await Document.findById(documentId);
        createdDocuments.push(createdDocument);
      }
    }

    const createdEntry = await Entry.findById(entryId);
    res.status(201).json({
      message: 'Entry created successfully',
      entry: createdEntry,
      prescriptions: createdPrescriptions,
      documents: createdDocuments
    });
  } catch (error) {
    console.error('Create entry error:', error);
    res.status(500).json({ error: 'Error creating entry' });
  }
};

// Update an entry
const updateEntry = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const entryId = req.params.id;
    const { descripcion, destacada } = req.body;

    // Check if entry exists
    const existingEntry = await Entry.findById(entryId);
    if (!existingEntry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // Update entry
    const updated = await Entry.update(entryId, {
      descripcion,
      destacada
    });

    if (!updated) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const updatedEntry = await Entry.findById(entryId);
    res.json({
      message: 'Entry updated successfully',
      entry: updatedEntry
    });
  } catch (error) {
    console.error('Update entry error:', error);
    res.status(500).json({ error: 'Error updating entry' });
  }
};

// Delete an entry
const deleteEntry = async (req, res) => {
  try {
    const entryId = req.params.id;
    
    // Check if entry exists
    const entry = await Entry.findById(entryId);
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // Delete entry (this should cascade to related prescriptions due to FK constraints)
    const deleted = await Entry.delete(entryId);
    if (!deleted) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Delete entry error:', error);
    res.status(500).json({ error: 'Error deleting entry' });
  }
};

// Get entries with prescriptions for a patient
const getPatientPrescriptionEntries = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const entries = await Entry.getEntriesWithPrescriptions(patientId);
    
    // Get prescriptions for each entry
    const entriesWithPrescriptions = await Promise.all(
      entries.map(async (entry) => {
        const prescriptions = await Prescription.getByEntry(entry.id_entry);
        return {
          ...entry,
          prescriptions
        };
      })
    );

    res.json({ entries: entriesWithPrescriptions });
  } catch (error) {
    console.error('Get prescription entries error:', error);
    res.status(500).json({ error: 'Error fetching prescription entries' });
  }
};

// Get entries for a specific appointment
const getAppointmentEntries = async (req, res) => {
  try {
    const citaId = req.params.citaId;
    const entries = await Entry.getEntriesByCita(citaId);

    // Get prescriptions and documents for each entry
    const entriesWithDetails = await Promise.all(
      entries.map(async (entry) => {
        const prescriptions = await Prescription.getByEntry(entry.id_entry);
        const documents = await Document.getAppointmentDocuments(citaId);
        return {
          ...entry,
          prescriptions,
          documents
        };
      })
    );

    res.json({ entries: entriesWithDetails });
  } catch (error) {
    console.error('Get appointment entries error:', error);
    res.status(500).json({ error: 'Error fetching appointment entries' });
  }
};

module.exports = {
  getPatientEntries,
  getEntry,
  createEntry,
  updateEntry,
  deleteEntry,
  getPatientPrescriptionEntries,
  getAppointmentEntries
}; 