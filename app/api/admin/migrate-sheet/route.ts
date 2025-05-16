import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getSheetData } from "@/lib/legacy-api-utils"
import { verifyAdminAuth } from "@/lib/auth-utils"
import { bypassAdminAuth } from "@/lib/admin-bypass"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
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

// Función para normalizar nombres de columnas - MEJORADA para manejar acentos y caracteres especiales
function normalizeColumnName(columnName: string): string {
  if (!columnName) return ""

  // Primero convertimos a minúsculas y reemplazamos espacios por guiones bajos
  let normalized = columnName.toLowerCase().replace(/\s+/g, "_").trim()

  // Luego eliminamos los acentos/tildes
  normalized = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

  // Eliminar caracteres especiales y guiones bajos al principio
  normalized = normalized.replace(/^[_\W]+/, "")

  // Reemplazar caracteres no alfanuméricos con guiones bajos
  normalized = normalized.replace(/[^\w]/g, "_")

  // Eliminar guiones bajos múltiples
  normalized = normalized.replace(/_+/g, "_")

  return normalized
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

// Función para obtener las columnas existentes en una tabla
async function getTableColumns(tableName: string): Promise<string[]> {
  try {
    // Enfoque directo: intentar inferir columnas de una fila
    const { data: sampleRow, error: sampleError } = await supabaseAdmin.from(tableName).select("*").limit(1).single()

    if (sampleError || !sampleRow) {
      console.error(`Error al obtener muestra de la tabla ${tableName}:`, sampleError)

      // Si no hay datos, intentamos con un enfoque alternativo
      // Definimos columnas básicas que sabemos que existen
      return [
        "id",
        "cue",
        "nombre",
        "direccion",
        "distrito",
        "ciudad",
        "lat",
        "lon",
        "predio",
        "created_at",
        "updated_at",
      ]
    }

    // Extraer nombres de columnas del objeto de muestra
    return Object.keys(sampleRow)
  } catch (error) {
    console.error(`Error al obtener columnas de la tabla ${tableName}:`, error)
    // Devolver columnas básicas como fallback
    return [
      "id",
      "cue",
      "nombre",
      "direccion",
      "distrito",
      "ciudad",
      "lat",
      "lon",
      "predio",
      "created_at",
      "updated_at",
    ]
  }
}

// Función para obtener los tipos de columnas de una tabla
async function getColumnTypes(tableName: string): Promise<Record<string, string>> {
  // Definimos tipos conocidos para columnas comunes
  const knownTypes: Record<string, string> = {
    lat: "double precision",
    lon: "double precision",
    latitude: "double precision",
    longitude: "double precision",
    latitud: "double precision",
    longitud: "double precision",
    mb: "double precision", // Megabytes o ancho de banda
  }

  return knownTypes
}

// Función para verificar si un valor es un valor especial de hoja de cálculo
function isSpreadsheetSpecialValue(value: any): boolean {
  if (typeof value !== "string") return false

  // Lista de valores especiales comunes en hojas de cálculo
  const specialValues = ["#N/A", "#NA", "N/A", "#VALUE!", "#DIV/0!", "#REF!", "#NUM!", "#NULL!", "NULL", "-"]

  return specialValues.includes(value.toUpperCase().trim())
}

// Función para convertir valores según su tipo
function convertValueByType(value: any, columnName: string, columnTypes: Record<string, string>): any {
  if (value === null || value === undefined || value === "") {
    return null
  }

  // Verificar si es un valor especial de hoja de cálculo
  if (isSpreadsheetSpecialValue(value)) {
    return null
  }

  // Si es un campo numérico conocido, convertir comas a puntos
  const columnType = columnTypes[columnName]
  if (columnType === "double precision") {
    if (typeof value === "string") {
      // Convertir coma a punto para números decimales
      const convertedValue = value.replace(",", ".")

      // Verificar si es un número válido
      if (!isNaN(Number.parseFloat(convertedValue))) {
        return Number.parseFloat(convertedValue)
      }

      // Si no es un número válido, devolver null
      return null
    } else if (typeof value === "number") {
      // Ya es un número, devolverlo tal cual
      return value
    }

    // Si no es string ni number, devolver null
    return null
  }

  return value
}

// Función para procesar los datos y actualizar/insertar en la base de datos
async function processData(
  tableName: string,
  data: any[],
): Promise<{ inserted: number; updated: number; skippedColumns: string[]; errors: string[] }> {
  if (!data || data.length === 0) {
    return { inserted: 0, updated: 0, skippedColumns: [], errors: [] }
  }

  // Verificar si la tabla existe
  const tableExist = await tableExists(tableName)

  // Si la tabla no existe, no podemos continuar
  if (!tableExist) {
    console.log(`La tabla ${tableName} no existe. Se asume que debe ser creada manualmente.`)
    throw new Error(`La tabla ${tableName} no existe en la base de datos. Debe crearla manualmente primero.`)
  }

  // Obtener las columnas existentes en la tabla
  const existingColumns = await getTableColumns(tableName)
  console.log(`Columnas existentes en la tabla ${tableName}:`, existingColumns)

  if (existingColumns.length === 0) {
    throw new Error(`No se pudieron obtener las columnas de la tabla ${tableName}. Verifique los permisos.`)
  }

  // Obtener los tipos de columnas
  const columnTypes = await getColumnTypes(tableName)

  // Normalizar nombres de columnas en los datos
  const normalizedData = data.map((record) => {
    const normalizedRecord: Record<string, any> = {}

    Object.entries(record).forEach(([key, value]) => {
      const normalizedKey = normalizeColumnName(key)
      if (normalizedKey) {
        normalizedRecord[normalizedKey] = value
      }
    })

    return normalizedRecord
  })

  // Obtener todas las columnas normalizadas de los datos
  const allDataColumns = Array.from(new Set(normalizedData.flatMap((record) => Object.keys(record))))

  // Identificar columnas que no existen en la tabla
  const skippedColumns = allDataColumns.filter((col) => !existingColumns.includes(col))
  console.log(`Columnas que se omitirán por no existir en la tabla:`, skippedColumns)

  const errors: string[] = []

  // Procesar cada registro
  let inserted = 0
  let updated = 0

  for (const record of normalizedData) {
    try {
      // Verificar si el registro ya existe por su CUE
      const cue = record.cue

      if (!cue) {
        console.warn("Registro sin CUE encontrado, se omitirá:", record)
        errors.push("Registro sin CUE encontrado, se omitió")
        continue
      }

      // Filtrar solo las columnas que existen en la tabla y convertir valores según el tipo
      const filteredRecord: Record<string, any> = {}
      Object.entries(record).forEach(([key, value]) => {
        if (existingColumns.includes(key)) {
          // Convertir el valor según el tipo de columna
          const convertedValue = convertValueByType(value, key, columnTypes)

          // Solo incluir valores no nulos
          if (convertedValue !== null && convertedValue !== undefined && convertedValue !== "") {
            filteredRecord[key] = convertedValue
          }
        }
      })

      // Si no hay campos válidos después de filtrar, omitir este registro
      if (Object.keys(filteredRecord).length === 0) {
        console.warn(`Registro con CUE ${cue} no tiene campos válidos después de filtrar, se omitirá.`)
        errors.push(`Registro con CUE ${cue} no tiene campos válidos después de filtrar, se omitió.`)
        continue
      }

      // Verificar si el registro existe
      const { data, error, count } = await supabaseAdmin
        .from(tableName)
        .select("*", { count: "exact", head: true })
        .eq("cue", cue)

      const exists = count !== null && count > 0

      if (exists) {
        // Actualizar registro existente con campos filtrados
        const { error: updateError } = await supabaseAdmin.from(tableName).update(filteredRecord).eq("cue", cue)

        if (updateError) {
          console.warn(`Error al actualizar registro con CUE ${cue}:`, updateError)
          errors.push(`Error al actualizar registro con CUE ${cue}: ${updateError.message}`)
        } else {
          updated++
        }
      } else {
        // Insertar nuevo registro con campos filtrados
        const { error: insertError } = await supabaseAdmin.from(tableName).insert([filteredRecord])

        if (insertError) {
          console.warn(`Error al insertar registro con CUE ${cue}:`, insertError)
          errors.push(`Error al insertar registro con CUE ${cue}: ${insertError.message}`)
        } else {
          inserted++
        }
      }
    } catch (recordError) {
      console.error(`Error al procesar registro:`, recordError)
      errors.push(
        `Error al procesar registro: ${recordError instanceof Error ? recordError.message : "Error desconocido"}`,
      )
      // Continuamos con el siguiente registro en caso de error
    }
  }

  return { inserted, updated, skippedColumns, errors }
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
    const { inserted, updated, skippedColumns, errors } = await processData(tableName, sheetData)

    // Devolver respuesta
    return NextResponse.json({
      success: true,
      processed: sheetData.length,
      inserted,
      updated,
      skippedColumns,
      errors: errors.length > 0 ? errors : undefined,
      message: `Migración completada. ${inserted} registros insertados, ${updated} registros actualizados.`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return handleError(error)
  }
}
