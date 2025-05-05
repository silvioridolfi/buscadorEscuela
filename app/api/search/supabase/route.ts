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
    console.log(`API búsqueda: Consulta original: "${query}"`)

    // Normalizar la consulta (quitar acentos, convertir a minúsculas)
    const normalizedQuery = normalizeString(query)
    console.log(`API búsqueda: Consulta normalizada: "${normalizedQuery}"`)

    // Construir la consulta base
    let supabaseQuery = supabaseAdmin.from("establecimientos").select(`
        *,
        contactos (*)
      `)

    // Verificar si es un patrón tipo "nivel + número" (ej: "secundaria 3", "primaria 5")
    const schoolTypeNumberMatch = normalizedQuery.match(/^(\w+)\s+(\d+)$/)

    // Verificar si es solo un número
    const isOnlyNumber = /^\d+$/.test(query)

    if (schoolTypeNumberMatch) {
      // Extraer el tipo de escuela y el número
      const [_, schoolType, schoolNumber] = schoolTypeNumberMatch
      console.log(`API búsqueda: Detectado patrón - Tipo: "${schoolType}", Número: "${schoolNumber}"`)

      // Manejar específicamente el caso de "jardin" o "jardín"
      if (schoolType === "jardin" || schoolType === "jardín" || schoolType === "jardin") {
        // Para jardines, usamos una estrategia específica
        // Buscamos cualquier variante de "jardin" (con o sin acento) y el número específico
        const jardinVariants = ["jardin", "jardín", "jardin de infantes", "jardín de infantes"]

        // Construir condiciones OR para cada variante
        const jardinConditions = jardinVariants.map((variant) => `nombre.ilike.%${variant}%`).join(",")

        // Primero filtramos por alguna variante de jardín
        supabaseQuery = supabaseQuery.or(jardinConditions)

        // Y luego aseguramos que contenga el número
        supabaseQuery = supabaseQuery.ilike("nombre", `%${schoolNumber}%`)

        console.log(`API búsqueda: Aplicando búsqueda específica para jardín ${schoolNumber}`)
      } else {
        // Para otros tipos de escuela, usamos la estrategia general
        // Buscamos escuelas que contengan tanto el tipo como el número
        supabaseQuery = supabaseQuery.ilike("nombre", `%${schoolType}%`).ilike("nombre", `%${schoolNumber}%`)
        console.log(`API búsqueda: Aplicando búsqueda combinada para "${schoolType}" y "${schoolNumber}"`)
      }
    } else if (isOnlyNumber) {
      // Si es solo un número (como CUE o número de escuela)
      const cueNumber = Number.parseInt(query, 10)
      if (!isNaN(cueNumber)) {
        // Buscar por CUE exacto o por el número en el nombre
        supabaseQuery = supabaseQuery.or(`cue.eq.${cueNumber},nombre.ilike.%${query}%`)
        console.log(`API búsqueda: Buscando por CUE/número: ${cueNumber}`)
      }
    } else {
      // Búsqueda general por texto
      supabaseQuery = supabaseQuery.ilike("nombre", `%${normalizedQuery}%`)
      console.log(`API búsqueda: Buscando texto general: "${normalizedQuery}"`)
    }

    // Aplicar filtros adicionales
    if (district) {
      supabaseQuery = supabaseQuery.ilike("distrito", `%${district}%`)
    }

    if (level) {
      // Filtrar por nivel educativo
      if (level === "primaria") {
        supabaseQuery = supabaseQuery.ilike("nombre", "%primaria%")
      } else if (level === "secundaria") {
        supabaseQuery = supabaseQuery.ilike("nombre", "%secundaria%")
      } else if (level === "inicial") {
        supabaseQuery = supabaseQuery.or("nombre.ilike.%inicial%,nombre.ilike.%jardin%,nombre.ilike.%jardín%")
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

    console.log(`API búsqueda: Recuperadas ${schools?.length || 0} escuelas.`)

    // Filtrado adicional para términos compuestos
    let filteredSchools = schools

    // En caso de búsqueda tipo+número, hacer un segundo filtrado para resultados más precisos
    if (schoolTypeNumberMatch) {
      const [_, schoolType, schoolNumber] = schoolTypeNumberMatch

      // Verificar resultados con un enfoque más estricto para detectar variaciones
      filteredSchools = schools.filter((school) => {
        if (!school.nombre) return false

        const normalizedName = normalizeString(school.nombre)
        console.log(`Evaluando escuela: "${school.nombre}" (normalizado: "${normalizedName}")`)

        // Verificar que contenga el tipo de escuela (secundaria, primaria, etc.)
        let hasSchoolType = false

        // Para jardines, verificar múltiples variantes
        if (schoolType === "jardin" || schoolType === "jardín" || schoolType === "jardin") {
          hasSchoolType =
            normalizedName.includes("jardin") ||
            normalizedName.includes("jardín") ||
            normalizedName.includes("jardin de infantes") ||
            normalizedName.includes("jardín de infantes")
        } else {
          hasSchoolType = normalizedName.includes(schoolType)
        }

        if (!hasSchoolType) {
          console.log(`  - No contiene el tipo "${schoolType}"`)
          return false
        }

        // Verificar que contenga el número específicamente como número de escuela
        // y no como parte de otra información
        const numberPatterns = [
          `${schoolType}\\s+(?:n|n°|nro|numero|número)?\\s*${schoolNumber}\\b`, // tipo + número
          `\\b(?:n|n°|nro|numero|número)?\\s*${schoolNumber}\\b`, // n° + número
        ]

        // Crear expresiones regulares para cada patrón
        const regexPatterns = numberPatterns.map((pattern) => new RegExp(pattern, "i"))

        // Verificar si alguno de los patrones coincide
        const hasCorrectNumber = regexPatterns.some((regex) => regex.test(normalizedName))

        if (!hasCorrectNumber) {
          console.log(`  - No contiene el número "${schoolNumber}" como identificador de escuela`)
          return false
        }

        console.log(`  ✓ Coincide con "${schoolType}" y "${schoolNumber}" como identificador de escuela`)
        return true
      })

      console.log(`API búsqueda: Filtrado estricto - Resultados: ${filteredSchools.length}`)

      // Si no encontramos resultados con el filtrado estricto, intentamos un enfoque más flexible
      if (filteredSchools.length === 0) {
        console.log("API búsqueda: Sin resultados con filtrado estricto, intentando enfoque flexible")

        // Enfoque más flexible: verificar que el tipo y número estén presentes, pero con criterios menos estrictos
        filteredSchools = schools.filter((school) => {
          if (!school.nombre) return false

          const normalizedName = normalizeString(school.nombre)

          // Para jardines, verificar que sea un jardín y contenga el número en alguna parte
          if (schoolType === "jardin" || schoolType === "jardín" || schoolType === "jardin") {
            const isJardin = normalizedName.includes("jardin") || normalizedName.includes("jardín")

            // Verificar si el número aparece como identificador de escuela
            const numberRegex = new RegExp(`\\b(?:n|n°|nro|numero|número)?\\s*${schoolTypeNumberMatch[2]}\\b`, "i")
            const hasNumber = numberRegex.test(normalizedName)

            return isJardin && hasNumber
          } else {
            // Para otros tipos, verificar que contenga el tipo y el número como identificador
            const hasType = normalizedName.includes(schoolType)

            // Verificar si el número aparece como identificador de escuela
            const numberRegex = new RegExp(`\\b(?:n|n°|nro|numero|número)?\\s*${schoolTypeNumberMatch[2]}\\b`, "i")
            const hasNumber = numberRegex.test(normalizedName)

            return hasType && hasNumber
          }
        })

        console.log(`API búsqueda: Filtrado flexible - Resultados: ${filteredSchools.length}`)
      }
    } else if (isOnlyNumber) {
      // Para búsquedas de solo números, mejorar la relevancia
      const searchNumber = query

      // Filtrar para priorizar escuelas donde el número es parte del identificador principal
      filteredSchools = schools.filter((school) => {
        if (!school.nombre) return false

        const normalizedName = normalizeString(school.nombre)

        // Verificar si el número aparece como parte de un identificador de escuela
        const numberRegex = new RegExp(`\\b(?:n|n°|nro|numero|número)?\\s*${searchNumber}\\b`, "i")
        const isSchoolNumber = numberRegex.test(normalizedName)

        // Si el CUE coincide exactamente, es una coincidencia perfecta
        if (school.cue.toString() === searchNumber) {
          return true
        }

        // Verificar si el número aparece como identificador de escuela
        return isSchoolNumber
      })

      // Si no hay resultados con el filtrado estricto, devolver todos los resultados originales
      if (filteredSchools.length === 0) {
        filteredSchools = schools
      }

      console.log(`API búsqueda: Filtrado para número ${searchNumber} - Resultados: ${filteredSchools.length}`)
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
