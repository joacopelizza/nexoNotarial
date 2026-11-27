# API: ejemplos de uso

Base local por Docker: `http://localhost:8080/api` (en desarrollo directo: `http://localhost:3000/api`). Las rutas de negocio requieren cookie de sesión. Tras login, el servidor devuelve un token CSRF; enviarlo como `X-CSRF-Token` en POST, PUT y DELETE. Postman conserva la cookie por dominio.

## Healthcheck

```http
GET /api/salud
```

```json
{ "estado": "ok" }
```

## Inicio de sesión

```http
POST /api/auth/login
Content-Type: application/json

{"identifier":"escribano","password":"<contraseña local>"}
```

Respuesta: `200`, cookie `nexo.sid` y `{ "token": "<csrf>" }`. El identificador puede ser el usuario o el correo electrónico.

## Crear legajo

```http
POST /api/legajos
X-CSRF-Token: <csrf>
Content-Type: application/json

{"numero":"2026-001"}
```

Respuesta: `201` con el legajo. Un número repetido responde `409`.

## Crear documento

```http
POST /api/documentos
X-CSRF-Token: <csrf>
Content-Type: application/json

{"titulo":"Poder general","tipo":"Poder","legajoId":"<uuid-legajo>","prioridadId":"<uuid-prioridad>","estado":"Pendiente","personas":[{"id":"<uuid-persona>","rol":"Representante"}],"categorias":["<uuid-categoria>"],"etiquetas":["<uuid-etiqueta>"]}
```

La respuesta es `201`. Si coincide con título o número, la propiedad `posiblesDuplicados` incluye candidatos; el endpoint de preconsulta es `GET /api/documentos/posibles-duplicados?titulo=Poder%20general&numero=PG-1`. La falta de legajo devuelve `400`.

## Buscar, filtrar y paginar

`GET /api/documentos?q=poder&page=1&pageSize=25&estado=Pendiente&legajoId=<uuid>&prioridadId=<uuid>&categoriaId=<uuid>&etiquetaId=<uuid>&fechaCampo=fechaEmision&fechaDesde=2026-01-01&fechaHasta=2026-12-31&sort=fechaIncorporacion&direction=DESC`

La respuesta contiene `rows`, `total`, `page` y `pageSize`. Los estados válidos se consultan con `GET /api/estados`.

## Archivos y recuperación

- Adjuntar: `POST /api/archivos/documentos/<uuid-documento>/archivos`, multipart con campo `archivo`.
- Vista previa autenticada: `GET /api/archivos/<uuid-archivo>/vista-previa`.
- Borrar: `DELETE /api/archivos/<uuid-archivo>` con CSRF.
- Recuperación: `POST /api/auth/recuperacion` con `{ "email": "..." }`. Si SMTP no está configurado, responde `503`.
- Nueva contraseña: `POST /api/auth/restablecer` con `{ "token": "...", "password": "..." }`.

Las respuestas se muestran como ejemplos de contrato esperado a partir de los controladores; el entorno PostgreSQL local no estaba disponible para ejecutar estas operaciones durante esta revisión.
