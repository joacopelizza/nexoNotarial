# Nexo Notarial

Aplicación web para organizar documentos digitales de una escribanía. Usa React y Vite para la interfaz, Express y TypeScript para la API, Sequelize para el acceso a datos y PostgreSQL para la persistencia.

## Estado

El repositorio contiene una versión funcional en desarrollo con login, sesiones, migración inicial, rutas CRUD y manejo de archivos. La interfaz y algunas operaciones todavía están incompletas; el estado y las tareas pendientes están en [`docs/estado-y-pendientes.md`](docs/estado-y-pendientes.md). No se presenta como lista para producción.

## Requisitos

- Windows 10/11, macOS o Linux.
- Node.js **20.19 o superior** y npm **11 o superior** para ejecutar los comandos locales.
- Docker Desktop con Docker Compose v2 para PostgreSQL o para ejecutar el sistema completo.
- PowerShell 5.1 o superior para usar `scripts/dev-up.ps1` en Windows.

Comprobá las herramientas desde una terminal:

```powershell
node --version
npm --version
docker compose version
```

## Opción A: ejecutar todo con Docker

### Windows

Desde PowerShell, en la carpeta raíz del repositorio:

```powershell
.\scripts\dev-up.ps1
```

En la primera ejecución, el script crea `.env` a partir de `.env.example`, genera claves aleatorias para PostgreSQL y las sesiones, y muestra la contraseña inicial una sola vez. Guardala. Si `.env` ya existe, el script lo conserva y reutiliza sus valores. El comando construye las imágenes y deja los servicios en primer plano; detenelos con `Ctrl+C`.

### macOS o Linux

Desde la raíz del repositorio:

```bash
cp .env.example .env
docker compose up --build
```

El `.env.example` sirve para desarrollo local. Antes de usarlo, podés cambiar `INITIAL_PASSWORD`, `SESSION_SECRET` y `DB_PASSWORD`; mantené sincronizadas la contraseña de `DATABASE_URL` y la variable `DB_PASSWORD`. No reutilices estos valores en un despliegue público. El comando mantiene los servicios en primer plano; detenelos con `Ctrl+C`.

### Abrir y cerrar

Abrí <http://localhost:8080>. El primer inicio crea el usuario con `INITIAL_USERNAME`, `INITIAL_EMAIL` e `INITIAL_PASSWORD` de `.env`. Si Windows creó el archivo, la contraseña inicial aparece en la salida de `dev-up.ps1`.

Para detener y quitar los contenedores, conservando los datos:

```bash
docker compose down
```

PostgreSQL y los adjuntos se guardan en volúmenes de Docker. Para borrar también esos datos:

```bash
docker compose down -v
```

Este último comando elimina los documentos y adjuntos guardados en el entorno local.

## Opción B: API e interfaz locales, PostgreSQL en Docker

Usá esta opción para desarrollar el código con recarga automática. Ejecutá todo desde la raíz del repositorio.

1. Creá `.env` si todavía no existe:

   ```powershell
   Copy-Item .env.example .env
   ```

   En macOS o Linux:

   ```bash
   cp .env.example .env
   ```

   Si `.env` ya existe, no lo sobrescribas. Verificá que `DATABASE_URL` apunte a `localhost:5432/nexo`, use el usuario `nexo` y tenga la misma contraseña que `DB_PASSWORD`. La contraseña de la URL puede escribirse con caracteres percent-encoded si contiene símbolos reservados. Vite usa `FRONTEND_ORIGIN=http://localhost:5173`.

2. Iniciá PostgreSQL y esperá el estado `healthy`:

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db
   docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
   ```

   La configuración de desarrollo publica PostgreSQL solo en `127.0.0.1:5432`. Docker Desktop debe estar iniciado y el puerto 5432 debe estar libre.

3. Instalá las dependencias una vez:

   ```bash
   npm ci
   ```

4. Abrí dos terminales en la raíz del repositorio. En la primera, iniciá la API:

   ```bash
   npm run dev
   ```

   En la segunda, iniciá Vite:

   ```bash
   npm run dev:web
   ```

5. Abrí <http://localhost:5173> e iniciá sesión con `INITIAL_USERNAME` o `INITIAL_EMAIL` y `INITIAL_PASSWORD` de `.env`. Si la base está vacía, la API aplica la migración y crea el usuario inicial al arrancar.

La API local escucha en `http://localhost:3000`. Vite escucha en `http://localhost:5173` y reenvía las solicitudes `/api` a la API. Si alguno de esos puertos está ocupado, la aplicación avisa y no cambia silenciosamente a otro puerto. Para detener ambos procesos, usá `Ctrl+C` en cada terminal. Para detener PostgreSQL sin borrar los datos:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

## Configuración local

| Variable                                                            | Uso                                                 | Valor de ejemplo                                                       |
| ------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| `DATABASE_URL`                                                      | Conexión PostgreSQL de la API ejecutada en el host  | `postgres://nexo:...@localhost:5432/nexo`                              |
| `DB_PASSWORD`                                                       | Contraseña del usuario PostgreSQL que crea Compose  | Debe coincidir con la contraseña de `DATABASE_URL` en desarrollo local |
| `SESSION_SECRET`                                                    | Firma de las sesiones; mínimo 32 caracteres         | Generá un valor aleatorio                                              |
| `INITIAL_USERNAME` / `INITIAL_EMAIL`                                | Identidades del primer usuario                      | `escribano` / `escribano@example.com`                                  |
| `INITIAL_PASSWORD`                                                  | Contraseña del primer usuario; mínimo 12 caracteres | Solo desarrollo                                                        |
| `APP_PORT`                                                          | Puerto publicado por la web de Docker               | `8080`                                                                 |
| `FRONTEND_ORIGIN`                                                   | Origen permitido por CORS                           | `http://localhost:5173` para Vite                                      |
| `UPLOAD_DIR`                                                        | Directorio de adjuntos                              | `uploads` en host, `/app/uploads` en Docker                            |
| `MAX_FILE_SIZE_MB`                                                  | Tamaño máximo por adjunto                           | `15`                                                                   |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Proveedor de recuperación por correo                | Vacíos; la recuperación responde `503` hasta configurarlos             |
| `PUBLIC_APP_URL`                                                    | URL que se incluye en el enlace de recuperación     | `http://localhost:5173`                                                |

`NODE_ENV` y `PORT` también se configuran en `.env`; los valores de desarrollo son `development` y `3000`. En Compose, la API usa el nombre de host `db` y el puerto interno 5432; `DATABASE_URL` de `.env` se usa al ejecutar la API directamente desde el host.

Compose usa `DB_PASSWORD` al inicializar por primera vez el volumen de PostgreSQL. Cambiar esa variable después no cambia la contraseña dentro de un volumen existente. Si ya existe la base, conservá la contraseña con que se creó o restablecé el entorno sabiendo que `docker compose down -v` borra sus datos.

El proyecto permite los scripts de instalación de las versiones de `esbuild` fijadas por `package-lock.json` mediante `allowScripts` en `package.json`. Con npm 11, una instalación limpia no debería pedir aprobar esos scripts. Puede seguir apareciendo el aviso deprecado de `dottie`, dependencia transitiva de Sequelize 6; no impide instalar ni ejecutar la aplicación.

## Comandos de verificación

Corré estos comandos desde la raíz después de `npm ci`:

| Comando                | Resultado                                                 |
| ---------------------- | --------------------------------------------------------- |
| `npm test`             | Ejecuta las pruebas automatizadas con Vitest              |
| `npm run typecheck`    | Verifica los tipos del backend sin emitir archivos        |
| `npm run build`        | Compila el backend en `dist/`                             |
| `npm run build:web`    | Compila la interfaz en `web-dist/`                        |
| `npm run lint`         | Ejecuta ESLint                                            |
| `npm run format:check` | Comprueba formato con Prettier                            |
| `npm run format:write` | Aplica el formato configurado                             |
| `npm start`            | Inicia el backend compilado; requiere PostgreSQL y `.env` |

Las pruebas actuales cubren reglas de dominio, middleware y rutas usando mocks; no equivalen a una suite de integración completa contra PostgreSQL.

## Solución de problemas

### `ConnectionRefusedError` al ejecutar `npm run dev`

La API no encuentra PostgreSQL. Iniciá Docker Desktop y ejecutá:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
```

Confirmá que `db` diga `healthy` y que el puerto local 5432 esté libre. Revisá también que `.env` tenga `DATABASE_URL` en `localhost:5432/nexo`.

### Error de contraseña de PostgreSQL

Comprobá que `DB_PASSWORD` coincida con la contraseña de `DATABASE_URL`. Si el volumen se creó antes con otra contraseña, cambiar `.env` no actualiza el usuario existente. Para conservar datos, restaurá en `.env` la contraseña original. Para empezar de cero, podés borrar el volumen con `docker compose down -v` y volver a iniciar; esto borra documentos y adjuntos.

### Puerto ocupado

En Docker completo, cambiá `APP_PORT` en `.env` si el puerto 8080 está ocupado. En modo local, la publicación de PostgreSQL usa `DB_PORT` (por defecto 5432); si lo cambiás, cambiá también el puerto de `DATABASE_URL`. Vite y la API locales usan los puertos 5173 y 3000. Liberá esos puertos antes de iniciar; la interfaz y su proxy requieren los valores configurados.

### La primera contraseña ya no funciona

El usuario inicial se crea solo cuando la tabla de usuarios está vacía. Cambiar `INITIAL_PASSWORD` después no modifica una cuenta existente. Usá la contraseña que se mostró al crear `.env`, configurá SMTP para recuperación, o reiniciá la base de desarrollo eliminando el volumen si no necesitás conservar datos.

## API

La API usa una cookie de sesión `HttpOnly`, `SameSite=Strict`, token CSRF para mutaciones y límite de intentos en rutas de autenticación. `GET /api/salud` es público; las rutas privadas requieren sesión.

Rutas principales: `/api/auth/*`, `/api/legajos`, `/api/documentos`, `/api/personas`, `/api/categorias`, `/api/etiquetas`, `/api/prioridades` y `/api/archivos`. Consultá los ejemplos de uso en [`docs/api.md`](docs/api.md) y la colección de Postman en [`postman/Nexo-Notarial.postman_collection.json`](postman/Nexo-Notarial.postman_collection.json).

Los archivos permitidos son PDF, JPG, PNG y WebP; se valida la firma y el tamaño. La recuperación por correo solo funciona con todos los valores SMTP configurados.

## Estructura del repositorio

- `src/`: API Express, configuración, base de datos, modelos, dominio y middleware.
- `web/`: interfaz React y configuración de Vite.
- `db/migrations/`: migraciones SQL versionadas.
- `tests/`: pruebas de API y dominio.
- `docker/`, `Dockerfile.*`, `docker-compose*.yml`: ejecución en contenedores.
- `scripts/`: scripts locales de desarrollo.
- `legacy/`: prototipo Flask anterior.
- `docs/`: decisiones, pendientes, API y notas de despliegue.

Más detalles: [`docs/decisiones-diseno.md`](docs/decisiones-diseno.md), [`docs/decisiones-pendientes.md`](docs/decisiones-pendientes.md), [`docs/backlog.md`](docs/backlog.md) y [`docs/deploy.md`](docs/deploy.md).

## Seguridad

No guardes `.env`, contraseñas ni secretos en Git. Los valores del ejemplo son únicamente para desarrollo. Antes de publicar, configurá secretos únicos, HTTPS, CORS, SMTP, una base PostgreSQL administrada y almacenamiento persistente adecuado para adjuntos. La aplicación no implementa backups, múltiples usuarios, OCR, búsqueda dentro del contenido de archivos, reportes ni auditoría completa.
