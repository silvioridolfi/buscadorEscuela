"use client"

import { useState, useEffect } from "react"
import AdminLogin from "@/admin/components/AdminLogin"
import AdminPanel from "@/admin/components/AdminPanel"
import { Loader2 } from "lucide-react"
import Image from "next/image"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Verificar si hay un token guardado al cargar la página
  useEffect(() => {
    const token = localStorage.getItem("adminToken")
    if (token) {
      verifyToken(token)
    } else {
      setIsAuthenticated(false)
      setIsLoading(false)
    }
  }, [])

  // Verificar el token con el servidor
  const verifyToken = async (token: string) => {
    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      if (response.ok) {
        setIsAuthenticated(true)
      } else {
        // Token inválido, eliminar del almacenamiento local
        localStorage.removeItem("adminToken")
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error("Error al verificar el token:", error)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Manejar el inicio de sesión
  const handleLogin = async (password: string) => {
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        const data = await response.json()
        // Guardar el token en el almacenamiento local
        localStorage.setItem("adminToken", data.token)
        setIsAuthenticated(true)
        return true
      }
      return false
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      return false
    }
  }

  // Manejar el cierre de sesión
  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    setIsAuthenticated(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="mt-4 text-white font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 mb-4 bg-gradient-to-br from-primary via-secondary to-accent rounded-full backdrop-blur-md flex items-center justify-center overflow-hidden shadow-2xl relative">
            <div className="absolute inset-2 rounded-full bg-white/15 backdrop-blur-sm"></div>
            <div className="absolute w-16 h-16 bg-white/30 rounded-full filter blur-md animate-pulse-slow"></div>
            <div className="relative w-16 h-16 flex items-center justify-center z-10">
              <Image
                src="/mi_escuela_1.png"
                alt="Icono de escuela"
                width={64}
                height={64}
                className="object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                priority
              />
            </div>
          </div>
          <h1 className="text-center text-white text-2xl font-bold mb-2">Administración</h1>
          <p className="text-white/70 text-center">Buscador de establecimientos educativos</p>
        </div>
      </div>

      {isAuthenticated ? <AdminPanel onLogout={handleLogout} /> : <AdminLogin onLogin={handleLogin} />}

      <div className="mt-8 text-center text-white/50 text-xs">
        © {new Date().getFullYear()} Dirección de Tecnología Educativa
      </div>
    </main>
  )
}
