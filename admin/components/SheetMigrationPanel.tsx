"use client"

import { useState, useEffect } from "react"
import { Loader2, AlertCircle, RefreshCw, Play, Info, Database, FileSpreadsheet } from "lucide-react"

export default function SheetMigrationPanel({ authKey }: { authKey: string }) {
  const [loading, setLoading] = useState(false)
  const [sheetId, setSheetId] = useState("")
  const [tableName, setTableName] = useState("establecimientos")
  const [migrationStatus, setMigrationStatus] = useState<Record<string, any> | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [recentMigrations, setRecentMigrations] = useState<any[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Función para agregar un log con timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prevLogs) => [`[${timestamp}] ${message}`, ...prevLogs])
  }

  // Cargar migraciones recientes del localStorage al iniciar
  useEffect(() => {
    try {
      const savedMigrations = localStorage.getItem("recentMigrations")
      if (savedMigrations) {
        setRecentMigrations(JSON.parse(savedMigrations))
      }

      // Agregar mensaje informativo sobre las limitaciones actuales
      addLog("NOTA: En esta versión, solo se admiten las hojas 'establecimientos' y 'contactos'.")
      addLog("Para migrar otras hojas, se requiere configurar la API key de Google Sheets.")
    } catch (err) {
      console.error("Error al cargar migraciones recientes:", err)
    }
  }, [])

  // Guardar migraciones recientes en localStorage
  const saveRecentMigration = (migration: any) => {
    try {
      const updatedMigrations = [migration, ...recentMigrations.slice(0, 9)] // Mantener solo las 10 más recientes
      setRecentMigrations(updatedMigrations)
      localStorage.setItem("recentMigrations", JSON.stringify(updatedMigrations))
    } catch (err) {
      console.error("Error al guardar migración reciente:", err)
    }
  }

  // Función para iniciar la migración
  const startMigration = async () => {
    if (!sheetId.trim()) {
      setError("Debes ingresar el ID de la hoja de Google Sheets")
      return
    }

    // Validar que el ID de la hoja sea 'establecimientos' o 'contactos'
    if (sheetId.trim() !== "establecimientos" && sheetId.trim() !== "contactos") {
      setError("En esta versión, solo se admiten las hojas 'establecimientos' y 'contactos'.")
      addLog("ERROR: ID de hoja no válido. Use 'establecimientos' o 'contactos'.")
      return
    }

    try {
      setLoading(true)
      setError(null)
      setMigrationStatus(null)
      addLog(`Iniciando migración desde la hoja ${sheetId} a la tabla ${tableName}...`)

      // Usamos el authKey que recibimos como prop
      const response = await fetch("/api/admin/migrate-sheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authKey, // Usamos el token pasado como prop
          sheetId: sheetId.trim(),
          sheetName: tableName.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error desconocido durante la migración")
      }

      setMigrationStatus(data)
      addLog(
        `Migración completada con éxito. ${data.inserted} registros insertados, ${data.updated} registros actualizados.`,
      )

      if (data.addedColumns && data.addedColumns.length > 0) {
        addLog(`Se agregaron ${data.addedColumns.length} columnas nuevas: ${data.addedColumns.join(", ")}`)
      }

      // Guardar en el historial de migraciones recientes
      saveRecentMigration({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        sheetId,
        tableName,
        processed: data.processed,
        inserted: data.inserted,
        updated: data.updated,
        addedColumns: data.addedColumns || [],
      })
    } catch (err) {
      console.error("Error durante la migración:", err)
      setError(err instanceof Error ? err.message : "Error desconocido durante la migración")
      addLog(`Error: ${err instanceof Error ? err.message : "Error desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  // Función para limpiar el formulario
  const resetForm = () => {
    if (!loading) {
      setSheetId("")
      setTableName("establecimientos")
      setMigrationStatus(null)
      setError(null)
      setLogs([])
      addLog("Formulario reiniciado")
      addLog("NOTA: En esta versión, solo se admiten las hojas 'establecimientos' y 'contactos'.")
    }
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/20 shadow-xl">
      <h2 className="text-xl font-bold mb-4 text-white flex items-center">
        <FileSpreadsheet className="w-5 h-5 mr-2" />
        Migración desde Google Sheets
      </h2>

      {/* Alerta de limitación */}
      <div className="bg-amber-900/30 border-l-4 border-amber-500 text-amber-200 p-4 mb-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-amber-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm">
              <strong>Limitación actual:</strong> En esta versión, solo se admiten las hojas 'establecimientos' y
              'contactos'. Para migrar otras hojas, se requiere configurar la API key de Google Sheets.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border-l-4 border-red-500 text-red-200 p-4 mb-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="mb-4">
          <label htmlFor="sheetId" className="block text-sm font-medium text-white mb-1">
            ID de la hoja
          </label>
          <input
            type="text"
            id="sheetId"
            value={sheetId}
            onChange={(e) => setSheetId(e.target.value)}
            placeholder="Ingresa 'establecimientos' o 'contactos'"
            className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-white/30 rounded-md bg-white/10 text-white p-2"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-white/70">
            En esta versión, solo se admiten los valores 'establecimientos' o 'contactos'
          </p>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between">
            <label htmlFor="tableName" className="block text-sm font-medium text-white mb-1">
              Tabla de destino
            </label>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-white/70 hover:text-white"
            >
              {showAdvanced ? "Ocultar opciones avanzadas" : "Mostrar opciones avanzadas"}
            </button>
          </div>

          {showAdvanced ? (
            <input
              type="text"
              id="tableName"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="Nombre de la tabla"
              className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-white/30 rounded-md bg-white/10 text-white p-2"
              disabled={loading}
            />
          ) : (
            <div className="bg-white/5 p-2 rounded-md border border-white/10 text-white/80">
              establecimientos <span className="text-xs text-white/50">(predeterminado)</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={startMigration}
          disabled={loading || !sheetId.trim()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
          {loading ? "Migrando..." : "Iniciar Migración"}
        </button>

        <button
          onClick={resetForm}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-white/30 text-sm font-medium rounded-md shadow-sm text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Limpiar
        </button>
      </div>

      {/* Resultados de la migración */}
      {migrationStatus && (
        <div className="mb-6 bg-gray-800/50 p-4 rounded-md border border-white/10">
          <h3 className="text-sm font-medium text-white mb-2 flex items-center">
            <Database className="w-4 h-4 mr-2" />
            Resultados de la migración
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-white/70">Registros procesados:</span>{" "}
              <span className="font-medium text-white">{migrationStatus.processed || 0}</span>
            </div>
            <div>
              <span className="text-white/70">Registros insertados:</span>{" "}
              <span className="font-medium text-green-400">{migrationStatus.inserted || 0}</span>
            </div>
            <div>
              <span className="text-white/70">Registros actualizados:</span>{" "}
              <span className="font-medium text-amber-400">{migrationStatus.updated || 0}</span>
            </div>
            <div>
              <span className="text-white/70">Columnas nuevas:</span>{" "}
              <span className="font-medium text-blue-400">{migrationStatus.addedColumns?.length || 0}</span>
            </div>
          </div>

          {migrationStatus.addedColumns && migrationStatus.addedColumns.length > 0 && (
            <div className="mt-3 bg-blue-900/20 p-2 rounded border border-blue-500/30 text-xs">
              <div className="font-medium text-blue-300 mb-1">Columnas agregadas:</div>
              <div className="flex flex-wrap gap-1">
                {migrationStatus.addedColumns.map((column: string, index: number) => (
                  <span key={index} className="bg-blue-800/50 px-2 py-1 rounded text-blue-200">
                    {column}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Migraciones recientes */}
      {recentMigrations.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-white mb-2">Migraciones recientes</h3>
          <div className="bg-gray-800/50 rounded-md border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700/30">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-white/70">
                      Fecha
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-white/70">
                      Hoja
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-white/70">
                      Tabla
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-white/70">
                      Procesados
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-white/70">
                      Resultado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {recentMigrations.map((migration) => (
                    <tr key={migration.id} className="hover:bg-gray-700/20">
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-white/80">
                        {new Date(migration.timestamp).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-white/80">
                        {migration.sheetId.length > 15 ? migration.sheetId.substring(0, 12) + "..." : migration.sheetId}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-white/80">{migration.tableName}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-white/80">{migration.processed}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        <div className="flex items-center space-x-1">
                          <span className="text-green-400">{migration.inserted} ins</span>
                          <span className="text-white/50">|</span>
                          <span className="text-amber-400">{migration.updated} act</span>
                          {migration.addedColumns.length > 0 && (
                            <>
                              <span className="text-white/50">|</span>
                              <span className="text-blue-400">{migration.addedColumns.length} cols</span>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Logs */}
      <div>
        <h3 className="text-sm font-medium text-white mb-2">Logs de migración</h3>
        <div className="bg-gray-900/70 text-gray-200 p-4 rounded-md h-64 overflow-y-auto font-mono text-xs border border-white/10">
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          ) : (
            <div className="text-gray-400">No hay logs disponibles</div>
          )}
        </div>
      </div>

      {/* Información de ayuda */}
      <div className="mt-6">
        <div className="flex items-center mb-2">
          <Info className="w-4 h-4 text-blue-400 mr-2" />
          <h3 className="text-sm font-medium text-white">Información</h3>
        </div>
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-md p-3 text-xs text-blue-200">
          <p className="mb-2">
            Esta herramienta permite migrar datos desde una hoja de Google Sheets a la base de datos Supabase.
          </p>
          <p className="mb-2">
            <strong>Limitación actual:</strong> En esta versión, solo se admiten las hojas 'establecimientos' y
            'contactos'.
          </p>
          <p className="mb-2">
            <strong>Características principales:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Normaliza automáticamente los nombres de columnas (minúsculas, guiones bajos)</li>
            <li>Agrega columnas nuevas si no existen en la tabla de destino</li>
            <li>Actualiza registros existentes (por CUE) sin sobrescribir con valores nulos</li>
            <li>Inserta registros nuevos que no existen en la base de datos</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
