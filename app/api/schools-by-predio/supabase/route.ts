import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const predio = searchParams.get("predio")

  if (!predio) {
    return NextResponse.json({ error: "Se requiere un número de PREDIO" }, { status: 400 })
  }

  try {
    console.log(`API Predio: Buscando escuelas con PREDIO: "${predio}"`)

    // Consultar escuelas que tengan el mismo predio
    const { data: schools, error } = await supabaseAdmin
      .from("establecimientos")
      .select(`
        *,
        contactos (*)
      `)
      .eq("predio", predio.trim())

    if (error) {
      throw error
    }

    console.log(`API Predio: Encontradas ${schools?.length || 0} escuelas con PREDIO ${predio}`)

    // Transformar los resultados al formato esperado por el frontend
    const formattedSchools = schools.map((school) => {
      const contact = school.contactos?.[0] || {}

      return {
        CUE: school.cue.toString(),
        PREDIO: school.predio || "",
        ESTABLECIMIENTO: school.nombre || "",
        FED_A_CARGO: school.fed_a_cargo || "",
        DISTRITO: school.distrito || "",
        CIUDAD: school.ciudad || "",
        DIRECCION: school.direccion || "",
        // Incluir todos los demás campos necesarios...
        LAT: school.lat ? String(school.lat) : "",
        LON: school.lon ? String(school.lon) : "",
        NOMBRE: contact.nombre || "",
        APELLIDO: contact.apellido || "",
        CARGO: contact.cargo || "",
        TELEFONO: contact.telefono || "",
        CORREO_INSTITUCIONAL: contact.correo || "",
      }
    })

    // Set cache control headers to prevent caching
    const headers = new Headers()
    headers.set("Cache-Control", "no-store, max-age=0")
    headers.set("Pragma", "no-cache")
    headers.set("Expires", "0")

    // Return the formatted schools
    return NextResponse.json(
      {
        schools: formattedSchools,
        debug: {
          requestedPredio: predio,
          foundCount: formattedSchools.length,
          foundCUEs: formattedSchools.map((school) => school.CUE),
          timestamp: new Date().toISOString(),
        },
      },
      { headers },
    )
  } catch (error) {
    console.error("Error en la ruta de API:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor. Por favor, intente más tarde.",
        debug: { message: error.message, stack: error.stack },
      },
      { status: 500 },
    )
  }
}
