"use client"

import type React from "react"

import { useState } from "react"
import { Key, Save, CheckCircle, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function GoogleSheetsApiKeyForm() {
  const [apiKey, setApiKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Obtener el token de administrador
      const adminToken = localStorage.getItem("adminToken")

      if (!adminToken) {
        throw new Error("No se encontró el token de administrador. Por favor, inicie sesión nuevamente.")
      }

      // Enviar la clave de API al servidor
      const response = await fetch("/api/admin/set-google-api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ apiKey }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      setSuccess(true)
      setApiKey("")

      toast({
        title: "Clave de API guardada",
        description: "La clave de API de Google Sheets se ha guardado correctamente.",
        variant: "default",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      setError(errorMessage)

      toast({
        title: "Error al guardar la clave de API",
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
        <Key className="w-4 h-4 mr-2" />
        Configurar Clave de API de Google Sheets
      </h3>

      <div className="bg-gray-800/50 p-4 rounded-xl border border-white/10 mb-4">
        <p className="text-white/80 text-sm">
          Ingresa tu clave de API de Google Sheets para poder acceder a los datos. La clave debe tener acceso a la API
          de Google Sheets.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-white/80 mb-1">
            Clave de API de Google Sheets
          </label>
          <input
            type="text"
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSyC..."
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !apiKey}
          className="w-full py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:from-primary/90 hover:to-secondary/90 transition-all font-medium shadow-lg text-sm flex items-center justify-center disabled:opacity-50"
        >
          {loading ? (
            <>
              <Save className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Guardar Clave de API
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="mt-3 p-3 bg-red-900/50 border border-red-500/30 rounded-xl text-sm text-red-200">
          <div className="flex items-start">
            <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mt-3 p-3 bg-green-900/50 border border-green-500/30 rounded-xl text-sm text-green-200">
          <div className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            <span>Clave de API guardada correctamente.</span>
          </div>
        </div>
      )}
    </div>
  )
}
