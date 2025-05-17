// Simple in-memory cache
let cachedEstablishmentsData: any[] | null = null
let cachedContactsData: any[] | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

// API configuration
const API_CONFIG = {
  // Primary API (SheetDB)
  primary: {
    baseUrl: "https://sheetdb.io/api/v1/qrokpjlkogyzr",
    contactsUrl: "https://sheetdb.io/api/v1/qrokpjlkogyzr?sheet=CONTACTOS",
    active: true,
    failCount: 0,
    lastFailTime: 0,
  },
  // Secondary API (Sheet2API)
  secondary: {
    baseUrl: "https://sheet2api.com/v1/MUeoqbUXSf6Q/escuelas-conectividad-r1",
    contactsUrl: "https://sheet2api.com/v1/MUeoqbUXSf6Q/escuelas-conectividad-r1/CONTACTOS",
    active: false,
    failCount: 0,
    lastFailTime: 0,
  },
}

// Maximum number of consecutive failures before switching APIs
const MAX_FAIL_COUNT = 3
// Cooldown period before trying a failed API again (30 minutes)
const API_RETRY_COOLDOWN = 30 * 60 * 1000

/**
 * Fetch with retry and exponential backoff
 */
export async function fetchWithRetry(url: string, retries = 3, delay = 1000) {
  let lastError

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url)

      // If we hit rate limit, wait and retry
      if (response.status === 429) {
        console.log(`Rate limit hit, waiting ${delay}ms before retry ${attempt + 1}/${retries}`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        // Increase delay for next attempt (exponential backoff)
        delay *= 2
        continue
      }

      return response
    } catch (error) {
      lastError = error
      console.error(`Attempt ${attempt + 1}/${retries} failed:`, error)

      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay))
        delay *= 2 // Exponential backoff
      }
    }
  }

  throw lastError || new Error(`Failed after ${retries} attempts`)
}

/**
 * Get the currently active API configuration
 */
function getActiveApi() {
  return API_CONFIG.primary.active ? API_CONFIG.primary : API_CONFIG.secondary
}

/**
 * Switch to the other API
 */
function switchApi() {
  const now = Date.now()

  if (API_CONFIG.primary.active) {
    // Switch from primary to secondary
    console.log("Switching from primary to secondary API")
    API_CONFIG.primary.active = false
    API_CONFIG.primary.lastFailTime = now
    API_CONFIG.secondary.active = true
    API_CONFIG.secondary.failCount = 0
  } else {
    // Switch from secondary to primary
    console.log("Switching from secondary to primary API")
    API_CONFIG.secondary.active = false
    API_CONFIG.secondary.lastFailTime = now
    API_CONFIG.primary.active = true
    API_CONFIG.primary.failCount = 0
  }

  // Clear cache when switching APIs
  cachedEstablishmentsData = null
  cachedContactsData = null
  cacheTimestamp = 0
}

/**
 * Record an API failure and switch if necessary
 */
function recordApiFailure(isPrimary: boolean) {
  const api = isPrimary ? API_CONFIG.primary : API_CONFIG.secondary
  api.failCount++

  console.log(`API failure recorded for ${isPrimary ? "primary" : "secondary"} API. Fail count: ${api.failCount}`)

  if (api.failCount >= MAX_FAIL_COUNT) {
    switchApi()
  }
}

/**
 * Check if we should try a failed API again
 */
function shouldRetryFailedApi() {
  const now = Date.now()
  const inactiveApi = API_CONFIG.primary.active ? API_CONFIG.secondary : API_CONFIG.primary

  // If the inactive API has been in cooldown for long enough, try it again
  if (now - inactiveApi.lastFailTime > API_RETRY_COOLDOWN) {
    console.log(`Cooldown period elapsed for ${API_CONFIG.primary.active ? "secondary" : "primary"} API. Trying again.`)
    return true
  }

  return false
}

/**
 * Fetch data from the active API with fallback
 */
async function fetchApiData(isContactsData = false) {
  // Check if we should retry the failed API
  if (shouldRetryFailedApi()) {
    switchApi()
  }

  const activeApi = getActiveApi()
  const url = isContactsData ? activeApi.contactsUrl : activeApi.baseUrl
  const isPrimary = activeApi === API_CONFIG.primary

  try {
    const response = await fetchWithRetry(url)

    if (!response.ok) {
      // If we get an error response, record the failure
      recordApiFailure(isPrimary)
      throw new Error(`Error fetching data: ${response.status}`)
    }

    // Reset fail count on success
    activeApi.failCount = 0

    return await response.json()
  } catch (error) {
    console.error(`Error fetching from ${isPrimary ? "primary" : "secondary"} API:`, error)
    recordApiFailure(isPrimary)

    // If we're already using the fallback API and it failed, throw the error
    if (!isPrimary) {
      throw error
    }

    // Try the other API immediately
    switchApi()
    return fetchApiData(isContactsData)
  }
}

/**
 * Get sheet data with caching and API fallback
 */
export async function getSheetData() {
  const now = Date.now()

  // Return cached data if it's still valid
  if (cachedEstablishmentsData && cachedContactsData && now - cacheTimestamp < CACHE_DURATION) {
    return {
      establishmentsData: cachedEstablishmentsData,
      contactsData: cachedContactsData,
    }
  }

  // Fetch new data with fallback logic
  try {
    // Fetch establishments data
    const establishmentsData = await fetchApiData(false)

    // Wait a bit before making the second request to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Fetch contacts data
    const contactsData = await fetchApiData(true)

    // Update cache
    cachedEstablishmentsData = establishmentsData
    cachedContactsData = contactsData
    cacheTimestamp = now

    return { establishmentsData, contactsData }
  } catch (error) {
    console.error("Error fetching sheet data:", error)

    // If we have cached data, return it even if it's expired
    if (cachedEstablishmentsData && cachedContactsData) {
      console.log("Returning expired cached data due to fetch error")
      return {
        establishmentsData: cachedEstablishmentsData,
        contactsData: cachedContactsData,
      }
    }

    throw error
  }
}

/**
 * Get the current API status for debugging
 */
export function getApiStatus() {
  return {
    activeApi: API_CONFIG.primary.active ? "primary" : "secondary",
    primary: {
      active: API_CONFIG.primary.active,
      failCount: API_CONFIG.primary.failCount,
      lastFailTime: API_CONFIG.primary.lastFailTime,
      cooldownRemaining: Math.max(0, API_RETRY_COOLDOWN - (Date.now() - API_CONFIG.primary.lastFailTime)),
    },
    secondary: {
      active: API_CONFIG.secondary.active,
      failCount: API_CONFIG.secondary.failCount,
      lastFailTime: API_CONFIG.secondary.lastFailTime,
      cooldownRemaining: Math.max(0, API_RETRY_COOLDOWN - (Date.now() - API_CONFIG.secondary.lastFailTime)),
    },
    cache: {
      hasEstablishmentsData: !!cachedEstablishmentsData,
      hasContactsData: !!cachedContactsData,
      age: Date.now() - cacheTimestamp,
      expiresIn: Math.max(0, CACHE_DURATION - (Date.now() - cacheTimestamp)),
    },
  }
}

/**
 * Normalize string for searching (remove accents, lowercase)
 */
export function normalizeString(str: string | null | undefined): string {
  if (str === null || str === undefined || typeof str !== "string") {
    return ""
  }

  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .trim() // Asegurarse de eliminar espacios al inicio y final
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

/**
 * Calculate similarity score (0-100)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0

  const maxLength = Math.max(str1.length, str2.length)
  if (maxLength === 0) return 100 // Both strings are empty

  const distance = levenshteinDistance(str1, str2)
  return Math.round((1 - distance / maxLength) * 100)
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
