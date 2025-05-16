import { getSupabaseData } from "./db-utils"

// Función para normalizar strings (eliminar acentos, convertir a minúsculas)
export function normalizeString(str: string): string {
  if (!str) return ""

  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/gi, "")
    .trim()
}

/**
 * Calculate Levenshtein distance for fuzzy matching
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost, // substitution
      )
    }
  }

  return matrix[b.length][a.length]
}

// Función para calcular la similitud entre dos strings (algoritmo simple)
export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0

  const s1 = normalizeString(str1)
  const s2 = normalizeString(str2)

  // Si alguna cadena está vacía después de normalizar
  if (!s1 || !s2) return 0

  // Si son iguales
  if (s1 === s2) return 100

  // Si una contiene a la otra
  if (s1.includes(s2)) return 90
  if (s2.includes(s1)) return 90

  // Calcular similitud basada en palabras comunes
  const words1 = s1.split(/\s+/)
  const words2 = s2.split(/\s+/)

  const commonWords = words1.filter((word) => words2.includes(word))

  if (commonWords.length === 0) return 0

  const similarity = ((commonWords.length * 2) / (words1.length + words2.length)) * 100

  return Math.round(similarity)
}

// Common words to ignore in search
export const COMMON_WORDS = [
  "escuela",
  "colegio",
  "instituto",
  "n",
  "n°",
  "nro",
  "numero",
  "número",
  "de",
  "la",
  "el",
  "los",
  "las",
  "y",
  "e",
  "o",
  "u",
  "a",
]

/**
 * Remove common words from a string
 */
export function removeCommonWords(str: string): string {
  return str
    .split(/\s+/)
    .filter((word) => !COMMON_WORDS.includes(word))
    .join(" ")
}

/**
 * Get phonetic representation (simplified)
 */
export function getPhoneticCode(str: string): string {
  // This is a very simplified phonetic algorithm
  // For Spanish, we could replace common phonetic equivalents
  return str
    .replace(/[aáàä]/g, "a")
    .replace(/[eéèë]/g, "e")
    .replace(/[iíìï]/g, "i")
    .replace(/[oóòö]/g, "o")
    .replace(/[uúùü]/g, "u")
    .replace(/[bv]/g, "b")
    .replace(/[zs]/g, "s")
    .replace(/[ñn]/g, "n")
    .replace(/[ck]/g, "k")
    .replace(/[jg]/g, "j")
    .replace(/ll/g, "y")
    .replace(/[h]/g, "") // Silent in Spanish
}

/**
 * Extract education level from school name
 */
export function extractEducationLevel(name: string): string | null {
  const normalized = normalizeString(name)

  if (normalized.includes("primari")) return "primaria"
  if (normalized.includes("secundari")) return "secundaria"
  if (normalized.includes("jardin") || normalized.includes("inicial")) return "inicial"
  if (normalized.includes("tecnic")) return "tecnica"
  if (normalized.includes("especial")) return "especial"
  if (normalized.includes("adult")) return "adultos"

  return null
}

/**
 * Extract school number from name
 */
export function extractSchoolNumber(name: string): string | null {
  const match = name.match(/\b(?:n|n°|nro|numero|número)?\s*(\d+)\b/i)
  return match ? match[1] : null
}

/**
 * Get sheet data - Wrapper function now using Supabase as primary source
 * Esta función mantiene la misma interfaz para compatibilidad con el código existente
 * pero internamente usa Supabase para obtener los datos
 */
export async function getSheetData() {
  try {
    // Usar Supabase como fuente principal de datos
    console.log("Obteniendo datos desde Supabase...")
    const { establishmentsData, contactsData } = await getSupabaseData()

    return { establishmentsData, contactsData }
  } catch (error) {
    console.error("Error al obtener datos desde Supabase:", error)

    // Si quieres mantener la posibilidad de usar las APIs antiguas como último recurso,
    // puedes cargar dinámicamente el módulo legacy-api-utils.ts aquí
    console.error("ERROR CRÍTICO: Fallo al obtener datos. No hay sistema de fallback configurado.")
    console.error("Para restaurar el sistema de fallback, importar getLegacySheetData desde legacy-api-utils.ts")

    throw error
  }
}

/**
 * Get the current API status for debugging
 */
export function getApiStatus() {
  try {
    // Simplificado para reflejar solo Supabase
    return {
      activeApi: "supabase",
      status: "active",
      timestamp: new Date().toISOString(),
      legacy: {
        available: false,
        message: "Legacy APIs (SheetDB/Sheet2API) no longer in use",
      },
    }
  } catch (error) {
    console.error("Error getting API status:", error)
    return {
      error: "Error al obtener estado de la API",
      timestamp: new Date().toISOString(),
    }
  }
}
