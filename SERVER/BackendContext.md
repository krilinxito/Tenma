# Diseño del Backend (Node.js)

Este documento describe la arquitectura del backend de Node.js, siguiendo el patrón de diseño **Modelo-Vista-Controlador (MVC)**. Se detalla la estructura de directorios, la responsabilidad de cada componente y los flujos de interacción con la base de datos MySQL y las APIs externas (Google Gemini, Google Workspace).

Debe existir un sistema de creacion de cuentas (registro) y login con permiso y autentificacion (con acceso diferenciado entre doctores y usuarios corrientes)
---

## 1. Estructura de Directorios (MVC)

El backend de Node.js (`./backend/` o `./server/`) adoptará la siguiente estructura para organizar el código de manera modular y escalable:

backend/
├── src/
│   ├── config/             # Configuración de la aplicación (DB, APIs, variables de entorno)
│   │   ├── db.js           # Conexión a la base de datos MySQL
│   │   └── index.js        # Carga de variables de entorno, configuración global
│   ├── controllers/        # Lógica de negocio y manejo de solicitudes HTTP
│   │   ├── authController.js
│   │   ├── pacienteController.js
│   │   ├── citaController.js
│   │   ├── iaController.js
│   │   ├── pagoController.js
│   │   ├── entryController.js
│   │   ├── medicamentoController.js
│   │   ├── examenController.js
│   │   └── ... (otros controladores según las tablas/entidades)
│   ├── models/             # Interacción con la base de datos (queries SQL, lógica de datos)
│   │   ├── User.js         # Modelo para la tabla 'usuario'
│   │   ├── Patient.js      # Modelo para la tabla 'paciente'
│   │   ├── Appointment.js  # Modelo para la tabla 'cita'
│   │   ├── IaSession.js    # Modelo para la tabla 'ia_sesion'
│   │   ├── IaChatLog.js    # Modelo para la tabla 'ia_chat_log'
│   │   ├── Payment.js      # Modelo para la tabla 'pago'
│   │   ├── Entry.js        # Modelo para la tabla 'entry'
│   │   ├── Document.js     # Modelo para la tabla 'documento'
│   │   ├── Medication.js   # Modelo para la tabla 'medicamento'
│   │   ├── PrescriptionDetail.js # Modelo para la tabla 'receta_detalle'
│   │   ├── ExamType.js     # Modelo para la tabla 'examen_tipo'
│   │   ├── ExamRequest.js  # Modelo para la tabla 'examen_solicitado'
│   │   ├── ExamResult.js   # Modelo para la tabla 'examen_resultado'
│   │   └── ... (otros modelos)
│   ├── routes/             # Definición de rutas de la API y mapeo a controladores
│   │   ├── authRoutes.js
│   │   ├── pacienteRoutes.js
│   │   ├── citaRoutes.js
│   │   ├── iaRoutes.js
│   │   ├── pagoRoutes.js
│   │   ├── entryRoutes.js
│   │   ├── medicamentoRoutes.js
│   │   ├── examenRoutes.js
│   │   └── index.js        # Agrupa todas las rutas
│   ├── services/           # Lógica de negocio compleja o integración con APIs externas
│   │   ├── googleAuthService.js # Manejo de OAuth para Google APIs
│   │   ├── googleCalendarService.js
│   │   ├── googleMeetService.js
│   │   ├── googleGmailService.js
│   │   ├── googleDriveService.js  # Para subir documentos
│   │   ├── geminiService.js       # Interacción con OpenRouter/Gemini API
│   │   ├── promptBuilder.js       # Construcción del prompt de Gemini
│   │   └── functionCaller.js      # Lógica para manejar Function Calling de Gemini
│   ├── utils/              # Funciones de utilidad (helpers, validadores, formateadores)
│   │   ├── validators.js
│   │   ├── helpers.js
│   │   └── errorHandler.js
│   ├── middlewares/        # Middlewares de Express (autenticación, autorización, logs)
│   │   ├── authMiddleware.js
│   │   └── errorMiddleware.js
│   └── app.js              # Configuración de Express, middlewares globales, carga de rutas
├── .env                    # Variables de entorno (no versionado por Git)
├── package.json
├── package-lock.json
└── server.js               # Punto de entrada principal para iniciar el servidor


---

## 2. Descripción de Componentes Clave

### 2.1. `server.js`

* **Punto de Entrada:** Archivo principal que inicia la aplicación Express.
* **Responsabilidad:** Carga las variables de entorno, importa y configura `app.js`, y comienza a escuchar solicitudes HTTP en un puerto definido.

### 2.2. `app.js`

* **Configuración de Express:** Inicializa la aplicación Express.
* **Middlewares Globales:** Configura middlewares esenciales como `cors` (para permitir solicitudes desde el frontend React Native), `express.json()` (para parsear bodies JSON), y middlewares de logging.
* **Carga de Rutas:** Importa y utiliza todos los archivos de rutas definidos en `src/routes/`.
* **Manejo Centralizado de Errores:** Incluye el middleware de manejo de errores.

### 2.3. `config/`

* **`config/db.js`:**
    * Contiene la lógica para establecer y gestionar la conexión con la base de datos MySQL (utilizando una librería como `mysql2/promise` para conexiones asíncronas).
    * Exporta el objeto de conexión (`pool` o `connection`) para ser utilizado por los modelos.
* **`config/index.js`:**
    * Carga las variables de entorno del archivo `.env` (usando `dotenv`).
    * Centraliza configuraciones globales (puerto del servidor, límites de tokens para IA, etc.).

### 2.4. `models/`

* **Responsabilidad:** Interactuar directamente con la base de datos. Cada archivo de modelo (ej., `Patient.js`, `Appointment.js`) representa una tabla de la base de datos (o una entidad lógica).
* **Funcionalidades:**
    * Contiene métodos para realizar operaciones CRUD (Crear, Leer, Actualizar, Eliminar) en su tabla correspondiente.
    * Puede incluir lógica de validación a nivel de datos (ej., verificar tipos de datos antes de insertar).
    * Realiza las consultas SQL directas o utiliza un ORM/query builder (si se decide implementar).
* **Ejemplo `Patient.js`:**
    * `Patient.getAllPatients()`: Recupera todos los pacientes.
    * `Patient.getPatientById(id)`: Obtiene un paciente por su ID.
    * `Patient.createPatient(data)`: Inserta un nuevo paciente.
    * `Patient.updatePatient(id, data)`: Actualiza datos de un paciente.
    * `Patient.deletePatient(id)`: Elimina un paciente.
    * `Patient.getPatientFullHistory(id_paciente)`: **Consulta compleja para IA.** Este método será crucial para recuperar toda la información necesaria para construir el prompt de Gemini: datos demográficos, alergias, enfermedades base, observaciones, medicamentos activos/recientes (de `receta_detalle`), resultados de exámenes relevantes (de `examen_resultado`), y notas clínicas destacadas/recientes (de `entry`).

### 2.5. `controllers/`

* **Responsabilidad:** Manejar las solicitudes HTTP (Request/Response) de las rutas. Son el "pegamento" entre las rutas y los modelos/servicios.
* **Funcionalidades:**
    * Reciben la solicitud del cliente (parámetros de ruta, query params, body).
    * Validan los datos de entrada (usando funciones de `utils/validators.js`).
    * Llaman a los métodos apropiados de los **modelos** para interactuar con la DB.
    * Llaman a los **servicios** para lógica de negocio compleja o interacción con APIs externas.
    * Formatean la respuesta para el cliente y la envían.
    * Manejan errores específicos de la solicitud y los pasan al middleware de errores.
* **Ejemplo `pacienteController.js`:**
    * `getAllPatients(req, res)`: Llama a `Patient.getAllPatients()`.
    * `getPatientProfile(req, res)`: Llama a `Patient.getPatientFullHistory(req.params.id)`.
    * `createPatient(req, res)`: Llama a `Patient.createPatient(req.body)`.
* **Ejemplo `citaController.js`:**
    * `createAppointment(req, res)`: Recibe la solicitud de la UI para agendar una cita manual. Llama a `Appointment.createAppointment()`, y luego al `googleCalendarService.createEvent()` y `googleMeetService.createMeeting()` si aplica.

### 2.6. `routes/`

* **Responsabilidad:** Definir los puntos finales (endpoints) de la API y mapearlos a funciones de controladores específicos.
* **Funcionalidades:**
    * Usa `express.Router()` para agrupar rutas relacionadas.
    * Aplica **middlewares** de autenticación y autorización (`middlewares/authMiddleware.js`) a las rutas que lo requieran.
* **Ejemplo `pacienteRoutes.js`:**
    ```javascript
    const express = require('express');
    const router = express.Router();
    const pacienteController = require('../controllers/pacienteController');
    const { authenticateToken } = require('../middlewares/authMiddleware'); // Asumiendo JWT

    router.get('/', authenticateToken, pacienteController.getAllPatients);
    router.get('/:id', authenticateToken, pacienteController.getPatientProfile);
    router.post('/', authenticateToken, pacienteController.createPatient);
    // ... otras rutas para pacientes
    module.exports = router;
    ```
* **Ejemplo `iaRoutes.js`:**
    ```javascript
    const express = require('express');
    const router = express.Router();
    const iaController = require('../controllers/iaController');
    const { authenticateToken } = require('../middlewares/authMiddleware');

    router.post('/chat/:patientId', authenticateToken, iaController.handleIaChat);
    module.exports = router;
    ```

### 2.7. `services/`

* **Responsabilidad:** Encapsular la lógica de negocio compleja que no pertenece directamente a un controlador o modelo, y manejar la interacción con **APIs externas**.
* **Funcionalidades:**
    * **`geminiService.js`:**
        * Contiene la lógica para llamar a la API de Gemini (OpenRouter.ai).
        * Maneja la configuración del modelo y la autenticación.
        * Envía prompts y recibe respuestas.
    * **`googleCalendarService.js`:**
        * Maneja la autenticación OAuth 2.0 con Google APIs.
        * Implementa funciones para crear, actualizar, eliminar y obtener eventos de Google Calendar.
    * **`googleMeetService.js`:**
        * Funciones para crear enlaces de Google Meet (generalmente integradas con la creación de eventos de Calendar).
    * **`googleGmailService.js`:**
        * Funciones para enviar correos electrónicos (recordatorios, recibos de pago) utilizando la Gmail API.
    * **`googleDriveService.js`:**
        * Funciones para subir documentos a Google Drive, obtener URLs y gestionar permisos.
    * **`promptBuilder.js`:**
        * Clase o conjunto de funciones dedicadas a construir el prompt de Gemini de manera dinámica, recuperando los datos del paciente usando `Patient.getPatientFullHistory()` y formateándolos según la estructura definida.
    * **`functionCaller.js`:**
        * Módulo que contiene la lógica para mapear las `function_call` recibidas de Gemini a las funciones correspondientes en el backend (ej., llamar a `citaController.createAppointment` o `citaController.reprogramAppointment`).
        * Maneja la ejecución de estas funciones y la preparación del resultado para ser enviado de vuelta a Gemini.

### 2.8. `utils/`

* **Responsabilidad:** Contener funciones de utilidad reutilizables en toda la aplicación.
* **Ejemplos:**
    * `validators.js`: Funciones para validar formatos de email, fechas, etc.
    * `helpers.js`: Funciones auxiliares genéricas.
    * `errorHandler.js`: Middleware para capturar y formatear errores de la aplicación.

### 2.9. `middlewares/`

* **Responsabilidad:** Funciones que se ejecutan entre la solicitud del cliente y el manejador de la ruta.
* **Ejemplos:**
    * `authMiddleware.js`: Verifica tokens JWT para autenticar al usuario.
    * `errorMiddleware.js`: Manejo centralizado de errores para enviar respuestas consistentes.

---

## 3. Flujos de Interacción Detallados (Backend)

### 3.1. Flujo de Chat Consultivo

1.  **Frontend (`/pacientes` -> Chat):** El doctor escribe un mensaje en el chat del paciente.
2.  **Ruta (`iaRoutes.js`):** La solicitud POST (`/api/ia/chat/:patientId`) llega al backend.
3.  **Controlador (`iaController.js`):**
    * Recibe `patientId` y `message` del doctor.
    * Llama a `Patient.getPatientFullHistory(patientId)` para obtener todos los datos relevantes del paciente.
    * Llama a `IaChatLog.getChatHistory(iaSessionId)` para obtener el historial de la conversación actual.
    * Llama a `promptBuilder.buildConsultativePrompt(patientData, chatHistory, doctorMessage, systemInstruction, [documentData])` para construir el prompt completo.
    * Llama a `geminiService.sendConsultativePrompt(builtPrompt)` para enviar la solicitud a Gemini (OpenRouter).
    * Recibe la respuesta textual de Gemini.
    * Llama a `IaChatLog.saveChatEntry(iaSessionId, doctorMessage, geminiResponse)` para guardar la interacción en la DB.
    * Envía la respuesta de Gemini de vuelta al frontend.

### 3.2. Flujo de Agendamiento de Citas (UI o IA)

#### 3.2.1. Agendamiento Manual (desde UI)

1.  **Frontend (`/calendario` -> "Agendar Cita"):** El doctor rellena un formulario en la UI.
2.  **Ruta (`citaRoutes.js`):** La solicitud POST (`/api/citas`) llega al backend con los datos de la cita.
3.  **Controlador (`citaController.js` -> `createAppointment`):**
    * Valida los datos de la cita recibidos.
    * Llama a `Appointment.createAppointment(data)` para guardar la cita en la DB local, obteniendo `id_cita`.
    * Llama a `googleCalendarService.createEvent(citaData)` para crear el evento en Google Calendar. Almacena `id_evento_google_calendar` en la DB.
    * Si `tipo_cita` es 'virtual', llama a `googleMeetService.createMeeting(citaData)` para generar el enlace de Meet y lo almacena (`enlace_meet`) en la DB.
    * Envía una respuesta de éxito al frontend.

#### 3.2.2. Agendamiento por IA (Function Calling)

1.  **Frontend (`/pacientes` -> Chat):** El doctor solicita a la IA que agende una cita.
2.  **Ruta (`iaRoutes.js`):** La solicitud POST (`/api/ia/chat/:patientId`) llega al backend (mismo endpoint que el chat consultivo, pero con `tools` configuradas).
3.  **Controlador (`iaController.js` -> `handleIaChat`):**
    * Prepara el prompt con el contexto del paciente, el historial y el mensaje actual.
    * **Adjunta la definición de `tools`** (funciones disponibles) a la solicitud de Gemini.
    * Llama a `geminiService.sendFunctionCallingPrompt(builtPrompt, tools)`
    * **Recibe la respuesta de Gemini:**
        * **Si es `function_call`:**
            * Extrae el nombre de la función y sus argumentos.
            * Llama a `functionCaller.executeFunction(functionName, args)` que mapea y ejecuta la lógica relevante (ej., `citaController.createAppointment` o una función dedicada en `citaService`).
            * **Importante:** `executeFunction` devolverá el resultado de la operación (éxito/error, IDs generados).
            * Envía este resultado de la función de vuelta a Gemini como un `tool_response`.
            * Espera la respuesta final de Gemini (confirmación o error textual).
        * **Si es respuesta textual (preguntas de clarificación):** Envía la respuesta de Gemini al frontend.
    * Guarda la interacción en `ia_chat_log`.
    * Envía la respuesta final (confirmación/error) al frontend.

### 3.3. Flujo de Recordatorios y Notificaciones

1.  **Cron Job (`src/services/scheduler.js` o similar):**
    * Un script/tarea programada se ejecuta periódicamente (ej., cada 15 minutos).
2.  **Verificación de Citas:**
    * Llama a `Appointment.getUpcomingAppointments(timeframe)` para obtener citas próximas que necesiten recordatorio y que aún no se hayan notificado.
3.  **Envío de Recordatorios:**
    * Para cada cita, llama a `googleGmailService.sendAppointmentReminder(citaData, patientEmail, doctorEmail)`.
    * Actualiza el estado de `recordatorio_enviado` en la tabla `cita`.
4.  **Notificaciones de Pago:**
    * Cuando se registra un pago exitoso (a través de `pagoController.createPayment`):
        * El controlador o un servicio invoca a `googleGmailService.sendPaymentReceipt(paymentData, patientEmail)`.

### 3.4. Flujo de Gestión de Documentos

1.  **Frontend (Modal de Paciente -> Drag & Drop):** El doctor sube un archivo.
2.  **Ruta (`documentoRoutes.js`):** La solicitud POST (`/api/documentos/upload`) con el archivo llega al backend.
3.  **Controlador (`documentoController.js` -> `uploadDocument`):**
    * Recibe el archivo subido.
    * Llama a `googleDriveService.uploadFile(fileData, patientId)` para subir el archivo a Google Drive en la carpeta del paciente. Obtiene la `url_archivo`.
    * Llama a `geminiService.uploadFileToGemini(fileData)` para subir el archivo a la Gemini Files API (si el tipo de documento es relevante para IA). Obtiene `uri_gemini`.
    * Llama a `Document.createDocument(data)` para guardar la metadata del documento (incluyendo `url_archivo` y `uri_gemini`) en la tabla `documento`.
    * Envía una respuesta de éxito con la URL y URI al frontend.

---

## 4. Modelos de Base de Datos (SQL Schema)

Aquí se presenta la estructura de la base de datos, vital para el backend.

```sql
-- Tabla: usuario (Doctores y Empleados)
CREATE TABLE usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    cargo ENUM('doctor', 'empleado') NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Agregado para autenticación
    rol_ia TEXT DEFAULT 'Eres un médico clínico con experiencia general.' -- Rol por defecto para los chats de este usuario
);

-- Tabla: paciente (Información básica del paciente)
CREATE TABLE paciente (
    id_paciente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE, -- Podría ser NULL si no hay email o no es único para todos
    telefono VARCHAR(20) NOT NULL,
    fecha_nacimiento DATE,
    genero ENUM('masculino', 'femenino', 'otro', 'no especificado'), -- Agregado
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
    estado ENUM('programada', 'asistida', 'cancelada', 'reprogramada', 'pendiente_confirmacion') DEFAULT 'programada', -- Agregado 'pendiente_confirmacion'
    tipo_cita ENUM('presencial', 'virtual') NOT NULL, -- Agregado
    motivo TEXT, -- Agregado
    id_evento_google_calendar VARCHAR(255), -- Para almacenar el ID del evento en Google Calendar
    enlace_meet VARCHAR(255), -- Agregado para citas virtuales
    recordatorio_enviado BOOLEAN DEFAULT FALSE, -- Agregado para control de recordatorios
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente)
);

-- Tabla: entry (Entradas médicas o anotaciones clínicas por cita)
-- Una "entry" representa una nota del doctor sobre un paciente en una cita particular.
CREATE TABLE entry (
    id_entry INT AUTO_INCREMENT PRIMARY KEY,
    id_cita INT, -- Puede ser NULL si la entry no está ligada a una cita específica (ej. nota rápida)
    id_usuario INT NOT NULL,  -- Quien escribió la nota (doctor o empleado)
    id_paciente INT NOT NULL, -- Se agrega para vincular directamente a un paciente, incluso sin cita
    descripcion TEXT,         -- Contenido de la nota clínica
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    destacada BOOLEAN DEFAULT FALSE, -- Entrada marcada como importante
    FOREIGN KEY (id_cita) REFERENCES cita(id_cita),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente)
);

-- Tabla: pago (Pagos 1:1 por cita, registrados por cualquier usuario)
CREATE TABLE pago (
    id_pago INT AUTO_INCREMENT PRIMARY KEY,
    id_cita INT UNIQUE NOT NULL, -- Un pago por cita
    id_usuario INT NOT NULL,     -- Quien registró el pago
    monto DECIMAL(10,2) NOT NULL,
    saldo_pendiente DECIMAL(10,2) NOT NULL, -- Agregado para cuotas
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
    fin TIMESTAMP NULL, -- Agregado para marcar el final de la sesión
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente)
);

-- Tabla: ia_chat_log (Logs de conversación IA dentro de una sesión)
CREATE TABLE ia_chat_log (
    id_chat INT AUTO_INCREMENT PRIMARY KEY,
    id_sesion INT NOT NULL,
    rol ENUM('user', 'model', 'function_call', 'tool_response') NOT NULL, -- Rol de la entrada (usuario, IA, llamada de función, respuesta de herramienta)
    contenido TEXT NOT NULL, -- Contenido del mensaje (pregunta, respuesta, JSON de llamada/resultado)
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_sesion) REFERENCES ia_sesion(id_sesion)
);

-- Tabla: documento (Documentos adjuntos a un paciente o a una cita)
CREATE TABLE documento (
    id_documento INT AUTO_INCREMENT PRIMARY KEY,
    id_paciente INT NOT NULL, -- Se asocia a paciente
    id_cita INT, -- Opcional: si el documento es específico de una cita
    url_archivo TEXT NOT NULL,       -- URL para acceder al archivo (ej. de Drive)
    uri_gemini VARCHAR(255),         -- URI de Google Gemini Files API si se subió allí
    tipo ENUM('receta', 'examen', 'imagen', 'informe', 'otros') DEFAULT 'otros', -- Agregado 'informe'
    nombre_archivo VARCHAR(255),     -- Nombre original del archivo para mostrar
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente),
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
    activo BOOLEAN DEFAULT TRUE, -- Agregado para indicar si el medicamento sigue activo para el paciente
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
-- Tabla: user_logs (Registro de actividad de usuarios como logins y logouts)
CREATE TABLE user_logs (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,               -- El ID del usuario que realizó la acción
    tipo_evento ENUM('login', 'logout') NOT NULL, -- Tipo de evento registrado
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Momento en que ocurrió el evento
    ip_address VARCHAR(45),                -- Dirección IP desde donde se realizó la acción
    user_agent TEXT,                       -- Información del navegador/dispositivo del usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);
```

# Flujo de Interacción con IA (Gemini) en el Sistema Médico

Este documento describe la arquitectura y los flujos de interacción con la inteligencia artificial (Gemini), diferenciando entre el chat consultivo sobre el paciente y las acciones transaccionales (como el agendamiento de citas).

---

## 1. Chat Consultivo "Embebido" con el Paciente (Información de Contexto)

Este es el flujo principal para cuando un doctor chatea con la IA para obtener información, análisis o sugerencias sobre un paciente específico, utilizando la información del historial clínico.

### 1.1. Propósito

Asistir al doctor con un "co-piloto" de IA que comprende el historial del paciente y puede ofrecer insights clínicos, diagnósticos diferenciales, sugerencias de tratamiento o responder preguntas específicas sobre el caso.

### 1.2. Construcción del Prompt (Backend Node.js)

Cuando el doctor envía un mensaje en el chat de un paciente, el backend de Node.js construye un prompt detallado para la API de Gemini. Este prompt se compone de las siguientes secciones, combinadas en una única solicitud `contents.parts` (array de objetos `Part`):

1.  **[INSTRUCCIÓN DEL SISTEMA]**
    * **Contenido:** Un rol predefinido para la IA, estableciendo su personalidad y propósito.
    * **Ejemplo Estático:**
        ```markdown
        Eres un médico clínico altamente experimentado y empático. Tu objetivo es asistir a otros doctores proporcionando análisis clínicos, sugerencias de tratamiento y respondiendo preguntas sobre el historial médico de los pacientes. Tu tono debe ser profesional, preciso y de apoyo. Siempre prioriza la seguridad y el bienestar del paciente.
        ```

2.  **[INFORMACIÓN DEL PACIENTE: <Nombre del Paciente>]**
    * **Contenido:** Datos demográficos, antecedentes médicos, medicamentos activos/recientes, resultados de exámenes relevantes y notas clínicas destacadas/recientes. El backend recupera esta información de la base de datos MySQL.
    * **Límites de Recuperación:**
        * **Medicamentos Activos / Recientes:** Se recuperarán todos los medicamentos marcados como "activos" o los recetados en los **últimos 3 meses** (configurable).
        * **Resultados de Exámenes Recientes / Relevantes:** Se recuperarán los resultados de los **últimos 6 meses** (configurable), priorizando aquellos que estén fuera del rango de referencia o marcados como importantes.
        * **Notas Clínicas Destacadas / Recientes:** Se incluirán todas las `entry` marcadas como `destacada` y las **últimas 10 entradas** (configurable) no destacadas, ordenadas cronológicamente.
    * **Formato de Ejemplo:**
        ```markdown
        ---

        [INFORMACIÓN DEL PACIENTE: <Nombre del Paciente>]

        **Datos Demográficos:**
        - Nombre: <Nombre Completo del Paciente>
        - Fecha de Nacimiento: <Fecha de Nacimiento> (Edad: <Edad>)
        - Género: <Género>
        - Grupo Sanguíneo: <Grupo Sanguíneo>
        - Estatura: <Estatura_cm> cm
        - Peso: <Peso_kg> kg

        **Antecedentes Médicos:**
        - Alergias: <Alergias del Paciente, o "Ninguna conocida">
        - Enfermedades Base: <Enfermedades_base, o "Ninguna">
        - Observaciones Generales del Paciente: <Observaciones_generales>

        **Medicamentos Activos / Recientes (Últimos X):**
        <Lista de medicamentos activos o recetados recientemente (ej., últimos 3 meses), con dosis, frecuencia, duración y el doctor/fecha de prescripción. Si no hay, indicar "Ninguno.">
        - Ejemplo 1: Paracetamol 500mg, 1 tableta cada 8 horas, por 5 días (recetado: 2025-06-25 por Dr. Smith).
        - Ejemplo 2: Amoxicilina 250mg/5ml, 10ml cada 12 horas, por 7 días (recetado: 2025-06-20 por Dr. Jones, para infección respiratoria).

        **Resultados de Exámenes Recientes / Relevantes (Últimos Y o Anormales):**
        <Lista de los últimos resultados de exámenes clínicamente significativos o que estén fuera del rango normal (ej., últimos 6 meses).>
        - **Tipo de Examen (Fecha: YYYY-MM-DD):**
            - Parámetro 1: <Valor> <Unidad> (Rango Referencia: <Rango>) - **<Normal/Anormal, si aplica>**
            - Interpretación del Médico: <Interpretación del doctor>
        - Ejemplo: **Hemograma Completo (Fecha: 2025-06-22):**
            - Leucocitos: 11.5 x10^9/L (Rango: 4.0-10.0 x10^9/L) - **ANORMAL (Alto)**
            - Eritrocitos: 4.8 x10^12/L (Rango: 4.5-5.5 x10^12/L) - Normal
            - Interpretación: Leucocitosis leve, sugiere posible proceso infeccioso.

        **Notas Clínicas Destacadas / Recientes (Últimas Z):**
        <Lista de las entradas `entry` marcadas como `destacada` y las últimas `Z` entradas cronológicamente. Limitar a un número manejable (ej., 3-5 destacadas, 5-10 más recientes).>
        - [Fecha: YYYY-MM-DD] [Doctor]: "<Descripción de la entrada>"
        - Ejemplo 1: [2025-06-20] Dr. López: "Paciente refiere malestar general, dolor de cabeza leve. Se solicitan exámenes de rutina."
        - Ejemplo 2: [2025-05-15] Dr. Gutiérrez: "Paciente sufrió reacción adversa (urticaria) a Ibuprofeno. Se descontinúa el medicamento."
        ```

3.  **[DOCUMENTOS ADJUNTOS] (si aplica)**
    * **Contenido:** Si el doctor ha adjuntado documentos relevantes a la cita o sesión (ej., PDF de un informe de laboratorio, imagen de una radiografía), o si el sistema identifica un documento relevante asociado a un examen reciente, se incluirá el `fileData` correspondiente.
    * **Uso:** Estos documentos deben haber sido previamente subidos a la **Gemini Files API** y referenciados por su `uri_gemini`.
    * **Formato:** No se incluye como texto en el prompt, sino como un objeto `Part` de tipo `fileData`.

4.  **[HISTORIAL DE CHAT DE LA SESIÓN ACTUAL]**
    * **Contenido:** Las últimas `N` interacciones (preguntas y respuestas) de la sesión de chat actual (`ia_chat_log`) se incluyen para mantener el contexto conversacional.
    * **Formato de Ejemplo:**
        ```markdown
        ---

        [HISTORIAL DE CHAT DE LA SESIÓN ACTUAL]
        user: <Pregunta anterior del doctor>
        model: <Respuesta de la IA>
        user: <Siguiente pregunta anterior del doctor>
        model: <Siguiente respuesta de la IA>
        ```

5.  **[MENSAJE ACTUAL DEL DOCTOR]**
    * **Contenido:** La pregunta o comentario que el doctor acaba de introducir.
    * **Formato de Ejemplo:**
        ```markdown
        ---

        [MENSAJE ACTUAL DEL DOCTOR]
        <La pregunta o comentario que el doctor acaba de introducir.>
        ```

### 1.3. Respuesta de Gemini

Gemini procesará todo el contexto proporcionado y generará una respuesta textual que el backend enviará de vuelta a la UI para mostrar en el chat. La respuesta de Gemini se guardará en `ia_chat_log`.

---

## 2. Flujo de Agendamiento de Citas (Con Function Calling)

Este flujo se activa cuando el doctor le pide a la IA que realice una acción específica, como agendar una cita. Aquí, la **Function Calling** de Gemini es fundamental para distinguir esta intención de una simple pregunta consultiva.

---

### 2.1. Propósito

Automatizar la creación, reprogramación y cancelación de citas directamente desde el chat de la IA, integrándose con la base de datos del sistema y las APIs de Google Workspace.

### 2.2. Definición de Herramientas (Functions) para Gemini

El backend de Node.js define y expone a Gemini una serie de funciones (tools) que la IA puede "llamar". Estas funciones corresponden a acciones que el sistema puede realizar.

* **Ejemplos de Funciones (Schema para la API de Gemini):**
    ```json
    [
        {
            "name": "agendarCita",
            "description": "Agenda una nueva cita médica para un paciente con un doctor en una fecha y hora específica.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pacienteId": {
                        "type": "string",
                        "description": "El ID único del paciente."
                    },
                    "doctorId": {
                        "type": "string",
                        "description": "El ID único del doctor que atenderá la cita."
                    },
                    "fecha": {
                        "type": "string",
                        "format": "date",
                        "description": "La fecha de la cita en formato YYYY-MM-DD."
                    },
                    "hora": {
                        "type": "string",
                        "format": "time",
                        "description": "La hora de la cita en formato HH:MM (24 horas)."
                    },
                    "tipoCita": {
                        "type": "string",
                        "enum": ["presencial", "virtual"],
                        "description": "El tipo de cita: 'presencial' o 'virtual'."
                    },
                    "motivo": {
                        "type": "string",
                        "description": "Breve descripción del motivo de la cita."
                    }
                },
                "required": ["pacienteId", "doctorId", "fecha", "hora", "tipoCita", "motivo"]
            }
        },
        {
            "name": "obtenerDisponibilidadDoctor",
            "description": "Obtiene los horarios disponibles de un doctor para agendar citas en un rango de fechas.",
            "parameters": {
                "type": "object",
                "properties": {
                    "doctorId": {
                        "type": "string",
                        "description": "El ID único del doctor."
                    },
                    "fechaInicio": {
                        "type": "string",
                        "format": "date",
                        "description": "Fecha de inicio del rango de búsqueda en formato YYYY-MM-DD."
                    },
                    "fechaFin": {
                        "type": "string",
                        "format": "date",
                        "description": "Fecha de fin del rango de búsqueda en formato YYYY-MM-DD."
                    }
                },
                "required": ["doctorId", "fechaInicio", "fechaFin"]
            }
        },
        {
            "name": "reprogramarCita",
            "description": "Reprograma una cita médica existente a una nueva fecha y hora.",
            "parameters": {
                "type": "object",
                "properties": {
                    "citaId": {
                        "type": "string",
                        "description": "El ID único de la cita a reprogramar."
                    },
                    "nuevaFecha": {
                        "type": "string",
                        "format": "date",
                        "description": "La nueva fecha de la cita en formato YYYY-MM-DD."
                    },
                    "nuevaHora": {
                        "type": "string",
                        "format": "time",
                        "description": "La nueva hora de la cita en formato HH:MM (24 horas)."
                    }
                },
                "required": ["citaId", "nuevaFecha", "nuevaHora"]
            }
        },
        {
            "name": "cancelarCita",
            "description": "Cancela una cita médica existente.",
            "parameters": {
                "type": "object",
                "properties": {
                    "citaId": {
                        "type": "string",
                        "description": "El ID único de la cita a cancelar."
                    },
                    "motivo": {
                        "type": "string",
                        "description": "El motivo de la cancelación."
                    }
                },
                "required": ["citaId", "motivo"]
            }
        }
    ]
    ```

### 2.3. Proceso de Agendamiento por IA

1.  **Doctor Inicia Solicitud de Acción (Chat):**
    * El doctor, en el chat del paciente, solicita una acción que implica el agendamiento: "Agenda una cita para Juan Pérez el martes 2 de julio de 2025 a las 10 AM, que sea virtual, para un control."

2.  **Backend Envía Mensaje a Gemini (con `tools`):**
    * El backend de Node.js envía el mensaje del doctor a la API de Gemini.
    * La solicitud incluye el prompt de contexto del paciente (como en el flujo consultivo), el historial de chat, el mensaje actual del doctor, **y la definición de las herramientas/funciones disponibles** (`tools`).
    * **Modelo Requerido:** Se utiliza un modelo de Gemini que soporte Function Calling (ej., Gemini 1.5 Flash o Gemini 1.5 Pro).

3.  **Gemini Identifica la Intención y Genera `function_call`:**
    * Gemini analiza el mensaje del doctor y, basándose en las `tools` proporcionadas, reconoce que la intención es "agendar una cita".
    * Extrae los parámetros necesarios del lenguaje natural (ej., `pacienteId` para Juan Pérez, `fecha: '2025-07-02'`, `hora: '10:00'`, `tipoCita: 'virtual'`, `motivo: 'control'`).
    * **Si faltan parámetros:** Gemini responderá con una pregunta aclaratoria al doctor (ej., "¿Qué día de la próxima semana?", "¿Es presencial o virtual?"). El backend reenvía esta pregunta al doctor, y cuando el doctor responde, el ciclo se repite hasta que todos los parámetros estén completos.
    * **Resultado de Gemini:** Cuando todos los parámetros están listos, Gemini devuelve una **`function_call`** especificando la función (`agendarCita`) y los argumentos extraídos.

4.  **Backend Ejecuta la Función Localmente y Sincroniza:**
    * El backend de Node.js recibe la respuesta de Gemini con la `function_call`.
    * **Validación:** El backend realiza validaciones adicionales (ej., verifica que el paciente y el doctor existan en la DB, que el horario esté realmente disponible según la lógica del negocio).
    * **Acción en DB:**
        * Inserta la nueva cita en la tabla `cita` de MySQL.
        * Registra el `id_usuario` (doctor), `id_paciente`, `fecha`, `hora`, `estado='programada'`, `tipo_cita` (virtual/presencial), y `motivo`.
    * **Sincronización con Google Calendar:**
        * Usa la **Google Calendar API** (via `google-api-nodejs-client`) para crear un evento en el calendario del doctor.
        * Detalles del Evento: Título ("Cita con <Nombre Paciente>"), fecha, hora, descripción.
        * El `id_evento_google_calendar` retornado por Google se almacena en la tabla `cita`.
    * **Creación de Google Meet (Si es virtual):**
        * Si `tipo_cita` es 'virtual', la **Google Meet API** (integrada con Calendar API) se usa para generar automáticamente un enlace de Google Meet para el evento.
        * El `enlace_meet` se guarda en la tabla `cita`.

5.  **Backend Reporta el Resultado a Gemini (Continuación de Conversación):**
    * Una vez que la acción `agendarCita` se ejecuta (éxito o falla), el backend envía el **resultado de la ejecución de la función** de vuelta a Gemini.
    * **Propósito:** Esto permite que Gemini "sepa" el resultado de la acción que solicitó y genere una respuesta de confirmación o error adecuada al doctor.
    * **Ejemplo de Reporte:** `"Cita agendada exitosamente con ID [cita_id_db], Evento Google Calendar ID [google_event_id], Enlace Meet: [meet_link]"` o `"Error: Horario no disponible."`

6.  **Gemini Genera Confirmación/Mensaje de Error:**
    * Basado en el resultado reportado por el backend, Gemini genera una respuesta textual que se envía al doctor: "¡Cita agendada para Juan Pérez el 2 de julio a las 10 AM! Se ha creado un evento en tu Google Calendar y el enlace de Meet es: <enlace>." o "Lo siento, no pude agendar la cita. El horario no está disponible."

---

### 2.4. Flujo de Recordatorios y Notificaciones (Gmail y Futuro WhatsApp)

Este es un flujo independiente, principalmente manejado por el backend con tareas programadas.

1.  **Cron Job Programado (Backend Node.js):**
    * Se configura un proceso `cron job` que se ejecuta periódicamente (ej. cada 30 minutos, o a horas específicas del día).

2.  **Verificación de Citas Próximas:**
    * El cron job consulta la tabla `cita` en MySQL para identificar citas que cumplan con criterios de recordatorio (ej., programadas para ocurrir en 24 horas o 1 hora, y que aún no tengan el recordatorio enviado).

3.  **Envío de Recordatorios (Gmail API):**
    * Para cada cita identificada:
        * El backend usa la **Gmail API** (vía `google-api-nodejs-client`) para construir y enviar un correo electrónico de recordatorio.
        * **Destinatarios:** Paciente (si su email está disponible) y/o el doctor.
        * **Contenido:** Asunto claro ("Recordatorio de Cita Médica"), detalles de la cita (fecha, hora, doctor, enlace Meet si aplica).
        * **Registro:** El campo `recordatorio_enviado BOOLEAN` en la tabla `cita` se actualiza a `TRUE` para evitar duplicados.

4.  **Notificaciones de Pago (Gmail API):**
    * Cuando un `pago` se registra exitosamente en la base de datos (`pago`), el backend activa una función para usar la **Gmail API** y enviar un recibo de pago por correo electrónico al paciente.

