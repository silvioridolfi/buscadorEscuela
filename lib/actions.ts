"use server"

import { createClient } from "@/lib/supabase"
import type { EstablecimientoConContacto } from "@/lib/supabase"
import { createClient as createSupabaseAdminClient } from "@/lib/supabase-admin"

const supabaseAdmin = createSupabaseAdminClient()

export async function searchEstablecimientos(query: string): Promise<EstablecimientoConContacto[]> {
  const supabase = createClient()

  // Normalizar la consulta
  const normalizedQuery = query.trim().toLowerCase()

  // Buscar en establecimientos
  const { data: establecimientos, error } = await supabase
    .from("establecimientos")
    .select(`
      *,
      contactos (*)
    `)
    .or(`
      cue.eq.${isNaN(Number.parseInt(normalizedQuery)) ? 0 : Number.parseInt(normalizedQuery)},
      establecimiento.ilike.%${normalizedQuery}%,
      distrito.ilike.%${normalizedQuery}%,
      predio.ilike.%${normalizedQuery}%
    `)
    .limit(50)

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
