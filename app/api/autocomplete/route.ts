import { NextResponse } from "next/server"
import { getSheetData, normalizeString } from "@/lib/api-utils"

// Cache for autocomplete suggestions
const autocompleteCache: Record<string, string[]> = {}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query") || ""

  if (!query || query.length < 2) {
    return NextResponse.json([])
  }

  // Check cache first
  const cacheKey = normalizeString(query)
  if (autocompleteCache[cacheKey]) {
    return NextResponse.json(autocompleteCache[cacheKey])
  }

  try {
    const { establishmentsData } = await getSheetData()

    if (!Array.isArray(establishmentsData) || establishmentsData.length === 0) {
      return NextResponse.json([])
    }

    // Add safety check for normalizedQuery
    const normalizedQuery = normalizeString(query)

    // Get unique districts for filtering
    const districts = [...new Set(establishmentsData.map((school) => school.DISTRITO).filter(Boolean))].sort()

    // Get matching school names
    const matchingSchools = establishmentsData
      .filter((school) => {
        const schoolName = normalizeString(school.ESTABLECIMIENTO || "")
        return schoolName.includes(normalizedQuery)
      })
      .map((school) => school.ESTABLECIMIENTO)
      .slice(0, 5) // Limit to 5 school suggestions

    // Get matching districts
    const matchingDistricts = districts
      .filter((district) => {
        const districtName = normalizeString(district || "")
        return districtName.includes(normalizedQuery)
      })
      .map((district) => `Distrito: ${district}`)
      .slice(0, 3) // Limit to 3 district suggestions

    // Get education level suggestions if query matches any level
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
      .slice(0, 2) // Limit to 2 level suggestions

    // Combine all suggestions
    const suggestions = [...matchingSchools, ...matchingDistricts, ...matchingLevels].slice(0, 10) // Limit total suggestions

    // Cache the results
    autocompleteCache[cacheKey] = suggestions

    // Trim cache if it gets too large
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
