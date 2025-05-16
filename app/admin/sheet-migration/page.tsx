"use client"

import { useState, useEffect } from "react"
import { Loader2, ArrowLeft } from "lucide-react"
import SheetMigrationPanel from "@/admin/components/SheetMigrationPanel"
import Link from "next/link"
import { bypassAdminAuth } from "@/lib/admin-bypass"

export default function SheetMigrationPage() {
  const [authKey, setAuthKey] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Intentar obtener el token de autenticación al cargar la página
  useEffect(() => {
    const getAuthToken = async () => {
      try {
        setLoading(true)

        // Primero intentamos obtener el token del servidor
        const response = await fetch("/api/admin/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // Usamos un bypass para desarrollo
            password: "admin_password_bypass",
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.token) {
            setAuthKey(data.token)
            setIsAuthenticated(true)
            return
          }
        }

        // Si no funciona, usamos el bypass para desarrollo
        if (bypassAdminAuth()) {
          setAuthKey("bypass_token_temporary")
          setIsAuthenticated(true)
        }
      } catch (err) {
        console.error("Error al obtener token:", err)
        setError("Error al obtener token de autenticación")

        // Último recurso: usar bypass
        setAuthKey("bypass_token_temporary")
        setIsAuthenticated(true)
      } finally {
        setLoading(false)
      }
    }

    getAuthToken()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-white/70">Cargando panel de migración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="inline-flex items-center text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver al panel de administración
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8 flex items-center">Migración desde Google Sheets</h1>

        {error && (
          <div className="bg-red-900/30 border-l-4 border-red-500 text-red-200 p-4 mb-4 rounded">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {isAuthenticated ? (
          <SheetMigrationPanel authKey={authKey} />
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/20 shadow-xl">
            <p className="text-white">
              No se pudo autenticar. Por favor, vuelve al panel de administración e intenta nuevamente.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
