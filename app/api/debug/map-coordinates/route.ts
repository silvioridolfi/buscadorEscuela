import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cue = searchParams.get("cue")

  if (!cue) {
    return NextResponse.json({ error: "Se requiere un CUE" }, { status: 400 })
  }

  try {
    // Convertir CUE a número
    const cueNumber = Number.parseInt(cue, 10)
    if (isNaN(cueNumber)) {
      return NextResponse.json({ error: "CUE inválido" }, { status: 400 })
    }

    // Obtener la escuela de Supabase
    const { data: school, error } = await supabaseAdmin
      .from("establecimientos")
      .select("*")
      .eq("cue", cueNumber)
      .single()

    if (error) {
      throw error
    }

    if (!school) {
      return NextResponse.json({ error: "Escuela no encontrada" }, { status: 404 })
    }

    // Información de coordenadas
    const coordInfo = {
      cue: school.cue,
      nombre: school.nombre,
      lat: {
        raw: school.lat,
        type: typeof school.lat,
        isNull: school.lat === null,
        asString: school.lat !== null ? String(school.lat) : null,
        asFloat: school.lat !== null ? Number.parseFloat(String(school.lat)) : null,
      },
      lon: {
        raw: school.lon,
        type: typeof school.lon,
        isNull: school.lon === null,
        asString: school.lon !== null ? String(school.lon) : null,
        asFloat: school.lon !== null ? Number.parseFloat(String(school.lon)) : null,
      },
      googleMapsUrl:
        school.lat !== null && school.lon !== null ? `https://www.google.com/maps?q=${school.lat},${school.lon}` : null,
    }

    return NextResponse.json(coordInfo)
  } catch (error) {
    console.error("Error en debug de coordenadas:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
