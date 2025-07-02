const { pool } = require('../../config/db');

class Exam {
  /**
   * Crea un nuevo tipo de examen
   */
  static async createType({ nombre, descripcion }) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO examen_tipo (nombre, descripcion) VALUES (?, ?)',
        [nombre, descripcion]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating exam type: ${error.message}`);
    }
  }

  /**
   * Encuentra un tipo de examen por ID
   */
  static async findTypeById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM examen_tipo WHERE id_examen_tipo = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error finding exam type: ${error.message}`);
    }
  }

  /**
   * Lista todos los tipos de exámenes
   */
  static async findAllTypes() {
    try {
      const [rows] = await pool.execute('SELECT * FROM examen_tipo ORDER BY nombre');
      return rows;
    } catch (error) {
      throw new Error(`Error listing exam types: ${error.message}`);
    }
  }

  /**
   * Solicita un nuevo examen
   */
  static async requestExam({ id_entry, id_examen_tipo, observaciones }) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO examen_solicitado (id_entry, id_examen_tipo, observaciones) VALUES (?, ?, ?)',
        [id_entry, id_examen_tipo, observaciones]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error requesting exam: ${error.message}`);
    }
  }

  /**
   * Registra el resultado de un examen
   */
  static async registerResult({
    id_examen_solicitado,
    valor_resultado,
    unidad,
    rango_referencia,
    interpretacion,
    id_documento_asociado,
    fecha_resultado
  }) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO examen_resultado 
         (id_examen_solicitado, valor_resultado, unidad, rango_referencia, 
          interpretacion, id_documento_asociado, fecha_resultado)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id_examen_solicitado, valor_resultado, unidad, rango_referencia,
         interpretacion, id_documento_asociado, fecha_resultado]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error registering exam result: ${error.message}`);
    }
  }

  /**
   * Obtiene un examen solicitado por ID
   */
  static async findRequestById(id) {
    try {
      const [rows] = await pool.execute(
        `SELECT es.*, et.nombre as tipo_examen, et.descripcion as descripcion_examen,
                e.fecha as fecha_solicitud, u.nombre as doctor_nombre
         FROM examen_solicitado es
         INNER JOIN examen_tipo et ON es.id_examen_tipo = et.id_examen_tipo
         INNER JOIN entry e ON es.id_entry = e.id_entry
         INNER JOIN usuario u ON e.id_usuario = u.id_usuario
         WHERE es.id_examen_solicitado = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error finding exam request: ${error.message}`);
    }
  }

  /**
   * Obtiene el resultado de un examen por ID
   */
  static async findResultById(id) {
    try {
      const [rows] = await pool.execute(
        `SELECT er.*, et.nombre as tipo_examen,
                d.url_archivo, d.nombre_archivo
         FROM examen_resultado er
         INNER JOIN examen_solicitado es ON er.id_examen_solicitado = es.id_examen_solicitado
         INNER JOIN examen_tipo et ON es.id_examen_tipo = et.id_examen_tipo
         LEFT JOIN documento d ON er.id_documento_asociado = d.id_documento
         WHERE er.id_examen_resultado = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error finding exam result: ${error.message}`);
    }
  }

  /**
   * Obtiene todos los exámenes solicitados para un paciente
   */
  static async getPatientExams(patientId) {
    try {
      const [rows] = await pool.execute(
        `SELECT es.*, et.nombre as tipo_examen,
                e.fecha as fecha_solicitud,
                u.nombre as doctor_nombre,
                er.valor_resultado, er.unidad, er.rango_referencia,
                er.interpretacion, er.fecha_resultado,
                d.url_archivo, d.nombre_archivo
         FROM examen_solicitado es
         INNER JOIN examen_tipo et ON es.id_examen_tipo = et.id_examen_tipo
         INNER JOIN entry e ON es.id_entry = e.id_entry
         INNER JOIN cita c ON e.id_cita = c.id_cita
         INNER JOIN usuario u ON e.id_usuario = u.id_usuario
         LEFT JOIN examen_resultado er ON es.id_examen_solicitado = er.id_examen_solicitado
         LEFT JOIN documento d ON er.id_documento_asociado = d.id_documento
         WHERE c.id_paciente = ?
         ORDER BY e.fecha DESC`,
        [patientId]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error getting patient exams: ${error.message}`);
    }
  }

  /**
   * Obtiene exámenes pendientes de resultado
   */
  static async getPendingExams() {
    try {
      const [rows] = await pool.execute(
        `SELECT es.*, et.nombre as tipo_examen,
                e.fecha as fecha_solicitud,
                u.nombre as doctor_nombre,
                p.nombre as paciente_nombre,
                p.apellido as paciente_apellido
         FROM examen_solicitado es
         INNER JOIN examen_tipo et ON es.id_examen_tipo = et.id_examen_tipo
         INNER JOIN entry e ON es.id_entry = e.id_entry
         INNER JOIN cita c ON e.id_cita = c.id_cita
         INNER JOIN usuario u ON e.id_usuario = u.id_usuario
         INNER JOIN paciente p ON c.id_paciente = p.id_paciente
         LEFT JOIN examen_resultado er ON es.id_examen_solicitado = er.id_examen_solicitado
         WHERE er.id_examen_resultado IS NULL
         ORDER BY e.fecha ASC`
      );
      return rows;
    } catch (error) {
      throw new Error(`Error getting pending exams: ${error.message}`);
    }
  }

  /**
   * Actualiza el resultado de un examen
   */
  static async updateResult(id, {
    valor_resultado,
    unidad,
    rango_referencia,
    interpretacion,
    id_documento_asociado,
    fecha_resultado
  }) {
    try {
      const [result] = await pool.execute(
        `UPDATE examen_resultado 
         SET valor_resultado = ?, unidad = ?, rango_referencia = ?,
             interpretacion = ?, id_documento_asociado = ?, fecha_resultado = ?
         WHERE id_examen_resultado = ?`,
        [valor_resultado, unidad, rango_referencia,
         interpretacion, id_documento_asociado, fecha_resultado, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating exam result: ${error.message}`);
    }
  }
}

module.exports = Exam; 