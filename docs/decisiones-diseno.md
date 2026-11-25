# Decisiones de diseño y evidencia

## Código analizado

La versión inicial concentraba el flujo de alta y consulta de actas en `app.py`: rutas Flask, validación mínima, creación del objeto y un repositorio en memoria. Los archivos `test/nexo.registro.test.ts` y `test/nexo.calendario.test.ts` estaban vacíos.

## Diagnóstico

El repositorio desacoplaba el servicio de la lista mediante `ActaRepository`, pero la persistencia se perdía al reiniciar y no había una forma de probar el comportamiento real. El secreto de Flask aceptaba el valor por defecto `dev`; además, no existían autenticación, validación de estructura, integridad referencial ni gestión de archivos.

## Alternativas

- Conservar Flask y agregar SQLite: cambio pequeño, pero se apartaba de la decisión tecnológica del proyecto (TypeScript, Express, Sequelize y PostgreSQL).
- Migrar a servicios separados y múltiples repositorios: permitiría despliegues independientes, aunque agregaría complejidad sin necesidad académica inmediata.
- Mantener un backend Express/TypeScript y frontend React en un repositorio, con PostgreSQL y migraciones SQL: alternativa elegida por alineación con el prompt y despliegue local simple.

## Decisión

Se creó una API TypeScript separada por rutas, modelos, middleware y configuración; el frontend usa React/TypeScript. Las relaciones y restricciones viven en una migración versionada. No se usa `sync({ alter: true })`. La capa de validación de documentos se comparte con pruebas puras para comprobar reglas sin depender de una base levantada.

## Evidencia y trade-offs

- `src/domain.ts`: estados fijos, DTO/validación de documento y detección de posibles duplicados.
- `src/api.routes.ts`: operaciones y consultas con Sequelize, integridad y transacciones al persistir relaciones.
- `src/models.ts` y `db/migrations/001_initial.sql`: relaciones, claves foráneas, cascada de legajo a documentos y tablas de unión.
- `src/auth.routes.ts`, `src/middleware.ts`: contraseña con bcrypt, sesión persistida, cookie protegida y CSRF.
- `src/files.routes.ts`: nombres aleatorios, comprobación de firma MIME y vista previa autenticada.
- `test/nexo.registro.test.ts`, `test/nexo.calendario.test.ts`: reglas de entrada y derivación de año.

El costo de migrar es mayor que mantener Flask: se agregan dependencias, servicios y configuración de base. El beneficio es persistencia, tipado estricto y una arquitectura alineada con la evaluación. La integración y los escenarios de eliminación todavía requieren pruebas reales con PostgreSQL.

## Registro del análisis presentado para Taller II

El documento previo evaluó `app.py` y eligió mantener una arquitectura en capas: ruta Flask para HTTP, `ActaService` para negocio y `ActaRepository` para persistencia. Comparó esa opción con concentrar todo en la ruta y señaló el costo inicial de crear más clases frente a mejor cohesión y menor acoplamiento. Esa reflexión sigue siendo evidencia del análisis del equipo.

### Aclaración técnica incorporada en esta revisión

La afirmación original de que la lógica de creación no podía probarse sin ejecutar Flask era demasiado amplia: `ActaService` recibe un `ActaRepository` y podía probarse directamente usando `MemoryActaRepository`. Lo que faltaba eran pruebas automatizadas y cobertura de las rutas HTTP. Las pruebas nuevas comprueban reglas de dominio y algunas respuestas HTTP; todavía falta ejecutar integración contra PostgreSQL.
