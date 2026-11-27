Este informe sintético detalla las decisiones técnicas y de arquitectura implementadas en el proyecto **Nexo Notarial**, omitiendo explicaciones teóricas generales y enfocándose en la resolución de problemas de diseño, su ubicación en el código fuente y sus beneficios directos.

---

## 1. Evolución de Arquitectura y Tecnologías

El sistema evolucionó desde un prototipo conceptual hacia una aplicación web full stack persistente y desacoplada.

| Componente | Prototipo Inicial | Estado Actual | Motivo del Cambio |
| :--- | :--- | :--- | :--- |
| **Backend** | Python / Flask (`legacy/app.py`) | Node.js / Express + TypeScript (`src/server.ts`) | Mayor control de tipos estáticos, autocompletado y tipado de APIs. |
| **Persistencia** | Memoria volátil (Arrays/Listas) | PostgreSQL + Sequelize ORM (`src/models/index.ts`) | Persistencia real relacional, integridad referencial y consultas ACID. |
| **Migraciones** | N/A | SQL idempotente (`db/migrations/001_initial.sql`) | Control explícito del esquema SQL sin alterar datos en producción. |
| **Frontend** | Plantillas HTML Jinja2 | React 18 + Vite + TypeScript (`web/src/`) | Interfaz interactiva de página única (SPA) con renderizado rápido. |
| **Seguridad** | Sin autenticación | Sesiones Cookie `HttpOnly` + CSRF + Rate Limit | Protección integral contra ataques web comunes (XSS, CSRF, Brute Force). |

---

## 2. Decisiones de Arquitectura y Backend

### 2.1. Adopción de TypeScript con Express
* **Qué se decidió:** Reescribir el backend en TypeScript utilizando Express como framework HTTP (`src/server.ts`).
* **Problema que resuelve:** La fragilidad del prototipo en Python al manejar estructuras de datos sin tipado estático y la falta de autocompletado en el desarrollo.
* **Archivos clave:** `src/server.ts`, `tsconfig.json`.
* **Ventajas y Trade-offs:** Previene errores de tipo en tiempo de compilación. Como trade-off, requiere un paso de compilación (`npm run build`).

### 2.2. Conexión de Base de Datos mediante Instancia de Módulo
* **Qué se decidió:** Exportar directamente la instancia de Sequelize configurada en un módulo centralizado de base de datos.
* **Problema que resuelve:** Evitar la apertura repetida de conexiones a PostgreSQL o la sobre-complejidad de implementar clases con constructores privados.
* **Archivos clave:** `src/database/connection.ts`.
* **Ventajas y Trade-offs:** Garantiza un único pool de conexiones compartido por toda la aplicación de manera simple e idiomática en Node.js.

### 2.3. Migraciones SQL puras e Idempotentes
* **Qué se decidió:** Implementar un script de migración (`migrate()`) que ejecuta directamente un archivo SQL (`001_initial.sql`) y registra la ejecución en la tabla `schema_migrations`.
* **Problema que resuelve:** Evitar la pérdida de datos o la inconsistencia que genera el uso de `sequelize.sync({ alter: true })` en entornos compartidos.
* **Archivos clave:** `db/migrations/001_initial.sql`, `src/database/migrate.ts`.
* **Ventajas y Trade-offs:** Permite tener el control exacto del DDL (índices, claves foráneas, cascadas). Requiere escribir las migraciones manualmente en SQL.

---

## 3. Decisiones de Dominio y Modelo de Datos

### 3.1. Aislamiento del Dominio con Esquemas Zod
* **Qué se decidió:** Separar completamente las reglas de validación de negocio del transporte HTTP mediante un módulo puro de dominio asistido por Zod.
* **Problema que resuelve:** Acoplamiento directo entre Express y las reglas de documentos, y falta de validación consistente en la entrada de datos.
* **Archivos clave:** `src/domain/document.ts`.
* **Ventajas y Trade-offs:** Permite probar las reglas de validación de documentos sin necesidad de levantar el servidor HTTP ni la base de datos.

### 3.2. Normalización de Cadenas y Detección de Duplicados
* **Qué se decidió:** Crear funciones puras (`normalizeDuplicateKey` e `isPossibleDuplicate`) que eliminan diacríticos (acentos), espacios múltiples y homogenizan minúsculas.
* **Problema que resuelve:** La creación involuntaria de documentos o legajos duplicados por diferencias menores de tipeo o acentuación (ej: "Poder General" vs " poder   general ").
* **Archivos clave:** `src/domain/document.ts`.
* **Ventajas y Trade-offs:** Advierte coincidencias probables sin bloquear la creación de documentos legítimos con nombres similares.

### 3.3. Relaciones Complejas y Restricciones de Integridad
* **Qué se decidió:** Definir relaciones de uno-a-muchos (`Legajo` -> `Documento`, `Prioridad` -> `Documento`) y muchos-a-muchos (`Documento` <-> `Persona`, `Documento` <-> `Categoria`, `Documento` <-> `Etiqueta`) con restricciones a nivel de base de datos (`ON DELETE CASCADE` / `ON DELETE RESTRICT`).
* **Problema que resuelve:** Inconsistencia de datos, huérfanos y pérdida de integridad en el sistema notarial.
* **Archivos clave:** `src/models/index.ts`, `db/migrations/001_initial.sql`.
* **Ventajas y Trade-offs:** La base de datos rechaza automáticamente eliminaciones que violen la integridad notarial (por ejemplo, borrar una Persona vinculada a un Documento activo).

---

## 4. Decisiones de Seguridad y Control de Errores

### 4.1. Autenticación basada en Sesiones Persistentes
* **Qué se decidió:** Utilizar sesiones HTTP guardadas en PostgreSQL mediante `connect-session-sequelize`, transmitiendo la cookie `nexo.sid` con atributos `HttpOnly`, `SameSite=Strict` y `Secure` en producción.
* **Problema que resuelve:** Vulnerabilidad de tokens JWT almacenados en `localStorage` frente a ataques XSS.
* **Archivos clave:** `src/server.ts`, `src/middleware/security.ts`.
* **Ventajas y Trade-offs:** La cookie es inaccesible desde JavaScript en el navegador. La sesión se invalida inmediatamente en el servidor al cerrar sesión.

### 4.2. Middleware CSRF basado en Tokens en Sesión
* **Qué se decidió:** Requerir un token aleatorio de 32 bytes (`x-csrf-token`) generado en la sesión para todas las mutaciones HTTP (POST, PUT, PATCH, DELETE).
* **Problema que resuelve:** Ataques de Falsificación de Peticiones en Sitios Cruzados (CSRF) provocados por el envío automático de cookies de sesión.
* **Archivos clave:** `src/middleware/security.ts`, `src/routes/auth.routes.ts`.
* **Ventajas y Trade-offs:** Protección efectiva sin necesidad de librerías obsoletas de CSRF. El cliente debe solicitar y enviar explícitamente la cabecera `x-csrf-token`.

### 4.3. Traducción y Manejo Centralizado de Errores
* **Qué se decidió:** Implementar un middleware de errores que captura excepciones de Sequelize (`UniqueConstraintError`, `ForeignKeyConstraintError`), Zod (`ZodError`) y Multer (`MulterError`), convirtiéndolas en respuestas JSON estandarizadas (códigos 400, 409, 500).
* **Problema que resuelve:** Filtración de stack traces internos o errores crudos de la base de datos hacia el cliente, y respuestas HTTP inconsistentes.
* **Archivos clave:** `src/middleware/error-handler.ts`.
* **Ventajas y Trade-offs:** Oculta detalles sensibles del servidor y proporciona mensajes de error claros al frontend.

---

## 5. Decisiones de Testing, Calidad y Entorno

### 5.1. Estrategia de Pruebas Automatizadas en Dos Niveles
* **Qué se decidió:** Dividir la suite de pruebas con Vitest en:
  1. Pruebas unitarias puras de dominio (`document.test.ts`, `nexo.registro.test.ts`, `nexo.calendario.test.ts`).
  2. Pruebas de integración HTTP y seguridad (`api.routes.test.ts`, `auth.routes.test.ts`, `server.test.ts`, `middleware.test.ts`).
* **Problema que resuelve:** Incertidumbre al refactorizar o modificar código y necesidad de verificar controles de acceso sin depender de pruebas manuales.
* **Archivos clave:** `tests/`.
* **Ventajas y Trade-offs:** Ejecución rápida (`npm test`) y cobertura comprobada de accesos privados (401), validaciones (400) y flujos de autenticación.

### 5.2. Entorno Contenerizado y Script de Inicialización Idempotente
* **Qué se decidió:** Configurar `Dockerfile.api`, `Dockerfile.web`, `docker-compose.yml` y un script PowerShell `scripts/dev-up.ps1`.
* **Problema que resuelve:** El problema del "funciona en mi máquina", la dificultad para configurar PostgreSQL localmente y la fricción en la puesta en marcha.
* **Archivos clave:** `docker-compose.yml`, `Dockerfile.api`, `Dockerfile.web`, `scripts/dev-up.ps1`.
* **Ventajas y Trade-offs:** Permite levantar la base de datos, el backend y el frontend con un solo comando, creando automáticamente el archivo `.env` si no existe.

---

## 6. Matriz Síntesis de Decisiones

| Ámbito | Decisión Implementada | Ubicación en Código | Beneficio Directo |
| :--- | :--- | :--- | :--- |
| **Arquitectura** | Migración de Flask a Node.js + TypeScript | `src/server.ts`, `tsconfig.json` | Tipado estático y mejor mantenibilidad. |
| **Base de Datos** | Sequelize ORM + PostgreSQL + Migraciones SQL | `src/database/`, `db/migrations/` | Persistencia ACID relacional e idempotencia. |
| **Dominio** | Validación declarativa desacoplada | `src/domain/document.ts` | Testeo aislado de reglas de negocio sin HTTP. |
| **Seguridad** | Cookies `HttpOnly` + Token CSRF `x-csrf-token` | `src/middleware/security.ts` | Mitigación estricta de vulnerabilidades XSS y CSRF. |
| **Errores** | Middleware traductor centralizado | `src/middleware/error-handler.ts` | Respuestas JSON uniformes sin fugar stack traces. |
| **Testing** | Suite desacoplada con Vitest y Supertest | `tests/` | Verificación automatizada de rutas, auth y reglas. |
| **Entorno** | Docker Compose + Script `dev-up.ps1` | `docker-compose.yml`, `scripts/` | Puesta en marcha en un solo paso. |
