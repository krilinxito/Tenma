const { pool } = require('../../config/db');

class Patient {
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM paciente WHERE id_paciente = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error finding patient by ID: ${error.message}`);
    }
  }

  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM paciente WHERE email = ?',
        [email]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error finding patient by email: ${error.message}`);
    }
  }

  static async create({
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
  }) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO paciente (
          nombre, apellido, email, telefono, fecha_nacimiento,
          genero, grupo_sanguineo, estatura_cm, peso_kg,
          alergias, enfermedades_base, observaciones
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
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
        ]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating patient: ${error.message}`);
    }
  }

  static async update(id, {
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
  }) {
    try {
      const [result] = await pool.execute(
        `UPDATE paciente SET
          nombre = ?, apellido = ?, email = ?, telefono = ?,
          fecha_nacimiento = ?, genero = ?, grupo_sanguineo = ?,
          estatura_cm = ?, peso_kg = ?, alergias = ?,
          enfermedades_base = ?, observaciones = ?
        WHERE id_paciente = ?`,
        [
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
          id
        ]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating patient: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM paciente WHERE id_paciente = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting patient: ${error.message}`);
    }
  }

  static async getAllPatients() {
    try {
      const [rows] = await pool.execute('SELECT * FROM paciente ORDER BY apellido, nombre');
      return rows;
    } catch (error) {
      throw new Error(`Error getting all patients: ${error.message}`);
    }
  }

  static async getPatientsByDoctor(doctorId) {
    try {
      const [rows] = await pool.execute(
        `SELECT p.* FROM paciente p
         INNER JOIN atiende a ON p.id_paciente = a.id_paciente
         WHERE a.id_usuario = ?
         ORDER BY p.apellido, p.nombre`,
        [doctorId]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error getting patients by doctor: ${error.message}`);
    }
  }

  static async assignDoctor(patientId, doctorId) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO atiende (id_usuario, id_paciente) VALUES (?, ?)',
        [doctorId, patientId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error assigning doctor to patient: ${error.message}`);
    }
  }

  static async removeDoctor(patientId, doctorId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM atiende WHERE id_usuario = ? AND id_paciente = ?',
        [doctorId, patientId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error removing doctor from patient: ${error.message}`);
    }
  }

  static async getPatientFullHistory(patientId) {
    try {
      // Get basic patient information
      const [patientInfo] = await pool.execute(
        'SELECT * FROM paciente WHERE id_paciente = ?',
        [patientId]
      );

      // Get active medications (last 3 months)
      const [activeMeds] = await pool.execute(
        `SELECT m.nombre, m.descripcion, m.principio_activo, m.presentacion,
                rd.dosis, rd.frecuencia, rd.duracion, rd.instrucciones_adicionales,
                e.fecha as fecha_receta, u.nombre as doctor_nombre
         FROM receta_detalle rd
         INNER JOIN entry e ON rd.id_entry = e.id_entry
         INNER JOIN medicamento m ON rd.id_medicamento = m.id_medicamento
         INNER JOIN usuario u ON e.id_usuario = u.id_usuario
         WHERE e.id_paciente = ? 
         AND rd.activo = true
         AND e.fecha >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
         ORDER BY e.fecha DESC`,
        [patientId]
      );

      // Get recent exam results (last 6 months)
      const [recentExams] = await pool.execute(
        `SELECT et.nombre as tipo_examen, er.valor_resultado, er.unidad,
                er.rango_referencia, er.interpretacion, er.fecha_resultado,
                es.fecha_solicitud, u.nombre as doctor_nombre
         FROM examen_resultado er
         INNER JOIN examen_solicitado es ON er.id_examen_solicitado = es.id_examen_solicitado
         INNER JOIN examen_tipo et ON es.id_examen_tipo = et.id_examen_tipo
         INNER JOIN entry e ON es.id_entry = e.id_entry
         INNER JOIN usuario u ON e.id_usuario = u.id_usuario
         WHERE e.id_paciente = ?
         AND er.fecha_resultado >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
         ORDER BY er.fecha_resultado DESC`,
        [patientId]
      );

      // Get recent and highlighted clinical notes
      const [clinicalNotes] = await pool.execute(
        `SELECT e.*, u.nombre as doctor_nombre
         FROM entry e
         INNER JOIN usuario u ON e.id_usuario = u.id_usuario
         WHERE e.id_paciente = ?
         AND (e.destacada = true OR e.fecha >= DATE_SUB(NOW(), INTERVAL 6 MONTH))
         ORDER BY e.fecha DESC
         LIMIT 10`,
        [patientId]
      );

      return {
        patientInfo: patientInfo[0],
        activeMedications: activeMeds,
        recentExams,
        clinicalNotes
      };
    } catch (error) {
      throw new Error(`Error getting patient full history: ${error.message}`);
    }
  }
}

module.exports = Patient; 