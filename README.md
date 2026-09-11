# Sistema de Organización de Datos de Escribanía

## Qué problema resuelve

Las escribanías suelen manejar la información de clientes, actos notariales
(escrituras, poderes, testamentos, hipotecas, etc.) y el estado de sus
trámites en planillas sueltas o documentos duplicados, lo que dificulta
encontrar información actualizada y confiable.

Este proyecto busca centralizar esos datos en un sistema simple. El diseño
detallado de las entidades (clientes, escrituras, trámites) y su lógica se
va a desarrollar en las próximas etapas de la materia.

## Cómo instalar dependencias

# 1. Clonar el repositorio
git clone https://github.com/joacopelizza/nexoNotarial.git
cd escribania-app

# 2. Crear el entorno virtual (igual en cualquier sistema operativo)
python -m venv venv

**Instalar dependencias:**

pip install -r requirements.txt

**Copiar el archivo de configuración de ejemplo:**

# Windows (PowerShell o CMD)
copy .env.example .env

# Mac / Linux
cp .env.example .env

## Cómo ejecutar el proyecto

python app.py

La aplicación queda disponible en `http://127.0.0.1:5000`. Al entrar
debería mostrar un mensaje confirmando que el entorno está funcionando.

## Estado actual y pendientes conocidos

- [x] Repositorio, README y entorno inicial reproducible.
- [x] Servidor mínimo funcionando (Flask + configuración por `.env`).
- [ ] Diseño del modelo de datos (Cliente, Escritura, Trámite).
- [ ] Endpoints de alta, modificación y consulta.
- [ ] Persistencia en base de datos.

Este README se irá actualizando a medida que avance el proyecto.
