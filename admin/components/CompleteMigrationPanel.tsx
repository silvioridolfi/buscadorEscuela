"use client"

import { useState, useEffect } from "react"
import { Loader2, AlertCircle, RefreshCw, Play, Check, X, Info } from "lucide-react"

export default function CompleteMigrationPanel({ authKey }: { authKey: string }) {
  const [loading, setLoading] = useState(false)
  const [sheets, setSheets] = useState<string[]>([])
  const [selectedSheets, setSelectedSheets] = useState<string[]>([])
  const [migrationStatus, setMigrationStatus] = useState<Record<string, any>>({})
  const [logs, setLogs] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [batchSize, setBatchSize] = useState(10)

  // Función para agregar un log con timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prevLogs) => [`[${timestamp}] ${message}`, ...prevLogs])
  }

  // Cargar la lista de hojas disponibles
  const loadSheets = async () => {
    try {
      setLoading(true)
      setError(null)
      addLog("Obteniendo lista de hojas disponibles...")

      const response = await fetch("/api/admin/sheet-list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ authKey }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al obtener la lista de hojas")
      }

      const data = await response.json()
      setSheets(data.sheets || [])

      // Seleccionar todas las hojas por defecto
      setSelectedSheets(data.sheets || [])

      addLog(`Se encontraron ${data.sheets.length} hojas disponibles`)

      if (data.message) {
        addLog(`Mensaje: ${data.message}`)
      }
    } catch (err) {
      console.error("Error al cargar las hojas:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
      addLog(`Error: ${err instanceof Error ? err.message : "Error desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  // Función para migrar una hoja específica
  const migrateSheet = async (sheet: string) => {
    try {
      addLog(`Iniciando migración de la hoja "${sheet}"...`)
      setMigrationStatus((prev) => ({ ...prev, [sheet]: { status: "in_progress", progress: 0 } }))

      const response = await fetch("/api/admin/migrate-sheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authKey,
          sheet,
          batchSize,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error al migrar la hoja "${sheet}"`)
      }

      const data = await response.json()

      if (data.success) {
        addLog(`Migración de "${sheet}" completada. ${data.recordsProcessed} registros procesados.`)
        setMigrationStatus((prev) => ({
          ...prev,
          [sheet]: {
            status: "completed",
            progress: 100,
            recordsProcessed: data.recordsProcessed,
            totalRecords: data.totalRecords,
          },
        }))
      } else {
        throw new Error(data.error || `Error desconocido al migrar la hoja "${sheet}"`)
      }
    } catch (err) {
      console.error(`Error al migrar la hoja "${sheet}":`, err)
      setError(err instanceof Error ? err.message : "Error desconocido")
      addLog(`Error en la hoja "${sheet}": ${err instanceof Error ? err.message : "Error desconocido"}`)
      setMigrationStatus((prev) => ({
        ...prev,
        [sheet]: { status: "error", error: err instanceof Error ? err.message : "Error desconocido" },
      }))
    }
  }

  // Función para iniciar la migración de todas las hojas seleccionadas
  const startMigration = async () => {
    if (selectedSheets.length === 0) {
      setError("Debes seleccionar al menos una hoja para migrar")
      return
    }

    setError(null)

    // Migrar cada hoja seleccionada en secuencia
    for (const sheet of selectedSheets) {
      await migrateSheet(sheet)
    }

    addLog("Proceso de migración completo")
  }

  // Cargar la lista de hojas al montar el componente
  useEffect(() => {
    loadSheets()
  }, [])

  // Función para alternar la selección de una hoja
  const toggleSheetSelection = (sheet: string) => {
    if (selectedSheets.includes(sheet)) {
      setSelectedSheets(selectedSheets.filter((s) => s !== sheet))
    } else {
      setSelectedSheets([...selectedSheets, sheet])
    }
  }

  // Función para seleccionar o deseleccionar todas las hojas
  const toggleAllSheets = () => {
    if (selectedSheets.length === sheets.length) {
      setSelectedSheets([])
    } else {
      setSelectedSheets([...sheets])
    }
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/20 shadow-xl">
      <h2 className="text-xl font-bold mb-4 text-white">Migración Completa de Datos</h2>

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
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-md font-medium text-white">Hojas Disponibles</h3>
          <button
            onClick={loadSheets}
            disabled={loading}
            className="inline-flex items-center px-2 py-1 border border-white/30 text-xs font-medium rounded-md shadow-sm text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 disabled:opacity-50"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
        ) : sheets.length > 0 ? (
          <div className="bg-gray-800/50 p-4 rounded-md border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={selectedSheets.length === sheets.length}
                  onChange={toggleAllSheets}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="select-all" className="ml-2 text-sm text-white">
                  Seleccionar todas
                </label>
              </div>
              <span className="text-xs text-white/70">
                {selectedSheets.length} de {sheets.length} seleccionadas
              </span>
            </div>

            <div className="space-y-2 mt-3">
              {sheets.map((sheet) => (
                <div key={sheet} className="flex items-center justify-between bg-gray-700/30 p-2 rounded-md">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`sheet-${sheet}`}
                      checked={selectedSheets.includes(sheet)}
                      onChange={() => toggleSheetSelection(sheet)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor={`sheet-${sheet}`} className="ml-2 text-sm text-white">
                      {sheet}
                    </label>
                  </div>

                  {migrationStatus[sheet] && (
                    <div className="flex items-center">
                      {migrationStatus[sheet].status === "completed" && (
                        <span className="flex items-center text-xs text-green-400">
                          <Check className="w-3 h-3 mr-1" />
                          Completado ({migrationStatus[sheet].recordsProcessed}/{migrationStatus[sheet].totalRecords})
                        </span>
                      )}
                      {migrationStatus[sheet].status === "in_progress" && (
                        <span className="flex items-center text-xs text-amber-400">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          En progreso
                        </span>
                      )}
                      {migrationStatus[sheet].status === "error" && (
                        <span className="flex items-center text-xs text-red-400">
                          <X className="w-3 h-3 mr-1" />
                          Error
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-800/50 p-4 rounded-md border border-white/10 text-white/70 text-center">
            No se encontraron hojas disponibles
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-white mb-1">Tamaño de lote</label>
        <div className="flex items-center">
          <input
            type="number"
            value={batchSize}
            onChange={(e) => setBatchSize(Number.parseInt(e.target.value) || 10)}
            min="5"
            max="50"
            className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-white/30 rounded-md bg-white/10 text-white"
            disabled={Object.keys(migrationStatus).some((key) => migrationStatus[key]?.status === "in_progress")}
          />
          <span className="ml-2 text-sm text-white/70">registros</span>
        </div>
        <p className="mt-1 text-xs text-white/70">
          Número de registros a procesar en cada lote. Valores más pequeños son más seguros.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={startMigration}
          disabled={
            loading ||
            selectedSheets.length === 0 ||
            Object.keys(migrationStatus).some((key) => migrationStatus[key]?.status === "in_progress")
          }
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 disabled:opacity-50"
        >
          <Play className="w-4 h-4 mr-2" />
          Iniciar Migración Completa
        </button>
      </div>

      <div className="mb-4">
        <div className="flex items-center mb-2">
          <Info className="w-4 h-4 text-blue-400 mr-2" />
          <h3 className="text-sm font-medium text-white">Información Importante</h3>
        </div>
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-md p-3 text-xs text-blue-200">
          <p className="mb-2">
            Esta herramienta migrará todas las hojas seleccionadas a tablas correspondientes en Supabase.
          </p>
          <p className="mb-2">
            Para cada hoja, se creará una tabla con el mismo nombre en la base de datos si no existe.
          </p>
          <p>
            El proceso puede tardar varios minutos dependiendo de la cantidad de datos. No cierres esta ventana durante
            la migración.
          </p>
        </div>
      </div>

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
    </div>
  )
}
