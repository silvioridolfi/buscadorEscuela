import { supabaseClient } from "./supabase"

/**
 * Función para obtener datos de Supabase con caché y manejo de errores
 */
export async function getSupabaseData() {
  try {
    // Obtener establecimientos
    const { data: establishmentsData, error: establishmentsError } = await supabaseClient
      .from("establecimientos")
      .select("*")

    if (establishmentsError) {
      throw establishmentsError
    }

    // Obtener contactos
    const { data: contactsData, error: contactsError } = await supabaseClient.from("contactos").select("*")

    if (contactsError) {
      throw contactsError
    }

    return { establishmentsData, contactsData }
  } catch (error) {
    console.error("Error al obtener datos de Supabase:", error)
    throw error
  }
}

/**
 * Función para buscar escuelas por CUE
 */
export async function getSchoolByCUE(cue: string) {
  try {
    const { data, error } = await supabaseClient
      .from("establecimientos")
      .select(`
        *,
        contactos (*)
      `)
      .eq("cue", cue)
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error(`Error al buscar escuela con CUE ${cue}:`, error)
    throw error
  }
}

/**
 * Función para buscar escuelas por PREDIO
 */
export async function getSchoolsByPredio(predio: string) {
  try {
    const { data, error } = await supabaseClient
      .from("establecimientos")
      .select(`
        *,
        contactos (*)
      `)
      .eq("predio", predio)

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error(`Error al buscar escuelas con PREDIO ${predio}:`, error)
    throw error
  }
}
