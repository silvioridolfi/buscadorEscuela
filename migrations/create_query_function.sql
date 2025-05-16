-- Función para ejecutar consultas SQL dinámicas
CREATE OR REPLACE FUNCTION query(sql_query TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    EXECUTE sql_query INTO result;
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
