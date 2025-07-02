const axios = require('axios');
const Patient = require('../models/Patient');
const Entry = require('../models/Entry');
const Document = require('../models/Document');
const Prescription = require('../models/Prescription');

class GeminiService {
  static OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

  /**
   * Construye el prompt base para el chat con el paciente
   */
  static async buildPatientContext(patientId) {
    try {
      // Obtener información básica del paciente
      const patient = await Patient.findById(patientId);
      if (!patient) throw new Error('Paciente no encontrado');

      // Obtener entradas médicas destacadas y recientes
      const entries = await Entry.getPatientEntries(patientId, {
        destacada: true,
        limit: 10,
        orderBy: 'fecha',
        orderDir: 'DESC'
      });

      // Obtener medicamentos activos
      const activePrescriptions = await Prescription.getActivePrescriptions(patientId);

      // Obtener documentos recientes
      const recentDocuments = await Document.getPatientDocuments(patientId, {
        limit: 5,
        orderBy: 'fecha_subida',
        orderDir: 'DESC'
      });

      // Construir el contexto del paciente
      const context = `
[INFORMACIÓN DEL PACIENTE: ${patient.nombre} ${patient.apellido}]

**Datos Demográficos:**
- Nombre: ${patient.nombre} ${patient.apellido}
- Fecha de Nacimiento: ${patient.fecha_nacimiento} (Edad: ${this.calculateAge(patient.fecha_nacimiento)} años)
- Género: ${patient.genero}
- Grupo Sanguíneo: ${patient.grupo_sanguineo || 'No registrado'}
- Estatura: ${patient.estatura_cm || 'No registrada'} cm
- Peso: ${patient.peso_kg || 'No registrado'} kg

**Antecedentes Médicos:**
- Alergias: ${patient.alergias || 'Ninguna conocida'}
- Enfermedades Base: ${patient.enfermedades_base || 'Ninguna registrada'}
- Observaciones Generales: ${patient.observaciones || 'Ninguna'}

**Medicamentos Activos:**
${activePrescriptions.length > 0 ? activePrescriptions.map(p => 
  `- ${p.medicamento_nombre} ${p.dosis}, ${p.frecuencia}, ${p.duracion}
   Recetado: ${p.fecha_receta} por Dr. ${p.doctor_nombre}
   Instrucciones: ${p.instrucciones_adicionales}`
).join('\n') : '- Ningún medicamento activo'}

**Notas Clínicas Destacadas/Recientes:**
${entries.length > 0 ? entries.map(e => 
  `[${e.fecha}] Dr. ${e.doctor_nombre}:
   "${e.descripcion}"
   ${e.destacada ? '[DESTACADA]' : ''}`
).join('\n\n') : '- No hay notas clínicas recientes'}

**Documentos Recientes:**
${recentDocuments.length > 0 ? recentDocuments.map(d => 
  `- ${d.tipo} (${d.fecha_subida}): ${d.nombre_archivo}`
).join('\n') : '- No hay documentos recientes'}
`.trim();

      return context;
    } catch (error) {
      console.error('Error building patient context:', error);
      throw error;
    }
  }

  /**
   * Envía un mensaje al modelo de Gemini
   */
  static async sendMessage(message, context, customRole = null) {
    try {
      const defaultRole = `Eres un médico clínico altamente experimentado y empático. 
Tu objetivo es asistir a otros doctores proporcionando análisis clínicos, 
sugerencias de tratamiento y respondiendo preguntas sobre el historial médico 
de los pacientes. Tu tono debe ser profesional, preciso y de apoyo. 
Siempre prioriza la seguridad y el bienestar del paciente.`;

      const response = await axios.post(
        this.OPENROUTER_API_URL,
        {
          model: 'google/gemini-pro',
          messages: [
            {
              role: 'system',
              content: customRole || defaultRole
            },
            {
              role: 'system',
              content: context
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      throw new Error(`Error comunicándose con la IA: ${error.message}`);
    }
  }

  /**
   * Calcula la edad a partir de una fecha de nacimiento
   */
  static calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Envía un documento a la API de Gemini para análisis
   */
  static async analyzeDocument(documentId) {
    try {
      const document = await Document.findById(documentId);
      if (!document) throw new Error('Documento no encontrado');

      // Si el documento ya tiene un URI de Gemini, usarlo
      if (document.uri_gemini) {
        const response = await axios.post(
          this.OPENROUTER_API_URL,
          {
            model: 'google/gemini-pro-vision',
            messages: [
              {
                role: 'system',
                content: 'Analiza este documento médico y proporciona un resumen de sus hallazgos principales.'
              }
            ],
            file_data: {
              uri: document.uri_gemini
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        return response.data.choices[0].message.content;
      } else {
        throw new Error('Documento no procesado por Gemini');
      }
    } catch (error) {
      console.error('Error analyzing document with Gemini:', error);
      throw new Error(`Error analizando documento: ${error.message}`);
    }
  }
}

module.exports = GeminiService; 