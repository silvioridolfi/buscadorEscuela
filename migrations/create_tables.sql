-- Función para crear la tabla de estados de migración
CREATE OR REPLACE FUNCTION create_migration_table()
RETURNS void AS $$
BEGIN
  -- Crear la tabla si no existe
  CREATE TABLE IF NOT EXISTS migration_state (
    id TEXT PRIMARY KEY,
    last_processed_id INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    total_records INTEGER NOT NULL DEFAULT 0,
    processed_records INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );
  
  -- Insertar un registro inicial si la tabla está vacía
  INSERT INTO migration_state (id, last_processed_id, completed, total_records, processed_records)
  SELECT 'current', 0, FALSE, 0, 0
  WHERE NOT EXISTS (SELECT 1 FROM migration_state WHERE id = 'current');
END;
$$ LANGUAGE plpgsql;

-- Función para crear las tablas principales
CREATE OR REPLACE FUNCTION create_necessary_tables()
RETURNS void AS $$
BEGIN
  -- Crear tabla de establecimientos si no existe
  CREATE TABLE IF NOT EXISTS establecimientos (
    id UUID PRIMARY KEY,
    cue INTEGER,
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
  
  -- Crear índice en CUE para búsquedas rápidas
  CREATE INDEX IF NOT EXISTS idx_establecimientos_cue ON establecimientos(cue);
  CREATE INDEX IF NOT EXISTS idx_establecimientos_nombre ON establecimientos(nombre);
  CREATE INDEX IF NOT EXISTS idx_establecimientos_predio ON establecimientos(predio);
  
  -- Crear tabla de contactos si no existe
  CREATE TABLE IF NOT EXISTS contactos (
    id UUID PRIMARY KEY,
    cue INTEGER,
    nombre TEXT,
    apellido TEXT,
    correo TEXT,
    telefono TEXT,
    cargo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Crear índice en CUE para búsquedas rápidas
  CREATE INDEX IF NOT EXISTS idx_contactos_cue ON contactos(cue);
  
  -- También creamos la tabla de migración si no existe
  PERFORM create_migration_table();
END;
$$ LANGUAGE plpgsql;
