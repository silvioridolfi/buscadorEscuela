import { getSheetData } from "../lib/api-utils"
import { supabaseAdmin, type Establecimiento, type Contacto, generateUUID } from "../lib/supabase"

/**
 * Script para migrar datos desde las hojas de cálculo a Supabase
 *
 * Este script se puede ejecutar manualmente o programar para que se ejecute periódicamente
 * para mantener la base de datos sincronizada con las hojas de cálculo.
 */

// Función para insertar datos en lotes con upsert
async function insertDataInBatches(tableName, data, batchSize = 100) {
  console.log(`Insertando o actualizando ${data.length} filas en la tabla ${tableName}...`)

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)

    // Limpiar campos vacíos de cada fila
    const cleanBatch = batch.map((row) => {
      const cleanRow = {}
      Object.entries(row).forEach(([key, value]) => {
        if (value !== null && value !== "" && value !== undefined) {
          cleanRow[key] = value
        }
      })
      return cleanRow
    })

    const { error } = await supabaseAdmin.from(tableName).upsert(cleanBatch, { onConflict: ["cue"] })

    if (error) {
      console.error(`Error al hacer upsert en ${tableName} (lote ${i}–${i + batchSize}):`, error)
    } else {
      console.log(`Lote ${i}–${i + batchSize} procesado correctamente.`)
    }
  }

  console.log(`Migración finalizada para ${tableName}.`)
}

async function migrateDataToSupabase() {
  console.log("Iniciando migración de datos a Supabase...")

  try {
    // 1. Obtener datos de las hojas de cálculo
    console.log("Obteniendo datos de las hojas de cálculo...")
    const { establishmentsData, contactsData } = await getSheetData()

    if (!Array.isArray(establishmentsData) || establishmentsData.length === 0) {
      throw new Error("No se pudieron obtener los datos de establecimientos")
    }

    console.log(`Se obtuvieron ${establishmentsData.length} establecimientos y ${contactsData?.length || 0} contactos`)

    // 2. Transformar los datos al formato de Supabase
    console.log("Transformando datos al formato de Supabase...")
    const establecimientos: Establecimiento[] = establishmentsData.map((school) => {
      // Convertir CUE a número (bigint)
      const cue = Number.parseInt(school.CUE, 10)
      if (isNaN(cue)) {
        console.warn(`CUE inválido: ${school.CUE}, usando 0 como valor predeterminado`)
      }

      // Convertir coordenadas a números
      let lat: number | undefined = undefined
      let lon: number | undefined = undefined

      if (school.Lat && school.Lon) {
        const parsedLat = Number.parseFloat(school.Lat)
        const parsedLon = Number.parseFloat(school.Lon)

        if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
          lat = parsedLat
          lon = parsedLon
        }
      }

      // Crear objeto según la estructura real de la tabla
      return {
        id: generateUUID(), // Generar un UUID para cada establecimiento
        cue: isNaN(cue) ? 0 : cue,
        nombre: school.ESTABLECIMIENTO,
        distrito: school.DISTRITO,
        ciudad: school.CIUDAD,
        direccion: school["DIRECCIÓN"],
        lat,
        lon,
        // No incluimos fed_id e info_tecnica_id ya que no tenemos esos datos
      }
    })

    const contactos: Contacto[] = contactsData.map((contact) => {
      // Convertir CUE a número (bigint)
      const cue = Number.parseInt(contact.CUE, 10)
      if (isNaN(cue)) {
        console.warn(`CUE inválido en contacto: ${contact.CUE}, usando 0 como valor predeterminado`)
      }

      return {
        id: generateUUID(), // Generar un UUID para cada contacto
        cue: isNaN(cue) ? 0 : cue,
        nombre: contact["NOMBRE"],
        apellido: contact["APELLIDO"],
        correo: contact["CORREO INSTITUCIONAL"],
        telefono: contact["TELÉFONO"],
      }
    })

    // 3. Insertar datos en Supabase usando la nueva función insertDataInBatches
    console.log("Insertando datos en Supabase...")

    // Insertar establecimientos
    await insertDataInBatches("establecimientos", establecimientos, 100)

    // Insertar contactos
    if (contactos && contactos.length > 0) {
      await insertDataInBatches("contactos", contactos, 100)
    }

    console.log("Migración completada con éxito")
  } catch (error) {
    console.error("Error durante la migración:", error)
  }
}

// Ejecutar la migración
migrateDataToSupabase()
