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
  const filter = searchParams.get("filter") || ""
  const district = searchParams.get("district") || ""
  const level = searchParams.get("level") || ""

  if (!query && !filter && !district && !level) {
    return NextResponse.json({ error: "Se requiere al menos un criterio de búsqueda" }, { status: 400 })
  }

  try {
    // Construir la consulta base
    let supabaseQuery = supabaseAdmin.from("establecimientos").select(`
        *,
        contactos (*)
      `)

    // Aplicar filtros
    if (query) {
      // Verificar si es una búsqueda por CUE exacto
      if (/^\d+$/.test(query)) {
        const cueNumber = Number.parseInt(query, 10)
        if (!isNaN(cueNumber)) {
          supabaseQuery = supabaseQuery.eq("cue", cueNumber)
        }
      } else {
        // Búsqueda por texto en el nombre del establecimiento
        const normalizedQuery = normalizeString(query)

        // Verificar si la consulta parece ser "secundaria X" o similar
        const schoolTypeNumberMatch = normalizedQuery.match(/^(\w+)\s+(\d+)$/)

        if (schoolTypeNumberMatch) {
          // Si es un patrón como "secundaria 2", buscar de forma más específica
          const [, schoolType, schoolNumber] = schoolTypeNumberMatch

          // Construir patrones para buscar el número exacto
          // Estos patrones buscarán coincidencias como:
          // - "primaria n° 2"
          // - "primaria nro 2"
          // - "primaria numero 2"
          // - "primaria n 2"
          // - "primaria 2"
          // Y evitarán coincidencias como "primaria 12", "primaria 21", etc.

          // Primero, asegurarse de que contiene el tipo de escuela
          supabaseQuery = supabaseQuery.ilike("nombre", `%${schoolType}%`)

          // Luego, buscar patrones específicos para el número exacto
          supabaseQuery = supabaseQuery.or(
            `nombre.ilike.%n° ${schoolNumber} %,` +
              `nombre.ilike.%n° ${schoolNumber}$,` +
              `nombre.ilike.%n°${schoolNumber} %,` +
              `nombre.ilike.%n°${schoolNumber}$,` +
              `nombre.ilike.%nro ${schoolNumber} %,` +
              `nombre.ilike.%nro ${schoolNumber}$,` +
              `nombre.ilike.%nro${schoolNumber} %,` +
              `nombre.ilike.%nro${schoolNumber}$,` +
              `nombre.ilike.%numero ${schoolNumber} %,` +
              `nombre.ilike.%numero ${schoolNumber}$,` +
              `nombre.ilike.%n ${schoolNumber} %,` +
              `nombre.ilike.%n ${schoolNumber}$,` +
              `nombre.ilike.% ${schoolNumber} %,` +
              `nombre.ilike.% ${schoolNumber}$`,
          )
        } else {
          // Búsqueda general por nombre
          supabaseQuery = supabaseQuery.ilike("nombre", `%${normalizedQuery}%`)
        }
      }
    }

    if (district) {
      supabaseQuery = supabaseQuery.ilike("distrito", `%${district}%`)
    }

    if (level) {
      // Filtrar por nivel educativo (primaria, secundaria, etc.)
      if (level === "primaria") {
        supabaseQuery = supabaseQuery.ilike("nombre", "%primaria%")
      } else if (level === "secundaria") {
        supabaseQuery = supabaseQuery.ilike("nombre", "%secundaria%")
      } else if (level === "inicial") {
        supabaseQuery = supabaseQuery.or("nombre.ilike.%inicial%,nombre.ilike.%jardin%")
      } else if (level === "tecnica") {
        supabaseQuery = supabaseQuery.ilike("nombre", "%tecnica%")
      } else if (level === "especial") {
        supabaseQuery = supabaseQuery.ilike("nombre", "%especial%")
      } else if (level === "adultos") {
        supabaseQuery = supabaseQuery.ilike("nombre", "%adultos%")
      }
    }

    // Ejecutar la consulta
    const { data: schools, error } = await supabaseQuery.limit(100)

    if (error) {
      throw error
    }

    // Filtrado adicional para búsquedas de tipo "primaria X"
    let filteredSchools = schools

    const schoolTypeNumberMatch = normalizeString(query).match(/^(\w+)\s+(\d+)$/)
    if (schoolTypeNumberMatch) {
      const [, , schoolNumber] = schoolTypeNumberMatch

      // Filtrar los resultados para asegurarnos de que solo incluimos escuelas con el número exacto
      filteredSchools = schools.filter((school) => {
        const normalizedName = normalizeString(school.nombre || "")

        // Patrones para detectar el número exacto de la escuela
        const exactNumberPatterns = [
          new RegExp(`n° ${schoolNumber}\\b`),
          new RegExp(`n°${schoolNumber}\\b`),
          new RegExp(`nro ${schoolNumber}\\b`),
          new RegExp(`nro${schoolNumber}\\b`),
          new RegExp(`numero ${schoolNumber}\\b`),
          new RegExp(`n ${schoolNumber}\\b`),
          new RegExp(`\\b${schoolNumber}\\b`), // Número solo, pero como palabra completa
        ]

        // Verificar si alguno de los patrones coincide
        return exactNumberPatterns.some((pattern) => pattern.test(normalizedName))
      })
    }

    // Transformar los resultados al formato esperado por el frontend
    const results = filteredSchools.map((school) => {
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

      // Log para depuración
      console.log(`Escuela ${school.nombre} (CUE: ${school.cue}): lat=${latString}, lon=${lonString}`)

      // Convertir el formato de la base de datos al formato esperado por el frontend
      return {
        CUE: school.cue.toString(),
        PREDIO: "", // No existe en la base de datos
        ESTABLECIMIENTO: school.nombre || "",
        FED_A_CARGO: "", // No existe en la base de datos
        DISTRITO: school.distrito || "",
        CIUDAD: school.ciudad || "",
        DIRECCION: school.direccion || "",
        PLAN_ENLACE: "", // No existe en la base de datos
        SUBPLAN_ENLACE: "", // No existe en la base de datos
        FECHA_INICIO_CONECTIVIDAD: "", // No existe en la base de datos
        PROVEEDOR_INTERNET_PNCE: "", // No existe en la base de datos
        FECHA_INSTALACION_PNCE: "", // No existe en la base de datos
        PNCE_TIPO_MEJORA: "", // No existe en la base de datos
        PNCE_FECHA_MEJORA: "", // No existe en la base de datos
        PNCE_ESTADO: "", // No existe en la base de datos
        PBA_GRUPO_1_PROVEEDOR_INTERNET: "", // No existe en la base de datos
        PBA_GRUPO_1_FECHA_INSTALACION: "", // No existe en la base de datos
        PBA_GRUPO_1_ESTADO: "", // No existe en la base de datos
        PBA_2019_PROVEEDOR_INTERNET: "", // No existe en la base de datos
        PBA_2019_FECHA_INSTALACION: "", // No existe en la base de datos
        PBA_2019_ESTADO: "", // No existe en la base de datos
        PBA_GRUPO_2_A_PROVEEDOR_INTERNET: "", // No existe en la base de datos
        PBA_GRUPO_2_A_FECHA_INSTALACION: "", // No existe en la base de datos
        PBA_GRUPO_2_A_TIPO_MEJORA: "", // No existe en la base de datos
        PBA_GRUPO_2_A_FECHA_MEJORA: "", // No existe en la base de datos
        PBA_GRUPO_2_A_ESTADO: "", // No existe en la base de datos
        PLAN_PISO_TECNOLOGICO: "", // No existe en la base de datos
        PROVEEDOR_PISO_TECNOLOGICO_CUE: "", // No existe en la base de datos
        FECHA_TERMINADO_PISO_TECNOLOGICO_CUE: "", // No existe en la base de datos
        TIPO_MEJORA: "", // No existe en la base de datos
        FECHA_MEJORA: "", // No existe en la base de datos
        TIPO_PISO_INSTALADO: "", // No existe en la base de datos
        TIPO: "", // No existe en la base de datos
        OBSERVACIONES: "", // No existe en la base de datos
        TIPO_ESTABLECIMIENTO: "", // No existe en la base de datos
        LISTADO_CONEXION_INTERNET: "", // No existe en la base de datos
        ESTADO_INSTALACION_PBA: "", // No existe en la base de datos
        PROVEEDOR_ASIGNADO_PBA: "", // No existe en la base de datos
        MB: "", // No existe en la base de datos
        AMBITO: "", // No existe en la base de datos
        CUE_ANTERIOR: "", // No existe en la base de datos
        RECLAMOS_GRUPO_1_ANI: "", // No existe en la base de datos
        RECURSO_PRIMARIO: "", // No existe en la base de datos
        ACCESS_ID: "", // No existe en la base de datos
        LAT: latString,
        LON: lonString,
        NOMBRE: contact.nombre || "",
        APELLIDO: contact.apellido || "",
        CARGO: "", // No existe en la base de datos
        TELEFONO: contact.telefono || "",
        CORREO_INSTITUCIONAL: contact.correo || "",
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
