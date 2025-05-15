import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { normalizeString } from "@/lib/api-utils"

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query") || ""

  console.log(`API búsqueda: Consulta original: "${query}"`)

  try {
    // Consulta extremadamente simple para probar la conexión
    let supabaseQuery = supabaseAdmin.from("establecimientos").select(`
        *,
        contactos (*)
      `)

    // Si hay una consulta, aplicar un filtro simple
    if (query) {
      const normalizedQuery = normalizeString(query)
      console.log(`API búsqueda: Consulta normalizada: "${normalizedQuery}"`)

      // Consulta simple por nombre o CUE
      if (/^\d+$/.test(query)) {
        // Si es solo números, buscar por CUE
        const cueNumber = Number.parseInt(query, 10)
        supabaseQuery = supabaseQuery.or(`cue.eq.${cueNumber},nombre.ilike.%${query}%`)
        console.log(`API búsqueda: Buscando por CUE o número en nombre: ${query}`)
      } else {
        // Búsqueda general por texto en el nombre
        supabaseQuery = supabaseQuery.ilike("nombre", `%${normalizedQuery}%`)
        console.log(`API búsqueda: Buscando texto en nombre: "${normalizedQuery}"`)
      }
    } else {
      // Si no hay consulta, devolver algunos resultados para verificar
      supabaseQuery = supabaseQuery.limit(10)
      console.log("API búsqueda: Sin consulta, devolviendo primeros 10 resultados")
    }

    // Ejecutar la consulta
    const { data: schools, error, count } = await supabaseQuery.limit(100)

    if (error) {
      console.error("Error en la consulta a Supabase:", error)
      return NextResponse.json(
        {
          error: "Error al consultar la base de datos",
          details: error.message,
          query: query,
        },
        { status: 500 },
      )
    }

    console.log(`API búsqueda: Recuperadas ${schools?.length || 0} escuelas.`)

    // Si no hay resultados, devolver un array vacío
    if (!schools || schools.length === 0) {
      console.log("API búsqueda: No se encontraron resultados.")
      return NextResponse.json([])
    }

    // Transformar los resultados al formato esperado por el frontend
    const results = schools.map((school) => {
      const contact = school.contactos?.[0] || {}

      // Convertir coordenadas a string de manera segura
      let latString = ""
      let lonString = ""

      if (school.lat !== null && school.lat !== undefined) {
        latString = String(school.lat)
      }

      if (school.lon !== null && school.lon !== undefined) {
        lonString = String(school.lon)
      }

      // Convertir el formato de la base de datos al formato esperado por el frontend
      return {
        CUE: school.cue ? school.cue.toString() : "",
        PREDIO: school.predio || "",
        ESTABLECIMIENTO: school.nombre || "",
        FED_A_CARGO: school.fed_a_cargo || "",
        DISTRITO: school.distrito || "",
        CIUDAD: school.ciudad || "",
        DIRECCION: school.direccion || "",
        LAT: latString,
        LON: lonString,
        NOMBRE: contact.nombre || "",
        APELLIDO: contact.apellido || "",
        CARGO: contact.cargo || "",
        TELEFONO: contact.telefono || "",
        CORREO_INSTITUCIONAL: contact.correo || "",
        // Incluir todos los demás campos
        ...Object.keys(school)
          .filter(
            (key) =>
              !["id", "cue", "nombre", "distrito", "ciudad", "direccion", "lat", "lon", "contactos"].includes(key),
          )
          .reduce((obj, key) => {
            obj[key.toUpperCase()] = school[key] || ""
            return obj
          }, {}),
      }
    })

    // Set cache control headers to prevent caching
    const headers = new Headers()
    headers.set("Cache-Control", "no-store, max-age=0")
    headers.set("Pragma", "no-cache")
    headers.set("Expires", "0")

    return NextResponse.json(results, { headers })
  } catch (error) {
    console.error("Error en la ruta de API:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error.message,
        stack: error.stack,
        query: query,
      },
      { status: 500 },
    )
  }
}
