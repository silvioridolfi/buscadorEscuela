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
  return str
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[áäâà]/g, "a")
    .replace(/[éëêè]/g, "e")
    .replace(/[íïîì]/g, "i")
    .replace(/[óöôò]/g, "o")
    .replace(/[úüûù]/g, "u")
    .replace(/[^a-z0-9_]/g, "")
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

// Función para verificar si una tabla existe
async function tableExists(supabase: any, tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("check_table_exists", { table_name: tableName })

    if (error) {
      // Si la función RPC no existe, creémosla
      await supabase.rpc("create_check_table_exists_function", {}, { count: "exact" })

      // Intentemos nuevamente
      const { data: retryData, error: retryError } = await supabase.rpc("check_table_exists", { table_name: tableName })

      if (retryError) {
        console.error("Error al verificar si la tabla existe:", retryError)

        // Enfoque alternativo: intentar hacer una consulta a la tabla
        const { error: queryError } = await supabase.from(tableName).select("*").limit(1)
        return !queryError
      }

      return retryData?.exists || false
    }

    return data?.exists || false
  } catch (error) {
    console.error("Error al verificar si la tabla existe:", error)

    // Enfoque alternativo: intentar hacer una consulta a la tabla
    try {
      const { error: queryError } = await supabase.from(tableName).select("*").limit(1)
      return !queryError
    } catch {
      return false
    }
  }
}

// Función para crear la función RPC check_table_exists
async function createCheckTableExistsFunction(supabase: any) {
  const { error } = await supabase.rpc("create_check_table_exists_function")
  if (error) {
    console.error("Error al crear la función check_table_exists:", error)

    // Crear la función manualmente
    const { error: sqlError } = await supabase.sql(`
      CREATE OR REPLACE FUNCTION check_table_exists(table_name text)
      RETURNS json
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        exists_val boolean;
      BEGIN
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = $1
        ) INTO exists_val;
        
        RETURN json_build_object('exists', exists_val);
      END;
      $$;
    `)

    if (sqlError) {
      console.error("Error al crear la función check_table_exists manualmente:", sqlError)
    }
  }
}

// Función para crear la función RPC create_check_table_exists_function
async function createHelperFunction(supabase: any) {
  const { error } = await supabase.sql(`
    CREATE OR REPLACE FUNCTION create_check_table_exists_function()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      CREATE OR REPLACE FUNCTION check_table_exists(table_name text)
      RETURNS json
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $func$
      DECLARE
        exists_val boolean;
      BEGIN
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = $1
        ) INTO exists_val;
        
        RETURN json_build_object('exists', exists_val);
      END;
      $func$;
    END;
    $$;
  `)

  if (error) {
    console.error("Error al crear la función helper:", error)
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
        
        CREATE INDEX idx_establecimientos_nombre ON establecimientos(establecimiento);
        CREATE INDEX idx_establecimientos_distrito ON establecimientos(distrito) WHERE distrito IS NOT NULL;
        CREATE INDEX idx_establecimientos_predio ON establecimientos(predio) WHERE predio IS NOT NULL;
      `

      const { error: createEstablecimientosError } = await supabase.sql(createEstablecimientosSQL)

      if (createEstablecimientosError) {
        console.error("Error al crear tabla establecimientos:", createEstablecimientosError)
        throw new Error(`Error al crear tabla establecimientos: ${createEstablecimientosError.message}`)
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
        
        CREATE INDEX idx_contactos_nombre ON contactos(nombre) WHERE nombre IS NOT NULL;
        CREATE INDEX idx_contactos_distrito ON contactos(distrito) WHERE distrito IS NOT NULL;
      `

      const { error: createContactosError } = await supabase.sql(createContactosSQL)

      if (createContactosError) {
        console.error("Error al crear tabla contactos:", createContactosError)
        throw new Error(`Error al crear tabla contactos: ${createContactosError.message}`)
      }
    }
  } catch (error) {
    console.error("Error al crear tablas:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const adminAuthKey = process.env.ADMIN_AUTH_KEY

    if (token !== adminAuthKey) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
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
      return NextResponse.json({ error: "Missing Google Sheets API key" }, { status: 500 })
    }

    // Crear funciones auxiliares para verificar tablas
    await createHelperFunction(supabaseAdmin)

    // Obtener datos de la hoja ESTABLECIMIENTOS
    console.log("Obteniendo datos de ESTABLECIMIENTOS...")
    const establecimientosResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/ESTABLECIMIENTOS?key=${googleSheetsApiKey}`,
    )

    if (!establecimientosResponse.ok) {
      return NextResponse.json(
        { error: "Error fetching ESTABLECIMIENTOS sheet", details: await establecimientosResponse.text() },
        { status: 500 },
      )
    }

    const establecimientosData = await establecimientosResponse.json()
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

    // Convertir tipos y normalizar nombres de columnas
    const establecimientosProcessed = convertTypes(establecimientosObjects, "ESTABLECIMIENTOS")

    // Obtener datos de la hoja CONTACTOS
    console.log("Obteniendo datos de CONTACTOS...")
    const contactosResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/CONTACTOS?key=${googleSheetsApiKey}`,
    )

    if (!contactosResponse.ok) {
      return NextResponse.json(
        { error: "Error fetching CONTACTOS sheet", details: await contactosResponse.text() },
        { status: 500 },
      )
    }

    const contactosData = await contactosResponse.json()
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

    // Convertir tipos y normalizar nombres de columnas
    const contactosProcessed = convertTypes(contactosObjects, "CONTACTOS")

    // Crear tablas si no existen
    await createTablesIfNotExist(supabaseAdmin, normalizedEstablecimientosHeaders, normalizedContactosHeaders)

    // Limpiar tablas existentes
    console.log("Limpiando tablas existentes...")
    await supabaseAdmin.from("contactos").delete().neq("cue", 0)
    await supabaseAdmin.from("establecimientos").delete().neq("cue", 0)

    // Insertar establecimientos en lotes
    console.log("Insertando establecimientos...")
    const batchSize = 100
    const establecimientosBatches = chunk(establecimientosProcessed, batchSize)

    let establecimientosInsertados = 0
    let establecimientosErrores = 0

    for (const batch of establecimientosBatches) {
      const { error } = await supabaseAdmin.from("establecimientos").insert(batch)

      if (error) {
        console.error("Error al insertar establecimientos:", error)
        establecimientosErrores += batch.length
      } else {
        establecimientosInsertados += batch.length
      }
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
      const { error } = await supabaseAdmin.from("contactos").insert(batch)

      if (error) {
        console.error("Error al insertar contactos:", error)
        contactosErrores += batch.length
      } else {
        contactosInsertados += batch.length
      }
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
