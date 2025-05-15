import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getSheetData } from "@/lib/legacy-api-utils"
import { verifyAdminAuth } from "@/lib/auth-utils"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0
export const maxDuration = 60 // Máximo permitido: 60 segundos

// Función para manejar errores y siempre devolver JSON válido
function handleError(error: any, status = 500) {
  console.error("Error en la API de migración de hoja:", error)

  // Asegurarse de que siempre devolvemos un objeto JSON válido
  return NextResponse.json(
    {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
      stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : null) : null,
      timestamp: new Date().toISOString(),
    },
    { status },
  )
}

// Función para crear una tabla en Supabase basada en los datos de una hoja
async function createTableForSheet(sheet: string, data: any[]) {
  if (!data || data.length === 0) {
    throw new Error(`No hay datos para crear la tabla ${sheet}`)
  }

  // Obtener las columnas del primer registro
  const firstRecord = data[0]
  const columns = Object.keys(firstRecord)

  // Crear la consulta SQL para crear la tabla
  let createTableSQL = `
    CREATE TABLE IF NOT EXISTS ${sheet} (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  `

  // Agregar columnas basadas en los datos
  columns.forEach((column, index) => {
    // Normalizar el nombre de la columna (convertir a minúsculas, reemplazar espacios por guiones bajos)
    const normalizedColumn = column.toLowerCase().replace(/\s+/g, "_")

    // Determinar el tipo de datos basado en el valor
    let columnType = "TEXT"
    const value = firstRecord[column]

    if (typeof value === "number") {
      if (Number.isInteger(value)) {
        columnType = "INTEGER"
      } else {
        columnType = "NUMERIC"
      }
    } else if (typeof value === "boolean") {
      columnType = "BOOLEAN"
    } else if (value instanceof Date) {
      columnType = "TIMESTAMP WITH TIME ZONE"
    }

    createTableSQL += `${normalizedColumn} ${columnType}`

    // Agregar coma si no es la última columna
    if (index < columns.length - 1) {
      createTableSQL += ","
    }

    createTableSQL += "\n"
  })

  createTableSQL += ");"

  // Ejecutar la consulta SQL para crear la tabla
  try {
    const { error } = await supabaseAdmin.rpc("execute_sql", { sql: createTableSQL })

    if (error) {
      throw new Error(`Error al crear la tabla ${sheet}: ${error.message}`)
    }

    console.log(`Tabla ${sheet} creada o verificada correctamente`)
    return true
  } catch (error) {
    console.error(`Error al crear la tabla ${sheet}:`, error)
    throw error
  }
}

// Función para insertar datos en una tabla
async function insertDataIntoTable(sheet: string, data: any[]) {
  if (!data || data.length === 0) {
    return { success: true, recordsProcessed: 0 }
  }

  // Normalizar los nombres de las columnas
  const normalizedData = data.map((record) => {
    const normalizedRecord: Record<string, any> = {}

    Object.entries(record).forEach(([key, value]) => {
      const normalizedKey = key.toLowerCase().replace(/\s+/g, "_")
      normalizedRecord[normalizedKey] = value
    })

    return normalizedRecord
  })

  // Insertar los datos en la tabla
  try {
    const { error } = await supabaseAdmin.from(sheet).insert(normalizedData)

    if (error) {
      throw new Error(`Error al insertar datos en la tabla ${sheet}: ${error.message}`)
    }

    console.log(`${normalizedData.length} registros insertados en la tabla ${sheet}`)
    return { success: true, recordsProcessed: normalizedData.length }
  } catch (error) {
    console.error(`Error al insertar datos en la tabla ${sheet}:`, error)
    throw error
  }
}

// Función para procesar una hoja en lotes
async function processSheetInBatches(sheet: string, batchSize: number) {
  try {
    // Obtener todos los datos de la hoja
    const data = await getSheetData(sheet)

    if (!data || !Array.isArray(data) || data.length === 0) {
      return { success: true, recordsProcessed: 0, totalRecords: 0 }
    }

    // Crear la tabla si no existe
    await createTableForSheet(sheet, data)

    // Procesar los datos en lotes
    const totalRecords = data.length
    let recordsProcessed = 0

    for (let i = 0; i < totalRecords; i += batchSize) {
      const batch = data.slice(i, i + batchSize)
      const result = await insertDataIntoTable(sheet, batch)
      recordsProcessed += result.recordsProcessed

      // Pequeña pausa entre lotes para no sobrecargar la base de datos
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    return { success: true, recordsProcessed, totalRecords }
  } catch (error) {
    console.error(`Error al procesar la hoja ${sheet}:`, error)
    throw error
  }
}

export async function POST(request: Request) {
  try {
    // Obtener datos de la solicitud
    const requestData = await request.json()
    const { authKey, sheet, batchSize = 10 } = requestData

    // Verificar que se proporcionó el nombre de la hoja
    if (!sheet) {
      return handleError(new Error("Falta el nombre de la hoja"), 400)
    }

    // Verificar autenticación
    const isAuthenticated = verifyAdminAuth(authKey)

    if (!isAuthenticated) {
      return handleError(new Error("No autorizado: Clave de autenticación inválida"), 401)
    }

    // Procesar la hoja en lotes
    const result = await processSheetInBatches(sheet, batchSize)

    return NextResponse.json({
      success: true,
      sheet,
      recordsProcessed: result.recordsProcessed,
      totalRecords: result.totalRecords,
      message: `Migración de la hoja "${sheet}" completada. ${result.recordsProcessed} registros procesados.`,
    })
  } catch (error) {
    return handleError(error)
  }
}
