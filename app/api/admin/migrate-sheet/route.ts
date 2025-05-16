import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getSheetData } from "@/lib/legacy-api-utils"
import { verifyAdminAuth } from "@/lib/auth-utils"
import { bypassAdminAuth } from "@/lib/admin-bypass"

export const dynamic = "force-dynamic"
export const fetchCache = "force_no_store"
export const revalidate = 0
export const maxDuration = 60 // Máximo permitido: 60 segundos

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

// Función para verificar si una tabla existe
async function tableExists(tableName: string): Promise<boolean> {
  try {
    // Intentamos hacer una consulta simple a la tabla
    const { data, error } = await supabaseAdmin.from(tableName).select("*").limit(1)

    // Si no hay error, la tabla existe
    return !error
  } catch (error) {
    console.error(`Error al verificar si la tabla existe:`, error)
    return false
  }
}

// Función para crear una tabla si no existe
async function createTableIfNotExists(tableName: string, columns: string[]): Promise<boolean> {
  try {
    // Verificar si la tabla ya existe
    const exists = await tableExists(tableName)

    if (exists) {
      console.log(`La tabla ${tableName} ya existe.`)
      return true
    }

    // Crear la tabla con las columnas proporcionadas
    const createTableSQL = `
      CREATE TABLE ${tableName} (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        cue TEXT,
        nombre TEXT,
        direccion TEXT,
        localidad TEXT,
        codigo_postal TEXT,
        telefono TEXT,
        email TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Ejecutar la consulta SQL para crear la tabla
    const { error } = await supabaseAdmin.rpc("execute_sql", { sql: createTableSQL })

    if (error) {
      console.error(`Error al crear la tabla ${tableName}:`, error)

      // Intentar con un enfoque más simple
      try {
        // Crear una tabla mínima y luego agregar columnas
        const simpleCreateSQL = `
          CREATE TABLE ${tableName} (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            cue TEXT
          );
        `

        const { error: simpleError } = await supabaseAdmin.rpc("execute_sql", { sql: simpleCreateSQL })

        if (simpleError) {
          console.error(`Error al crear tabla simple:`, simpleError)
          return false
        }

        return true
      } catch (simpleError) {
        console.error(`Error al crear tabla simple:`, simpleError)
        return false
      }
    }

    console.log(`Tabla ${tableName} creada correctamente.`)
    return true
  } catch (error) {
    console.error(`Error al crear la tabla ${tableName}:`, error)
    return false
  }
}

// Función para verificar si una columna existe en una tabla
async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    // Intentamos hacer una consulta seleccionando solo esa columna
    const { error } = await supabaseAdmin.from(tableName).select(columnName).limit(1)

    // Si no hay error, la columna existe
    return !error
  } catch (error) {
    console.error(`Error al verificar si la columna ${columnName} existe:`, error)
    return false
  }
}

// Función para agregar una columna a una tabla
async function addColumnToTable(tableName: string, columnName: string): Promise<boolean> {
  try {
    // Verificar si la columna ya existe
    const exists = await columnExists(tableName, columnName)

    if (exists) {
      return true
    }

    // Agregar la columna
    const alterSQL = `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${columnName} TEXT;`

    const { error } = await supabaseAdmin.rpc("execute_sql", { sql: alterSQL })

    if (error) {
      console.error(`Error al agregar columna ${columnName}:`, error)
      return false
    }

    return true
  } catch (error) {
    console.error(`Error al agregar columna ${columnName}:`, error)
    return false
  }
}

// Función para agregar columnas a una tabla existente
async function addColumnsToTable(tableName: string, columns: string[]): Promise<string[]> {
  try {
    const addedColumns: string[] = []

    // Agregar cada columna individualmente
    for (const column of columns) {
      const added = await addColumnToTable(tableName, column)

      if (added) {
        addedColumns.push(column)
      }
    }

    return addedColumns
  } catch (error) {
    console.error(`Error al agregar columnas a la tabla ${tableName}:`, error)
    return []
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
async function processData(
  tableName: string,
  data: any[],
): Promise<{ inserted: number; updated: number; addedColumns: string[] }> {
  if (!data || data.length === 0) {
    return { inserted: 0, updated: 0, addedColumns: [] }
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

  // Verificar si la tabla existe, si no, crearla
  const tableCreated = await createTableIfNotExists(tableName, allColumns)

  if (!tableCreated) {
    throw new Error(`No se pudo crear la tabla ${tableName}.`)
  }

  // Agregar columnas que no existen
  const addedColumns = await addColumnsToTable(tableName, allColumns)

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

  return { inserted, updated, addedColumns }
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

    // Verificar autenticación - MODIFICADO para aceptar bypass en desarrollo
    let isAuthenticated = verifyAdminAuth(authKey)

    // Si estamos en desarrollo, también aceptamos el bypass
    if (!isAuthenticated && process.env.NODE_ENV === "development") {
      isAuthenticated = bypassAdminAuth() && authKey === "bypass_token_temporary"
    }

    if (!isAuthenticated) {
      console.error("Autenticación fallida. Token recibido:", authKey)
      return handleError(new Error("No autorizado: Clave de autenticación inválida"), 401)
    }

    // Obtener datos de la hoja - MODIFICADO para usar directamente la función legacy
    let sheetData: any[] = []

    try {
      // Usar directamente la función legacy ya que la API key de Google no está configurada
      console.log("Obteniendo datos con la API legacy...")
      sheetData = await getSheetData(sheetId)
    } catch (error) {
      console.error("Error al obtener datos:", error)
      return handleError(
        new Error(
          `No se pudieron obtener datos de la hoja. Verifique el ID y los permisos. Solo se admiten las hojas 'establecimientos' y 'contactos' en esta versión.`,
        ),
        404,
      )
    }

    if (!sheetData || !Array.isArray(sheetData) || sheetData.length === 0) {
      return handleError(new Error("No se encontraron datos en la hoja especificada"), 404)
    }

    console.log(`Datos obtenidos correctamente. Procesando ${sheetData.length} registros...`)

    // Procesar los datos
    const tableName = sheetName.toLowerCase()
    const { inserted, updated, addedColumns } = await processData(tableName, sheetData)

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
