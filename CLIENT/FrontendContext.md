# Contexto del Frontend (UI/UX)


Este documento describe la estructura y funcionalidades de la interfaz de usuario (UI) del sistema, desarrollado con **React Native**. Se enfoca en la experiencia del doctor, proporcionando un acceso intuitivo a la información y herramientas clave.

## Tecnologias
React, React Router, Material UI


Antes de la creacion de la UI debe existir el apartado de login y register con acceso diferenciado (con un contexto de autentificacion) entre doctores y usuarios normales.

## Estructura General de la UI

La aplicación se compone de los siguientes elementos principales:

* **Header:** Barra superior fija.
* **Nav Lateral:** Menú de navegación desplegable.
* **Footer:** Pie de página (su uso podría evolucionar).

---

## 1. Header

La barra superior es un elemento constante que proporciona navegación y acceso rápido a funcionalidades clave.

* **Logo/Título:** Texto "Tenma" ubicado a la izquierda, que funciona como logo y como botón para regresar a la ruta `/home` (Dashboard principal del doctor).
* **Botón Hamburguesa (Menú Desplegable):** Ubicado a la derecha, al hacer clic, despliega el `Nav Lateral` para acceder a las principales secciones de la aplicación.
* **Iconos de Notificaciones/Alertas:** Icono de campana que, al hacer clic, muestra un pop-up o un panel lateral con notificaciones importantes (ej., citas próximas, pagos pendientes, alertas de la IA, mensajes).
* **Icono de Perfil de Usuario/Ajustes Rápidos:** Icono a la derecha que, al tocar, abre un pequeño menú contextual con opciones rápidas como "Cerrar Sesión", "Mi Perfil" o "Cambiar Rol de IA" (si aplica).

---

## 2. Nav Lateral

Este menú de navegación se despliega desde el botón hamburguesa del `Header` y contiene las redirecciones a las principales secciones de la aplicación.

* **Página de Pacientes (`/pacientes`):** Acceso a la gestión completa de la ficha clínica y el historial de los pacientes.
* **Página de Calendario (`/calendario`):** Visualización y gestión de citas del día, semana o mes, incluyendo su estado.
* **Página de Pagos (`/pagos`):** Gestión de pagos pendientes asociados a citas y control de pagos por cuotas.
* **Página de Configuracion (`/config`):** Ajustes de la aplicación y preferencias de usuario.
* **Opción de "Ayuda" o "Soporte":** Enlace a documentación, FAQs o contacto con soporte.

---

## 3. Páginas Principales

### 3.1. Página de Pacientes (`/pacientes`)

Esta página es el centro de gestión para la información de los pacientes.

* **Display de Pacientes (Cards):**
    * Cada paciente se representa con una "card" visualmente atractiva.
    * **Información Visible en Card:** Nombre completo del paciente, edad y un dato básico relevante (ej., última cita, enfermedad base).
    * **Avatar:** Un círculo con un color variable asignado al paciente y la inicial de su nombre, para una identificación visual rápida.
    * **Botón "Ver Más" (Modal):** Al hacer clic, despliega un modal detallado con toda la información del paciente.
    * **Botón "Añadir Entrada Rápida" (Icono +):** Permite añadir una nueva `entry` (nota clínica) al historial del paciente de forma rápida, sin necesidad de abrir el modal completo.

* **Herramientas de Búsqueda y Filtrado:**
    * **Barra de Búsqueda:** Permite buscar pacientes por nombre.
    * **Filtros:** Opciones para filtrar la lista de pacientes por características específicas (ej., por doctor asignado, por enfermedad base, pacientes con citas pendientes, por tipo de seguro).

#### 3.1.1. Modal de Pacientes (Detalle)

Este modal se superpone a la `Página de Pacientes` y ofrece una vista completa y editable del historial clínico del paciente.

* **Sección de Datos del Paciente:**
    * Muestra todos los **datos demográficos y antecedentes médicos** del paciente (nombre, fecha de nacimiento, género, alergias, enfermedades base, observaciones generales, etc.).
    * **Funcionalidad de Edición:** Permite al doctor editar cualquier campo de la información del paciente directamente desde el modal.
* **Sección de Medicamentos Recetados:**
    * Muestra una lista de todos los **medicamentos recetados** al paciente, incluyendo dosis, frecuencia, duración y el doctor que lo recetó.
    * **Botón "Añadir Medicamento":** Permite añadir nuevas recetas al paciente.
* **Sección de Editar el rol de IA:**
    * Permite aniadir un rol custom para el chat embebido de ese unico paciente
* **Sección de Exámenes Recientes:**
    * Muestra una lista de los **últimos resultados de exámenes** del paciente, incluyendo valores, rangos de referencia e interpretación médica.
    * **Botón "Añadir Examen":** Permite registrar nuevos resultados de exámenes.
* **Sección de Documentos:**
    * **Área de Drag & Drop:** Un área visual donde el doctor puede arrastrar y soltar archivos (PDFs de informes, imágenes) para **añadirlos automáticamente a una carpeta de Google Drive asociada al paciente** (y registrar su URI para la API de Gemini Files).
    * **Display de Documentos:** Lista de todos los documentos ya asociados al paciente, con opción de previsualizar/descargar.
* **Sección de Entradas Clínicas (Entrys):**
    * **Área de Añadir `Entry`:** Un campo de texto/editor para redactar y guardar nuevas `entrys` (notas clínicas detalladas).
    * **Display de `Entrys`:** Una lista cronológica de todas las `entrys` del paciente. Cada `entry` se puede expandir para ver detalles completos.
    * **Icono de Favorito/Destacado:** Cada `entry` tendrá un icono (ej. estrella) que permite marcarla como "destacada" (`destacada = TRUE`) para facilitar su referencia rápida en el chat de la IA.
* **Botón de Chat Embebido (Sticky Position):**
    * Un botón flotante o con posición "sticky" en la esquina del modal.
    * Al hacer clic, abre una **ventana de chat directamente integrada en el modal**, permitiendo al doctor interactuar con la IA de Gemini con el contexto de ese paciente específico.

### 3.2. Página de Calendario (`/calendario`)

Esta página proporciona una visión clara de la agenda del doctor y la gestión de citas.

* **Vistas de Calendario (Día, Semana, Mes):**
    * Selector visible para cambiar entre las vistas de `Día`, `Semana` y `Mes`.
    * La vista predeterminada al cargar la página es la `Vista de Día`, mostrando las citas del día actual.
* **Display de Citas:**
    * Las citas se mostrarán en un formato de agenda o cuadrícula, indicando la hora, paciente, tipo de cita (presencial/virtual) y estado (programada, confirmada, cancelada, completada).
    * **Diferenciación Visual:** Citas presenciales y virtuales tendrán íconos o colores distintivos.
    * **Acceso Rápido a Meet:** Para citas virtuales, un botón o enlace directo para unirse a la llamada de Google Meet.
* **Filtrado y Búsqueda en Calendario:** (Adición)
    * Opción para filtrar citas por estado (pendientes, completadas, canceladas).
    * Barra de búsqueda para encontrar citas por nombre de paciente o doctor.
* **Botón "Agendar Nueva Cita":** (Adición)
    * Un botón prominente que, al hacer clic, abre un modal/formulario para agendar una nueva cita. Este formulario permitirá seleccionar paciente, fecha, hora, tipo de cita (presencial/virtual), motivo y doctor.

### 3.3. Página de Pagos (`/pagos`)

Esta sección se encarga de la gestión financiera de las citas y servicios.

* **Listado de Pagos Pendientes:**
    * Display claro de todas las citas o servicios con pagos pendientes.
    * Información por cada pago: Paciente, Doctor, Fecha de Cita, Monto Total, Monto Pagado, Saldo Pendiente.
    * **Indicadores Visuales:** Alertas de pagos atrasados o próximos a vencer.
* **Gestión de Pagos por Cuotas:**
    * Para cada pago pendiente, opción de registrar pagos parciales (cuotas).
    * Historial de cuotas pagadas por cada servicio/cita.
* **Registro de Nuevos Pagos:**
    * Formulario para registrar un pago completo o una cuota para una cita/servicio específico.
    * Opción de generar y enviar recibo por email (utilizando la Gmail API a través del backend).
* **Historial de Pagos Completados:** (Adición)
    * Sección para visualizar todos los pagos que ya han sido completados.
    * Herramientas de búsqueda y filtrado por paciente, doctor, fecha o estado del pago.

### 3.4. Página de Configuración (`/config`)

Centraliza las preferencias y ajustes de la aplicación para el usuario.

* **Configuración del Rol de la IA por Usuario:**
    * Permite al doctor ajustar el "tono" o "personalidad" de la IA (ej., "más empática", "más técnica", "solo responder a datos"). Esto podría influir en el prompt `[INSTRUCCIÓN DEL SISTEMA]` de Gemini.
    * Posibilidad de activar/desactivar ciertas funcionalidades de la IA (ej., si la IA puede sugerir diagnósticos o solo información).
* **Tema de la Aplicación:**
    * Selector para cambiar entre `Tema Oscuro` y `Tema Claro` (o automático según configuración del dispositivo).
* **Cambio de Contraseña:**
    * Formulario seguro para que el usuario pueda cambiar su contraseña de acceso al sistema.
* **Gestión de Notificaciones:** (Adición)
    * Opciones para activar/desactivar tipos específicos de notificaciones (ej., recordatorios de citas, alertas de exámenes anormales, notificaciones de pago).
    * Elección del canal de notificación (ej., solo in-app, in-app + email, in-app + WhatsApp - cuando esté implementado).
* **Permisos y Roles (Admin):** (Adición, si hay diferentes tipos de usuarios)
    * Para usuarios con rol de administrador, sección para gestionar permisos de otros usuarios del sistema (ej., asistentes médicos, otros doctores).
* **Información de la Cuenta:** (Adición)
    * Verificación del plan de suscripción, uso de tokens de IA (si el sistema los monitorea y muestra), historial de facturación.

---

### Consideraciones Generales de UI/UX

* **Responsive Design:** La aplicación debe ser completamente responsive y ofrecer una experiencia fluida tanto en teléfonos móviles como en tablets, dada la naturaleza de React Native.
* **Feedback Visual:** Proporcionar feedback visual claro al usuario para todas las acciones (ej., spinners de carga, mensajes de éxito/error, animaciones).
* **Consistencia:** Mantener una consistencia visual y de interacción en toda la aplicación.
* **Accesibilidad:** Considerar principios básicos de accesibilidad para asegurar que la aplicación sea usable para una audiencia amplia.