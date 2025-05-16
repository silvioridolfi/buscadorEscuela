-- Función para obtener las columnas de una tabla
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS TABLE (column_name text) AS $$
BEGIN
  RETURN QUERY
  SELECT column_name::text
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = $1;
END;
$$ LANGUAGE plpgsql;
