import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getSheetData } from "@/lib/legacy-api-utils"
import { verifyAdminAuth } from "@/lib/auth-utils"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0
export const maxDuration = 60 // Ajustado al máximo permitido (60 segundos)

// Función para manejar errores y siempre devolver JSON válido
function handleError(error: any, status = 500) {
  console.error("Error en la API de migración de hoja:", error)

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

// Función para normalizar nombres de columnas
function normalizeColumnName(columnName: string): string {
  return columnName.toLowerCase().replace(/\s+/g, "_").trim()
}

// Función para obtener las columnas existentes de una tabla
async function getExistingColumns(tableName: string): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin.rpc("get_table_columns", { table_name: tableName })

    if (error) {
      console.error(`Error al obtener columnas de la tabla ${tableName}:`, error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error(`Error al obtener columnas de la tabla ${tableName}:`, error)

    // Intento alternativo usando información del esquema
    try {
      const { data, error } = await supabaseAdmin
        .from("information_schema.columns")
        .select("column_name")
        .eq("table_name", tableName)

      if (error) throw error

      return data ? data.map((col) => col.column_name) : []
    } catch (innerError) {
      console.error(`Error alternativo al obtener columnas:`, innerError)
      throw error // Lanzamos el error original
    }
  }
}

// Función para agregar columnas nuevas si no existen
async function addMissingColumns(tableName: string, columns: string[]): Promise<string[]> {
  try {
    // Obtener columnas existentes
    const existingColumns = await getExistingColumns(tableName)
    const columnsToAdd = columns.filter((col) => !existingColumns.includes(col))

    // Agregar columnas nuevas
    for (const column of columnsToAdd) {
      try {
        const { error } = await supabaseAdmin.rpc("alter_table_add_column_if_not_exists", {
          table_name: tableName,
          column_name: column,
          column_type: "TEXT",
        })

        if (error) {
          // Si falla la función RPC, intentamos con SQL directo
          console.warn(`Error al usar RPC para agregar columna ${column}:`, error)

          const sql = `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${column} TEXT;`
          const { error: sqlError } = await supabaseAdmin.rpc("execute_sql", { sql })

          if (sqlError) {
            throw sqlError
          }
        }
      } catch (columnError) {
        console.error(`Error al agregar columna ${column}:`, columnError)
        throw columnError
      }
    }

    return columnsToAdd
  } catch (error) {
    console.error(`Error al agregar columnas a la tabla ${tableName}:`, error)
    throw error
  }
}

// Función para verificar si un registro existe por su CUE
async function recordExistsByCUE(tableName: string, cue: any): Promise<boolean> {
  try {
    const { data, error, count } = await supabaseAdmin
      .from(tableName)
      .select("*", { count: "exact", head: true })
      .eq("cue", cue)

    if (error) throw error

    return count !== null && count > 0
  } catch (error) {
    console.error(`Error al verificar existencia de registro con CUE ${cue}:`, error)
    throw error
  }
}

// Función para procesar los datos y actualizar/insertar en la base de datos
async function processData(tableName: string, data: any[]): Promise<{ inserted: number; updated: number }> {
  if (!data || data.length === 0) {
    return { inserted: 0, updated: 0 }
  }

  // Normalizar nombres de columnas en los datos
  const normalizedData = data.map((record) => {
    const normalizedRecord: Record<string, any> = {}

    Object.entries(record).forEach(([key, value]) => {
      const normalizedKey = normalizeColumnName(key)
      normalizedRecord[normalizedKey] = value
    })

    return normalizedRecord
  })

  // Obtener todas las columnas normalizadas
  const allColumns = Array.from(new Set(normalizedData.flatMap((record) => Object.keys(record))))

  // Agregar columnas que no existen
  const addedColumns = await addMissingColumns(tableName, allColumns)

  // Procesar cada registro
  let inserted = 0
  let updated = 0

  for (const record of normalizedData) {
    try {
      // Verificar si el registro ya existe por su CUE
      const cue = record.cue

      if (!cue) {
        console.warn("Registro sin CUE encontrado, se omitirá:", record)
        continue
      }

      const exists = await recordExistsByCUE(tableName, cue)

      if (exists) {
        // Filtrar campos no nulos para actualización
        const updateData: Record<string, any> = {}

        Object.entries(record).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== "") {
            updateData[key] = value
          }
        })

        // Actualizar registro existente con campos no nulos
        const { error } = await supabaseAdmin.from(tableName).update(updateData).eq("cue", cue)

        if (error) throw error

        updated++
      } else {
        // Insertar nuevo registro
        const { error } = await supabaseAdmin.from(tableName).insert([record])

        if (error) throw error

        inserted++
      }
    } catch (recordError) {
      console.error(`Error al procesar registro:`, recordError, record)
      // Continuamos con el siguiente registro en caso de error
    }
  }

  return { inserted, updated }
}

export async function POST(request: Request) {
  try {
    // Obtener datos de la solicitud
    const requestData = await request.json()
    const { authKey, sheetId, sheetName = "establecimientos" } = requestData

    // Verificar parámetros requeridos
    if (!sheetId) {
      return handleError(new Error("Falta el ID de la hoja de cálculo"), 400)
    }

    // Verificar autenticación
    const isAuthenticated = verifyAdminAuth(authKey)

    if (!isAuthenticated) {
      return handleError(new Error("No autorizado: Clave de autenticación inválida"), 401)
    }

    // Obtener datos de la hoja
    const sheetData = await getSheetData(sheetId)

    if (!sheetData || !Array.isArray(sheetData) || sheetData.length === 0) {
      return handleError(new Error("No se encontraron datos en la hoja especificada"), 404)
    }

    // Procesar los datos
    const tableName = sheetName.toLowerCase()
    const { inserted, updated } = await processData(tableName, sheetData)

    // Obtener columnas agregadas
    const allColumns = Array.from(
      new Set(sheetData.flatMap((record) => Object.keys(record).map((key) => normalizeColumnName(key)))),
    )

    const existingColumns = await getExistingColumns(tableName)
    const addedColumns = allColumns.filter((col) => !existingColumns.includes(col))

    // Devolver respuesta
    return NextResponse.json({
      success: true,
      processed: sheetData.length,
      inserted,
      updated,
      addedColumns,
      message: `Migración completada. ${inserted} registros insertados, ${updated} registros actualizados.`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return handleError(error)
  }
}
