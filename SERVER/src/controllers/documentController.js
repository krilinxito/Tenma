const { validationResult } = require('express-validator');
const Document = require('../models/Document');

// Get all documents for a patient
const getPatientDocuments = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const { tipo, fromDate, toDate, citaId, limit } = req.query;

    const documents = await Document.getPatientDocuments(patientId, {
      tipo,
      fromDate,
      toDate,
      citaId,
      limit: parseInt(limit) || undefined
    });

    res.json({ documents });
  } catch (error) {
    console.error('Get patient documents error:', error);
    res.status(500).json({ error: 'Error fetching patient documents' });
  }
};

// Get a single document
const getDocument = async (req, res) => {
  try {
    const documentId = req.params.id;
    const document = await Document.findById(documentId);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ document });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Error fetching document' });
  }
};

// Create a new document
const createDocument = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      id_paciente,
      id_cita,
      url_archivo,
      uri_gemini,
      tipo,
      nombre_archivo
    } = req.body;

    const documentId = await Document.create({
      id_paciente,
      id_cita,
      url_archivo,
      uri_gemini,
      tipo,
      nombre_archivo
    });

    const createdDocument = await Document.findById(documentId);
    res.status(201).json({
      message: 'Document created successfully',
      document: createdDocument
    });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ error: 'Error creating document' });
  }
};

// Update a document
const updateDocument = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const documentId = req.params.id;
    const {
      url_archivo,
      uri_gemini,
      tipo,
      nombre_archivo
    } = req.body;

    // Check if document exists
    const existingDocument = await Document.findById(documentId);
    if (!existingDocument) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Update document
    const updated = await Document.update(documentId, {
      url_archivo,
      uri_gemini,
      tipo,
      nombre_archivo
    });

    if (!updated) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const updatedDocument = await Document.findById(documentId);
    res.json({
      message: 'Document updated successfully',
      document: updatedDocument
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ error: 'Error updating document' });
  }
};

// Delete a document
const deleteDocument = async (req, res) => {
  try {
    const documentId = req.params.id;
    
    // Check if document exists
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete document
    const deleted = await Document.delete(documentId);
    if (!deleted) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Error deleting document' });
  }
};

// Get documents for a specific appointment
const getAppointmentDocuments = async (req, res) => {
  try {
    const citaId = req.params.citaId;
    const documents = await Document.getAppointmentDocuments(citaId);
    res.json({ documents });
  } catch (error) {
    console.error('Get appointment documents error:', error);
    res.status(500).json({ error: 'Error fetching appointment documents' });
  }
};

// Get documents by type for a patient
const getDocumentsByType = async (req, res) => {
  try {
    const { patientId, tipo } = req.params;
    const documents = await Document.getDocumentsByType(patientId, tipo);
    res.json({ documents });
  } catch (error) {
    console.error('Get documents by type error:', error);
    res.status(500).json({ error: 'Error fetching documents by type' });
  }
};

// Get documents associated with an exam result
const getExamDocuments = async (req, res) => {
  try {
    const examenResultadoId = req.params.examenResultadoId;
    const documents = await Document.getExamDocuments(examenResultadoId);
    res.json({ documents });
  } catch (error) {
    console.error('Get exam documents error:', error);
    res.status(500).json({ error: 'Error fetching exam documents' });
  }
};

module.exports = {
  getPatientDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  getAppointmentDocuments,
  getDocumentsByType,
  getExamDocuments
}; 