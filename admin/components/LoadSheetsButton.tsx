"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Database, CheckCircle, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function LoadSheetsButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [adminToken, setAdminToken] = useState<string | null>(null)
  const { toast } = useToast()

  // Recuperar el token al montar el componente
  useEffect(() => {
    const token = localStorage.getItem("adminToken")
    setAdminToken(token)

    // Verificar el token al cargar el componente
    if (token) {
      verifyToken(token)
    }
  }, [])

  // Función para verificar el token
  const verifyToken = async (token: string) => {
    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        console.error(`Error al verificar el token: ${response.status}`)
        // Si el token no es válido, mostrar un mensaje y eliminarlo
        localStorage.removeItem("adminToken")
        setAdminToken(null)
        setError("El token almacenado no es válido. Por favor, inicie sesión nuevamente.")
      }
    } catch (error) {
      console.error("Error al verificar el token:", error)
    }
  }

  const loadFromSheets = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Verificar que tenemos el token
      if (!adminToken) {
        throw new Error("No se encontró el token de administrador. Por favor, inicie sesión nuevamente.")
      }

      console.log("Iniciando migración completa de la base de datos...")
      console.log(`Token disponible: ${adminToken ? "Sí (últimos 4 caracteres: " + adminToken.slice(-4) + ")" : "No"}`)

      const response = await fetch("/api/admin/load-sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        // Añadir un cuerpo vacío para asegurarnos de que la solicitud se envíe correctamente
        body: JSON.stringify({}),
      })

      console.log(`[${new Date().toLocaleTimeString()}] Respuesta recibida del servidor: ${response.status}`)

      // Si la respuesta no es exitosa, intentar obtener el mensaje de error
      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`

        try {
          // Intentar obtener el texto de la respuesta primero
          const responseText = await response.text()

          // Intentar analizar el texto como JSON
          try {
            const errorData = JSON.parse(responseText)
            if (errorData && errorData.error) {
              errorMessage = errorData.error
              if (errorData.details) {
                errorMessage += ` - ${typeof errorData.details === "string" ? errorData.details : JSON.stringify(errorData.details)}`
              }
            }
          } catch (jsonError) {
            // Si no es JSON válido, usar el texto como está
            errorMessage = responseText || errorMessage
          }
        } catch (e) {
          console.error("Error al obtener el texto de la respuesta:", e)
        }

        throw new Error(errorMessage)
      }

      // Intentar analizar la respuesta como JSON
      let data
      try {
        const responseText = await response.text()
        data = JSON.parse(responseText)
      } catch (jsonError) {
        console.error("Error al analizar la respuesta como JSON:", jsonError)
        throw new Error("La respuesta del servidor no es JSON válido")
      }

      if (!data.success) {
        throw new Error(data.error || "Error desconocido al cargar datos")
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
      console.error("Error en la migración:", errorMessage)

      toast({
        title: "Error al cargar datos",
        description: errorMessage,
        variant: "destructive",
      })

      // Si el error es de autenticación, sugerir iniciar sesión nuevamente
      if (errorMessage.includes("Unauthorized") || errorMessage.includes("Token inválido")) {
        localStorage.removeItem("adminToken")
        setAdminToken(null)
        toast({
          title: "Sesión expirada",
          description: "Por favor, inicie sesión nuevamente.",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // Función para cerrar sesión y volver a la pantalla de login
  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    setAdminToken(null)
    window.location.reload()
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

      {!adminToken && (
        <div className="mb-4 p-3 bg-amber-900/50 border border-amber-500/30 rounded-xl text-sm text-amber-200">
          <div className="flex items-start">
            <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            <span>No se encontró el token de administrador. Por favor, inicie sesión nuevamente.</span>
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 w-full py-2 px-3 bg-amber-700/50 hover:bg-amber-700/70 text-amber-100 rounded-lg text-xs font-medium transition-colors"
          >
            Volver a iniciar sesión
          </button>
        </div>
      )}

      <button
        onClick={loadFromSheets}
        disabled={loading || !adminToken}
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
          {(error.includes("Unauthorized") || error.includes("Token inválido")) && (
            <button
              onClick={handleLogout}
              className="mt-2 w-full py-2 px-3 bg-red-700/50 hover:bg-red-700/70 text-red-100 rounded-lg text-xs font-medium transition-colors"
            >
              Volver a iniciar sesión
            </button>
          )}
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
