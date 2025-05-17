import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Tipos para las tablas de Supabase
type Establecimiento = {
  cue: number
  [key: string]: any
}

type Contacto = {
  cue: number
  [key: string]: any
}

// Función para convertir a snake_case
function toSnakeCase(str: string): string {
  // Convertir a minúsculas y reemplazar espacios por guiones bajos
  let result = str
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[áäâà]/g, "a")
    .replace(/[éëêè]/g, "e")
    .replace(/[íïîì]/g, "i")
    .replace(/[óöôò]/g, "o")
    .replace(/[úüûù]/g, "u")
    .replace(/[^a-z0-9_]/g, "")

  // Eliminar guiones bajos al principio si existen
  result = result.replace(/^_+/, "")

  // Si el resultado está vacío o comienza con un número, añadir prefijo
  if (result === "" || /^\d/.test(result)) {
    result = "col_" + result
  }

  return result
}

// Función para validar y convertir tipos
function convertTypes(data: any[], sheet: string): any[] {
  return data
    .map((row) => {
      const newRow: { [key: string]: any } = {}

      for (const [key, value] of Object.entries(row)) {
        const snakeCaseKey = toSnakeCase(key)

        // Convertir tipos específicos
        if (snakeCaseKey === "cue" && value) {
          newRow[snakeCaseKey] = Number.parseInt(value.toString().replace(/\D/g, ""), 10) || null
        } else if ((snakeCaseKey === "lat" || snakeCaseKey === "lon") && value) {
          newRow[snakeCaseKey] = Number.parseFloat(value.toString().replace(/,/g, ".")) || null
        } else {
          newRow[snakeCaseKey] = value || null
        }
      }

      return newRow
    })
    .filter((row) => row.cue) // Filtrar filas sin CUE
}

// Función para dividir un array en lotes
function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

// Función para verificar si una tabla existe usando SQL directo
async function tableExists(supabase: any, tableName: string): Promise<boolean> {
  try {
    // Enfoque directo: intentar hacer una consulta a la tabla
    const { error: queryError } = await supabase.from(tableName).select("*").limit(1)
    return !queryError
  } catch (error) {
    console.error("Error al verificar si la tabla existe:", error)
    return false
  }
}

// Función para crear las tablas si no existen
async function createTablesIfNotExist(
  supabase: any,
  establecimientosColumns: string[],
  contactosColumns: string[],
): Promise<void> {
  try {
    // Verificar si las tablas existen
    const establecimientosExists = await tableExists(supabase, "establecimientos")
    const contactosExists = await tableExists(supabase, "contactos")

    console.log(`Tabla establecimientos existe: ${establecimientosExists}`)
    console.log(`Tabla contactos existe: ${contactosExists}`)

    // Crear tabla establecimientos si no existe
    if (!establecimientosExists) {
      console.log("Creando tabla establecimientos...")

      // Construir columnas adicionales
      const additionalColumns = establecimientosColumns
        .filter((col) => !["cue", "predio", "establecimiento", "direccion", "lat", "lon"].includes(col))
        .map((col) => `${col} TEXT`)

      const createEstablecimientosSQL = `
        CREATE TABLE establecimientos (
          cue INTEGER PRIMARY KEY,
          predio TEXT,
          establecimiento TEXT,
          direccion TEXT,
          lat DOUBLE PRECISION,
          lon DOUBLE PRECISION,
          ${additionalColumns.join(",\n          ")}
        );
      `

      const { error: createEstablecimientosError } = await supabase.sql(createEstablecimientosSQL)

      if (createEstablecimientosError) {
        console.error("Error al crear tabla establecimientos:", createEstablecimientosError)
        throw new Error(`Error al crear tabla establecimientos: ${createEstablecimientosError.message}`)
      }

      // Crear índices en una operación separada para evitar timeouts
      const createIndicesSQL = `
        CREATE INDEX IF NOT EXISTS idx_establecimientos_nombre ON establecimientos(establecimiento);
        CREATE INDEX IF NOT EXISTS idx_establecimientos_distrito ON establecimientos(distrito) WHERE distrito IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_establecimientos_predio ON establecimientos(predio) WHERE predio IS NOT NULL;
      `

      const { error: createIndicesError } = await supabase.sql(createIndicesSQL)

      if (createIndicesError) {
        console.error("Error al crear índices para establecimientos:", createIndicesError)
      }
    }

    // Crear tabla contactos si no existe
    if (!contactosExists) {
      console.log("Creando tabla contactos...")

      // Construir columnas adicionales
      const additionalColumns = contactosColumns
        .filter((col) => !["cue", "correo", "nombre", "apellido", "cargo", "distrito"].includes(col))
        .map((col) => `${col} TEXT`)

      const createContactosSQL = `
        CREATE TABLE contactos (
          cue INTEGER PRIMARY KEY,
          correo TEXT,
          nombre TEXT,
          apellido TEXT,
          cargo TEXT,
          distrito TEXT,
          ${additionalColumns.join(",\n          ")},
          FOREIGN KEY (cue) REFERENCES establecimientos(cue)
        );
      `

      const { error: createContactosError } = await supabase.sql(createContactosSQL)

      if (createContactosError) {
        console.error("Error al crear tabla contactos:", createContactosError)
        throw new Error(`Error al crear tabla contactos: ${createContactosError.message}`)
      }

      // Crear índices en una operación separada
      const createIndicesSQL = `
        CREATE INDEX IF NOT EXISTS idx_contactos_nombre ON contactos(nombre) WHERE nombre IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_contactos_distrito ON contactos(distrito) WHERE distrito IS NOT NULL;
      `

      const { error: createIndicesError } = await supabase.sql(createIndicesSQL)

      if (createIndicesError) {
        console.error("Error al crear índices para contactos:", createIndicesError)
      }
    }
  } catch (error) {
    console.error("Error al crear tablas:", error)
    throw error
  }
}

// Función para verificar y corregir los nombres de columnas
function verifyColumnNames(data: any[]): any[] {
  // Crear un conjunto para detectar duplicados
  const columnNames = new Set<string>()
  const result = []

  for (const item of data) {
    const newItem: { [key: string]: any } = {}

    for (const [key, value] of Object.entries(item)) {
      let newKey = toSnakeCase(key)

      // Si ya existe este nombre de columna, añadir un sufijo numérico
      let counter = 1
      const originalKey = newKey
      while (columnNames.has(newKey)) {
        newKey = `${originalKey}_${counter}`
        counter++
      }

      columnNames.add(newKey)
      newItem[newKey] = value
    }

    result.push(newItem)
  }

  return result
}

// Función para manejar respuestas HTTP de manera segura
async function safelyParseResponse(response: Response, errorPrefix: string): Promise<any> {
  try {
    // Primero verificar si la respuesta es exitosa
    if (!response.ok) {
      // Intentar obtener el texto de la respuesta
      const text = await response.text()

      // Intentar analizar el texto como JSON
      try {
        const errorData = JSON.parse(text)
        return {
          error: `${errorPrefix}: ${errorData.error || errorData.message || "Error desconocido"}`,
          details: errorData,
        }
      } catch (jsonError) {
        // Si no es JSON válido, devolver el texto como está
        return { error: `${errorPrefix}: ${text}` }
      }
    }

    // Si la respuesta es exitosa, intentar analizarla como JSON
    try {
      return await response.json()
    } catch (jsonError) {
      // Si no es JSON válido, intentar obtener el texto
      const text = await response.text()
      return { error: `${errorPrefix}: La respuesta no es JSON válido`, details: text }
    }
  } catch (error) {
    // Error general al procesar la respuesta
    return { error: `${errorPrefix}: ${(error as Error).message}` }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Encabezado de autorización inválido:", authHeader)
      return NextResponse.json({ error: "Unauthorized: Encabezado de autorización inválido" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const adminAuthKey = process.env.ADMIN_AUTH_KEY

    // Verificar que tenemos ambos tokens
    if (!token) {
      console.error("Token no proporcionado")
      return NextResponse.json({ error: "Unauthorized: Token no proporcionado" }, { status: 401 })
    }

    if (!adminAuthKey) {
      console.error("ADMIN_AUTH_KEY no configurada en el servidor")
      return NextResponse.json(
        { error: "Error de configuración del servidor: ADMIN_AUTH_KEY no configurada" },
        { status: 500 },
      )
    }

    // Comparar los tokens
    if (token !== adminAuthKey) {
      console.error(`Token inválido. Token recibido: ***${token.slice(-4)}`)
      console.error(`Token esperado: ***${adminAuthKey.slice(-4)}`)
      return NextResponse.json({ error: "Unauthorized: Token inválido" }, { status: 401 })
    }

    // Configurar cliente de Supabase
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Missing Supabase configuration" }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Configurar acceso a Google Sheets
    const googleSheetsApiKey = process.env.GOOGLE_SHEETS_API_KEY
    const spreadsheetId = "1VJO9BAg0XI7kujyeOl1_arsMxzMuuiwvJW4D3RzuLGs"

    if (!googleSheetsApiKey) {
      console.error("GOOGLE_SHEETS_API_KEY no configurada en el servidor")
      return NextResponse.json(
        { error: "Error de configuración del servidor: GOOGLE_SHEETS_API_KEY no configurada" },
        { status: 500 },
      )
    }

    // Verificar que la clave de API no esté vacía o tenga un formato inválido
    if (googleSheetsApiKey.trim() === "" || googleSheetsApiKey.includes(" ")) {
      console.error("GOOGLE_SHEETS_API_KEY inválida o mal formateada")
      return NextResponse.json(
        { error: "Error de configuración del servidor: GOOGLE_SHEETS_API_KEY inválida o mal formateada" },
        { status: 500 },
      )
    }

    console.log(`Usando clave de API de Google Sheets: ***${googleSheetsApiKey.slice(-4)}`)

    // Obtener datos de la hoja ESTABLECIMIENTOS
    console.log("Obteniendo datos de ESTABLECIMIENTOS...")
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/ESTABLECIMIENTOS?key=${googleSheetsApiKey}`
    console.log(`URL de la solicitud: ${sheetsUrl.replace(googleSheetsApiKey, "***" + googleSheetsApiKey.slice(-4))}`)

    const establecimientosResponse = await fetch(sheetsUrl, { cache: "no-store" })

    // Manejar la respuesta de manera segura
    const establecimientosData = await safelyParseResponse(
      establecimientosResponse,
      "Error al obtener datos de ESTABLECIMIENTOS",
    )

    // Verificar si hay un error en la respuesta
    if (establecimientosData.error) {
      console.error(establecimientosData.error)
      return NextResponse.json(
        { error: establecimientosData.error, details: establecimientosData.details },
        { status: 500 },
      )
    }

    // Verificar que la respuesta tenga el formato esperado
    if (!establecimientosData.values || !Array.isArray(establecimientosData.values)) {
      console.error("Formato de respuesta inesperado:", establecimientosData)
      return NextResponse.json(
        { error: "Formato de respuesta inesperado de Google Sheets", details: JSON.stringify(establecimientosData) },
        { status: 500 },
      )
    }

    const establecimientosHeaders = establecimientosData.values[0]
    const establecimientosRows = establecimientosData.values.slice(1)

    // Convertir filas a objetos con encabezados
    const establecimientosObjects = establecimientosRows.map((row: any[]) => {
      const obj: { [key: string]: any } = {}
      establecimientosHeaders.forEach((header: string, index: number) => {
        obj[header] = row[index] || null
      })
      return obj
    })

    // Normalizar nombres de columnas
    const normalizedEstablecimientosHeaders = establecimientosHeaders.map(toSnakeCase)

    // Verificar si hay nombres de columnas duplicados o inválidos
    console.log("Verificando nombres de columnas de establecimientos...")
    console.log("Nombres de columnas originales:", establecimientosHeaders)
    console.log("Nombres de columnas normalizados:", normalizedEstablecimientosHeaders)

    // Convertir tipos y normalizar nombres de columnas
    let establecimientosProcessed = convertTypes(establecimientosObjects, "ESTABLECIMIENTOS")

    // Verificar y corregir nombres de columnas
    establecimientosProcessed = verifyColumnNames(establecimientosProcessed)

    // Mostrar las primeras columnas para depuración
    const sampleKeys = Object.keys(establecimientosProcessed[0] || {}).slice(0, 10)
    console.log("Muestra de columnas normalizadas:", sampleKeys)

    // Obtener datos de la hoja CONTACTOS
    console.log("Obteniendo datos de CONTACTOS...")
    const contactosUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/CONTACTOS?key=${googleSheetsApiKey}`

    const contactosResponse = await fetch(contactosUrl, { cache: "no-store" })

    // Manejar la respuesta de manera segura
    const contactosData = await safelyParseResponse(contactosResponse, "Error al obtener datos de CONTACTOS")

    // Verificar si hay un error en la respuesta
    if (contactosData.error) {
      console.error(contactosData.error)
      return NextResponse.json({ error: contactosData.error, details: contactosData.details }, { status: 500 })
    }

    // Verificar que la respuesta tenga el formato esperado
    if (!contactosData.values || !Array.isArray(contactosData.values)) {
      console.error("Formato de respuesta inesperado:", contactosData)
      return NextResponse.json(
        { error: "Formato de respuesta inesperado de Google Sheets", details: JSON.stringify(contactosData) },
        { status: 500 },
      )
    }

    const contactosHeaders = contactosData.values[0]
    const contactosRows = contactosData.values.slice(1)

    // Convertir filas a objetos con encabezados
    const contactosObjects = contactosRows.map((row: any[]) => {
      const obj: { [key: string]: any } = {}
      contactosHeaders.forEach((header: string, index: number) => {
        obj[header] = row[index] || null
      })
      return obj
    })

    // Normalizar nombres de columnas
    const normalizedContactosHeaders = contactosHeaders.map(toSnakeCase)

    // Verificar si hay nombres de columnas duplicados o inválidos
    console.log("Verificando nombres de columnas de contactos...")
    console.log("Nombres de columnas originales:", contactosHeaders)
    console.log("Nombres de columnas normalizados:", normalizedContactosHeaders)

    // Convertir tipos y normalizar nombres de columnas
    let contactosProcessed = convertTypes(contactosObjects, "CONTACTOS")

    // Verificar y corregir nombres de columnas
    contactosProcessed = verifyColumnNames(contactosProcessed)

    // Crear tablas si no existen
    await createTablesIfNotExist(supabaseAdmin, normalizedEstablecimientosHeaders, normalizedContactosHeaders)

    // Limpiar tablas existentes - hacerlo en lotes pequeños para evitar timeouts
    console.log("Limpiando tablas existentes...")

    // Primero eliminar contactos (debido a la restricción de clave foránea)
    await supabaseAdmin.from("contactos").delete().neq("cue", 0)

    // Luego eliminar establecimientos
    await supabaseAdmin.from("establecimientos").delete().neq("cue", 0)

    // Insertar establecimientos en lotes más pequeños
    console.log("Insertando establecimientos...")
    const batchSize = 50 // Reducir el tamaño del lote para evitar timeouts
    const establecimientosBatches = chunk(establecimientosProcessed, batchSize)

    let establecimientosInsertados = 0
    let establecimientosErrores = 0

    for (const batch of establecimientosBatches) {
      try {
        const { error } = await supabaseAdmin.from("establecimientos").insert(batch)

        if (error) {
          console.error("Error al insertar establecimientos:", error)
          establecimientosErrores += batch.length
        } else {
          establecimientosInsertados += batch.length
        }
      } catch (error) {
        console.error("Excepción al insertar establecimientos:", error)
        establecimientosErrores += batch.length
      }

      // Pequeña pausa entre lotes para evitar sobrecarga
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Obtener CUEs válidos de establecimientos
    const { data: cuesValidos } = await supabaseAdmin.from("establecimientos").select("cue")

    const cuesSet = new Set(cuesValidos?.map((e) => e.cue) || [])

    // Filtrar contactos para solo incluir aquellos con CUE válido
    const contactosFiltrados = contactosProcessed.filter((c) => cuesSet.has(c.cue))

    // Insertar contactos en lotes
    console.log("Insertando contactos...")
    const contactosBatches = chunk(contactosFiltrados, batchSize)

    let contactosInsertados = 0
    let contactosErrores = 0

    for (const batch of contactosBatches) {
      try {
        const { error } = await supabaseAdmin.from("contactos").insert(batch)

        if (error) {
          console.error("Error al insertar contactos:", error)
          contactosErrores += batch.length
        } else {
          contactosInsertados += batch.length
        }
      } catch (error) {
        console.error("Excepción al insertar contactos:", error)
        contactosErrores += batch.length
      }

      // Pequeña pausa entre lotes para evitar sobrecarga
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Devolver resultados
    return NextResponse.json({
      success: true,
      resultados: {
        establecimientos: {
          total: establecimientosProcessed.length,
          insertados: establecimientosInsertados,
          errores: establecimientosErrores,
        },
        contactos: {
          total: contactosProcessed.length,
          filtrados: contactosFiltrados.length,
          insertados: contactosInsertados,
          errores: contactosErrores,
        },
      },
    })
  } catch (error) {
    console.error("Error en la migración:", error)
    return NextResponse.json({ error: "Error en la migración", details: (error as Error).message }, { status: 500 })
  }
}
