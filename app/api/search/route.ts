import { NextResponse } from "next/server"
import {
  getSheetData,
  normalizeString,
  removeCommonWords,
  getPhoneticCode,
  extractEducationLevel,
  extractSchoolNumber,
} from "@/lib/api-utils"

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query") || ""
  const filter = searchParams.get("filter") || ""
  const district = searchParams.get("district") || ""
  const level = searchParams.get("level") || ""

  if (!query && !filter && !district && !level) {
    return NextResponse.json({ error: "Se requiere al menos un criterio de búsqueda" }, { status: 400 })
  }

  try {
    const { establishmentsData, contactsData } = await getSheetData()

    if (!Array.isArray(establishmentsData) || establishmentsData.length === 0) {
      return NextResponse.json([])
    }

    // Check if query is an exact phrase search (enclosed in quotes)
    const exactPhraseMatch = query ? query.match(/^"(.+)"$/) : null
    const exactPhrase = exactPhraseMatch ? exactPhraseMatch[1] : null

    // Normalize and prepare search terms
    const normalizedQuery = normalizeString(query)
    const cleanedQuery = removeCommonWords(normalizedQuery)
    const phoneticQuery = getPhoneticCode(cleanedQuery)

    // Split into search terms, but keep exact phrase as one term if present
    let searchTerms: string[] = []
    if (exactPhrase) {
      searchTerms = [normalizeString(exactPhrase)]
    } else {
      searchTerms = normalizedQuery.split(/\s+|\+/).filter(Boolean)
    }

    // Check if the query looks like a specific school name with a number
    const schoolNameWithNumberRegex = /^(.*?)\s+(\d+)$/i
    const schoolNameMatch = normalizedQuery ? normalizedQuery.match(schoolNameWithNumberRegex) : null

    // Extract school number if present in the query
    const querySchoolNumber = schoolNameMatch ? schoolNameMatch[2] : null

    // Apply filters
    let filteredSchools = establishmentsData

    // Filter by district if specified
    if (district) {
      filteredSchools = filteredSchools.filter((school) =>
        normalizeString(school.DISTRITO || "").includes(normalizeString(district)),
      )
    }

    // Filter by education level if specified
    if (level) {
      filteredSchools = filteredSchools.filter((school) => {
        const schoolLevel = extractEducationLevel(school.ESTABLECIMIENTO)
        return schoolLevel === normalizeString(level)
      })
    }

    // Pre-filter by school number if present in query
    if (querySchoolNumber) {
      filteredSchools = filteredSchools.filter((school) => {
        const schoolNumber = extractSchoolNumber(school.ESTABLECIMIENTO)
        return schoolNumber === querySchoolNumber
      })
    }

    // Calculate relevance scores and filter
    const results = filteredSchools
      .map((school) => {
        const normalizedName = normalizeString(school.ESTABLECIMIENTO)
        const cleanedName = removeCommonWords(normalizedName)
        const phoneticName = getPhoneticCode(cleanedName)
        const schoolNumber = extractSchoolNumber(school.ESTABLECIMIENTO)

        // Initialize score and match reasons
        let score = 0
        const matchReasons: string[] = []

        // 1. Exact CUE match (highest priority)
        if (normalizedQuery && school.CUE) {
          const schoolCue = typeof school.CUE === "string" ? school.CUE.trim() : school.CUE.toString()
          if (schoolCue === normalizedQuery.trim()) {
            score += 1000
            matchReasons.push("Coincidencia exacta de CUE")
          }
        }

        // 2. Exact name match
        if (normalizedName === normalizedQuery) {
          score += 900
          matchReasons.push("Coincidencia exacta de nombre")
        }

        // 3. Exact phrase match
        if (exactPhrase && normalizedName.includes(normalizeString(exactPhrase))) {
          score += 800
          matchReasons.push("Coincidencia exacta de frase")
        }

        // 4. School name + number specific match
        if (schoolNameMatch) {
          const [, schoolType, schoolNumber] = schoolNameMatch
          const schoolPattern = new RegExp(`${schoolType}\\s+(?:n|n°|nro|numero|número)?\\s*${schoolNumber}\\b`, "i")
          if (schoolPattern.test(normalizedName)) {
            score += 700
            matchReasons.push("Coincidencia de tipo de escuela y número")
          }
        }

        // 5. All search terms present (in any order)
        const allTermsPresent = searchTerms.every((term) => normalizedName.includes(term))
        if (allTermsPresent) {
          score += 600
          matchReasons.push("Todas las palabras clave presentes")
        }

        // Return the school with its score if it's relevant
        return {
          school,
          score,
          matchReasons,
        }
      })
      .filter((result) => result.score > 0) // Only include relevant results
      .sort((a, b) => b.score - a.score) // Sort by score (highest first)
      .map((result) => {
        const contact = contactsData.find((c) => c.CUE === result.school.CUE) || {}

        // Extract education level and school number for filtering/display
        const educationLevel = extractEducationLevel(result.school.ESTABLECIMIENTO)
        const schoolNumber = extractSchoolNumber(result.school.ESTABLECIMIENTO)

        return {
          CUE: result.school.CUE,
          PREDIO: result.school.PREDIO,
          ESTABLECIMIENTO: result.school.ESTABLECIMIENTO,
          FED_A_CARGO: result.school["FED A CARGO"],
          DISTRITO: result.school.DISTRITO,
          CIUDAD: result.school.CIUDAD,
          DIRECCION: result.school["DIRECCIÓN"],
          PLAN_ENLACE: result.school["PLAN ENLACE"],
          SUBPLAN_ENLACE: result.school["SUBPLAN ENLACE"],
          FECHA_INICIO_CONECTIVIDAD: result.school["FECHA INICIO CONECTIVIDAD"],
          PROVEEDOR_INTERNET_PNCE: result.school["Proveedor INTERNET PNCE"],
          FECHA_INSTALACION_PNCE: result.school["Fecha Instalación PNCE"],
          PNCE_TIPO_MEJORA: result.school["PNCE Tipo de mejora"],
          PNCE_FECHA_MEJORA: result.school["PNCE Fecha de mejora"],
          PNCE_ESTADO: result.school["PNCE Estado"],
          PBA_GRUPO_1_PROVEEDOR_INTERNET: result.school["PBA - GRUPO 1 Proveedor INTERNET"],
          PBA_GRUPO_1_FECHA_INSTALACION: result.school["PBA - GRUPO 1 Fecha instalación"],
          PBA_GRUPO_1_ESTADO: result.school["PBA - GRUPO 1 Estado"],
          PBA_2019_PROVEEDOR_INTERNET: result.school["PBA 2019 Proveedor INTERNET"],
          PBA_2019_FECHA_INSTALACION: result.school["PBA 2019 Fecha instalación"],
          PBA_2019_ESTADO: result.school["PBA 2019 Estado"],
          PBA_GRUPO_2_A_PROVEEDOR_INTERNET: result.school["PBA - GRUPO 2 - A Proveedor INTERNET"],
          PBA_GRUPO_2_A_FECHA_INSTALACION: result.school["PBA - GRUPO 2 - A Fecha instalación"],
          PBA_GRUPO_2_A_TIPO_MEJORA: result.school["PBA - GRUPO 2 - A Tipo de mejora"],
          PBA_GRUPO_2_A_FECHA_MEJORA: result.school["PBA - GRUPO 2 - A Fecha de mejora"],
          PBA_GRUPO_2_A_ESTADO: result.school["PBA - GRUPO 2 - A Estado"],
          PLAN_PISO_TECNOLOGICO: result.school["PLAN PISO TECNOLÓGICO"],
          PROVEEDOR_PISO_TECNOLOGICO_CUE: result.school["Proveedor PISO TECNOLÓGICO CUE"],
          FECHA_TERMINADO_PISO_TECNOLOGICO_CUE: result.school["Fecha terminado PISO TECNOLÓGICO CUE"],
          TIPO_MEJORA: result.school["Tipo de mejora"],
          FECHA_MEJORA: result.school["Fecha de mejora"],
          TIPO_PISO_INSTALADO: result.school["Tipo de Piso instalado"],
          TIPO: result.school["Tipo"],
          OBSERVACIONES: result.school["Observaciones"],
          TIPO_ESTABLECIMIENTO: result.school["Tipo de establecimiento"],
          LISTADO_CONEXION_INTERNET: result.school["Listado por el que se conecta internet"],
          ESTADO_INSTALACION_PBA: result.school["Estado de instalacion PBA"],
          PROVEEDOR_ASIGNADO_PBA: result.school["Proveedor asignado PBA"],
          MB: result.school["MB"],
          AMBITO: result.school["Ambito"],
          CUE_ANTERIOR: result.school["CUE ANTERIOR"],
          RECLAMOS_GRUPO_1_ANI: result.school["RECLAMOS GRUPO 1 ANI"],
          RECURSO_PRIMARIO: result.school["RECURSO PRIMARIO"],
          ACCESS_ID: result.school["Access ID"],
          LAT: result.school["Lat"],
          LON: result.school["Lon"],
          NOMBRE: contact["NOMBRE"],
          APELLIDO: contact["APELLIDO"],
          CARGO: contact["CARGO"],
          TELEFONO: contact["TELÉFONO"],
          CORREO_INSTITUCIONAL: contact["CORREO INSTITUCIONAL"],
          // Additional metadata for UI
          _relevanceScore: result.score,
          _matchReasons: result.matchReasons,
          _educationLevel: educationLevel,
          _schoolNumber: schoolNumber,
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
    return NextResponse.json({ error: "Error interno del servidor. Por favor, intente más tarde." }, { status: 500 })
  }
}
