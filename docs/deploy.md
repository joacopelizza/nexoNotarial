# Preparación para despliegue

No hay un despliegue público ni credenciales de proveedor configuradas. La composición local con Docker es el entorno verificable previsto para evaluación.

## Topología recomendada

- **Frontend:** compilar con `npm ci && npm run build:web`; publicar el contenido de `web-dist` en Vercel o Netlify, configurando un rewrite de `/api/*` al backend.
- **Backend:** servicio Node.js 20+ en Render u otro proveedor compatible. Comandos: `npm ci`, `npm run build`, `npm start`. El inicio ejecuta las migraciones SQL pendientes.
- **Base:** PostgreSQL administrado. Configurar `DATABASE_URL` con TLS según las indicaciones del proveedor.
- **Archivos:** montar almacenamiento persistente en `UPLOAD_DIR`. El filesystem efímero de un contenedor no es adecuado para adjuntos. La integración actual usa disco local; no se incorporó un proveedor de objetos.

## Variables de entorno

Configurar secretos en el panel privado del proveedor, nunca en Git: `NODE_ENV=production`, `DATABASE_URL`, `SESSION_SECRET` aleatorio de 32+ caracteres, `INITIAL_USERNAME`, `INITIAL_EMAIL`, `INITIAL_PASSWORD` de 12+ caracteres, `UPLOAD_DIR`, `MAX_FILE_SIZE_MB`, `FRONTEND_ORIGIN`, `PUBLIC_APP_URL` y los cinco valores `SMTP_*` si se habilita recuperación por correo.

Usar HTTPS. Mantener `FRONTEND_ORIGIN` alineado con el origen web real. La cookie de sesión se marca `Secure` en producción. Al terminar el primer inicio, revisar que la cuenta inicial y el proveedor SMTP funcionan.

## Flujo de publicación

1. Crear PostgreSQL y configurar variables secretas.
2. Desplegar backend y esperar el healthcheck `GET /api/salud`.
3. Montar volumen persistente para adjuntos y comprobar permisos de escritura.
4. Publicar `web-dist` y configurar el rewrite de `/api` al backend.
5. Probar login, CSRF, CRUD, vista previa y recuperación con un correo controlado.
6. Revisar logs y el estado de migración. No hay pipeline CI/CD configurado; se puede incorporar posteriormente para ejecutar `typecheck`, lint, pruebas y builds antes de publicar.

No habilitar una instancia pública con credenciales de ejemplo. Los pasos de creación de recursos, DNS y secretos requieren las cuentas del equipo y no se realizaron desde este repositorio.
