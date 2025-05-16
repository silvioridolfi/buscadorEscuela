-- Función para crear las tablas necesarias si no existen
CREATE OR REPLACE FUNCTION create_necessary_tables()
RETURNS void AS $$
BEGIN
  -- Verificar si la tabla establecimientos existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'establecimientos') THEN
    -- Crear tabla establecimientos si no existe
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE TABLE establecimientos (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      cue TEXT,
      nombre TEXT,
      distrito TEXT,
      ciudad TEXT,
      direccion TEXT,
      lat DOUBLE PRECISION,
      lon DOUBLE PRECISION,
      predio TEXT,
      fed_a_cargo TEXT,
      plan_enlace TEXT,
      subplan_enlace TEXT,
      fecha_inicio_conectividad TEXT,
      proveedor_internet_pnce TEXT,
      fecha_instalacion_pnce TEXT,
      pnce_tipo_mejora TEXT,
      pnce_fecha_mejora TEXT,
      pnce_estado TEXT,
      pba_grupo_1_proveedor_internet TEXT,
      pba_grupo_1_fecha_instalacion TEXT,
      pba_grupo_1_estado TEXT,
      pba_2019_proveedor_internet TEXT,
      pba_2019_fecha_instalacion TEXT,
      pba_2019_estado TEXT,
      pba_grupo_2_a_proveedor_internet TEXT,
      pba_grupo_2_a_fecha_instalacion TEXT,
      pba_grupo_2_a_tipo_mejora TEXT,
      pba_grupo_2_a_fecha_mejora TEXT,
      pba_grupo_2_a_estado TEXT,
      plan_piso_tecnologico TEXT,
      proveedor_piso_tecnologico_cue TEXT,
      fecha_terminado_piso_tecnologico_cue TEXT,
      tipo_mejora TEXT,
      fecha_mejora TEXT,
      tipo_piso_instalado TEXT,
      tipo TEXT,
      observaciones TEXT,
      tipo_establecimiento TEXT,
      listado_conexion_internet TEXT,
      estado_instalacion_pba TEXT,
      proveedor_asignado_pba TEXT,
      mb TEXT,
      ambito TEXT,
      cue_anterior TEXT,
      reclamos_grupo_1_ani TEXT,
      recurso_primario TEXT,
      access_id TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Crear índices para búsquedas rápidas
    CREATE INDEX idx_establecimientos_cue ON establecimientos(cue);
    CREATE INDEX idx_establecimientos_nombre ON establecimientos(nombre);
    CREATE INDEX idx_establecimientos_distrito ON establecimientos(distrito);
    CREATE INDEX idx_establecimientos_ciudad ON establecimientos(ciudad);
    CREATE INDEX idx_establecimientos_predio ON establecimientos(predio);
    CREATE INDEX idx_establecimientos_fed_a_cargo ON establecimientos(fed_a_cargo);
    CREATE INDEX idx_establecimientos_tipo_establecimiento ON establecimientos(tipo_establecimiento);
  END IF;

  -- Verificar si la tabla contactos existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contactos') THEN
    -- Crear tabla contactos si no existe
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE TABLE contactos (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      cue TEXT,
      nombre TEXT,
      apellido TEXT,
      correo TEXT,
      telefono TEXT,
      cargo TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Crear índice para búsquedas rápidas
    CREATE INDEX idx_contactos_cue ON contactos(cue);
    CREATE INDEX idx_contactos_nombre ON contactos(nombre);
    CREATE INDEX idx_contactos_apellido ON contactos(apellido);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Función para crear la tabla de estado de migración
CREATE OR REPLACE FUNCTION create_migration_table()
RETURNS void AS $$
BEGIN
  -- Verificar si la tabla migration_state existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'migration_state') THEN
    -- Crear la tabla migration_state
    CREATE TABLE migration_state (
      id TEXT PRIMARY KEY,
      last_processed_id INTEGER DEFAULT 0,
      completed BOOLEAN DEFAULT FALSE,
      total_records INTEGER DEFAULT 0,
      processed_records INTEGER DEFAULT 0,
      last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END;
$$ LANGUAGE plpgsql;
