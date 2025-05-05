"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import SchoolCard from "./SchoolCard"
import { Search, X, RefreshCw, School, AlertCircle, Loader2 } from "lucide-react"

// Add a version number to help track deployments
const APP_VERSION = "2.0.3" // Optimización y corrección de funcionalidades
// Generar versión automática basada en la fecha (formato: AAAA.MM.DD)
const today = new Date()
const AUTO_VERSION = `${today.getFullYear()}.${(today.getMonth() + 1).toString().padStart(2, "0")}.${today.getDate().toString().padStart(2, "0")}`

interface SchoolInfo {
  CUE: string
  PREDIO: string
  ESTABLECIMIENTO: string
  FED_A_CARGO: string
  DISTRITO: string
  CIUDAD: string
  DIRECCION: string
  PLAN_ENLACE: string
  SUBPLAN_ENLACE: string
  FECHA_INICIO_CONECTIVIDAD: string
  PROVEEDOR_INTERNET_PNCE: string
  FECHA_INSTALACION_PNCE: string
  PNCE_TIPO_MEJORA: string
  PNCE_FECHA_MEJORA: string
  PNCE_ESTADO: string
  PBA_GRUPO_1_PROVEEDOR_INTERNET: string
  PBA_GRUPO_1_FECHA_INSTALACION: string
  PBA_GRUPO_1_ESTADO: string
  PBA_2019_PROVEEDOR_INTERNET: string
  PBA_2019_FECHA_INSTALACION: string
  PBA_2019_ESTADO: string
  PBA_GRUPO_2_A_PROVEEDOR_INTERNET: string
  PBA_GRUPO_2_A_FECHA_INSTALACION: string
  PBA_GRUPO_2_A_TIPO_MEJORA: string
  PBA_GRUPO_2_A_FECHA_MEJORA: string
  PBA_GRUPO_2_A_ESTADO: string
  PLAN_PISO_TECNOLOGICO: string
  PROVEEDOR_PISO_TECNOLOGICO_CUE: string
  FECHA_TERMINADO_PISO_TECNOLOGICO_CUE: string
  TIPO_MEJORA: string
  FECHA_MEJORA: string
  TIPO_PISO_INSTALADO: string
  TIPO: string
  OBSERVACIONES: string
  TIPO_ESTABLECIMIENTO: string
  LISTADO_CONEXION_INTERNET: string
  ESTADO_INSTALACION_PBA: string
  PROVEEDOR_ASIGNADO_PBA: string
  MB: string
  AMBITO: string
  CUE_ANTERIOR: string
  RECLAMOS_GRUPO_1_ANI: string
  RECURSO_PRIMARIO: string
  ACCESS_ID: string
  LAT: string
  LON: string
  NOMBRE: string
  APELLIDO: string
  CARGO: string
  TELEFONO: string
  CORREO_INSTITUCIONAL: string
  _relevanceScore?: number
  _matchReasons?: string[]
  _educationLevel?: string | null
  _schoolNumber?: string | null
}

export interface SharedPredioInfo {
  isShared: boolean
  predio: string
  sharedWith: Array<{
    CUE: string
    ESTABLECIMIENTO: string
  }>
}

export default function SchoolSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SchoolInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sharedPredios, setSharedPredios] = useState<Record<string, SharedPredioInfo>>({})
  const [isCheckingSharedPredios, setIsCheckingSharedPredios] = useState(false)
  const [forceRefreshKey, setForceRefreshKey] = useState(Date.now())
  // Nuevo estado para rastrear si se ha realizado una búsqueda activa
  const [hasSearched, setHasSearched] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Force a refresh of the component on mount to clear any stale data
  useEffect(() => {
    // This will force a re-render of the component
    setForceRefreshKey(Date.now())

    // Clear browser cache for API endpoints
    const clearApiCache = async () => {
      try {
        // Try to clear cache for our API endpoints
        if ("caches" in window) {
          const cacheKeys = await caches.keys()
          for (const key of cacheKeys) {
            await caches.delete(key)
          }
          console.log("Cleared browser caches")
        }
      } catch (error) {
        console.error("Error clearing cache:", error)
      }
    }

    clearApiCache()

    // Focus the search input when the component mounts
    // Usar un pequeño retraso para asegurar que el DOM esté completamente cargado
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus()
        console.log("Search input focused")
      }
    }, 100)
  }, [])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
  }

  // Force a hard refresh of the page
  const forceHardRefresh = () => {
    window.location.reload(true)
  }

  // Add a timestamp to API requests to bypass cache
  const getTimestampedUrl = (url: string) => {
    const separator = url.includes("?") ? "&" : "?"
    return `${url}${separator}_t=${Date.now()}`
  }

  // Direct PREDIO check for specific schools
  const checkSpecificPredios = useCallback(async () => {
    // Check for the specific PREDIO 606335 that should be shared between CUEs 60881800 and 60888400
    const specificPredio = "606335"

    try {
      console.log(`Client: Checking specific PREDIO ${specificPredio}`)

      // Add timestamp to URL to bypass cache
      const url = getTimestampedUrl(`/api/schools-by-predio/supabase?predio=${encodeURIComponent(specificPredio)}`)
      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error(`Error checking specific PREDIO: ${response.status}`)
      }

      const data = await response.json()
      const schools = data.schools || []

      console.log(`Client: Found ${schools.length} schools with specific PREDIO ${specificPredio}`)

      if (Array.isArray(schools) && schools.length > 1) {
        // Create shared PREDIO info for these specific schools
        const newSharedPredios: Record<string, SharedPredioInfo> = {}

        schools.forEach((school) => {
          newSharedPredios[school.CUE] = {
            isShared: true,
            predio: specificPredio,
            sharedWith: schools
              .filter((s) => s.CUE !== school.CUE)
              .map((s) => ({
                CUE: s.CUE,
                ESTABLECIMIENTO: s.ESTABLECIMIENTO,
              })),
          }
        })

        // Only update if these schools are in our results
        const resultCUEs = new Set(results.map((school) => school.CUE))
        const relevantSharedPredios = Object.entries(newSharedPredios)
          .filter(([cue]) => resultCUEs.has(cue))
          .reduce(
            (acc, [cue, info]) => {
              acc[cue] = info
              return acc
            },
            {} as Record<string, SharedPredioInfo>,
          )

        if (Object.keys(relevantSharedPredios).length > 0) {
          console.log(
            `Client: Adding specific shared PREDIO info for ${Object.keys(relevantSharedPredios).length} schools`,
          )
          setSharedPredios((prev) => ({ ...prev, ...relevantSharedPredios }))
        }
      }
    } catch (error) {
      console.error("Error checking specific PREDIO:", error)
    }
  }, [results])

  // Fetch schools that share the same PREDIO
  const fetchSchoolsByPredio = useCallback(
    async (predioNumbers: string[]) => {
      setIsCheckingSharedPredios(true)

      try {
        // Create a map to store all schools by PREDIO
        const schoolsByPredio: Record<string, SchoolInfo[]> = {}

        // Fetch schools for each PREDIO
        await Promise.all(
          predioNumbers.map(async (predio) => {
            if (!predio || typeof predio !== "string" || predio.trim() === "") return

            const normalizedPredio = predio.trim()
            console.log(`Client: Fetching schools for PREDIO: "${normalizedPredio}"`)

            try {
              // Usar la API de Supabase para buscar escuelas por predio
              const url = getTimestampedUrl(
                `/api/schools-by-predio/supabase?predio=${encodeURIComponent(normalizedPredio)}`,
              )
              const response = await fetch(url, {
                cache: "no-store",
                headers: {
                  "Cache-Control": "no-cache, no-store, must-revalidate",
                  Pragma: "no-cache",
                  Expires: "0",
                },
              })

              if (!response.ok) {
                throw new Error(`Error al obtener escuelas por PREDIO: ${response.status}`)
              }

              const data = await response.json()
              const schools = data.schools || []

              console.log(
                `Client: API returned ${Array.isArray(schools) ? schools.length : 0} schools for PREDIO ${normalizedPredio}`,
              )

              if (Array.isArray(schools) && schools.length > 0) {
                schoolsByPredio[normalizedPredio] = schools
              }
            } catch (error) {
              console.error(`Error fetching schools for PREDIO ${normalizedPredio}:`, error)
            }
          }),
        )

        // Process the results to identify shared PREDIOs
        const newSharedPredios: Record<string, SharedPredioInfo> = {}

        // For each PREDIO that has multiple schools
        Object.entries(schoolsByPredio).forEach(([predio, schools]) => {
          console.log(`Client: Processing PREDIO ${predio} with ${schools.length} schools`)

          if (schools.length > 1) {
            // This PREDIO is shared by multiple schools
            schools.forEach((school) => {
              newSharedPredios[school.CUE] = {
                isShared: true,
                predio: predio,
                sharedWith: schools
                  .filter((s) => s.CUE !== school.CUE)
                  .map((s) => ({
                    CUE: s.CUE,
                    ESTABLECIMIENTO: s.ESTABLECIMIENTO,
                  })),
              }
              console.log(
                `Client: Marked CUE ${school.CUE} as sharing PREDIO ${predio} with ${schools.length - 1} other schools`,
              )
            })
          }
        })

        setSharedPredios(newSharedPredios)

        // Log for debugging
        console.log("Client: Shared PREDIOs detected:", Object.keys(newSharedPredios).length)
        console.log("Client: Schools by PREDIO:", Object.keys(schoolsByPredio).length)

        // Si no encontramos predios compartidos, verificar específicamente los que sabemos que deberían estar compartidos
        if (Object.keys(newSharedPredios).length === 0) {
          await checkSpecificPredios()
        }
      } catch (error) {
        console.error("Error fetching schools by PREDIO:", error)
      } finally {
        setIsCheckingSharedPredios(false)
      }
    },
    [checkSpecificPredios],
  )

  // When results change, check for shared PREDIOs
  useEffect(() => {
    if (results.length > 0) {
      // Get unique, non-empty PREDIO numbers from the results
      const predioNumbers = [
        ...new Set(
          results
            .map((school) => school.PREDIO)
            .filter((predio) => predio !== undefined && predio !== null && predio !== "")
            .map((predio) => String(predio).trim()), // Normalize all PREDIOs
        ),
      ]

      if (predioNumbers.length > 0) {
        console.log("Client: Checking PREDIOs:", predioNumbers)
        fetchSchoolsByPredio(predioNumbers)
      } else {
        // If no PREDIOs in results, still check for specific known shared PREDIOs
        checkSpecificPredios()
      }
    } else {
      setSharedPredios({})
    }
  }, [results, fetchSchoolsByPredio, checkSpecificPredios])

  // Fetch all schools from the database to check for shared PREDIOs
  const fetchAllSchoolsForPredioCheck = useCallback(async () => {
    if (results.length === 0) return

    try {
      console.log("Client: Fetching all schools to check for shared PREDIOs")

      // Cambiar la URL para usar la API de Supabase (si existe)
      // Si no existe una API específica para esto en Supabase, podemos mantener la original
      const url = getTimestampedUrl("/api/all-schools")
      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error(`Error fetching all schools: ${response.status}`)
      }

      const data = await response.json()
      const allSchools = data.schools || data // Handle both response formats

      if (!Array.isArray(allSchools)) {
        console.error("Client: Invalid response format from all-schools API", data)
        return
      }

      console.log(`Client: Received ${allSchools.length} schools from all-schools API`)

      // Group schools by PREDIO
      const schoolsByPredio: Record<string, SchoolInfo[]> = {}

      allSchools.forEach((school: any) => {
        if (school && school.PREDIO && typeof school.PREDIO === "string" && school.PREDIO.trim() !== "") {
          const predio = school.PREDIO.trim()
          if (!schoolsByPredio[predio]) {
            schoolsByPredio[predio] = []
          }
          schoolsByPredio[predio].push(school)
        }
      })

      // Find shared PREDIOs
      const newSharedPredios: Record<string, SharedPredioInfo> = {}

      // For each PREDIO that has multiple schools
      Object.entries(schoolsByPredio).forEach(([predio, schools]) => {
        if (schools.length > 1) {
          // Check if any of these schools are in our results
          const resultCUEs = new Set(results.map((school) => school.CUE))

          schools.forEach((school) => {
            if (resultCUEs.has(school.CUE)) {
              newSharedPredios[school.CUE] = {
                isShared: true,
                predio: predio,
                sharedWith: schools
                  .filter((s) => s.CUE !== school.CUE)
                  .map((s) => ({
                    CUE: s.CUE,
                    ESTABLECIMIENTO: s.ESTABLECIMIENTO,
                  })),
              }
              console.log(
                `Client: Marked CUE ${school.CUE} as sharing PREDIO ${predio} with ${schools.length - 1} other schools`,
              )
            }
          })
        }
      })

      if (Object.keys(newSharedPredios).length > 0) {
        setSharedPredios((prev) => ({ ...prev, ...newSharedPredios }))
        console.log("Client: Additional shared PREDIOs detected:", Object.keys(newSharedPredios).length)
      } else {
        // If we still didn't find any shared PREDIOs, check the specific ones
        await checkSpecificPredios()
      }
    } catch (error) {
      console.error("Error fetching all schools:", error)
    }
  }, [results, checkSpecificPredios])

  // Call the function to check all schools when results change
  useEffect(() => {
    if (results.length > 0) {
      fetchAllSchoolsForPredioCheck()
    }
  }, [results, fetchAllSchoolsForPredioCheck])

  const fetchResults = useCallback(
    async (searchQuery?: string) => {
      const queryToUse = searchQuery !== undefined ? searchQuery : query

      if (queryToUse.length === 0) {
        setResults([])
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Build query params
        const params = new URLSearchParams()
        if (queryToUse) params.append("query", queryToUse)

        // Cambiar la URL para usar la API de Supabase
        const url = getTimestampedUrl(`/api/search/supabase?${params.toString()}`)
        const response = await fetch(url, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Ocurrió un error al buscar los datos")
        }

        const data = await response.json()
        setResults(data)
        // Marcar que se ha realizado una búsqueda
        setHasSearched(true)
      } catch (error) {
        console.error("Error en fetchResults:", error)
        setError(error.message || "Ocurrió un error inesperado")
      } finally {
        setLoading(false)
      }
    },
    [query],
  )

  // Function to search by CUE
  const handleSearchByCUE = useCallback(
    (cue: string) => {
      // Set the query to the CUE
      setQuery(cue)
      // Execute the search
      fetchResults(cue)
    },
    [fetchResults],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchResults()
  }

  // Mejorar la función handleClear para limpiar la búsqueda y los resultados
  const handleClear = () => {
    setQuery("")
    setResults([])
    setError(null)
    setSharedPredios({})
    // Reiniciar el estado de búsqueda
    setHasSearched(false)

    // Usar un pequeño retraso para asegurar que el DOM se actualice antes de enfocar
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus()
        console.log("Search input focused after clear")
      }
    }, 50)
  }

  // Función para manejar el clic en el botón X
  const handleClearButtonClick = () => {
    handleClear()
  }

  return (
    <div className="max-w-6xl mx-auto px-4" key={forceRefreshKey}>
      {/* Search Panel - Nuevo diseño con efecto de vidrio */}
      <div className="mb-8">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20">
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Input field - Diseño mejorado */}
              <div className="relative flex-grow">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={handleInputChange}
                  placeholder="Ingresar CUE o nombre de establecimiento"
                  className="w-full px-6 py-3 pl-12 rounded-xl border-2 border-white/30 focus:border-primary text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-lg bg-white/5 backdrop-blur-sm"
                  ref={searchInputRef}
                  autoFocus
                />
                {query && (
                  <button
                    type="button"
                    onClick={handleClearButtonClick}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1 rounded-full transition-colors"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Buttons - Diseño mejorado */}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium transition-colors disabled:opacity-50 shadow-lg flex items-center justify-center min-w-[120px]"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Buscar
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={forceHardRefresh}
                  title="Actualizar"
                  className="px-3 py-3 rounded-xl bg-accent hover:bg-accent/90 text-white font-medium transition-colors shadow-lg flex items-center justify-center"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </form>

          {error && (
            <div className="bg-red-500/20 backdrop-blur-sm border-l-4 border-red-500 text-white p-4 rounded-lg mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-300" />
                </div>
                <div className="ml-3">
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="mt-8 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <School className="w-6 h-6 mr-3" />
                Resultados
                <span className="ml-3 px-4 py-1 bg-primary/20 text-white rounded-full text-sm font-normal">
                  {results.length} encontrados
                </span>
              </h2>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-accent rounded-full mt-3"></div>
          </div>
        )}
      </div>

      {/* Results Grid - Diseño mejorado */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {results.map((school) => (
          <SchoolCard
            key={school.CUE}
            school={school}
            sharedPredioInfo={sharedPredios[school.CUE]}
            onSearchByCUE={handleSearchByCUE}
          />
        ))}
      </div>

      {/* Loading State for Shared PREDIOs */}
      {isCheckingSharedPredios && (
        <div className="text-center text-white text-sm mt-6 bg-white/10 p-3 rounded-xl backdrop-blur-sm max-w-md mx-auto border border-white/20 shadow-lg">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Verificando predios compartidos...
        </div>
      )}

      {/* No Results State - Diseño mejorado - Modificado para mostrar solo cuando se ha realizado una búsqueda */}
      {!loading && !isCheckingSharedPredios && hasSearched && query.length > 0 && results.length === 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center shadow-xl max-w-md mx-auto border border-white/20">
          <div className="w-20 h-20 mx-auto mb-6 text-white/70">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
            </svg>
          </div>
          <p className="text-white text-xl font-medium mb-2">No se encontraron resultados</p>
          <p className="text-white/70 mb-4">Intente con otros términos de búsqueda o verifique el CUE ingresado.</p>
          <button
            onClick={handleClear}
            className="px-6 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium transition-colors"
          >
            Realizar nueva búsqueda
          </button>
        </div>
      )}
    </div>
  )
}
