# Sistema de Organización de Datos de Escribanía

## Qué problema resuelve

Las escribanías suelen manejar la información de clientes, actos notariales
(escrituras, poderes, testamentos, hipotecas, etc.) y el estado de sus
trámites en planillas sueltas o documentos duplicados, lo que dificulta
encontrar información actualizada y confiable.

Este proyecto busca centralizar esos datos en un sistema simple. El diseño
detallado de las entidades (clientes, escrituras, trámites) y su lógica se
va a desarrollar en las próximas etapas de la materia.

## Integrantes

- Pelizza Joaquin - JoaquinPelizza
- Moore Andy - andymoore01
- Fedigatti Augusto - Agusfedredhunter
- Urdampilleta Iñaki - iniakiur

## Tecnología elegida

- **Lenguaje:** Python 3.11+ / cambiando a Typescript
- **Framework web:** Flask
- **Gestión de dependencias:** `pip` + `requirements.txt`
- **Base de datos:** a definir en la próxima etapa (SQLite es la opción más
  probable, por no requerir instalación de un servidor aparte)

## Cómo instalar dependencias

# 1. Clonar el repositorio
git clone https://github.com/joacopelizza/nexoNotarial.git
cd nexoNotorial

# 2. Crear el entorno virtual (igual en cualquier sistema operativo)
python -m venv venv

**Activar el entorno virtual** (el comando cambia según el sistema operativo):

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# Windows (CMD, sin PowerShell)
venv\Scripts\activate.bat

# Mac / Linux
source venv/bin/activate

Se activó correctamente si el prompt empieza con `(venv)`.

**Instalar dependencias:**

pip install -r requirements.txt

Sobre el lockfile: `requirements.txt` declara las dependencias directas del proyecto (Flask, python-dotenv). El archivo `requirements-lock.txt` fija además las versiones exactas de las dependencias transitivas (las que Flask instala por su cuenta), para garantizar un entorno idéntico entre integrantes.

**Copiar el archivo de configuración de ejemplo:**

# Windows (PowerShell o CMD)
copy .env.example .env

# Mac / Linux
cp .env.example .env

## Cómo ejecutar el proyecto

python app.py

La aplicación queda disponible en `http://127.0.0.1:5000`. Al entrar
debería mostrar un mensaje confirmando que el entorno está funcionando.

## Fase actual del sistema.

Gen A-1
- Generación: Alpha
- Versión: 1

## Estado actual y pendientes conocidos

- [x] Repositorio, README y entorno inicial reproducible.
- [x] Servidor mínimo funcionando (Flask + configuración por `.env`).
- [ ] Diseño del modelo de datos (Cliente, Escritura, Trámite).
- [ ] Endpoints de alta, modificación y consulta.
- [ ] Persistencia en base de datos.

Este README se irá actualizando a medida que avance el proyecto.
