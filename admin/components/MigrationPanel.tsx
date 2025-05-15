"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

interface MigrationPanelProps {
  authToken: string
}

export function MigrationPanel({ authToken }: MigrationPanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [currentBatch, setCurrentBatch] = useState(0)
  const [totalBatches, setTotalBatches] = useState(0)
  const [migrationStarted, setMigrationStarted] = useState(false)
  const [migrationComplete, setMigrationComplete] = useState(false)
  const [batchSize] = useState(50) // Tamaño de lote fijo

  // Función para agregar un log con timestamp
  const addLog = (message: string) => {
    const now = new Date()
    const timestamp = now.toLocaleTimeString()
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev])
  }

  // Función para iniciar la migración
  const startMigration = async () => {
    setIsLoading(true)
    setMigrationStarted(true)
    setMigrationComplete(false)
    setError(null)
    setLogs([])
    setProgress(0)
    setCurrentBatch(0)

    addLog("Iniciando migración completa de la base de datos con TODOS los campos...")

    try {
      // Paso 1: Iniciar la migración y obtener información inicial
      const initialResponse = await fetch("/api/admin/migrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authToken,
          batchSize,
          batchNumber: 0,
          fullMigration: true,
        }),
      })

      if (!initialResponse.ok) {
        const errorData = await initialResponse.json()
        throw new Error(errorData.message || "Error al iniciar la migración")
      }

      const initialData = await initialResponse.json()

      if (!initialData.success) {
        throw new Error(initialData.error || "Error desconocido al iniciar la migración")
      }

      addLog(
        `Datos obtenidos correctamente: ${initialData.totalEstablecimientos} establecimientos y ${initialData.totalContactos} contactos`,
      )
      setTotalBatches(initialData.totalBatches || Math.ceil(initialData.totalEstablecimientos / batchSize))

      // Paso 2: Procesar los lotes secuencialmente
      let currentBatchNumber = 0
      let hasMore = true

      while (hasMore) {
        setCurrentBatch(currentBatchNumber + 1)

        addLog(`Procesando lote ${currentBatchNumber + 1} de ${totalBatches || "?"}...`)

        const batchResponse = await fetch("/api/admin/migrate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            authToken,
            batchSize,
            batchNumber: currentBatchNumber,
          }),
        })

        if (!batchResponse.ok) {
          const errorData = await batchResponse.json()
          throw new Error(`Error en lote ${currentBatchNumber + 1}: ${errorData.message || "Error desconocido"}`)
        }

        const batchData = await batchResponse.json()

        if (!batchData.success) {
          throw new Error(`Error en lote ${currentBatchNumber + 1}: ${batchData.error || "Error desconocido"}`)
        }

        // Actualizar progreso
        setProgress(batchData.progress || Math.round(((currentBatchNumber + 1) / totalBatches) * 100))

        // Registrar resultados
        addLog(`Lote ${currentBatchNumber + 1} completado: ${batchData.processedRange}`)
        addLog(
          `- Establecimientos: ${batchData.resultados.establecimientos.insertados} insertados, ${batchData.resultados.establecimientos.errores} errores`,
        )
        addLog(
          `- Contactos: ${batchData.resultados.contactos.insertados} insertados, ${batchData.resultados.contactos.errores} errores`,
        )

        // Verificar si hay más lotes
        hasMore = batchData.hasMore
        if (hasMore) {
          currentBatchNumber++
          // Pequeña pausa para evitar sobrecargar el servidor
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }

      // Migración completada
      setProgress(100)
      setMigrationComplete(true)
      addLog("¡Migración completada con éxito!")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido durante la migración"
      setError(errorMessage)
      addLog(`Error: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Panel de Migración de Datos</CardTitle>
        <CardDescription>Migra los datos desde las hojas de cálculo a la base de datos Supabase</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {migrationComplete && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">Migración Completada</AlertTitle>
            <AlertDescription>La migración se ha completado con éxito.</AlertDescription>
          </Alert>
        )}

        {migrationStarted && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                Progreso: {progress}% {isLoading ? `(Lote ${currentBatch} de ${totalBatches || "?"})` : ""}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="border rounded-md p-4 h-64 overflow-y-auto bg-gray-50 font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-gray-400 italic">Los logs de migración aparecerán aquí...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="pb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={startMigration} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Migrando datos...
            </>
          ) : (
            "Iniciar Migración"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
