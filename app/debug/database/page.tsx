"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function DatabaseStructurePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDatabaseStructure() {
      try {
        const response = await fetch("/api/debug/database-structure")
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setLoading(false)
      }
    }

    fetchDatabaseStructure()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-500/20 p-6 rounded-lg max-w-2xl">
          <h1 className="text-xl font-bold text-white mb-4">Error</h1>
          <p className="text-white/80">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Estructura de la Base de Datos</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Tabla de Establecimientos */}
          <div className="bg-white/10 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">Tabla: establecimientos</h2>

            <h3 className="text-lg font-semibold text-white/80 mt-6 mb-3">Columnas</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-white/70">
                <thead className="text-xs uppercase bg-white/10 text-white/80">
                  <tr>
                    <th className="px-4 py-2">Columna</th>
                    <th className="px-4 py-2">Tipo</th>
                    <th className="px-4 py-2">Nullable</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.establecimientos?.columns?.map((col: any, index: number) => (
                    <tr key={index} className="border-b border-white/10">
                      <td className="px-4 py-2 font-medium">{col.column_name}</td>
                      <td className="px-4 py-2">{col.data_type}</td>
                      <td className="px-4 py-2">{col.is_nullable ? "Sí" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold text-white/80 mt-6 mb-3">Datos de Muestra</h3>
            <div className="overflow-x-auto">
              <pre className="bg-gray-800 p-4 rounded-lg text-xs text-white/70 overflow-x-auto">
                {JSON.stringify(data?.establecimientos?.sample, null, 2)}
              </pre>
            </div>
          </div>

          {/* Tabla de Contactos */}
          <div className="bg-white/10 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">Tabla: contactos</h2>

            <h3 className="text-lg font-semibold text-white/80 mt-6 mb-3">Columnas</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-white/70">
                <thead className="text-xs uppercase bg-white/10 text-white/80">
                  <tr>
                    <th className="px-4 py-2">Columna</th>
                    <th className="px-4 py-2">Tipo</th>
                    <th className="px-4 py-2">Nullable</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.contactos?.columns?.map((col: any, index: number) => (
                    <tr key={index} className="border-b border-white/10">
                      <td className="px-4 py-2 font-medium">{col.column_name}</td>
                      <td className="px-4 py-2">{col.data_type}</td>
                      <td className="px-4 py-2">{col.is_nullable ? "Sí" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold text-white/80 mt-6 mb-3">Datos de Muestra</h3>
            <div className="overflow-x-auto">
              <pre className="bg-gray-800 p-4 rounded-lg text-xs text-white/70 overflow-x-auto">
                {JSON.stringify(data?.contactos?.sample, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
