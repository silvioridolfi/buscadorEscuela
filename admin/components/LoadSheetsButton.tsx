"use client"

import { useState } from "react"
import { RefreshCw, Database, CheckCircle, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function LoadSheetsButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const loadFromSheets = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Obtener el token de administrador del localStorage
      const adminToken = localStorage.getItem("adminToken")

      if (!adminToken) {
        throw new Error("No se encontró el token de administrador")
      }

      const response = await fetch("/api/admin/load-sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar datos desde Google Sheets")
      }

      setResult(data.resultados)

      toast({
        title: "Datos cargados correctamente",
        description: `Se insertaron ${data.resultados.establecimientos.insertados} establecimientos y ${data.resultados.contactos.insertados} contactos.`,
        variant: "default",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      setError(errorMessage)

      toast({
        title: "Error al cargar datos",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-xl">
      <h3 className="text-white font-bold mb-3 flex items-center">
        <Database className="w-4 h-4 mr-2" />
        Cargar Datos desde Google Sheets
      </h3>

      <div className="bg-gray-800/50 p-4 rounded-xl border border-white/10 mb-4">
        <p className="text-white/80 text-sm">
          Este proceso carga todos los datos desde las hojas de Google Sheets a la base de datos Supabase, reemplazando
          los datos existentes.
        </p>
      </div>

      <button
        onClick={loadFromSheets}
        disabled={loading}
        className="w-full py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:from-primary/90 hover:to-secondary/90 transition-all font-medium shadow-lg text-sm flex items-center justify-center disabled:opacity-50"
      >
        {loading ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Cargando datos...
          </>
        ) : (
          <>
            <Database className="w-4 h-4 mr-2" />
            Cargar datos desde Sheets
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
            <span>Carga de datos finalizada</span>
          </div>
          <div className="text-xs space-y-1">
            <p>
              Establecimientos: {result.establecimientos.insertados} de {result.establecimientos.total}
              {result.establecimientos.errores > 0 && (
                <span className="text-red-300"> (Errores: {result.establecimientos.errores})</span>
              )}
            </p>
            <p>
              Contactos: {result.contactos.insertados} de {result.contactos.total}
              {result.contactos.errores > 0 && (
                <span className="text-red-300"> (Errores: {result.contactos.errores})</span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
