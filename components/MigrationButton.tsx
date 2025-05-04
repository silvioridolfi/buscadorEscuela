"use client"

import { useState } from "react"
import { Database, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react"

export default function MigrationButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runMigration = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // En un entorno de producción, deberías usar una clave de autorización
      // que se configura como variable de entorno
      const migrationKey = prompt("Ingrese la clave de migración:")

      if (!migrationKey) {
        setError("Se requiere una clave de migración")
        setLoading(false)
        return
      }

      const response = await fetch(`/api/migrate?key=${migrationKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al ejecutar la migración")
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-xl">
        <h3 className="text-white font-bold mb-3 flex items-center">
          <Database className="w-4 h-4 mr-2" />
          Migración a Supabase
        </h3>

        <button
          onClick={runMigration}
          disabled={loading}
          className="w-full py-2 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:from-primary/90 hover:to-secondary/90 transition-all font-medium shadow-lg text-sm flex items-center justify-center"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Migrando datos...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              Ejecutar migración
            </>
          )}
        </button>

        {error && (
          <div className="mt-3 p-3 bg-red-900/50 border border-red-500/30 rounded-xl text-sm text-red-200">
            <div className="flex items-start">
              <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-3 p-3 bg-green-900/50 border border-green-500/30 rounded-xl text-sm text-green-200">
            <div className="flex items-start mb-2">
              <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
              <span>Migración completada</span>
            </div>
            <div className="text-xs space-y-1">
              <p>
                Establecimientos: {result.resultados.establecimientos.insertados} de{" "}
                {result.resultados.establecimientos.total}
              </p>
              <p>
                Contactos: {result.resultados.contactos.insertados} de {result.resultados.contactos.total}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
