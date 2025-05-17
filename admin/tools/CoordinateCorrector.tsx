"use client"

import { useState } from "react"
import { MapPin, Search, RefreshCw, CheckCircle, AlertTriangle, Save } from "lucide-react"

export default function CoordinateCorrector() {
  const [cue, setCue] = useState("")
  const [schoolInfo, setSchoolInfo] = useState<any>(null)
  const [newLat, setNewLat] = useState("")
  const [newLon, setNewLon] = useState("")
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [geocodeResults, setGeocodeResults] = useState<any>(null)
  const [geocodeLoading, setGeocodeLoading] = useState(false)

  // Buscar escuela por CUE
  const searchSchool = async () => {
    if (!cue) return

    setLoading(true)
    setSearchError(null)
    setSchoolInfo(null)
    setUpdateSuccess(false)
    setGeocodeResults(null)

    try {
      const timestamp = Date.now()
      const response = await fetch(`/api/debug/map-coordinates?cue=${encodeURIComponent(cue)}&_t=${timestamp}`, {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      setSchoolInfo(data)

      // Inicializar los campos con los valores actuales
      setNewLat(data.lat.asString || "")
      setNewLon(data.lon.asString || "")
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  // Geocodificar dirección
  const geocodeAddress = async () => {
    if (!schoolInfo) return

    setGeocodeLoading(true)
    setGeocodeResults(null)

    try {
      const address = schoolInfo.nombre
      const district = schoolInfo.distrito || ""
      const city = schoolInfo.ciudad || ""

      const timestamp = Date.now()
      const response = await fetch(
        `/api/geocode?address=${encodeURIComponent(address)}&district=${encodeURIComponent(district)}&city=${encodeURIComponent(city)}&_t=${timestamp}`,
        { cache: "no-store" },
      )

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      setGeocodeResults(data)

      // Actualizar los campos con las coordenadas geocodificadas
      if (data.lat && data.lng) {
        setNewLat(String(data.lat))
        setNewLon(String(data.lng))
      }
    } catch (err) {
      console.error("Error en geocodificación:", err)
    } finally {
      setGeocodeLoading(false)
    }
  }

  // Actualizar coordenadas
  const updateCoordinates = async () => {
    if (!schoolInfo || !newLat || !newLon) return

    setLoading(true)
    setUpdateError(null)
    setUpdateSuccess(false)

    try {
      // Obtener la clave de migración
      const migrationKey = prompt("Ingrese la clave de migración:")

      if (!migrationKey) {
        setUpdateError("Se requiere una clave de migración")
        setLoading(false)
        return
      }

      const response = await fetch(`/api/admin/update-coordinates?key=${encodeURIComponent(migrationKey)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cue: schoolInfo.cue,
          lat: newLat,
          lon: newLon,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error: ${response.status}`)
      }

      const data = await response.json()
      setUpdateSuccess(true)

      // Actualizar la información de la escuela
      setTimeout(() => {
        searchSchool()
      }, 1000)
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center">
        <MapPin className="w-5 h-5 mr-2 text-primary" />
        Corrector de Coordenadas
      </h2>

      <div className="mb-6">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={cue}
            onChange={(e) => setCue(e.target.value)}
            placeholder="Ingrese CUE"
            className="flex-grow px-4 py-2 rounded-xl border-2 border-white/30 focus:border-primary text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-lg bg-white/5 backdrop-blur-sm"
          />
          <button
            onClick={searchSchool}
            disabled={loading || !cue}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl flex items-center justify-center min-w-[100px] disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span className="ml-2">Buscar</span>
          </button>
        </div>

        {searchError && (
          <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-xl text-sm text-red-300 mb-4">
            <AlertTriangle className="w-4 h-4 inline-block mr-2" />
            {searchError}
          </div>
        )}
      </div>

      {schoolInfo && (
        <div className="space-y-6">
          <div className="p-4 bg-gray-800/50 rounded-xl border border-white/10">
            <h3 className="font-bold text-white mb-2">{schoolInfo.nombre}</h3>
            <p className="text-white/70 text-sm">CUE: {schoolInfo.cue}</p>
            {schoolInfo.distrito && <p className="text-white/70 text-sm">Distrito: {schoolInfo.distrito}</p>}
            {schoolInfo.ciudad && <p className="text-white/70 text-sm">Ciudad: {schoolInfo.ciudad}</p>}
            {schoolInfo.direccion && <p className="text-white/70 text-sm">Dirección: {schoolInfo.direccion}</p>}
          </div>

          <div className="p-4 bg-gray-800/50 rounded-xl border border-white/10">
            <h3 className="font-bold text-white mb-3 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-primary" />
              Coordenadas Actuales
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-white/70 text-sm mb-1">Latitud:</p>
                <p className="text-white font-mono bg-gray-700/50 p-2 rounded-md">
                  {schoolInfo.lat?.raw !== undefined ? String(schoolInfo.lat.raw) : "No disponible"}
                </p>
              </div>
              <div>
                <p className="text-white/70 text-sm mb-1">Longitud:</p>
                <p className="text-white font-mono bg-gray-700/50 p-2 rounded-md">
                  {schoolInfo.lon?.raw !== undefined ? String(schoolInfo.lon.raw) : "No disponible"}
                </p>
              </div>
            </div>

            {schoolInfo.googleMapsUrl && (
              <a
                href={schoolInfo.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center text-sm"
              >
                <MapPin className="w-4 h-4 mr-1" />
                Ver en Google Maps
              </a>
            )}
          </div>

          <div className="p-4 bg-gray-800/50 rounded-xl border border-white/10">
            <h3 className="font-bold text-white mb-3">Geocodificar Dirección</h3>
            <button
              onClick={geocodeAddress}
              disabled={geocodeLoading}
              className="w-full px-4 py-2 bg-secondary hover:bg-secondary/90 text-white rounded-xl flex items-center justify-center mb-4 disabled:opacity-50"
            >
              {geocodeLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <MapPin className="w-4 h-4 mr-2" />
              )}
              Obtener Coordenadas por Dirección
            </button>

            {geocodeResults && (
              <div className="bg-gray-700/50 p-3 rounded-xl text-sm">
                <p className="text-white/90 mb-2">
                  <span className="font-bold">Dirección encontrada:</span> {geocodeResults.formattedAddress}
                </p>
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <p className="text-white/90">
                    <span className="font-bold">Lat:</span> {geocodeResults.lat}
                  </p>
                  <p className="text-white/90">
                    <span className="font-bold">Lon:</span> {geocodeResults.lng}
                  </p>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${geocodeResults.lat},${geocodeResults.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center text-sm"
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  Ver en Google Maps
                </a>
              </div>
            )}
          </div>

          <div className="p-4 bg-gray-800/50 rounded-xl border border-white/10">
            <h3 className="font-bold text-white mb-3 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-primary" />
              Nuevas Coordenadas
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="newLat" className="text-white/70 text-sm mb-1 block">
                  Nueva Latitud:
                </label>
                <input
                  id="newLat"
                  type="text"
                  value={newLat}
                  onChange={(e) => setNewLat(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/30 focus:border-primary text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-lg bg-white/5 backdrop-blur-sm"
                  placeholder="-34.6037"
                />
              </div>
              <div>
                <label htmlFor="newLon" className="text-white/70 text-sm mb-1 block">
                  Nueva Longitud:
                </label>
                <input
                  id="newLon"
                  type="text"
                  value={newLon}
                  onChange={(e) => setNewLon(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/30 focus:border-primary text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-lg bg-white/5 backdrop-blur-sm"
                  placeholder="-58.3816"
                />
              </div>
            </div>

            <button
              onClick={updateCoordinates}
              disabled={loading || !newLat || !newLon}
              className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl flex items-center justify-center disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Actualizar Coordenadas
            </button>

            {updateError && (
              <div className="mt-3 p-3 bg-red-900/30 border border-red-500/30 rounded-xl text-sm text-red-300">
                <AlertTriangle className="w-4 h-4 inline-block mr-2" />
                {updateError}
              </div>
            )}

            {updateSuccess && (
              <div className="mt-3 p-3 bg-green-900/30 border border-green-500/30 rounded-xl text-sm text-green-300">
                <CheckCircle className="w-4 h-4 inline-block mr-2" />
                Coordenadas actualizadas correctamente
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
