"use client"

import { useState } from "react"
import { Database, RefreshCw, CheckCircle, AlertTriangle, Trash2, Download, Server } from "lucide-react"

export default function MigrationButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [migrationKey, setMigrationKey] = useState("")
  const [logMessages, setLogMessages] = useState<string[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  const runMigration = async () => {
    if (!migrationKey) {
      setError("Se requiere una clave de migración")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setLogMessages(["Iniciando migración completa de la base de datos con TODOS los campos..."])

    try {
      // Añadir un timestamp para evitar caché
      const timestamp = Date.now()
      const response = await fetch(`/api/migrate?key=${encodeURIComponent(migrationKey)}&_t=${timestamp}`, {
        method: "POST",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      // Intentar obtener el texto de la respuesta primero
      const responseText = await response.text()
      addLogMessage("Respuesta recibida del servidor")

      // Intentar parsear como JSON
      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        // Si no es JSON válido, mostrar el texto como error
        throw new Error(`Respuesta no válida: ${responseText.substring(0, 500)}...`)
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || "Error al ejecutar la migración")
      }

      // Mostrar logs del servidor
      if (data.logs && Array.isArray(data.logs)) {
        data.logs.forEach((log) => addLogMessage(`[Servidor] ${log}`))
      }

      addLogMessage(
        `Migración completada: ${data.resultados?.establecimientos?.insertados || 0} establecimientos y ${data.resultados?.contactos?.insertados || 0} contactos migrados con TODOS sus campos`,
      )
      setResult(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      addLogMessage(`Error: ${errorMessage}`)
      setError(errorMessage)
      console.error("Error en migración:", err)
    } finally {
      setLoading(false)
    }
  }

  const addLogMessage = (message: string) => {
    setLogMessages((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-xl">
      <h3 className="text-white font-bold mb-3 flex items-center">
        <Database className="w-4 h-4 mr-2" />
        Migración Completa a Supabase
      </h3>

      <div className="bg-gray-800/50 p-4 rounded-xl border border-white/10 mb-4">
        <h4 className="text-white font-bold flex items-center mb-2">
          <Server className="w-4 h-4 mr-2 text-primary" />
          Información de Migración
        </h4>
        <p className="text-white/80 text-sm">
          Este proceso ejecuta una migración completa de todos los datos desde las hojas de Google Sheets a la base de
          datos Supabase, incluyendo todos los campos disponibles.
        </p>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-primary hover:text-primary/80 text-sm mt-2 flex items-center"
        >
          {showAdvanced ? "Ocultar detalles" : "Mostrar más detalles"}
        </button>

        {showAdvanced && (
          <ul className="list-disc list-inside text-white/80 text-sm mt-2 space-y-1 pl-2">
            <li>
              <strong>Limpieza de datos existentes</strong> - Se eliminarán todos los registros actuales
            </li>
            <li>
              Obtención de todos los establecimientos educativos con <strong>TODOS</strong> sus campos
            </li>
            <li>
              Obtención de todos los datos de contacto con <strong>TODOS</strong> sus campos
            </li>
            <li>
              Migración de campos específicos como <strong>Fed a cargo, PREDIO, LAT, LON</strong> y todos los demás
            </li>
            <li>Transformación de datos al formato de Supabase</li>
            <li>Inserción de registros en la base de datos</li>
          </ul>
        )}
      </div>

      <div className="bg-amber-900/30 p-3 rounded-xl border border-amber-500/30 mb-4">
        <div className="flex items-start">
          <Trash2 className="w-4 h-4 text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-amber-200 text-sm">
            <p className="font-bold">¡Atención! Esta operación eliminará todos los datos existentes</p>
            <p className="mt-1">
              Antes de insertar los nuevos datos, se eliminarán todos los registros existentes en las tablas de
              establecimientos y contactos.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <label htmlFor="migrationKey" className="block text-sm font-medium text-white/90">
          Clave de Migración
        </label>
        <input
          type="password"
          id="migrationKey"
          value={migrationKey}
          onChange={(e) => setMigrationKey(e.target.value)}
          className="w-full px-4 py-2 rounded-xl border-2 border-white/30 focus:border-primary text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-lg bg-white/5 backdrop-blur-sm"
          placeholder="Ingrese la clave de migración"
        />
      </div>

      <button
        onClick={runMigration}
        disabled={loading || !migrationKey.trim()}
        className="w-full py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:from-primary/90 hover:to-secondary/90 transition-all font-medium shadow-lg text-sm flex items-center justify-center disabled:opacity-50"
      >
        {loading ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Ejecutando migración completa...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Ejecutar Migración Completa
          </>
        )}
      </button>

      {/* Log de mensajes */}
      {logMessages.length > 0 && (
        <div className="mt-3 p-3 bg-gray-800/70 border border-white/10 rounded-xl text-xs text-white/80 font-mono">
          <div className="mb-2 font-bold text-white/90">Log de Migración:</div>
          <div className="overflow-auto max-h-60">
            {logMessages.map((msg, index) => (
              <div key={index} className="py-0.5">
                {msg}
              </div>
            ))}
          </div>
        </div>
      )}

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
            <span>Migración completa finalizada</span>
          </div>
          <div className="text-xs space-y-1">
            <p>
              Establecimientos: {result.resultados?.establecimientos?.insertados} de{" "}
              {result.resultados?.establecimientos?.total}
              {result.resultados?.establecimientos?.errores > 0 && (
                <span className="text-red-300"> (Errores: {result.resultados.establecimientos.errores})</span>
              )}
            </p>
            <p>
              Contactos: {result.resultados?.contactos?.insertados} de {result.resultados?.contactos?.total}
              {result.resultados?.contactos?.errores > 0 && (
                <span className="text-red-300"> (Errores: {result.resultados.contactos.errores})</span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
