"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getAdminAuthKey } from "@/lib/admin-bypass"

interface MigrationResult {
  success: boolean
  processed: number
  inserted: number
  updated: number
  addedColumns: string[]
  message: string
  timestamp: string
  error?: string
}

interface MigrationHistory {
  sheetId: string
  tableName: string
  result: MigrationResult
  timestamp: string
}

export default function SheetMigrationPanel() {
  const [sheetId, setSheetId] = useState("")
  const [tableName, setTableName] = useState("establecimientos")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<MigrationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [history, setHistory] = useState<MigrationHistory[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const router = useRouter()

  // Cargar historial de migraciones desde localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem("migrationHistory")
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory))
      } catch (e) {
        console.error("Error al cargar historial de migraciones:", e)
      }
    }
  }, [])

  // Función para agregar logs
  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  // Función para iniciar la migración
  const startMigration = async () => {
    if (!sheetId) {
      setError("Por favor, ingresa el ID de la hoja de Google Sheets")
      return
    }

    setIsLoading(true)
    setResult(null)
    setError(null)
    setLogs([])
    addLog(`Iniciando migración desde la hoja ${sheetId} a la tabla ${tableName}...`)

    try {
      const authKey = getAdminAuthKey()

      if (!authKey) {
        router.push("/admin")
        return
      }

      addLog("Enviando solicitud al servidor...")

      // Modificación: Implementar procesamiento por lotes para manejar el límite de tiempo
      const batchSize = 100 // Procesar 100 registros a la vez

      const response = await fetch("/api/admin/migrate-sheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authKey,
          sheetId,
          sheetName: tableName,
          batchSize, // Añadir tamaño de lote para procesamiento incremental
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
        addLog(
          `Migración completada con éxito. ${data.inserted} registros insertados, ${data.updated} registros actualizados.`,
        )

        // Si hay columnas nuevas, mostrarlas en los logs
        if (data.addedColumns && data.addedColumns.length > 0) {
          addLog(`Se agregaron ${data.addedColumns.length} columnas nuevas: ${data.addedColumns.join(", ")}`)
        }

        // Guardar en el historial
        const newHistory: MigrationHistory = {
          sheetId,
          tableName,
          result: data,
          timestamp: new Date().toISOString(),
        }

        const updatedHistory = [newHistory, ...history].slice(0, 10) // Mantener solo las últimas 10 migraciones
        setHistory(updatedHistory)
        localStorage.setItem("migrationHistory", JSON.stringify(updatedHistory))
      } else {
        setError(data.error || "Error desconocido durante la migración")
        addLog(`Error: ${data.error || "Error desconocido durante la migración"}`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      setError(errorMessage)
      addLog(`Error: ${errorMessage}`)
      console.error("Error durante la migración:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Migración desde Google Sheets</h2>

      {/* Formulario de migración */}
      <div className="mb-8 bg-gray-50 p-4 rounded-lg">
        <div className="mb-4">
          <label htmlFor="sheetId" className="block text-sm font-medium text-gray-700 mb-1">
            ID de la hoja de Google Sheets
          </label>
          <input
            type="text"
            id="sheetId"
            value={sheetId}
            onChange={(e) => setSheetId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ingresa el ID de la hoja (se encuentra en la URL)"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            El ID se encuentra en la URL de la hoja: https://docs.google.com/spreadsheets/d/
            <span className="font-bold">ID-DE-LA-HOJA</span>/edit
          </p>
        </div>

        {/* Opciones avanzadas (colapsables) */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none flex items-center"
          >
            {showAdvanced ? "▼" : "►"} Opciones avanzadas
          </button>

          {showAdvanced && (
            <div className="mt-2 pl-4 border-l-2 border-gray-200">
              <div className="mb-3">
                <label htmlFor="tableName" className="block text-sm font-medium text-gray-700 mb-1">
                  Tabla de destino
                </label>
                <input
                  type="text"
                  id="tableName"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre de la tabla en Supabase"
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-gray-500">
                Por defecto, los datos se migrarán a la tabla &quot;establecimientos&quot;. Cambia este valor solo si
                sabes lo que estás haciendo.
              </p>
            </div>
          )}
        </div>

        <button
          onClick={startMigration}
          disabled={isLoading || !sheetId}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${
              isLoading || !sheetId
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            }`}
        >
          {isLoading ? "Migrando datos..." : "Iniciar Migración"}
        </button>
      </div>

      {/* Resultados de la migración */}
      {result && (
        <div className="mb-8 bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Migración Completada</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-3 rounded-md shadow-sm">
              <p className="text-sm text-gray-500">Registros Procesados</p>
              <p className="text-2xl font-bold text-gray-800">{result.processed}</p>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm">
              <p className="text-sm text-gray-500">Registros Insertados</p>
              <p className="text-2xl font-bold text-green-600">{result.inserted}</p>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm">
              <p className="text-sm text-gray-500">Registros Actualizados</p>
              <p className="text-2xl font-bold text-blue-600">{result.updated}</p>
            </div>
          </div>

          {result.addedColumns && result.addedColumns.length > 0 && (
            <div className="mt-4">
              <h4 className="text-md font-medium text-gray-700 mb-2">Columnas Nuevas Agregadas:</h4>
              <div className="bg-white p-3 rounded-md shadow-sm max-h-40 overflow-y-auto">
                <ul className="list-disc pl-5 text-sm">
                  {result.addedColumns.map((column, index) => (
                    <li key={index} className="text-gray-700">
                      {column}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-600 mt-4">
            Migración completada el {new Date(result.timestamp).toLocaleString()}
          </p>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="mb-8 bg-red-50 p-4 rounded-lg border border-red-200">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error en la Migración</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Logs de la migración */}
      {logs.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Logs de la Migración</h3>
          <div className="bg-gray-800 text-gray-200 p-3 rounded-md shadow-sm max-h-60 overflow-y-auto font-mono text-sm">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial de migraciones */}
      {history.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Historial de Migraciones</h3>
          <div className="bg-white border rounded-md shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Fecha
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Hoja
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Tabla
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Resultado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.sheetId.substring(0, 10)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.tableName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.result.success ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {item.result.inserted} insertados, {item.result.updated} actualizados
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Error
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
