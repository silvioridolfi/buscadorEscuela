"use client"

import { useState } from "react"
import { AlertTriangle, MapPin, RefreshCw } from "lucide-react"

interface CoordinateDebuggerProps {
  cue: string
  lat: string
  lon: string
  schoolName: string
}

export default function CoordinateDebugger({ cue, lat, lon, schoolName }: CoordinateDebuggerProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDebugInfo = async () => {
    setLoading(true)
    setError(null)

    try {
      // Añadir timestamp para evitar caché
      const timestamp = Date.now()
      const response = await fetch(`/api/debug/map-coordinates?cue=${encodeURIComponent(cue)}&_t=${timestamp}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      setDebugInfo(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
      <h3 className="text-white font-bold mb-2 flex items-center">
        <MapPin className="w-4 h-4 mr-2 text-primary" />
        Depurador de Coordenadas
      </h3>

      <div className="mb-3 text-sm text-white/70">
        <p>Escuela: {schoolName}</p>
        <p>CUE: {cue}</p>
        <p>
          Coordenadas actuales: {lat}, {lon}
        </p>
      </div>

      <button
        onClick={fetchDebugInfo}
        disabled={loading}
        className="bg-primary/20 hover:bg-primary/30 text-primary px-3 py-1 rounded-md text-sm flex items-center"
      >
        {loading ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <MapPin className="w-3 h-3 mr-1" />}
        {loading ? "Obteniendo información..." : "Verificar coordenadas"}
      </button>

      {error && (
        <div className="mt-3 p-2 bg-red-900/30 border border-red-500/30 rounded-md text-xs text-red-300">
          <AlertTriangle className="w-3 h-3 inline-block mr-1" />
          {error}
        </div>
      )}

      {debugInfo && (
        <div className="mt-3 p-2 bg-gray-700/50 border border-gray-600 rounded-md text-xs text-white/80">
          <h4 className="font-bold mb-1">Información de coordenadas en la base de datos:</h4>
          <pre className="overflow-x-auto whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>

          {debugInfo.googleMapsUrl && (
            <div className="mt-2">
              <a
                href={debugInfo.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center"
              >
                <MapPin className="w-3 h-3 mr-1" />
                Ver en Google Maps
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
