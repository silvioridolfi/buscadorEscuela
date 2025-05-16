-- Función para añadir columnas de timestamp si no existen
CREATE OR REPLACE FUNCTION add_timestamp_columns()
RETURNS void AS $$
BEGIN
  -- Verificar si la columna created_at existe en establecimientos
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'establecimientos' AND column_name = 'created_at'
  ) THEN
    -- Añadir columna created_at
    ALTER TABLE establecimientos ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Verificar si la columna updated_at existe en establecimientos
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'establecimientos' AND column_name = 'updated_at'
  ) THEN
    -- Añadir columna updated_at
    ALTER TABLE establecimientos ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Verificar si la columna created_at existe en contactos
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contactos' AND column_name = 'created_at'
  ) THEN
    -- Añadir columna created_at
    ALTER TABLE contactos ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Verificar si la columna updated_at existe en contactos
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contactos' AND column_name = 'updated_at'
  ) THEN
    -- Añadir columna updated_at
    ALTER TABLE contactos ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END;
$$ LANGUAGE plpgsql;
