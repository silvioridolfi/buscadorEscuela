"use client"

import { useEffect, useState } from "react"
import { MapPin } from "lucide-react"

interface SchoolMapProps {
  lat: string
  lon: string
  schoolName: string
}

export default function SchoolMap({ lat, lon, schoolName }: SchoolMapProps) {
  const [mapUrl, setMapUrl] = useState<string | null>(null)
  const [directUrl, setDirectUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMapData() {
      if (!lat || !lon) {
        setError("Coordenadas no disponibles")
        setLoading(false)
        return
      }

      try {
        const response = await fetch(
          `/api/maps?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&name=${encodeURIComponent(schoolName)}`,
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Error al obtener el mapa")
        }

        const data = await response.json()
        setMapUrl(data.mapUrl)
        setDirectUrl(data.directUrl)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching map:", err)
        setError(err.message || "Error al cargar el mapa")
        setDirectUrl(`https://www.google.com/maps?q=${lat},${lon}`)
        setLoading(false)
      }
    }

    fetchMapData()
  }, [lat, lon, schoolName])

  if (loading) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error || !mapUrl) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-lg flex flex-col items-center justify-center p-4 text-center">
        <p className="text-gray-500 mb-2">{error || "No se pudo cargar el mapa"}</p>
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
        <p className="text-xs text-gray-400 mt-2">
          Coordenadas: {lat}, {lon}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden">
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
    </div>
  )
}
