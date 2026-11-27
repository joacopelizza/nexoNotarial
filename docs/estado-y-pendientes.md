# Estado de auditoría y trabajo local

## Estado inicial observado

- Un único `app.py` con Flask; las actas vivían en una lista en memoria.
- Sin usuarios reales, base persistente, migraciones, interfaz web ni Docker.
- `test/nexo.calendario.test.ts` y `test/nexo.registro.test.ts` existían vacíos.
- `README.md` describía el proyecto como fase inicial con diseño de datos pendiente.
- El repositorio recibido no tenía cambios locales (`main` alineada con `origin/main`). No se realizaron commits ni operaciones remotas.

## Cambios locales preparados

- Añadida API Express/TypeScript strict y Sequelize con PostgreSQL.
- Añadida migración SQL inicial para usuario, legajo, documento, persona, clasificación, prioridad, estado y adjunto.
- Añadido login por usuario/correo, sesiones en PostgreSQL, logout y token CSRF.
- Añadida recuperación segura con token de un uso; retorna `503` al no estar SMTP configurado.
- Añadidos endpoints CRUD iniciales, búsqueda/paginación, filtros básicos, estados fijos, prioridad de cinco niveles y vínculos muchos a muchos.
- Añadida carga, validación de firma, vista previa y borrado de adjuntos.
- Añadida interfaz React responsive con las seis secciones y confirmaciones de eliminación.
- Añadidos Dockerfiles, Compose, README, guía de despliegue, backlog, decisiones pendientes, colección Postman y ejemplos de API.
- Añadidas pruebas de validación de dominio y de respuestas HTTP para healthcheck, autenticación ausente y SMTP no configurado.

## Pendientes materiales

- Completar formularios de edición y eliminación para personas/categorías, edición de legajos y ficha completa de documento.
- Completar filtros de etiqueta y búsqueda/filtros por todos los datos en la interfaz; la API tiene búsqueda, filtros básicos por categoría/etiqueta/fechas/legajo/prioridad/estado y orden paginado.
- Revisar cascadas y archivos físicos ante eliminación en todos los escenarios; actualmente se eliminan para legajos y documentos desde API.
- Añadir pruebas de integración API con PostgreSQL y pruebas de componentes frontend; las pruebas HTTP actuales no abren una base real.
- Completar formularios de edición de documento, asociaciones y datos personales/categóricos, y mostrar personas relacionadas desde la interfaz de legajo.
- Probar Compose en ejecución, persistencia, inicio de sesión, adjuntos y migración cuando Docker Engine esté disponible.
- Configurar almacenamiento persistente y SMTP para un despliegue real; ningún entorno público fue desplegado.
- Los formularios de personas/categorías solo cubren alta básica y no exponen todos los campos disponibles.

## Verificaciones observadas

| Verificación         | Resultado                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Instalación npm      | `npm install` completado y lockfile actualizado.                                                                         |
| TypeScript           | `npm run typecheck` pasó.                                                                                                |
| Build backend        | `npm run build` pasó.                                                                                                    |
| Build frontend       | `npm run build:web` pasó.                                                                                                |
| ESLint               | `npm run lint` pasó.                                                                                                     |
| Prettier             | `npm run format:check` pasó.                                                                                             |
| Tests                | `npm test`: 4 archivos y 13 pruebas pasaron.                                                                             |
| Auditoría npm        | `npm audit`: cero vulnerabilidades en el árbol instalado.                                                                |
| Postman              | Colección y entorno parsean como JSON válido.                                                                            |
| Configuración Docker | `docker compose config --quiet` pasó con `.env.example` copiado temporalmente como `.env`; el archivo temporal se quitó. |
| Migración PostgreSQL | No ejecutada: no había servicio PostgreSQL disponible.                                                                   |
| Docker en ejecución  | No ejecutado: Docker Engine no estaba iniciado (`docker info` no pudo conectar al pipe de Docker Desktop).               |

No se hicieron commits, pushes ni cambios en el remoto.
