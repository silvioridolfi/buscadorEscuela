// Este archivo contiene funciones de las APIs anteriores (SheetDB y Sheet2API)
// Mantenido solo como referencia y plan de contingencia
// NO se utiliza en el flujo principal de la aplicación

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
 * Get sheet data with caching and API fallback (legacy method)
 * @deprecated Use Supabase data sources instead
 */
export async function getLegacySheetData() {
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
 * Get the legacy APIs status for debugging
 * @deprecated Use Supabase status check instead
 */
export function getLegacyApiStatus() {
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
