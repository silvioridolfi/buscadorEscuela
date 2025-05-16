"use client"

import { useState } from "react"
import { Loader2, AlertCircle, RefreshCw, Play } from "lucide-react"

export default function VerifyMigrationPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [migrationState, setMigrationState] = useState<any>(null)
  const [recordCounts, setRecordCounts] = useState<{
    establecimientos: number
    contactos: number
  } | null>(null)
  const [authKey, setAuthKey] = useState<string>("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [continuingMigration, setContinuingMigration] = useState(false)

  // Función para verificar el estado de la migración
  const verifyMigration = async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener el estado de la migración
      const migrationResponse = await fetch("/api/admin/verify-migration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ authKey }),
      })

      if (!migrationResponse.ok) {
        const errorData = await migrationResponse.json()
        throw new Error(errorData.error || "Error al verificar la migración")
      }

      const migrationData = await migrationResponse.json()
      setMigrationState(migrationData.migrationState)
      setRecordCounts(migrationData.recordCounts)
    } catch (err) {
      console.error("Error al verificar la migración:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  // Función para continuar la migración
  const continueMigration = async () => {
    try {
      setContinuingMigration(true)
      setError(null)

      const response = await fetch("/api/admin/continue-migration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ authKey }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al continuar la migración")
      }

      const data = await response.json()
      alert(data.message || "Migración continuada. Verifica el panel de migración para seguir el progreso.")

      // Actualizar el estado después de continuar
      await verifyMigration()
    } catch (err) {
      console.error("Error al continuar la migración:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setContinuingMigration(false)
    }
  }

  // Función para verificar la autenticación
  const verifyAuth = async () => {
    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ authKey }),
      })

      if (response.ok) {
        setIsAuthenticated(true)
        verifyMigration()
      } else {
        setIsAuthenticated(false)
        setError("Clave de autenticación inválida")
      }
    } catch (err) {
      console.error("Error al verificar autenticación:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
      setIsAuthenticated(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Verificación de Migración</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!isAuthenticated ? (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Autenticación</h2>
          <div className="mb-4">
            <label htmlFor="authKey" className="block text-sm font-medium text-gray-700 mb-1">
              Clave de Autenticación
            </label>
            <input
              type="password"
              id="authKey"
              value={authKey}
              onChange={(e) => setAuthKey(e.target.value)}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          <button
            onClick={verifyAuth}
            disabled={!authKey || loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Verificar
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Estado de la Migración</h2>
              <button
                onClick={verifyMigration}
                disabled={loading}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Actualizar
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-md font-medium mb-2">Registros en Base de Datos</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="mb-2">
                        <span className="text-gray-600">Establecimientos:</span>{" "}
                        <span className="font-semibold">{recordCounts?.establecimientos || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Contactos:</span>{" "}
                        <span className="font-semibold">{recordCounts?.contactos || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-md font-medium mb-2">Estado de Migración</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      {migrationState ? (
                        <>
                          <div className="mb-2">
                            <span className="text-gray-600">Estado:</span>{" "}
                            <span
                              className={`font-semibold ${
                                migrationState.completed ? "text-green-600" : "text-amber-600"
                              }`}
                            >
                              {migrationState.completed ? "Completada" : "En progreso"}
                            </span>
                          </div>
                          <div className="mb-2">
                            <span className="text-gray-600">Registros procesados:</span>{" "}
                            <span className="font-semibold">
                              {migrationState.processedRecords} / {migrationState.totalRecords}
                            </span>
                          </div>
                          <div className="mb-2">
                            <span className="text-gray-600">Último índice procesado:</span>{" "}
                            <span className="font-semibold">{migrationState.lastProcessedId}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Última actualización:</span>{" "}
                            <span className="font-semibold">
                              {new Date(migrationState.lastUpdated).toLocaleString()}
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="text-gray-500">No se encontró información de estado de migración</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Análisis y recomendaciones */}
                <div className="mt-6">
                  <h3 className="text-md font-medium mb-2">Análisis y Recomendaciones</h3>
                  <div className="bg-blue-50 p-4 rounded-md text-blue-800">
                    {recordCounts && migrationState ? (
                      <>
                        {recordCounts.establecimientos < migrationState.totalRecords ? (
                          <>
                            <p className="mb-2">
                              <strong>Migración incompleta:</strong> Se han migrado {recordCounts.establecimientos} de{" "}
                              {migrationState.totalRecords} establecimientos.
                            </p>
                            <p>
                              Se recomienda continuar la migración desde el índice {migrationState.lastProcessedId}.
                            </p>
                          </>
                        ) : recordCounts.establecimientos >= migrationState.totalRecords ? (
                          <>
                            <p className="mb-2">
                              <strong>Migración completa:</strong> Se han migrado todos los establecimientos.
                            </p>
                            <p>
                              El número de registros en la base de datos ({recordCounts.establecimientos}) coincide o
                              supera el total esperado ({migrationState.totalRecords}).
                            </p>
                          </>
                        ) : (
                          <p>Analizando estado de la migración...</p>
                        )}
                      </>
                    ) : (
                      <p>No hay suficiente información para analizar el estado de la migración.</p>
                    )}
                  </div>
                </div>

                {/* Botón para continuar la migración */}
                {recordCounts &&
                  migrationState &&
                  recordCounts.establecimientos < migrationState.totalRecords &&
                  !migrationState.completed && (
                    <div className="mt-6">
                      <button
                        onClick={continueMigration}
                        disabled={continuingMigration}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {continuingMigration ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4 mr-2" />
                        )}
                        Continuar Migración
                      </button>
                      <p className="mt-2 text-sm text-gray-500">
                        Esto redirigirá la migración al panel principal para continuar desde el índice{" "}
                        {migrationState.lastProcessedId}.
                      </p>
                    </div>
                  )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
