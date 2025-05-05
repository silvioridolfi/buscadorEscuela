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

      // Obtener todos los campos adicionales disponibles
      const additionalFields: Record<string, any> = {}

      // Agregar todos los campos de la escuela que no son estándar
      Object.keys(school).forEach((key) => {
        if (!["id", "cue", "nombre", "distrito", "ciudad", "direccion", "lat", "lon", "contactos"].includes(key)) {
          additionalFields[key.toUpperCase()] = school[key]
        }
      })

      // Convertir el formato de la base de datos al formato esperado por el frontend
      return {
        CUE: school.cue.toString(),
        PREDIO: school.predio || "",
        ESTABLECIMIENTO: school.nombre || "",
        FED_A_CARGO: school.fed_a_cargo || "",
        DISTRITO: school.distrito || "",
        CIUDAD: school.ciudad || "",
        DIRECCION: school.direccion || "",
        PLAN_ENLACE: school.plan_enlace || "",
        SUBPLAN_ENLACE: school.subplan_enlace || "",
        FECHA_INICIO_CONECTIVIDAD: school.fecha_inicio_conectividad || "",
        PROVEEDOR_INTERNET_PNCE: school.proveedor_internet_pnce || "",
        FECHA_INSTALACION_PNCE: school.fecha_instalacion_pnce || "",
        PNCE_TIPO_MEJORA: school.pnce_tipo_mejora || "",
        PNCE_FECHA_MEJORA: school.pnce_fecha_mejora || "",
        PNCE_ESTADO: school.pnce_estado || "",
        PBA_GRUPO_1_PROVEEDOR_INTERNET: school.pba_grupo_1_proveedor_internet || "",
        PBA_GRUPO_1_FECHA_INSTALACION: school.pba_grupo_1_fecha_instalacion || "",
        PBA_GRUPO_1_ESTADO: school.pba_grupo_1_estado || "",
        PBA_2019_PROVEEDOR_INTERNET: school.pba_2019_proveedor_internet || "",
        PBA_2019_FECHA_INSTALACION: school.pba_2019_fecha_instalacion || "",
        PBA_2019_ESTADO: school.pba_2019_estado || "",
        PBA_GRUPO_2_A_PROVEEDOR_INTERNET: school.pba_grupo_2_a_proveedor_internet || "",
        PBA_GRUPO_2_A_FECHA_INSTALACION: school.pba_grupo_2_a_fecha_instalacion || "",
        PBA_GRUPO_2_A_TIPO_MEJORA: school.pba_grupo_2_a_tipo_mejora || "",
        PBA_GRUPO_2_A_FECHA_MEJORA: school.pba_grupo_2_a_fecha_mejora || "",
        PBA_GRUPO_2_A_ESTADO: school.pba_grupo_2_a_estado || "",
        PLAN_PISO_TECNOLOGICO: school.plan_piso_tecnologico || "",
        PROVEEDOR_PISO_TECNOLOGICO_CUE: school.proveedor_piso_tecnologico_cue || "",
        FECHA_TERMINADO_PISO_TECNOLOGICO_CUE: school.fecha_terminado_piso_tecnologico_cue || "",
        TIPO_MEJORA: school.tipo_mejora || "",
        FECHA_MEJORA: school.fecha_mejora || "",
        TIPO_PISO_INSTALADO: school.tipo_piso_instalado || "",
        TIPO: school.tipo || "",
        OBSERVACIONES: school.observaciones || "",
        TIPO_ESTABLECIMIENTO: school.tipo_establecimiento || "",
        LISTADO_CONEXION_INTERNET: school.listado_conexion_internet || "",
        ESTADO_INSTALACION_PBA: school.estado_instalacion_pba || "",
        PROVEEDOR_ASIGNADO_PBA: school.proveedor_asignado_pba || "",
        MB: school.mb || "",
        AMBITO: school.ambito || "",
        CUE_ANTERIOR: school.cue_anterior || "",
        RECLAMOS_GRUPO_1_ANI: school.reclamos_grupo_1_ani || "",
        RECURSO_PRIMARIO: school.recurso_primario || "",
        ACCESS_ID: school.access_id || "",
        LAT: latString,
        LON: lonString,
        NOMBRE: contact.nombre || "",
        APELLIDO: contact.apellido || "",
        CARGO: contact.cargo || "",
        TELEFONO: contact.telefono || "",
        CORREO_INSTITUCIONAL: contact.correo || "",

        // Incluir campos adicionales
        ...additionalFields,
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
