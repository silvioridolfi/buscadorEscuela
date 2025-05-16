import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { verifyAdminAuth } from "@/lib/auth-utils"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

export async function POST(request: Request) {
  try {
    // Obtener datos de la solicitud
    const requestData = await request.json()
    const { authKey } = requestData

    // Verificar autenticación
    const isAuthenticated = verifyAdminAuth(authKey)

    if (!isAuthenticated) {
      return NextResponse.json(
        {
          success: false,
          error: "No autorizado: Clave de autenticación inválida",
        },
        { status: 401 },
      )
    }

    // Obtener el estado de la migración
    let migrationState = null
    try {
      const { data: migrationData, error: migrationError } = await supabaseAdmin
        .from("migration_state")
        .select("*")
        .eq("id", "current")
        .single()

      if (migrationError) {
        console.error("Error al obtener el estado de migración:", migrationError)
      } else {
        migrationState = {
          lastProcessedId: migrationData.last_processed_id,
          completed: migrationData.completed,
          totalRecords: migrationData.total_records,
          processedRecords: migrationData.processed_records,
          lastUpdated: migrationData.last_updated,
        }
      }
    } catch (error) {
      console.error("Error al consultar el estado de migración:", error)
    }

    // Contar registros en las tablas
    let establecimientosCount = 0
    let contactosCount = 0

    try {
      const { count: estCount, error: estError } = await supabaseAdmin
        .from("establecimientos")
        .select("*", { count: "exact", head: true })

      if (estError) {
        console.error("Error al contar establecimientos:", estError)
      } else {
        establecimientosCount = estCount || 0
      }
    } catch (error) {
      console.error("Error al contar establecimientos:", error)
    }

    try {
      const { count: contCount, error: contError } = await supabaseAdmin
        .from("contactos")
        .select("*", { count: "exact", head: true })

      if (contError) {
        console.error("Error al contar contactos:", contError)
      } else {
        contactosCount = contCount || 0
      }
    } catch (error) {
      console.error("Error al contar contactos:", error)
    }

    return NextResponse.json({
      success: true,
      migrationState,
      recordCounts: {
        establecimientos: establecimientosCount,
        contactos: contactosCount,
      },
    })
  } catch (error) {
    console.error("Error en la API de verificación de migración:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
