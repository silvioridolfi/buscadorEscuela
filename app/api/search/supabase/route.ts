import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { normalizeString, calculateSimilarity } from "@/lib/api-utils"

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query") || ""

  console.log(`API búsqueda: Consulta original: "${query}"`)

  try {
    // Consulta base para obtener establecimientos y sus contactos
    let supabaseQuery = supabaseAdmin.from("establecimientos").select(`
        *,
        contactos (*)
      `)

    // Si hay una consulta, aplicar filtros avanzados
    if (query) {
      const normalizedQuery = normalizeString(query)
      console.log(`API búsqueda: Consulta normalizada: "${normalizedQuery}"`)

      // Verificar si la consulta es numérica (posible CUE)
      if (/^\d+$/.test(query)) {
        // Si es solo números, buscar por CUE exacto o como texto en otros campos
        const numericQuery = Number.parseInt(query, 10)

        // Para campos numéricos usamos operadores de igualdad o comparación, no ilike
        supabaseQuery = supabaseQuery.or(`cue.eq.${numericQuery},predio.eq.${numericQuery}`)

        console.log(`API búsqueda: Buscando por valor numérico exacto en CUE o predio: ${numericQuery}`)
      } else {
        // Búsqueda avanzada por múltiples campos de texto (no numéricos)
        const searchFields = [
          "nombre",
          "distrito",
          "ciudad",
          "direccion",
          "fed_a_cargo",
          "tipo_establecimiento",
          "observaciones",
        ]

        // Construir una consulta OR para buscar en varios campos de texto
        const searchConditions = searchFields.map((field) => `${field}.ilike.%${normalizedQuery}%`).join(",")

        supabaseQuery = supabaseQuery.or(searchConditions)
        console.log(`API búsqueda: Buscando texto en múltiples campos: "${normalizedQuery}"`)
      }
    } else {
      // Si no hay consulta, limitar los resultados
      supabaseQuery = supabaseQuery.limit(20)
      console.log("API búsqueda: Sin consulta, devolviendo primeros 20 resultados")
    }

    // Ejecutar la consulta
    const { data: schools, error } = await supabaseQuery.limit(100)

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

      // Calcular relevancia para ordenar resultados
      let relevanceScore = 0
      const matchReasons = []

      if (query) {
        const normalizedQuery = normalizeString(query)

        // Verificar coincidencias exactas en campos clave
        if (school.cue && school.cue.toString() === query) {
          relevanceScore += 100
          matchReasons.push("Coincidencia exacta en CUE")
        }

        if (school.predio && school.predio.toString() === query) {
          relevanceScore += 90
          matchReasons.push("Coincidencia exacta en PREDIO")
        }

        // Verificar coincidencias parciales en campos de texto
        if (school.nombre) {
          const similarity = calculateSimilarity(normalizedQuery, normalizeString(school.nombre))
          if (similarity > 70) {
            relevanceScore += similarity * 0.8
            matchReasons.push(`Coincidencia en nombre (${similarity}%)`)
          }
        }

        if (school.distrito) {
          const similarity = calculateSimilarity(normalizedQuery, normalizeString(school.distrito))
          if (similarity > 80) {
            relevanceScore += similarity * 0.5
            matchReasons.push(`Coincidencia en distrito (${similarity}%)`)
          }
        }

        if (school.ciudad) {
          const similarity = calculateSimilarity(normalizedQuery, normalizeString(school.ciudad))
          if (similarity > 80) {
            relevanceScore += similarity * 0.5
            matchReasons.push(`Coincidencia en ciudad (${similarity}%)`)
          }
        }

        if (school.direccion) {
          const similarity = calculateSimilarity(normalizedQuery, normalizeString(school.direccion))
          if (similarity > 70) {
            relevanceScore += similarity * 0.4
            matchReasons.push(`Coincidencia en dirección (${similarity}%)`)
          }
        }
      }

      // Convertir el formato de la base de datos al formato esperado por el frontend
      return {
        CUE: school.cue ? school.cue.toString() : "",
        PREDIO: school.predio ? school.predio.toString() : "",
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

        // Información de conectividad - Plan Enlace
        PLAN_ENLACE: school.plan_enlace || "",
        SUBPLAN_ENLACE: school.subplan_enlace || "",
        FECHA_INICIO_CONECTIVIDAD: school.fecha_inicio_conectividad || "",

        // Información PNCE
        PROVEEDOR_INTERNET_PNCE: school.proveedor_internet_pnce || "",
        FECHA_INSTALACION_PNCE: school.fecha_instalacion_pnce || "",
        PNCE_TIPO_MEJORA: school.pnce_tipo_mejora || "",
        PNCE_FECHA_MEJORA: school.pnce_fecha_mejora || "",
        PNCE_ESTADO: school.pnce_estado || "",

        // Información PBA Grupo 1
        PBA_GRUPO_1_PROVEEDOR_INTERNET: school.pba_grupo_1_proveedor_internet || "",
        PBA_GRUPO_1_FECHA_INSTALACION: school.pba_grupo_1_fecha_instalacion || "",
        PBA_GRUPO_1_ESTADO: school.pba_grupo_1_estado || "",

        // Información PBA 2019
        PBA_2019_PROVEEDOR_INTERNET: school.pba_2019_proveedor_internet || "",
        PBA_2019_FECHA_INSTALACION: school.pba_2019_fecha_instalacion || "",
        PBA_2019_ESTADO: school.pba_2019_estado || "",

        // Información PBA Grupo 2A
        PBA_GRUPO_2_A_PROVEEDOR_INTERNET: school.pba_grupo_2_a_proveedor_internet || "",
        PBA_GRUPO_2_A_FECHA_INSTALACION: school.pba_grupo_2_a_fecha_instalacion || "",
        PBA_GRUPO_2_A_TIPO_MEJORA: school.pba_grupo_2_a_tipo_mejora || "",
        PBA_GRUPO_2_A_FECHA_MEJORA: school.pba_grupo_2_a_fecha_mejora || "",
        PBA_GRUPO_2_A_ESTADO: school.pba_grupo_2_a_estado || "",

        // Información de piso tecnológico
        PLAN_PISO_TECNOLOGICO: school.plan_piso_tecnologico || "",
        PROVEEDOR_PISO_TECNOLOGICO_CUE: school.proveedor_piso_tecnologico_cue || "",
        FECHA_TERMINADO_PISO_TECNOLOGICO_CUE: school.fecha_terminado_piso_tecnologico_cue || "",
        TIPO_MEJORA: school.tipo_mejora || "",
        FECHA_MEJORA: school.fecha_mejora || "",
        TIPO_PISO_INSTALADO: school.tipo_piso_instalado || "",

        // Información adicional
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

        // Incluir todos los demás campos que puedan existir
        ...Object.keys(school)
          .filter(
            (key) =>
              ![
                "id",
                "cue",
                "nombre",
                "distrito",
                "ciudad",
                "direccion",
                "lat",
                "lon",
                "contactos",
                "created_at",
                "updated_at",
              ].includes(key),
          )
          .reduce((obj, key) => {
            obj[key.toUpperCase()] = school[key] !== null ? school[key].toString() : ""
            return obj
          }, {}),

        // Añadir información de relevancia para ordenar resultados
        _relevanceScore: relevanceScore,
        _matchReasons: matchReasons,
      }
    })

    // Ordenar resultados por relevancia si hay una consulta
    if (query) {
      results.sort((a, b) => (b._relevanceScore || 0) - (a._relevanceScore || 0))
    }

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
