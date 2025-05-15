"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, AlertCircle, RefreshCw, Play, Pause, Info } from "lucide-react"

export default function MigrationPanel({ authKey }: { authKey: string }) {
  const [loading, setLoading] = useState(false)
  const [migrationState, setMigrationState] = useState<any>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isMigrating, setIsMigrating] = useState(false)
  const [batchSize, setBatchSize] = useState(50)
  const [progress, setProgress] = useState(0)
  const [lastBatchError, setLastBatchError] = useState<string | null>(null)

  // Ref para mantener el estado de migración entre renderizados
  const migrationRef = useRef({
    isMigrating: false,
    currentBatchIndex: 0,
    hasError: false,
  })

  // Función para agregar un log con timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prevLogs) => [`[${timestamp}] ${message}`, ...prevLogs])
  }

  // Función para obtener el estado actual de la migración
  const getMigrationState = async () => {
    try {
      setLoading(true)
      setError(null)
      addLog("Obteniendo estado de migración...")

      const response = await fetch("/api/admin/migrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authKey,
          action: "getState",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al obtener el estado de la migración")
      }

      setMigrationState(data.state)

      if (data.state.totalRecords > 0) {
        const calculatedProgress = Math.round((data.state.processedRecords / data.state.totalRecords) * 100)
        setProgress(calculatedProgress)
        addLog(`Progreso actual: ${calculatedProgress}%`)
      }

      addLog(`Estado de migración: ${data.state.completed ? "Completada" : "Pendiente"}`)
      addLog(`Registros procesados: ${data.state.processedRecords} de ${data.state.totalRecords}`)

      return data.state
    } catch (error) {
      console.error("Error al obtener el estado de la migración:", error)
      setError(error.message || "Error al obtener el estado de la migración")
      addLog(`Error: ${error.message}`)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Función para iniciar la migración
  const startMigration = async () => {
    try {
      setLoading(true)
      setError(null)
      setLastBatchError(null)
      addLog("Iniciando migración completa de la base de datos...")

      const response = await fetch("/api/admin/migrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authKey,
          action: "start",
          batchSize,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al iniciar la migración")
      }

      addLog(`Migración iniciada. Total de registros: ${data.totalRecords}`)
      addLog(`Tamaño de lote: ${batchSize} registros`)

      // Iniciar el proceso de migración por lotes
      migrationRef.current = {
        isMigrating: true,
        currentBatchIndex: 0,
        hasError: false,
      }

      setIsMigrating(true)
      await processBatch(0)
    } catch (error) {
      console.error("Error al iniciar la migración:", error)
      setError(error.message || "Error al iniciar la migración")
      addLog(`Error: ${error.message}`)
      setIsMigrating(false)
      migrationRef.current.isMigrating = false
    } finally {
      setLoading(false)
    }
  }

  // Función para procesar un lote de datos
  const processBatch = async (startIndex: number) => {
    // Verificar si la migración sigue activa
    if (!migrationRef.current.isMigrating) {
      addLog("Migración pausada por el usuario")
      return
    }

    try {
      addLog(`Procesando lote desde el índice ${startIndex}...`)
      setLastBatchError(null)

      const response = await fetch("/api/admin/migrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authKey,
          action: "continue",
          batchSize,
          startIndex,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al procesar lote")
      }

      // Actualizar el estado de la migración solo si seguimos migrando
      if (migrationRef.current.isMigrating) {
        migrationRef.current.currentBatchIndex = data.nextBatchStart || 0

        addLog(`Lote procesado. ${data.processedInBatch} registros procesados.`)
        addLog(`Progreso total: ${data.totalProcessed} de ${data.totalRecords} (${data.progress}%)`)
        setProgress(data.progress)

        // Si hay más lotes por procesar y la migración sigue activa
        if (!data.completed && data.nextBatchStart !== null && migrationRef.current.isMigrating) {
          // Esperar un poco para no sobrecargar el servidor
          await new Promise((resolve) => setTimeout(resolve, 1000))

          // Procesar el siguiente lote
          await processBatch(data.nextBatchStart)
        } else {
          if (data.completed) {
            addLog("¡Migración completada con éxito!")
          }
          setIsMigrating(false)
          migrationRef.current.isMigrating = false
        }
      }
    } catch (error) {
      console.error("Error al procesar lote:", error)
      setLastBatchError(error.message || "Error al procesar lote")
      addLog(`Error en lote: ${error.message}`)

      // No paramos la migración por un error en un lote, intentamos continuar
      // con el siguiente lote después de una pausa
      if (migrationRef.current.isMigrating) {
        addLog("Intentando continuar con el siguiente lote después de 3 segundos...")
        await new Promise((resolve) => setTimeout(resolve, 3000))

        // Avanzamos al siguiente lote
        const nextIndex = startIndex + batchSize
        await processBatch(nextIndex)
      }
    }
  }

  // Función para reiniciar la migración
  const resetMigration = async () => {
    if (!confirm("¿Estás seguro de que deseas reiniciar la migración? Esto eliminará todos los datos existentes.")) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      addLog("Reiniciando migración...")

      const response = await fetch("/api/admin/migrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authKey,
          action: "reset",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al reiniciar la migración")
      }

      addLog("Migración reiniciada correctamente")
      await getMigrationState()
    } catch (error) {
      console.error("Error al reiniciar la migración:", error)
      setError(error.message || "Error al reiniciar la migración")
      addLog(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Función para pausar/reanudar la migración
  const toggleMigration = () => {
    if (isMigrating) {
      // Pausar
      migrationRef.current.isMigrating = false
      setIsMigrating(false)
      addLog("Migración pausada por el usuario")
    } else {
      // Reanudar
      migrationRef.current.isMigrating = true
      setIsMigrating(true)
      addLog("Reanudando migración...")

      // Reanudar desde el último índice procesado
      const startIndex = migrationRef.current.currentBatchIndex || migrationState?.lastProcessedId || 0
      processBatch(startIndex)
    }
  }

  // Obtener el estado inicial al cargar el componente
  useEffect(() => {
    getMigrationState()

    // Limpiar el estado de migración cuando se desmonta el componente
    return () => {
      migrationRef.current.isMigrating = false
      setIsMigrating(false)
    }
  }, [])

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/20 shadow-xl">
      <h2 className="text-xl font-bold mb-4 text-white">Panel de Migración de Datos</h2>

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

      {lastBatchError && (
        <div className="bg-amber-900/30 border-l-4 border-amber-500 text-amber-200 p-4 mb-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-amber-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm">Error en el último lote: {lastBatchError}</p>
              <p className="text-sm mt-1">La migración intentará continuar con el siguiente lote.</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-white mb-1">Tamaño de lote</label>
        <div className="flex items-center">
          <input
            type="number"
            value={batchSize}
            onChange={(e) => setBatchSize(Number.parseInt(e.target.value) || 50)}
            min="10"
            max="500"
            className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-white/30 rounded-md bg-white/10 text-white"
            disabled={isMigrating || loading}
          />
          <span className="ml-2 text-sm text-white/70">registros</span>
        </div>
        <p className="mt-1 text-xs text-white/70">
          Número de registros a procesar en cada lote. Valores más pequeños son más seguros pero más lentos.
        </p>
      </div>

      {/* Barra de progreso */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-white/70 mb-1">
          <span>Progreso</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={startMigration}
          disabled={isMigrating || loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
          Iniciar Migración
        </button>

        <button
          onClick={toggleMigration}
          disabled={loading || (!isMigrating && (!migrationState || migrationState.completed))}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
            isMigrating ? "bg-amber-600 hover:bg-amber-700" : "bg-green-600 hover:bg-green-700"
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 disabled:opacity-50`}
        >
          {isMigrating ? (
            <>
              <Pause className="w-4 h-4 mr-2" />
              Pausar
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Reanudar
            </>
          )}
        </button>

        <button
          onClick={resetMigration}
          disabled={isMigrating || loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reiniciar
        </button>

        <button
          onClick={getMigrationState}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-white/30 text-sm font-medium rounded-md shadow-sm text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar Estado
        </button>
      </div>

      {/* Estado de la migración */}
      {migrationState && (
        <div className="mb-6 bg-gray-800/50 p-4 rounded-md border border-white/10">
          <h3 className="text-sm font-medium text-white mb-2">Estado de la migración</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-white/70">Estado:</span>{" "}
              <span className={`font-medium ${migrationState.completed ? "text-green-400" : "text-amber-400"}`}>
                {migrationState.completed ? "Completada" : "En progreso"}
              </span>
            </div>
            <div>
              <span className="text-white/70">Registros procesados:</span>{" "}
              <span className="font-medium text-white">
                {migrationState.processedRecords} / {migrationState.totalRecords}
              </span>
            </div>
            <div>
              <span className="text-white/70">Progreso:</span>{" "}
              <span className="font-medium text-white">
                {migrationState.totalRecords > 0
                  ? Math.round((migrationState.processedRecords / migrationState.totalRecords) * 100)
                  : 0}
                %
              </span>
            </div>
            <div>
              <span className="text-white/70">Índice actual:</span>{" "}
              <span className="font-medium text-white">
                {migrationRef.current.currentBatchIndex || migrationState.lastProcessedId}
              </span>
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
    </div>
  )
}
