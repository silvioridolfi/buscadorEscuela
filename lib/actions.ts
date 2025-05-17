"use server"

import { createClient } from "@/lib/supabase"
import type { EstablecimientoConContacto } from "@/lib/supabase"
import { createClient as createSupabaseAdminClient } from "@/lib/supabase-admin"

const supabaseAdmin = createSupabaseAdminClient()

export async function searchEstablecimientos(query: string): Promise<EstablecimientoConContacto[]> {
  const supabase = createClient()

  // Normalizar la consulta
  const normalizedQuery = query.trim().toLowerCase()

  // Verificar si la consulta es un número
  const isNumeric = !isNaN(Number.parseInt(normalizedQuery)) && normalizedQuery.match(/^\d+$/)
  const numericValue = isNumeric ? Number.parseInt(normalizedQuery) : 0

  try {
    // Primero, obtengamos la estructura de la tabla para verificar los nombres de columnas
    const { data: tableInfo, error: tableError } = await supabase.from("establecimientos").select("*").limit(1)

    if (tableError) {
      console.error("Error al obtener información de la tabla:", tableError)
      throw new Error("Error al obtener información de la tabla")
    }

    // Verificar qué columnas existen realmente
    const sampleRow = tableInfo && tableInfo.length > 0 ? tableInfo[0] : {}
    const columns = Object.keys(sampleRow)

    console.log("Columnas disponibles:", columns)

    let query

    if (isNumeric) {
      // Si es un número, buscar por CUE exacto
      query = supabase
        .from("establecimientos")
        .select(`
          *,
          contactos (*)
        `)
        .eq("cue", numericValue)
        .limit(50)
    } else {
      // Si es texto, buscar en campos de texto
      // Construir la consulta OR basada en las columnas de texto que existen
      const textColumns = [
        "nombre",
        "nombre_establecimiento",
        "nombre_completo",
        "denominacion",
        "distrito",
        "predio",
        "localidad",
        "direccion",
      ].filter((col) => columns.includes(col))

      if (textColumns.length === 0) {
        console.error("No se encontraron columnas de texto adecuadas para la búsqueda")
        throw new Error("No se encontraron columnas adecuadas para la búsqueda")
      }

      // Construir filtros para cada columna de texto
      const filters = textColumns.map((col) =>
        supabase
          .from("establecimientos")
          .select(`
            *,
            contactos (*)
          `)
          .ilike(col, `%${normalizedQuery}%`)
          .limit(50),
      )

      // Ejecutar todas las consultas en paralelo
      const results = await Promise.all(filters.map((query) => query))

      // Combinar y deduplicar resultados
      const allEstablecimientos = results.flatMap((result) => result.data || []).filter(Boolean)

      // Deduplicar por CUE
      const uniqueEstablecimientos = Array.from(new Map(allEstablecimientos.map((item) => [item.cue, item])).values())

      // Transformar los datos
      const transformedResults: EstablecimientoConContacto[] = uniqueEstablecimientos.map((est) => {
        const contacto = est.contactos?.[0] || {}
        return {
          ...est,
          ...contacto,
          contactos: undefined, // Eliminar el array anidado
        }
      })

      return transformedResults
    }

    // Ejecutar la consulta para búsqueda numérica
    const { data: establecimientos, error } = await query

    if (error) {
      console.error("Error al buscar establecimientos:", error)
      throw new Error("Error al buscar establecimientos")
    }

    // Transformar los datos para que coincidan con el tipo EstablecimientoConContacto
    const results: EstablecimientoConContacto[] = establecimientos.map((est) => {
      const contacto = est.contactos?.[0] || {}
      return {
        ...est,
        ...contacto,
        contactos: undefined, // Eliminar el array anidado
      }
    })

    return results
  } catch (error) {
    console.error("Error en searchEstablecimientos:", error)
    throw error
  }
}

/**
 * Obtiene un establecimiento por su CUE con información de contacto
 */
export async function getEstablecimientoByCUE(cue: number): Promise<EstablecimientoConContacto | null> {
  try {
    // Buscar establecimiento
    const { data: establecimientos, error: estError } = await supabaseAdmin
      .from("establecimientos")
      .select("*")
      .eq("cue", cue)
      .limit(1)

    if (estError) throw estError

    if (!establecimientos || establecimientos.length === 0) {
      return null
    }

    // Buscar contacto asociado
    const { data: contactos, error: contactError } = await supabaseAdmin
      .from("contactos")
      .select("*")
      .eq("cue", cue)
      .limit(1)

    if (contactError) throw contactError

    // Combinar establecimiento con contacto
    return {
      ...establecimientos[0],
      contacto: contactos && contactos.length > 0 ? contactos[0] : undefined,
    }
  } catch (error) {
    console.error(`Error al obtener establecimiento con CUE ${cue}:`, error)
    throw new Error(`Error al obtener establecimiento con CUE ${cue}`)
  }
}

/**
 * Busca establecimientos que comparten el mismo predio
 */
export async function getEstablecimientosByPredio(predio: string): Promise<EstablecimientoConContacto[]> {
  try {
    if (!predio || predio.trim() === "") {
      return []
    }

    // Buscar establecimientos con el mismo predio
    const { data: establecimientos, error: estError } = await supabaseAdmin
      .from("establecimientos")
      .select("*")
      .eq("predio", predio)

    if (estError) throw estError

    if (!establecimientos || establecimientos.length === 0) {
      return []
    }

    // Obtener todos los CUEs para buscar contactos
    const cues = establecimientos.map((est) => est.cue)

    // Buscar contactos asociados
    const { data: contactos, error: contactError } = await supabaseAdmin.from("contactos").select("*").in("cue", cues)

    if (contactError) throw contactError

    // Crear un mapa de contactos por CUE para facilitar la búsqueda
    const contactosByCue = new Map()
    if (contactos) {
      contactos.forEach((contacto) => {
        contactosByCue.set(contacto.cue, contacto)
      })
    }

    // Combinar establecimientos con sus contactos
    return establecimientos.map((est) => ({
      ...est,
      contacto: contactosByCue.get(est.cue),
    }))
  } catch (error) {
    console.error(`Error al obtener establecimientos con predio ${predio}:`, error)
    throw new Error(`Error al obtener establecimientos con predio ${predio}`)
  }
}
