"use client"

import type React from "react"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import CompleteMigrationPanel from "@/admin/components/CompleteMigrationPanel"

export default function CompleteMigrationPage() {
  const [authKey, setAuthKey] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!authKey) {
      setError("Por favor, ingresa la clave de autenticación")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ authKey }),
      })

      if (response.ok) {
        setIsAuthenticated(true)
      } else {
        const data = await response.json()
        setError(data.error || "Error de autenticación")
      }
    } catch (err) {
      console.error("Error de autenticación:", err)
      setError("Error al verificar la autenticación")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Migración Completa de Datos</h1>

        {!isAuthenticated ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/20 shadow-xl max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4">Autenticación</h2>

            {error && (
              <div className="bg-red-900/30 border-l-4 border-red-500 text-red-200 p-4 mb-4 rounded">
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleAuth}>
              <div className="mb-4">
                <label htmlFor="authKey" className="block text-sm font-medium mb-1">
                  Clave de Autenticación
                </label>
                <input
                  type="password"
                  id="authKey"
                  value={authKey}
                  onChange={(e) => setAuthKey(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ingresa tu clave de autenticación"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !authKey}
                className="w-full flex justify-center items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                {loading ? "Verificando..." : "Acceder"}
              </button>
            </form>
          </div>
        ) : (
          <CompleteMigrationPanel authKey={authKey} />
        )}
      </div>
    </div>
  )
}
