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
      setError(err instanceof Error ? err.message : "Error al obtener el estado de la API")
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
              Estado de la API
            </h3>
            <button onClick={() => setExpanded(false)} className="text-gray-500 hover:text-gray-700">
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div className="p-2 rounded bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="font-medium">API Activa:</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Supabase
                </span>
              </div>
            </div>

            <div className="p-2 rounded bg-green-50">
              <div className="font-medium flex items-center mb-1">
                <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                Supabase
              </div>
              <div className="text-xs text-gray-600">
                <div>Estado: Activo</div>
                <div>Entorno: {status.supabase?.environment || "development"}</div>
              </div>
            </div>

            {status.transitionInfo && (
              <div className="p-2 rounded bg-blue-50">
                <div className="font-medium flex items-center mb-1 text-blue-800">Información</div>
                <div className="text-xs text-blue-700">
                  <div>{status.transitionInfo.message}</div>
                  <div>Versión: {status.transitionInfo.version}</div>
                </div>
              </div>
            )}

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
          className="p-2 rounded-full shadow-lg flex items-center justify-center bg-green-500 text-white"
          title="API activa: Supabase"
        >
          <Database className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
