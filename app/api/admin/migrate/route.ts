import { NextResponse } from "next/server"
import { getSheetData } from "@/lib/api-utils"
import { supabaseAdmin, type Establecimiento, type Contacto, generateUUID } from "@/lib/supabase"
import { verifyAdminAuth } from "@/lib/auth-utils"

// Esta ruta API permite ejecutar la migración de datos manualmente
export async function POST(request: Request) {
  try {
    // Verificar si la solicitud tiene una clave de autorización
    const body = await request.json()
    const { authToken, batchSize = 50, batchNumber = 0, fullMigration = false } = body

    // Verificar la autenticación usando el sistema de autenticación
    if (!verifyAdminAuth(authToken)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Si es una migración completa, procesamos todo desde el principio
    if (fullMigration && batchNumber === 0) {
      console.log("Iniciando migración completa...")

      try {
        // 1. Obtener datos de las hojas de cálculo con más información de diagnóstico
        console.log("Obteniendo datos de las hojas de cálculo...")

        // Intentar obtener los datos con manejo de errores mejorado
        let sheetDataResult
        try {
          sheetDataResult = await getSheetData()

          // Verificar explícitamente la estructura de los datos
          if (!sheetDataResult) {
            throw new Error("La función getSheetData() devolvió un valor nulo o indefinido")
          }

          const { establishmentsData, contactsData } = sheetDataResult

          if (!establishmentsData) {
            throw new Error("No se recibieron datos de establecimientos (undefined)")
          }

          if (!Array.isArray(establishmentsData)) {
            throw new Error(`Los datos de establecimientos no son un array: ${typeof establishmentsData}`)
          }

          if (establishmentsData.length === 0) {
            throw new Error("Se recibió un array vacío de establecimientos")
          }

          // Devolver información sobre la primera migración
          return NextResponse.json({
            success: true,
            message: "Datos obtenidos correctamente",
            totalEstablecimientos: establishmentsData.length,
            totalContactos: contactsData?.length || 0,
            batchSize,
            totalBatches: Math.ceil(establishmentsData.length / batchSize),
            // Incluir una muestra de los datos para diagnóstico
            muestra: {
              establecimientos: establishmentsData.slice(0, 2),
              contactos: contactsData?.slice(0, 2) || [],
            },
          })
        } catch (error) {
          console.error("Error al obtener datos de las hojas de cálculo:", error)
          return NextResponse.json(
            {
              error: "Error al obtener datos de las hojas de cálculo",
              message: error instanceof Error ? error.message : "Error desconocido",
              // Incluir información de diagnóstico
              diagnostico: {
                tipoError: error instanceof Error ? error.name : typeof error,
                mensaje: error instanceof Error ? error.message : String(error),
                stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : null) : null,
              },
            },
            { status: 500 },
          )
        }
      } catch (outerError) {
        console.error("Error general en la migración completa:", outerError)
        return NextResponse.json(
          {
            error: "Error general en la migración",
            message: outerError instanceof Error ? outerError.message : "Error desconocido",
          },
          { status: 500 },
        )
      }
    } else {
      // Migración por lotes
      try {
        // Obtener los datos
        const { establishmentsData, contactsData } = await getSheetData()

        if (!Array.isArray(establishmentsData) || establishmentsData.length === 0) {
          return NextResponse.json(
            {
              error: "No se pudieron obtener los datos de establecimientos",
              detalles: "Los datos recibidos no son un array o están vacíos",
            },
            { status: 500 },
          )
        }

        // Calcular el rango para este lote
        const start = batchNumber * batchSize
        const end = Math.min(start + batchSize, establishmentsData.length)

        // Verificar si hemos terminado
        if (start >= establishmentsData.length) {
          return NextResponse.json({
            success: true,
            message: "Migración completada",
            batchNumber,
            hasMore: false,
          })
        }

        // Obtener el lote actual
        const currentBatchEstablishments = establishmentsData.slice(start, end)

        // Transformar establecimientos
        const establecimientos: Establecimiento[] = currentBatchEstablishments.map((school) => {
          // Convertir CUE a número (bigint)
          const cue = Number.parseInt(school.CUE, 10)

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
            id: generateUUID(),
            cue: isNaN(cue) ? 0 : cue,
            nombre: school.ESTABLECIMIENTO,
            distrito: school.DISTRITO,
            ciudad: school.CIUDAD,
            direccion: school["DIRECCIÓN"],
            lat,
            lon,
          }
        })

        // Encontrar contactos correspondientes a este lote de establecimientos
        const cuesInBatch = establecimientos.map((e) => e.cue)
        const batchContactos: Contacto[] = contactsData
          .filter((contact) => {
            const contactCue = Number.parseInt(contact.CUE, 10)
            return !isNaN(contactCue) && cuesInBatch.includes(contactCue)
          })
          .map((contact) => {
            const cue = Number.parseInt(contact.CUE, 10)
            return {
              id: generateUUID(),
              cue: isNaN(cue) ? 0 : cue,
              nombre: contact["NOMBRE"],
              apellido: contact["APELLIDO"],
              correo: contact["CORREO INSTITUCIONAL"],
              telefono: contact["TELÉFONO"],
            }
          })

        // Insertar establecimientos
        let establecimientosInsertados = 0
        let establecimientosErrores = 0

        try {
          const { error } = await supabaseAdmin.from("establecimientos").upsert(establecimientos, {
            onConflict: "cue",
            ignoreDuplicates: false,
          })

          if (error) {
            console.error(`Error al insertar lote de establecimientos:`, error)
            establecimientosErrores = establecimientos.length
          } else {
            establecimientosInsertados = establecimientos.length
          }
        } catch (error) {
          console.error(`Error al insertar lote de establecimientos:`, error)
          establecimientosErrores = establecimientos.length
        }

        // Insertar contactos
        let contactosInsertados = 0
        let contactosErrores = 0

        if (batchContactos.length > 0) {
          try {
            // Primero, eliminar contactos existentes con los mismos CUEs
            const cues = batchContactos.map((contact) => contact.cue).filter(Boolean)
            if (cues.length > 0) {
              await supabaseAdmin.from("contactos").delete().in("cue", cues)
            }

            // Luego insertar los nuevos contactos
            const { error } = await supabaseAdmin.from("contactos").insert(batchContactos)

            if (error) {
              console.error(`Error al insertar lote de contactos:`, error)
              contactosErrores = batchContactos.length
            } else {
              contactosInsertados = batchContactos.length
            }
          } catch (error) {
            console.error(`Error al insertar lote de contactos:`, error)
            contactosErrores = batchContactos.length
          }
        }

        // Calcular si hay más lotes
        const hasMore = end < establishmentsData.length

        return NextResponse.json({
          success: true,
          message: `Lote ${batchNumber} procesado correctamente`,
          batchNumber,
          processedRange: `${start + 1}-${end} de ${establishmentsData.length}`,
          resultados: {
            establecimientos: {
              procesados: establecimientos.length,
              insertados: establecimientosInsertados,
              errores: establecimientosErrores,
            },
            contactos: {
              procesados: batchContactos.length,
              insertados: contactosInsertados,
              errores: contactosErrores,
            },
          },
          hasMore,
          progress: Math.round((end / establishmentsData.length) * 100),
        })
      } catch (error) {
        console.error("Error durante la migración por lotes:", error)
        return NextResponse.json(
          {
            error: "Error durante la migración por lotes",
            message: error instanceof Error ? error.message : "Error desconocido",
            batchNumber,
          },
          { status: 500 },
        )
      }
    }
  } catch (error) {
    console.error("Error general en la API de migración:", error)
    return NextResponse.json(
      {
        error: "Error general en la API de migración",
        message: error instanceof Error ? error.message : "Error desconocido",
        stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : null) : null,
      },
      { status: 500 },
    )
  }
}
