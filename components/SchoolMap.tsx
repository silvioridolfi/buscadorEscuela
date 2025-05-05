"use client"

import { useEffect, useState } from "react"
import { MapPin, AlertTriangle, ExternalLink } from "lucide-react"
import CoordinateDebugger from "./CoordinateDebugger"

interface SchoolMapProps {
  lat: string
  lon: string
  schoolName: string
  cue: string
  showDebugger?: boolean
}

export default function SchoolMap({ lat, lon, schoolName, cue, showDebugger = false }: SchoolMapProps) {
  const [mapUrl, setMapUrl] = useState<string | null>(null)
  const [directUrl, setDirectUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [debugMode, setDebugMode] = useState(showDebugger)

  useEffect(() => {
    async function fetchMapData() {
      // Validar que las coordenadas existan y no sean valores por defecto
      if (!lat || !lon || lat === "0" || lon === "0" || lat.trim() === "" || lon.trim() === "") {
        setError("Coordenadas no disponibles")
        setLoading(false)
        return
      }

      try {
        // Limpiar y normalizar las coordenadas
        const cleanLat = lat.toString().trim().replace(",", ".")
        const cleanLon = lon.toString().trim().replace(",", ".")

        // Convertir a números para validación
        const latNum = Number.parseFloat(cleanLat)
        const lonNum = Number.parseFloat(cleanLon)

        // Validar que sean números válidos y estén en rangos correctos
        if (isNaN(latNum) || isNaN(lonNum) || latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
          throw new Error("Coordenadas inválidas")
        }

        // Verificar si son coordenadas enteras y ajustarlas si es necesario
        // Esto es una solución temporal para el problema de coordenadas enteras
        let adjustedLat = latNum
        let adjustedLon = lonNum

        // Si las coordenadas son enteras, asumimos que son aproximadas y las ajustamos
        // para Buenos Aires, Argentina
        if (Number.isInteger(latNum) && latNum === -34) {
          adjustedLat = -34.6037 // Coordenada aproximada para Buenos Aires
        }
        if (Number.isInteger(lonNum) && lonNum === -58) {
          adjustedLon = -58.3816 // Coordenada aproximada para Buenos Aires
        }

        // Obtener la URL del mapa desde el servidor
        const response = await fetch(
          `/api/maps/embed-url?lat=${adjustedLat}&lon=${adjustedLon}&name=${encodeURIComponent(schoolName)}`,
          {
            cache: "no-store",
          },
        )

        if (!response.ok) {
          throw new Error(`Error al obtener URL del mapa: ${response.status}`)
        }

        const data = await response.json()
        setMapUrl(data.mapUrl)
        setDirectUrl(data.directUrl)
        setLoading(false)

        // Log para depuración
        console.log(`Mapa cargado para ${schoolName} (CUE: ${cue}) en coordenadas: ${adjustedLat}, ${adjustedLon}`)
        if (adjustedLat !== latNum || adjustedLon !== lonNum) {
          console.log(`Nota: Coordenadas ajustadas de ${latNum},${lonNum} a ${adjustedLat},${adjustedLon}`)
        }
      } catch (err) {
        console.error("Error fetching map:", err)
        setError(err instanceof Error ? err.message : "Error al cargar el mapa")
        // Siempre proporcionar un enlace directo a Google Maps como fallback
        setDirectUrl(`https://www.google.com/maps?q=${lat},${lon}`)
        setLoading(false)
      }
    }

    fetchMapData()
  }, [lat, lon, schoolName, cue])

  if (loading) {
    return (
      <div className="w-full h-full bg-gray-800/50 rounded-lg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      {debugMode && <CoordinateDebugger cue={cue} lat={lat} lon={lon} schoolName={schoolName} />}

      {error || !mapUrl ? (
        <div className="w-full h-full bg-gray-800/50 rounded-lg flex flex-col items-center justify-center p-4 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
          <p className="text-white/70 mb-2">{error || "No se pudo cargar el mapa"}</p>
          {directUrl && (
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center"
            >
              <MapPin className="w-4 h-4 mr-1" />
              Ver en Google Maps
            </a>
          )}
          <p className="text-xs text-white/40 mt-2">
            Coordenadas: {lat}, {lon}
          </p>
          <button
            onClick={() => setDebugMode(!debugMode)}
            className="mt-3 text-xs bg-gray-700 hover:bg-gray-600 text-white/70 px-2 py-1 rounded-md"
          >
            {debugMode ? "Ocultar depurador" : "Mostrar depurador"}
          </button>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col">
          <div className="flex-grow bg-gray-800/50 rounded-lg overflow-hidden relative">
            <iframe
              src={mapUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Mapa de ${schoolName}`}
            ></iframe>

            <div className="absolute bottom-2 right-2 flex gap-2">
              <a
                href={directUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/90 hover:bg-white text-gray-800 text-xs px-2 py-1 rounded-md flex items-center shadow-md"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Abrir en Google Maps
              </a>

              <button
                onClick={() => setDebugMode(!debugMode)}
                className="bg-white/90 hover:bg-white text-gray-800 text-xs px-2 py-1 rounded-md flex items-center shadow-md"
              >
                {debugMode ? "Ocultar depurador" : "Mostrar depurador"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
