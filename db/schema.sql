-- Tabla: usuario (Doctores y Empleados)
CREATE TABLE usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    cargo ENUM('doctor', 'empleado') NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    rol_ia TEXT DEFAULT 'Eres un médico clínico con experiencia general.' -- Rol por defecto para los chats de este usuario
);

-- Tabla: paciente (Información básica del paciente)
CREATE TABLE paciente (
    id_paciente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    fecha_nacimiento DATE,
    grupo_sanguineo ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    estatura_cm SMALLINT,
    peso_kg DECIMAL(5,2),
    alergias TEXT,
    enfermedades_base TEXT,
    observaciones TEXT
);

-- Tabla: atiende (Relación N:M entre usuarios y pacientes, qué doctor atiende a qué paciente)
CREATE TABLE atiende (
    id_usuario INT,
    id_paciente INT,
    PRIMARY KEY (id_usuario, id_paciente),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente)
);

-- Tabla: cita (Citas médicas)
CREATE TABLE cita (
    id_cita INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,  -- Doctor que atiende
    id_paciente INT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    estado ENUM('programada', 'asistida', 'cancelada', 'reprogramada') DEFAULT 'programada',
    id_evento_google_calendar VARCHAR(255), -- Para almacenar el ID del evento en Google Calendar
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente)
);

-- Tabla: entry (Entradas médicas o anotaciones clínicas por cita)
-- Una "entry" representa una nota del doctor sobre un paciente en una cita particular.
CREATE TABLE entry (
    id_entry INT AUTO_INCREMENT PRIMARY KEY,
    id_cita INT NOT NULL,
    id_usuario INT NOT NULL,  -- Quien escribió la nota (doctor o empleado)
    descripcion TEXT,         -- Contenido de la nota clínica
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    destacada BOOLEAN DEFAULT FALSE, -- Entrada marcada como importante
    FOREIGN KEY (id_cita) REFERENCES cita(id_cita),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- Tabla: pago (Pagos 1:1 por cita, registrados por cualquier usuario)
CREATE TABLE pago (
    id_pago INT AUTO_INCREMENT PRIMARY KEY,
    id_cita INT UNIQUE NOT NULL, -- Un pago por cita
    id_usuario INT NOT NULL,     -- Quien registró el pago
    monto DECIMAL(10,2) NOT NULL,
    metodo VARCHAR(50),          -- Ej: 'Efectivo', 'Tarjeta', 'Transferencia'
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cita) REFERENCES cita(id_cita),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- Tabla: ia_sesion (Sesiones de conversación con IA por paciente)
CREATE TABLE ia_sesion (
    id_sesion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,      -- Doctor que inicia la sesión con la IA
    id_paciente INT NOT NULL,
    rol_ia_custom TEXT DEFAULT NULL, -- Rol personalizado para esta sesión de chat
    inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente)
);

-- Tabla: ia_chat_log (Logs de conversación IA dentro de una sesión)
CREATE TABLE ia_chat_log (
    id_chat INT AUTO_INCREMENT PRIMARY KEY,
    id_sesion INT NOT NULL,
    pregunta TEXT NOT NULL,
    respuesta TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_sesion) REFERENCES ia_sesion(id_sesion)
);

-- Tabla: documento (Documentos adjuntos a una cita - PDFs, imágenes, recetas escaneadas, etc.)
CREATE TABLE documento (
    id_documento INT AUTO_INCREMENT PRIMARY KEY,
    id_cita INT NOT NULL,
    url_archivo TEXT NOT NULL,       -- URL para acceder al archivo (ej. de Drive)
    uri_gemini VARCHAR(255),         -- URI de Google Gemini Files API si se subió allí
    tipo ENUM('receta', 'examen', 'imagen', 'otros') DEFAULT 'otros',
    nombre_archivo VARCHAR(255),     -- Nombre original del archivo para mostrar
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cita) REFERENCES cita(id_cita)
);

-- --- NUEVAS TABLAS PARA MEDICAMENTOS, TRATAMIENTOS Y EXÁMENES ---

-- Tabla: medicamento (Catálogo de medicamentos)
CREATE TABLE medicamento (
    id_medicamento INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE, -- Nombre del medicamento (ej. 'Paracetamol', 'Amoxicilina')
    descripcion TEXT,                    -- Información adicional sobre el medicamento
    principio_activo VARCHAR(255),       -- Ej. 'Acetaminofén'
    presentacion VARCHAR(100)            -- Ej. 'Tableta 500mg', 'Suspensión 250mg/5ml'
);

-- Tabla: receta_detalle (Detalle de una receta asociada a una entrada médica 'entry')
-- Esto permite que una 'entry' (una nota del doctor) contenga múltiples medicamentos recetados.
CREATE TABLE receta_detalle (
    id_receta_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_entry INT NOT NULL,              -- Asociado a una entrada médica específica
    id_medicamento INT NOT NULL,        -- Referencia al medicamento del catálogo
    dosis VARCHAR(100) NOT NULL,        -- Ej. '500 mg', '10 ml'
    frecuencia VARCHAR(100) NOT NULL,   -- Ej. 'Cada 8 horas', 'Una vez al día'
    duracion VARCHAR(100),              -- Ej. 'Por 7 días', 'Hasta terminar'
    instrucciones_adicionales TEXT,
    FOREIGN KEY (id_entry) REFERENCES entry(id_entry),
    FOREIGN KEY (id_medicamento) REFERENCES medicamento(id_medicamento)
);

-- Tabla: examen_tipo (Catálogo de tipos de exámenes)
CREATE TABLE examen_tipo (
    id_examen_tipo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE, -- Nombre del tipo de examen (ej. 'Hemograma Completo', 'Glucemia en ayunas')
    descripcion TEXT                     -- Descripción del examen
);

-- Tabla: examen_solicitado (Exámenes solicitados a un paciente en una 'entry' específica)
-- Esto representa que el doctor pidió un examen.
CREATE TABLE examen_solicitado (
    id_examen_solicitado INT AUTO_INCREMENT PRIMARY KEY,
    id_entry INT NOT NULL,              -- Asociado a una entrada médica donde se solicitó el examen
    id_examen_tipo INT NOT NULL,        -- Referencia al tipo de examen solicitado
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT,
    FOREIGN KEY (id_entry) REFERENCES entry(id_entry),
    FOREIGN KEY (id_examen_tipo) REFERENCES examen_tipo(id_examen_tipo)
);

-- Tabla: examen_resultado (Resultados de los exámenes solicitados)
-- Los resultados pueden ser texto, valores numéricos, o asociarse a un documento escaneado.
CREATE TABLE examen_resultado (
    id_examen_resultado INT AUTO_INCREMENT PRIMARY KEY,
    id_examen_solicitado INT UNIQUE NOT NULL, -- Referencia al examen que fue solicitado
    valor_resultado VARCHAR(255),             -- Si es un valor simple (ej. '120 mg/dL')
    unidad VARCHAR(50),                       -- Ej. 'mg/dL', '%'
    rango_referencia VARCHAR(255),            -- Rango normal (ej. '70-100 mg/dL')
    interpretacion TEXT,                      -- Interpretación del resultado por el doctor
    id_documento_asociado INT,                -- Opcional: Referencia a un PDF/imagen del resultado
    fecha_resultado DATE,                     -- Fecha en que se obtuvo el resultado
    FOREIGN KEY (id_examen_solicitado) REFERENCES examen_solicitado(id_examen_solicitado),
    FOREIGN KEY (id_documento_asociado) REFERENCES documento(id_documento)
);