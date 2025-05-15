import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { verifyAdminAuth } from "@/lib/auth-utils"
import { bypassAdminAuth, getBypassToken } from "@/lib/admin-bypass"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

export async function POST(request: Request) {
  try {
    // Obtener datos de la solicitud
    const requestData = await request.json()
    const { authKey } = requestData

    // BYPASS TEMPORAL: Verificar si estamos usando el bypass
    const bypassEnabled = bypassAdminAuth()
    const bypassToken = getBypassToken()

    // Verificar autenticación usando la función de auth-utils o el bypass
    const isAuthenticated = bypassEnabled
      ? authKey === bypassToken || authKey === process.env.MIGRATION_AUTH_KEY
      : verifyAdminAuth(authKey)

    if (!isAuthenticated) {
      return NextResponse.json(
        {
          success: false,
          error: "No autorizado: Clave de autenticación inválida",
        },
        { status: 401 },
      )
    }

    // Ejecutar la migración SQL para añadir las columnas de timestamp
    const createFunctionSQL = `
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
    `

    // Ejecutar SQL para crear la función
    const { error: createFunctionError } = await supabaseAdmin.rpc("query", { query: createFunctionSQL })

    if (createFunctionError) {
      console.error("Error al crear la función:", createFunctionError)
      return NextResponse.json(
        {
          success: false,
          error: `Error al crear la función: ${createFunctionError.message}`,
        },
        { status: 500 },
      )
    }

    // Ejecutar la función para añadir las columnas
    const { error: executeFunctionError } = await supabaseAdmin.rpc("add_timestamp_columns")

    if (executeFunctionError) {
      console.error("Error al ejecutar la función:", executeFunctionError)
      return NextResponse.json(
        {
          success: false,
          error: `Error al ejecutar la función: ${executeFunctionError.message}`,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Migración SQL ejecutada correctamente. Columnas de timestamp añadidas.",
    })
  } catch (error) {
    console.error("Error en la API de ejecución de migración:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
