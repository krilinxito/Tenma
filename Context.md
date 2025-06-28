# Sistema de ayuda Medica
Nombre: Tenma
## Proposito
Tenma es un asistente web que permite a doctores facilitar la atencion a pacientes
y organizar las actividades del consultorio en general

Tenma provee a cada doctor un usuario que se relaciona con una lista de pacientes (de los cuales se guarda informacion util como ficha medica, enfermedades de base, entrys, examenes y asi) el doctor puede ingresar a la info de cada paciente y usar un chat con IA embebido para chatear con un modelo de IA acerca del paciente (la IA recibe todos los datos del paciente mas cierta informacion por prompt) y ayuda al doctor a dar una atencion mas personalizada, ademas la IA seria capaz de agendar citas con el pacientes y aniadrilas automaticamente a Google Calendar (la cuenta que el doctor necesite) y mandar recordatorios por correo a los pacientes (luego de que obtenga acceso a la API Cloud de Whatsapp por ahi vamos a enviar los recordatorios, pero mientras tanto solo por correo es suficiente) y un apartado para citas en meet usando la API de Calendar junto con la de Google Meet.

Ademas Tenma organiza los pagos por que ocurren por cita y facilita la cobranza (con cosas como opciones para aniadir pagos por cuota y asi)

Se requiere de un Backend solido y escalable junto con un frontend visualmente atractivo 

## Teconologias
- BD: MySQL con Host en Railway (pero para testing se usara en local con phpMyAdmin y XAMPP)
- Backend: Node.js con JS (uso de paquetes como mysql2, cors, express, nodemon, etc...)
- Frontend: Uso de React (con Material UI y axios para las API's)
- APIS: Para la IA se usara Gemini 2.5 Flash con la key y API de Open Router, Google Calendar API, Google Meet  API, gmail API (todo del google Workspace)

para el manejo de API's usa nombres de KEYS genericas GEMINI.KEY (que luego seran aniadidas manualmente en el .env)
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


## Conclusion
Estas son las instrucciones claves para el disenio del sistema, si puedes empezar a crear usando el modelo MVC
