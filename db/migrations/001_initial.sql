CREATE EXTENSION IF NOT EXISTS pgcrypto;
DO $$ BEGIN
  CREATE TYPE estado_documento AS ENUM ('Pendiente','En preparación','En revisión','Aprobado','Finalizado','Archivado','Anulado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), username varchar(80) NOT NULL UNIQUE,
  email varchar(254) NOT NULL UNIQUE, password_hash varchar(100) NOT NULL,
  recovery_hash varchar(64), recovery_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS legajos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), numero varchar(40) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nombre varchar(180) NOT NULL,
  identificacion varchar(40) UNIQUE, domicilio varchar(300), telefono varchar(40), email varchar(254), observaciones text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nombre varchar(100) NOT NULL,
  parent_id uuid REFERENCES categorias(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS categorias_nombre_raiz_uq ON categorias (lower(nombre)) WHERE parent_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS categorias_nombre_sub_uq ON categorias (lower(nombre), parent_id) WHERE parent_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS etiquetas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nombre varchar(60) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS prioridades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nombre varchar(60) NOT NULL,
  orden integer NOT NULL UNIQUE CHECK (orden BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), titulo varchar(220) NOT NULL, numero varchar(80), tipo varchar(80) NOT NULL,
  fecha_emision date, fecha_incorporacion timestamptz NOT NULL DEFAULT now(), descripcion text,
  legajo_id uuid NOT NULL REFERENCES legajos(id) ON DELETE CASCADE,
  prioridad_id uuid NOT NULL REFERENCES prioridades(id) ON DELETE RESTRICT,
  estado estado_documento NOT NULL DEFAULT 'Pendiente',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS documentos_titulo_idx ON documentos USING gin (to_tsvector('simple', titulo));
CREATE INDEX IF NOT EXISTS documentos_numero_idx ON documentos (numero);
CREATE INDEX IF NOT EXISTS documentos_fecha_idx ON documentos (fecha_incorporacion DESC);
CREATE TABLE IF NOT EXISTS documento_persona (
  document_id uuid NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  rol varchar(80) NOT NULL, PRIMARY KEY (document_id, persona_id)
);
CREATE TABLE IF NOT EXISTS documento_categoria (
  document_id uuid NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
  categoria_id uuid NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, categoria_id)
);
CREATE TABLE IF NOT EXISTS documento_etiqueta (
  document_id uuid NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
  etiqueta_id uuid NOT NULL REFERENCES etiquetas(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, etiqueta_id)
);
CREATE TABLE IF NOT EXISTS archivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), document_id uuid NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
  stored_name varchar(100) NOT NULL UNIQUE, original_name varchar(255) NOT NULL,
  mime_type varchar(100) NOT NULL, size integer NOT NULL CHECK (size > 0),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS schema_migrations (name varchar(200) PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
