"use client"

import { useState, useEffect } from "react"
import { Database, RefreshCw, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

export default function ApiStatusIndicator() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const fetchStatus = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/status")
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      setStatus(data)
    } catch (err) {
      setError(err.message || "Error al obtener el estado de la API")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()

    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${Math.round(ms / 1000)}s`
    return `${Math.round(ms / 60000)}m`
  }

  if (!status) {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full shadow-lg z-50 flex items-center">
        {loading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
        )}
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {expanded ? (
        <div className="bg-white rounded-lg shadow-lg p-4 w-80 animate-fadeIn">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800 flex items-center">
              <Database className="w-4 h-4 mr-2" />
              Estado de las APIs
            </h3>
            <button onClick={() => setExpanded(false)} className="text-gray-500 hover:text-gray-700">
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div className="p-2 rounded bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="font-medium">API Activa:</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    status.activeApi === "primary" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {status.activeApi === "primary" ? "SheetDB (Principal)" : "Sheet2API (Secundaria)"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className={`p-2 rounded ${status.primary.active ? "bg-green-50" : "bg-gray-50"}`}>
                <div className="font-medium flex items-center mb-1">
                  {status.primary.active ? (
                    <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-yellow-500 mr-1" />
                  )}
                  SheetDB
                </div>
                <div className="text-xs text-gray-600">
                  <div>Fallos: {status.primary.failCount}</div>
                  {status.primary.lastFailTime > 0 && (
                    <div>Cooldown: {formatTime(status.primary.cooldownRemaining)}</div>
                  )}
                </div>
              </div>

              <div className={`p-2 rounded ${status.secondary.active ? "bg-green-50" : "bg-gray-50"}`}>
                <div className="font-medium flex items-center mb-1">
                  {status.secondary.active ? (
                    <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-yellow-500 mr-1" />
                  )}
                  Sheet2API
                </div>
                <div className="text-xs text-gray-600">
                  <div>Fallos: {status.secondary.failCount}</div>
                  {status.secondary.lastFailTime > 0 && (
                    <div>Cooldown: {formatTime(status.secondary.cooldownRemaining)}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-2 rounded bg-gray-50">
              <div className="font-medium mb-1">Caché</div>
              <div className="text-xs text-gray-600">
                <div>Datos: {status.cache.hasEstablishmentsData ? "Disponibles" : "No disponibles"}</div>
                <div>Edad: {formatTime(status.cache.age)}</div>
                <div>Expira en: {formatTime(status.cache.expiresIn)}</div>
              </div>
            </div>

            <button
              onClick={fetchStatus}
              className="w-full py-1 px-3 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 flex items-center justify-center"
              disabled={loading}
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className={`p-2 rounded-full shadow-lg flex items-center justify-center ${
            status.activeApi === "primary" ? "bg-green-500 text-white" : "bg-blue-500 text-white"
          }`}
          title={`API activa: ${status.activeApi === "primary" ? "SheetDB (Principal)" : "Sheet2API (Secundaria)"}`}
        >
          <Database className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
