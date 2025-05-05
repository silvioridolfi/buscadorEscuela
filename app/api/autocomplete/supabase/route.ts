import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { normalizeString } from "@/lib/api-utils"

// Cache para sugerencias de autocompletado
const autocompleteCache: Record<string, string[]> = {}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query") || ""

  if (!query || query.length < 2) {
    return NextResponse.json([])
  }

  // Verificar caché primero
  const cacheKey = normalizeString(query)
  if (autocompleteCache[cacheKey]) {
    return NextResponse.json(autocompleteCache[cacheKey])
  }

  try {
    // Normalizar la consulta
    const normalizedQuery = normalizeString(query)

    // Obtener nombres de establecimientos que coincidan
    const { data: schoolsData, error: schoolsError } = await supabaseAdmin
      .from("establecimientos")
      .select("nombre")
      .ilike("nombre", `%${normalizedQuery}%`)
      .limit(5)

    if (schoolsError) throw schoolsError

    // Obtener distritos únicos que coincidan
    const { data: districtsData, error: districtsError } = await supabaseAdmin
      .from("establecimientos")
      .select("distrito")
      .ilike("distrito", `%${normalizedQuery}%`)
      .limit(3)

    if (districtsError) throw districtsError

    // Extraer nombres de establecimientos
    const matchingSchools = schoolsData.filter((school) => school.nombre).map((school) => school.nombre)

    // Extraer y formatear distritos únicos
    const districts = [...new Set(districtsData.map((item) => item.distrito).filter(Boolean))]
    const matchingDistricts = districts.map((district) => `Distrito: ${district}`)

    // Verificar si la consulta coincide con algún nivel educativo
    const educationLevels = [
      { key: "primaria", label: "Nivel: Primaria" },
      { key: "secundaria", label: "Nivel: Secundaria" },
      { key: "inicial", label: "Nivel: Inicial" },
      { key: "tecnica", label: "Nivel: Técnica" },
      { key: "especial", label: "Nivel: Especial" },
      { key: "adultos", label: "Nivel: Adultos" },
    ]

    const matchingLevels = educationLevels
      .filter((level) => level.key.includes(normalizedQuery))
      .map((level) => level.label)
      .slice(0, 2)

    // Combinar todas las sugerencias
    const suggestions = [...matchingSchools, ...matchingDistricts, ...matchingLevels].slice(0, 10)

    // Guardar en caché
    autocompleteCache[cacheKey] = suggestions

    // Limpiar caché si es demasiado grande
    if (Object.keys(autocompleteCache).length > 1000) {
      const oldestKeys = Object.keys(autocompleteCache).slice(0, 500)
      oldestKeys.forEach((key) => delete autocompleteCache[key])
    }

    return NextResponse.json(suggestions)
  } catch (error) {
    console.error("Error en la ruta de API de autocompletado:", error)
    return NextResponse.json([])
  }
}
