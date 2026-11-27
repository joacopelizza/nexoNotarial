Nexo Notarial
Aplicación web para organizar documentos digitales de una escribanía. Este repositorio partía de un prototipo Flask que guardaba actas en memoria. La versión actual inicia una migración hacia TypeScript, Express, Sequelize y PostgreSQL, con una interfaz React.

Estado del proyecto
Hay una base full stack ejecutable en preparación: autenticación de usuario único, sesiones persistentes, migración PostgreSQL inicial, CRUD de legajos, personas, categorías, prioridades y documentos, búsqueda paginada, asociación de personas/categorías/etiquetas desde API y gestión autenticada de archivos. La interfaz incluye inicio de sesión y las seis secciones requeridas.

El trabajo sigue incompleto: faltan operaciones y formularios de edición en varias pantallas, la recuperación de contraseña necesita SMTP real, falta una batería de integración con PostgreSQL y la verificación final de Docker depende del entorno. La lista detallada está en docs/estado-y-pendientes.md. No se afirma que el proyecto esté listo para producción.

Requisitos
Node.js 20 o superior y npm.
Docker Desktop con Docker Compose v2 para levantar PostgreSQL y los servicios web.
Puesta en marcha local con Docker
Copiá .env.example como .env y reemplazá DB_PASSWORD, SESSION_SECRET y INITIAL_PASSWORD por valores propios. SESSION_SECRET debe tener al menos 32 caracteres y la contraseña inicial al menos 12.

Desde la raíz del repositorio, ejecutá:

docker compose up --build
Abrí http://localhost:8080. El primer inicio crea la cuenta configurada en INITIAL_USERNAME y INITIAL_EMAIL.

Los documentos y adjuntos se guardan en volúmenes locales de Docker. docker compose down conserva los datos. docker compose down -v los elimina; no lo uses si necesitás conservarlos.

Desarrollo sin contenedores
Instalá PostgreSQL y creá una base vacía.

Copiá .env.example a .env y ajustá DATABASE_URL y las variables iniciales.

Instalá dependencias y arrancá la API y la interfaz en terminales separadas:

npm ci
npm run dev
npm run dev:web
La API escucha en el puerto 3000 y Vite en el 5173. Para el modo local, configurá FRONTEND_ORIGIN=http://localhost:5173 en .env. La migración SQL inicial se ejecuta al iniciar la API. Para producción no se usa sync({ alter: true }).

Comandos
Comando	Uso
npm run dev	API en modo desarrollo
npm run dev:web	Interfaz React/Vite
npm run typecheck	Verifica tipos TypeScript del backend
npm run build	Compila el backend
npm run build:web	Genera el frontend
npm test	Ejecuta pruebas automatizadas disponibles
npm run lint	Analiza TypeScript con ESLint
npm run format:check	Comprueba formato con Prettier
API
La API usa sesiones HTTP con cookie HttpOnly, SameSite=Strict, token CSRF para mutaciones y límite de intentos en rutas de autenticación. GET /api/salud es el healthcheck público. El resto requiere sesión.

Principales rutas: /api/auth/*, /api/legajos, /api/documentos, /api/personas, /api/categorias, /api/etiquetas, /api/prioridades y /api/archivos. La colección importable está en postman/Nexo-Notarial.postman_collection.json.

Los ejemplos de request/response y el uso de CSRF están en docs/api.md.

La recuperación devuelve un error 503 si no están configuradas todas las variables SMTP. No declara enviado un correo cuando no existe proveedor. Las vistas previas de archivos requieren sesión y los tipos permitidos son PDF, JPG, PNG y WebP con validación de firma y tamaño.

Arquitectura y datos
web/: React, TypeScript y Vite.
src/: API Express, modelos Sequelize, rutas, validaciones, autenticación y archivos.
db/migrations/: esquema SQL versionado e idempotente.
test/: pruebas unitarias de validaciones y reglas de dominio.
docker/: inicialización/configuración del entorno.
Las decisiones de diseño y sus trade-offs están en docs/decisiones-diseno.md. Los cinco puntos funcionales pendientes están en docs/decisiones-pendientes.md. El backlog académico está en docs/backlog.md.
