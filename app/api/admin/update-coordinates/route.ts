import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { verifyAdminAuth } from "@/lib/auth-utils"

export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const { searchParams } = new URL(request.url)
    const authKey = searchParams.get("key")

    if (!verifyAdminAuth(authKey)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener datos del cuerpo
    const { cue, lat, lon } = await request.json()

    // Validaciones básicas
    if (!cue) {
      return NextResponse.json({ error: "Se requiere el CUE" }, { status: 400 })
    }

    if (lat === undefined || lon === undefined) {
      return NextResponse.json({ error: "Se requieren las coordenadas lat y lon" }, { status: 400 })
    }

    // Convertir CUE a número
    const cueNumber = Number.parseInt(cue, 10)
    if (isNaN(cueNumber)) {
      return NextResponse.json({ error: "CUE inválido" }, { status: 400 })
    }

    // Convertir coordenadas a números
    const latNumber = Number.parseFloat(String(lat))
    const lonNumber = Number.parseFloat(String(lon))

    if (isNaN(latNumber) || isNaN(lonNumber)) {
      return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 })
    }

    // Validar rango de coordenadas
    if (latNumber < -90 || latNumber > 90 || lonNumber < -180 || lonNumber > 180) {
      return NextResponse.json({ error: "Coordenadas fuera de rango" }, { status: 400 })
    }

    // Actualizar en la base de datos
    const { data, error } = await supabaseAdmin
      .from("establecimientos")
      .update({ lat: latNumber, lon: lonNumber })
      .eq("cue", cueNumber)
      .select()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: "Coordenadas actualizadas correctamente",
      data,
    })
  } catch (error) {
    console.error("Error al actualizar coordenadas:", error)
    return NextResponse.json(
      {
        error: "Error al actualizar coordenadas",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
