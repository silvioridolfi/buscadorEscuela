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

    // Obtener el estado actual de la migración
    const { data: migrationData, error: migrationError } = await supabaseAdmin
      .from("migration_state")
      .select("*")
      .eq("id", "current")
      .single()

    if (migrationError) {
      return NextResponse.json(
        {
          success: false,
          error: `Error al obtener el estado de migración: ${migrationError.message}`,
        },
        { status: 500 },
      )
    }

    // Si la migración ya está completada, informar
    if (migrationData.completed) {
      return NextResponse.json({
        success: true,
        message: "La migración ya está marcada como completada.",
        alreadyCompleted: true,
      })
    }

    // Actualizar el estado para asegurar que no esté marcada como completada
    const { error: updateError } = await supabaseAdmin
      .from("migration_state")
      .update({
        completed: false,
        last_updated: new Date().toISOString(),
      })
      .eq("id", "current")

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: `Error al actualizar el estado de migración: ${updateError.message}`,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Estado de migración actualizado. Utiliza el panel de migración para continuar el proceso.",
      migrationState: {
        lastProcessedId: migrationData.last_processed_id,
        completed: false,
        totalRecords: migrationData.total_records,
        processedRecords: migrationData.processed_records,
      },
    })
  } catch (error) {
    console.error("Error en la API de continuación de migración:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
