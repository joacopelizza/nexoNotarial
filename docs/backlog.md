# Backlog académico inicial

| ID     | Área          | Tarea                                                        | Prioridad | Dependencias   | Criterio de aceptación                                        |
| ------ | ------------- | ------------------------------------------------------------ | --------- | -------------- | ------------------------------------------------------------- |
| NEX-01 | Configuración | Fijar Node, TypeScript, lint y formato                       | Alta      | —              | `npm ci`, typecheck, lint y formato reproducibles             |
| NEX-02 | Base de datos | Revisar migraciones y constraints con PostgreSQL             | Alta      | NEX-01         | Base limpia migra y conserva unicidad/cascadas                |
| NEX-03 | Autenticación | Probar login, cookie, CSRF, logout y limitación              | Alta      | NEX-02         | Pruebas de API pasan; rutas privadas responden 401 sin sesión |
| NEX-04 | Recuperación  | Configurar SMTP y probar token de un uso                     | Media     | NEX-03         | Correo real, vencimiento y reutilización rechazada            |
| NEX-05 | Legajos       | Completar edición, listado detallado y personas relacionadas | Alta      | NEX-02         | ABM y confirmación de cascada validados                       |
| NEX-06 | Documentos    | Completar ficha, edición, asociaciones y filtros             | Alta      | NEX-05         | Campos obligatorios y filtros probados desde UI/API           |
| NEX-07 | Personas      | Completar formulario, roles y edición                        | Alta      | NEX-06         | Una persona reutilizada conserva rol en cada documento        |
| NEX-08 | Clasificación | Completar edición de categorías/etiquetas y filtros          | Media     | NEX-06         | Asociación múltiple y restricciones documentadas              |
| NEX-09 | Prioridades   | Validar renombrado y reordenamiento de cinco niveles         | Media     | NEX-02         | No permite alta/baja y guarda orden único                     |
| NEX-10 | Archivos      | Verificar MIME, tamaño, vista, reemplazo y cascadas          | Alta      | NEX-06         | Acceso privado, extensión/signatura comprobadas               |
| NEX-11 | Testing       | Agregar integración API y pruebas frontend                   | Alta      | NEX-03–10      | Casos normales, límite y error se ejecutan localmente         |
| NEX-12 | Documentación | Actualizar Postman y guías con resultados medidos            | Media     | NEX-11         | Colección usable y documentación coincide con versión         |
| NEX-13 | Deploy        | Definir almacenamiento y secretos del proveedor              | Baja      | NEX-02, NEX-10 | Build reproducible y pasos sin credenciales en Git            |

## Organización de trabajo sugerida

- **Sprint A:** configuración, esquema, autenticación y pruebas de acceso.
- **Sprint B:** legajos, documentos y relaciones.
- **Sprint C:** personas, clasificación, prioridades y archivos.
- **Sprint D:** pruebas end-to-end, documentación y preparación de deploy.

Asignar responsables y fechas con el equipo. No se crearon tareas en Jira.
