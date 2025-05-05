"use client"

import type React from "react"

import { useState } from "react"
import { Lock, LogIn, AlertTriangle } from "lucide-react"

interface AdminLoginProps {
  onLogin: (password: string) => Promise<boolean>
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const success = await onLogin(password)
      if (!success) {
        setError("Credenciales inválidas. Por favor, intente nuevamente.")
      }
    } catch (err) {
      setError("Error al iniciar sesión. Por favor, intente nuevamente.")
      console.error("Error de inicio de sesión:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl max-w-md w-full">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center justify-center">
        <Lock className="w-6 h-6 mr-2" />
        Acceso Administrativo
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
            Contraseña de administrador
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border-2 border-white/30 focus:border-primary text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-lg bg-white/5 backdrop-blur-sm"
            placeholder="Ingrese la contraseña"
            required
          />
        </div>

        {error && (
          <div className="p-3 bg-red-900/50 border border-red-500/30 rounded-xl text-sm text-red-200">
            <div className="flex items-start">
              <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:from-primary/90 hover:to-secondary/90 transition-all font-medium shadow-lg text-sm flex items-center justify-center"
        >
          {loading ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Iniciando sesión...
            </span>
          ) : (
            <span className="flex items-center">
              <LogIn className="w-4 h-4 mr-2" />
              Iniciar sesión
            </span>
          )}
        </button>
      </form>
    </div>
  )
}
