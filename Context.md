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
