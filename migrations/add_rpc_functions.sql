-- Función para obtener las columnas de una tabla
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS text[] AS $$
DECLARE
    columns text[];
BEGIN
    SELECT array_agg(column_name::text) INTO columns
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1;
    
    RETURN columns;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para agregar una columna si no existe
CREATE OR REPLACE FUNCTION alter_table_add_column_if_not_exists(
  table_name text,
  column_name text,
  column_type text
) RETURNS void AS $$
BEGIN
  EXECUTE format(
    'ALTER TABLE %I ADD COLUMN IF NOT EXISTS %I %s',
    table_name,
    column_name,
    column_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para ejecutar SQL dinámico
CREATE OR REPLACE FUNCTION execute_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
