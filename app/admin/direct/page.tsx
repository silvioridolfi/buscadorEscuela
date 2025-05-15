"use client"

import { useEffect, useState } from "react"
import { getBypassToken } from "@/lib/admin-bypass"
import AdminPanel from "@/admin/components/AdminPanel"

export default function AdminDirectPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const bypassToken = getBypassToken()

    // Verificar la autenticación con el token de bypass
    const verifyAuth = async () => {
      try {
        const response = await fetch("/api/admin/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: bypassToken }),
        })

        const data = await response.json()

        if (data.success) {
          setIsAuthenticated(true)
          // Guardar el token en localStorage para que otras páginas lo puedan usar
          localStorage.setItem("adminToken", bypassToken)
        } else {
          setError("Error de autenticación: " + (data.error || "Token inválido"))
        }
      } catch (err) {
        setError("Error al verificar la autenticación: " + (err instanceof Error ? err.message : String(err)))
      } finally {
        setIsLoading(false)
      }
    }

    verifyAuth()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="bg-red-900/50 text-white p-6 rounded-lg max-w-md">
          <h2 className="text-xl font-bold mb-4">Error de Acceso</h2>
          <p className="mb-4">{error}</p>
          <p className="text-sm opacity-80">Contacta al administrador del sistema para resolver este problema.</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <AdminPanel authToken={getBypassToken()} />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="bg-red-900/50 text-white p-6 rounded-lg max-w-md">
        <h2 className="text-xl font-bold mb-4">Acceso Denegado</h2>
        <p className="mb-4">No tienes permiso para acceder a esta página.</p>
      </div>
    </div>
  )
}
