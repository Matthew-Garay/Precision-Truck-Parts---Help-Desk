# Documentación Interna de Archivos - PrecisionTrucks HelpDesk

**Guía de documentación interna para desarrolladores.**

---

## Propósito

Este documento describe cómo documentar internamente los archivos del proyecto para que otros desarrolladores entiendan rápidamente el código.

---

## Estándares de Documentación

### 1. Comentarios de Archivo (Encabezado)

Cada archivo debe comenzar con un comentario describiendo su propósito:

```javascript
/**
 * @file ticketsController.js
 * @description Controlador para gestionar operaciones de tickets
 * @author Matthew Garay
 * @version 1.0.0
 * @date 2024-08-07
 * 
 * Funciones principales:
 * - createTicket: Crear nuevo ticket
 * - getTickets: Obtener lista de tickets
 * - updateTicket: Actualizar ticket existente
 * - deleteTicket: Eliminar ticket
 */
```

### 2. Comentarios de Función

Cada función debe tener un comentario JSDoc:

```javascript
/**
 * Crea un nuevo ticket en el sistema
 * 
 * @async
 * @function createTicket
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} req.body - Cuerpo de la solicitud
 * @param {string} req.body.titulo - Título del ticket
 * @param {string} req.body.descripcion - Descripción del problema
 * @param {string} req.body.categoria - Categoría del ticket
 * @param {string} req.body.prioridad - Prioridad (baja, media, alta, crítica)
 * @param {Object} res - Objeto de respuesta Express
 * 
 * @returns {Promise<void>} Envía respuesta JSON con ticket creado
 * 
 * @throws {Error} Si hay error en la validación o BD
 * 
 * @example
 * POST /api/tickets
 * {
 * "titulo": "Impresora no funciona",
 * "descripcion": "La impresora HP no imprime",
 * "categoria": "Hardware",
 * "prioridad": "Alta"
 * }
 */
async function createTicket(req, res) {
 // Implementación
}
```

### 3. Comentarios de Lógica Compleja

Explicar la lógica no obvia:

```javascript
// Validar que el usuario sea técnico o admin
// para poder asignar tickets a otros
if (!['tecnico', 'admin'].includes(req.user.rol)) {
 return res.status(403).json({ error: 'No autorizado' });
}

// Generar portada del PDF automáticamente
// usando la primera página como miniatura
const portada = await generarPortada(rutaPDF);
```

### 4. Comentarios de Variables

Para variables importantes:

```javascript
// Tiempo de expiración del token JWT en segundos (24 horas)
const JWT_EXPIRATION = 86400;

// Tamaño máximo de archivo permitido (50 MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Extensiones permitidas para manuales
const ALLOWED_EXTENSIONS = ['.pdf'];
```

---

## Documentación por Carpeta

### Backend/Config/

**Propósito**: Archivos de configuración centralizada

#### db.js
```javascript
/**
 * @file db.js
 * @description Configuración de conexión a MySQL
 * 
 * Exporta:
 * - pool: Pool de conexiones MySQL
 * - query: Función para ejecutar queries
 * 
 * Uso:
 * const { query } = require('./db');
 * const results = await query('SELECT * FROM tickets');
 */
```

#### mailer.js
```javascript
/**
 * @file mailer.js
 * @description Configuración de Nodemailer para envío de emails
 * 
 * Exporta:
 * - sendEmail: Función para enviar emails
 * 
 * Uso:
 * const { sendEmail } = require('./mailer');
 * await sendEmail({
 * to: 'usuario@example.com',
 * subject: 'Recuperar contraseña',
 * html: '<p>Haz clic aquí</p>'
 * });
 */
```

#### cache.js
```javascript
/**
 * @file cache.js
 * @description Sistema de caché en memoria para mejorar rendimiento
 * 
 * Exporta:
 * - set: Guardar valor en caché
 * - get: Obtener valor del caché
 * - delete: Eliminar valor del caché
 * - clear: Limpiar todo el caché
 * 
 * Uso:
 * const { set, get } = require('./cache');
 * set('user_1', userData, 3600); // Expira en 1 hora
 * const data = get('user_1');
 */
```

#### socketInstance.js
```javascript
/**
 * @file socketInstance.js
 * @description Instancia global de Socket.io para comunicación en tiempo real
 * 
 * Exporta:
 * - io: Instancia de Socket.io
 * 
 * Eventos:
 * - ticket:created: Nuevo ticket creado
 * - ticket:updated: Ticket actualizado
 * - ticket:deleted: Ticket eliminado
 * 
 * Uso:
 * const { io } = require('./socketInstance');
 * io.emit('ticket:created', ticketData);
 */
```

### Backend/Models/

**Propósito**: Modelos de datos (ORM)

#### Ticket.js
```javascript
/**
 * @file Ticket.js
 * @description Modelo de datos para tickets de soporte
 * 
 * Tabla: tickets
 * Campos:
 * - id: INT PRIMARY KEY AUTO_INCREMENT
 * - numero: VARCHAR(20) UNIQUE
 * - titulo: VARCHAR(255)
 * - descripcion: TEXT
 * - estado: ENUM('abierto', 'en_progreso', 'resuelto', 'cerrado')
 * - prioridad: ENUM('baja', 'media', 'alta', 'critica')
 * - categoria_id: INT FOREIGN KEY
 * - usuario_id: INT FOREIGN KEY
 * - tecnico_id: INT FOREIGN KEY (nullable)
 * - fecha_creacion: TIMESTAMP
 * - fecha_actualizacion: TIMESTAMP
 * 
 * Métodos:
 * - create(data): Crear nuevo ticket
 * - findById(id): Obtener ticket por ID
 * - findAll(filters): Obtener todos los tickets
 * - update(id, data): Actualizar ticket
 * - delete(id): Eliminar ticket
 */
```

### Backend/Controllers/

**Propósito**: Lógica de negocio

#### authController.js
```javascript
/**
 * @file authController.js
 * @description Controlador de autenticación y autorización
 * 
 * Funciones:
 * - login: Iniciar sesión con email y contraseña
 * - logout: Cerrar sesión
 * - refreshToken: Renovar token JWT
 * - resetPassword: Solicitar reset de contraseña
 * - confirmReset: Confirmar reset de contraseña
 * 
 * Flujo de autenticación:
 * 1. Usuario envía email y contraseña
 * 2. Se valida contra BD
 * 3. Se genera JWT token
 * 4. Se devuelve token al cliente
 * 5. Cliente envía token en headers Authorization
 */
```

### Backend/Routes/

**Propósito**: Definición de rutas API

#### ticketsRoutes.js
```javascript
/**
 * @file ticketsRoutes.js
 * @description Rutas API para gestión de tickets
 * 
 * Rutas:
 * GET /api/tickets - Listar tickets
 * POST /api/tickets - Crear ticket
 * GET /api/tickets/:id - Obtener detalles
 * PUT /api/tickets/:id - Actualizar ticket
 * DELETE /api/tickets/:id - Eliminar ticket
 * POST /api/tickets/:id/comentar - Agregar comentario
 * 
 * Middlewares:
 * - authMiddleware: Verificar JWT
 * - validate: Validar datos con Zod
 * - uploadEvidencias: Subir archivos
 */
```

### Backend/Middlewares/

**Propósito**: Middlewares Express

#### authMiddleware.js
```javascript
/**
 * @file authMiddleware.js
 * @description Middleware para verificación de JWT
 * 
 * Verifica:
 * - Token JWT válido en header Authorization
 * - Token no expirado
 * - Usuario existe en BD
 * 
 * Agrega a req:
 * - req.user: Datos del usuario autenticado
 * - req.user.id: ID del usuario
 * - req.user.rol: Rol del usuario
 * 
 * Uso:
 * router.get('/tickets', authMiddleware, ticketsController.getTickets);
 */
```

#### security.js
```javascript
/**
 * @file security.js
 * @description Middlewares de seguridad
 * 
 * Middlewares:
 * - corsMiddleware: Configurar CORS
 * - helmetMiddleware: Headers de seguridad
 * - rateLimitMiddleware: Limitar tasa de solicitudes
 * - cspMiddleware: Content Security Policy
 * 
 * Uso:
 * app.use(corsMiddleware);
 * app.use(helmetMiddleware);
 * app.use(rateLimitMiddleware);
 */
```

#### validate.js
```javascript
/**
 * @file validate.js
 * @description Middleware para validación de datos con Zod
 * 
 * Esquemas:
 * - createTicketSchema: Validar creación de ticket
 * - updateTicketSchema: Validar actualización de ticket
 * - loginSchema: Validar login
 * 
 * Uso:
 * router.post('/tickets', validate(createTicketSchema), controller.create);
 */
```

### Frontend/components/

**Propósito**: Componentes React reutilizables

#### TicketCard.jsx
```javascript
/**
 * @file TicketCard.jsx
 * @description Componente para mostrar tarjeta de ticket
 * 
 * Props:
 * - ticket (Object): Datos del ticket
 * - id: ID del ticket
 * - numero: Número de ticket
 * - titulo: Título
 * - estado: Estado actual
 * - prioridad: Nivel de prioridad
 * - onClick (Function): Callback al hacer clic
 * - onDelete (Function): Callback para eliminar
 * 
 * Ejemplo:
 * <TicketCard 
 * ticket={ticket}
 * onClick={() => navigate(`/tickets/${ticket.id}`)}
 * onDelete={() => deleteTicket(ticket.id)}
 * />
 */
```

### Frontend/hooks/

**Propósito**: Custom hooks React

#### useAuth.js
```javascript
/**
 * @file useAuth.js
 * @description Custom hook para autenticación
 * 
 * Retorna:
 * - user: Datos del usuario autenticado
 * - isLoading: Indica si está cargando
 * - error: Error si existe
 * - login: Función para iniciar sesión
 * - logout: Función para cerrar sesión
 * - isAuthenticated: Booleano si está autenticado
 * 
 * Uso:
 * const { user, login, logout } = useAuth();
 */
```

### Frontend/services/

**Propósito**: Servicios API

#### ticketsService.js
```javascript
/**
 * @file ticketsService.js
 * @description Servicios API para tickets
 * 
 * Funciones:
 * - getTickets(filters): Obtener lista de tickets
 * - getTicketById(id): Obtener detalles de ticket
 * - createTicket(data): Crear nuevo ticket
 * - updateTicket(id, data): Actualizar ticket
 * - deleteTicket(id): Eliminar ticket
 * - addComment(ticketId, comment): Agregar comentario
 * 
 * Manejo de errores:
 * - Captura errores de red
 * - Maneja errores de validación
 * - Redirige a login si token expirado
 * 
 * Uso:
 * const tickets = await ticketsService.getTickets({ estado: 'abierto' });
 */
```

---

## Checklist de Documentación

### Para Cada Archivo

- [ ] Comentario de encabezado con propósito
- [ ] Comentarios JSDoc para funciones
- [ ] Comentarios para lógica compleja
- [ ] Ejemplos de uso
- [ ] Descripción de parámetros
- [ ] Descripción de retorno
- [ ] Posibles errores documentados

### Para Cada Función

- [ ] Descripción clara del propósito
- [ ] Parámetros documentados con tipos
- [ ] Retorno documentado
- [ ] Ejemplo de uso
- [ ] Posibles excepciones

### Para Cada Componente React

- [ ] Descripción del componente
- [ ] Props documentadas
- [ ] Estados internos explicados
- [ ] Efectos secundarios documentados
- [ ] Ejemplo de uso

---

## Plantillas

### Plantilla de Archivo Backend

```javascript
/**
 * @file nombreArchivo.js
 * @description Descripción breve del archivo
 * @author Nombre del autor
 * @version 1.0.0
 * @date YYYY-MM-DD
 * 
 * Funciones principales:
 * - funcion1: Descripción
 * - funcion2: Descripción
 */

/**
 * Descripción de la función
 * 
 * @async
 * @function nombreFuncion
 * @param {type} param1 - Descripción del parámetro
 * @param {type} param2 - Descripción del parámetro
 * @returns {Promise<type>} Descripción del retorno
 * @throws {Error} Descripción de posibles errores
 * 
 * @example
 * const resultado = await nombreFuncion(param1, param2);
 */
async function nombreFuncion(param1, param2) {
 // Implementación
}

module.exports = { nombreFuncion };
```

### Plantilla de Componente React

```javascript
/**
 * @file NombreComponente.jsx
 * @description Descripción del componente
 * 
 * Props:
 * - prop1 (type): Descripción
 * - prop2 (type): Descripción
 * 
 * Estados:
 * - state1: Descripción
 * 
 * Efectos:
 * - useEffect: Descripción
 * 
 * @example
 * <NombreComponente prop1={valor1} prop2={valor2} />
 */

import React, { useState, useEffect } from 'react';

function NombreComponente({ prop1, prop2 }) {
 const [state1, setState1] = useState(null);

 useEffect(() => {
 // Efecto
 }, []);

 return (
 <div>
 {/* JSX */}
 </div>
 );
}

export default NombreComponente;
```

---

## Mejores Prácticas

### Hacer

- Documentar funciones públicas
- Usar comentarios para explicar "por qué", no "qué"
- Mantener comentarios actualizados
- Usar ejemplos de uso
- Documentar casos especiales

### No Hacer

- Documentar código obvio
- Comentarios desactualizados
- Comentarios muy largos
- Documentación en otro idioma
- Comentarios que repiten el código

---

## Referencias

- [JSDoc Documentation](https://jsdoc.app/)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [MySQL Documentation](https://dev.mysql.com/doc/)

---

**Última actualización**: Agosto 2024
**Versión**: 1.0.0
