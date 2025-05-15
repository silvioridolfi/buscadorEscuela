import { NextResponse } from "next/server"
import { supabaseAdmin, generateUUID } from "@/lib/supabase"
import { getSheetData } from "@/lib/legacy-api-utils"
import { verifyAdminAuth } from "@/lib/auth-utils"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

// Función para manejar errores y siempre devolver JSON válido
function handleError(error: any, status = 500) {
  console.error("Error en la API de migración:", error)

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

// Función para obtener el estado actual de la migración
async function getMigrationState() {
  try {
    const { data, error } = await supabaseAdmin.from("migration_state").select("*").single()

    if (error) {
      console.log("Error al obtener el estado de migración, creando tabla:", error.message)

      // Intentar crear la tabla si no existe
      try {
        // Primero verificamos si la tabla existe
        const { error: checkError } = await supabaseAdmin.from("migration_state").select("id").limit(1)

        if (checkError) {
          // La tabla probablemente no existe, intentamos crearla con SQL directo
          await supabaseAdmin.rpc("create_migration_table")
        }

        // Ahora insertamos el registro inicial
        await supabaseAdmin.from("migration_state").insert({
          id: "current",
          last_processed_id: 0,
          completed: false,
          total_records: 0,
          processed_records: 0,
          last_updated: new Date().toISOString(),
        })
      } catch (createError) {
        console.error("Error al crear la tabla de migración:", createError)
      }

      return {
        lastProcessedId: 0,
        completed: false,
        totalRecords: 0,
        processedRecords: 0,
      }
    }

    return {
      lastProcessedId: data.last_processed_id || 0,
      completed: data.completed || false,
      totalRecords: data.total_records || 0,
      processedRecords: data.processed_records || 0,
    }
  } catch (error) {
    console.error("Error al obtener el estado de la migración:", error)
    return {
      lastProcessedId: 0,
      completed: false,
      totalRecords: 0,
      processedRecords: 0,
    }
  }
}

// Función para actualizar el estado de la migración
async function updateMigrationState(state: any) {
  try {
    const { error } = await supabaseAdmin.from("migration_state").upsert({
      id: "current",
      last_processed_id: state.lastProcessedId,
      completed: state.completed,
      total_records: state.totalRecords,
      processed_records: state.processedRecords,
      last_updated: new Date().toISOString(),
    })

    if (error) {
      console.error("Error al actualizar el estado de migración:", error.message)
      return false
    }

    return true
  } catch (error) {
    console.error("Error al actualizar el estado de la migración:", error)
    return false
  }
}

// Función para crear las tablas necesarias si no existen
async function ensureTablesExist() {
  try {
    // Verificar si las tablas existen
    const { error: checkEstablecimientosError } = await supabaseAdmin.from("establecimientos").select("id").limit(1)

    const { error: checkContactosError } = await supabaseAdmin.from("contactos").select("id").limit(1)

    // Si hay error, las tablas pueden no existir
    if (checkEstablecimientosError || checkContactosError) {
      // Crear la función para crear las tablas
      await supabaseAdmin.rpc("create_necessary_tables")
      console.log("Tablas creadas o verificadas correctamente")
    }

    return true
  } catch (error) {
    console.error("Error al verificar o crear tablas:", error)
    return false
  }
}

export async function POST(request: Request) {
  try {
    // Obtener datos de la solicitud
    let requestData
    try {
      requestData = await request.json()
    } catch (parseError) {
      return handleError(new Error("Error al parsear el cuerpo de la solicitud: " + parseError.message), 400)
    }

    const { authKey, action, batchSize = 25, startIndex = 0 } = requestData

    // Verificar autenticación usando la función de auth-utils
    const isAuthenticated = verifyAdminAuth(authKey)

    if (!isAuthenticated) {
      return handleError(new Error("No autorizado: Clave de autenticación inválida"), 401)
    }

    // Asegurar que las tablas necesarias existan
    await ensureTablesExist()

    // Obtener el estado actual de la migración
    const migrationState = await getMigrationState()

    // Si se solicita el estado
    if (action === "getState") {
      return NextResponse.json({
        success: true,
        state: migrationState,
      })
    }

    // Si se solicita iniciar/continuar la migración
    if (action === "start" || action === "continue") {
      // Si ya está completada, devolver mensaje
      if (migrationState.completed) {
        return NextResponse.json({
          success: true,
          message: "La migración ya está completa",
          state: migrationState,
        })
      }

      // Si es inicio, obtener los datos para calcular el total
      if (action === "start") {
        try {
          // Obtener datos de establecimientos
          console.log("Obteniendo datos de establecimientos para inicio...")
          const establishments = await getSheetData("establecimientos")

          if (!establishments || !Array.isArray(establishments) || establishments.length === 0) {
            return handleError(new Error("No se pudieron obtener los datos de establecimientos"), 500)
          }

          console.log(`Obtenidos ${establishments.length} establecimientos`)

          // Obtener datos de contactos
          console.log("Obteniendo datos de contactos para inicio...")
          const contacts = await getSheetData("contactos")

          if (!contacts || !Array.isArray(contacts)) {
            return handleError(new Error("No se pudieron obtener los datos de contactos"), 500)
          }

          console.log(`Obtenidos ${contacts.length} contactos`)

          // Actualizar el estado con el total de registros
          await updateMigrationState({
            ...migrationState,
            totalRecords: establishments.length,
            processedRecords: 0,
            lastProcessedId: 0,
            completed: false,
          })

          return NextResponse.json({
            success: true,
            message: "Migración iniciada",
            totalRecords: establishments.length,
            batchSize,
          })
        } catch (error) {
          return handleError(error)
        }
      }

      // Procesar un lote de datos
      try {
        console.log(`Procesando lote desde el índice ${startIndex} con tamaño ${batchSize}...`)

        // Obtener datos de establecimientos
        const establishments = await getSheetData("establecimientos")

        if (!establishments || !Array.isArray(establishments) || establishments.length === 0) {
          return handleError(new Error("No se pudieron obtener los datos de establecimientos"), 500)
        }

        // Obtener datos de contactos
        const contacts = await getSheetData("contactos")

        if (!contacts || !Array.isArray(contacts)) {
          return handleError(new Error("No se pudieron obtener los datos de contactos"), 500)
        }

        // Determinar el índice de inicio y fin para este lote
        const start = startIndex || migrationState.lastProcessedId
        const end = Math.min(start + batchSize, establishments.length)

        console.log(`Procesando desde ${start} hasta ${end} de ${establishments.length} establecimientos`)

        // Extraer el lote actual
        const currentBatch = establishments.slice(start, end)

        // Procesar cada establecimiento en el lote
        const results = []
        let successCount = 0
        let failCount = 0

        for (const establishment of currentBatch) {
          try {
            // Normalizar el CUE para buscar contactos relacionados
            const cue = establishment.CUE ? establishment.CUE.toString().trim() : null

            // Buscar contactos relacionados con este CUE
            const relatedContacts = contacts.filter((contact) => contact.CUE && contact.CUE.toString().trim() === cue)

            // Transformar el establecimiento al formato de Supabase
            const transformedEstablishment = {
              id: generateUUID(),
              cue: cue ? Number.parseInt(cue, 10) : null,
              nombre: establishment.ESTABLECIMIENTO || null,
              distrito: establishment.DISTRITO || null,
              ciudad: establishment.CIUDAD || null,
              direccion: establishment.DIRECCION || null,
              lat: establishment.LAT ? Number.parseFloat(establishment.LAT) : null,
              lon: establishment.LON ? Number.parseFloat(establishment.LON) : null,
              predio: establishment.PREDIO || null,
              fed_a_cargo: establishment.FED_A_CARGO || null,
              plan_enlace: establishment.PLAN_ENLACE || null,
              subplan_enlace: establishment.SUBPLAN_ENLACE || null,
              fecha_inicio_conectividad: establishment.FECHA_INICIO_CONECTIVIDAD || null,
              proveedor_internet_pnce: establishment.PROVEEDOR_INTERNET_PNCE || null,
              fecha_instalacion_pnce: establishment.FECHA_INSTALACION_PNCE || null,
              pnce_tipo_mejora: establishment.PNCE_TIPO_MEJORA || null,
              pnce_fecha_mejora: establishment.PNCE_FECHA_MEJORA || null,
              pnce_estado: establishment.PNCE_ESTADO || null,
              pba_grupo_1_proveedor_internet: establishment.PBA_GRUPO_1_PROVEEDOR_INTERNET || null,
              pba_grupo_1_fecha_instalacion: establishment.PBA_GRUPO_1_FECHA_INSTALACION || null,
              pba_grupo_1_estado: establishment.PBA_GRUPO_1_ESTADO || null,
              pba_2019_proveedor_internet: establishment.PBA_2019_PROVEEDOR_INTERNET || null,
              pba_2019_fecha_instalacion: establishment.PBA_2019_FECHA_INSTALACION || null,
              pba_2019_estado: establishment.PBA_2019_ESTADO || null,
              pba_grupo_2_a_proveedor_internet: establishment.PBA_GRUPO_2_A_PROVEEDOR_INTERNET || null,
              pba_grupo_2_a_fecha_instalacion: establishment.PBA_GRUPO_2_A_FECHA_INSTALACION || null,
              pba_grupo_2_a_tipo_mejora: establishment.PBA_GRUPO_2_A_TIPO_MEJORA || null,
              pba_grupo_2_a_fecha_mejora: establishment.PBA_GRUPO_2_A_FECHA_MEJORA || null,
              pba_grupo_2_a_estado: establishment.PBA_GRUPO_2_A_ESTADO || null,
              plan_piso_tecnologico: establishment.PLAN_PISO_TECNOLOGICO || null,
              proveedor_piso_tecnologico_cue: establishment.PROVEEDOR_PISO_TECNOLOGICO_CUE || null,
              fecha_terminado_piso_tecnologico_cue: establishment.FECHA_TERMINADO_PISO_TECNOLOGICO_CUE || null,
              tipo_mejora: establishment.TIPO_MEJORA || null,
              fecha_mejora: establishment.FECHA_MEJORA || null,
              tipo_piso_instalado: establishment.TIPO_PISO_INSTALADO || null,
              tipo: establishment.TIPO || null,
              observaciones: establishment.OBSERVACIONES || null,
              tipo_establecimiento: establishment.TIPO_ESTABLECIMIENTO || null,
              listado_conexion_internet: establishment.LISTADO_CONEXION_INTERNET || null,
              estado_instalacion_pba: establishment.ESTADO_INSTALACION_PBA || null,
              proveedor_asignado_pba: establishment.PROVEEDOR_ASIGNADO_PBA || null,
              mb: establishment.MB || null,
              ambito: establishment.AMBITO || null,
              cue_anterior: establishment.CUE_ANTERIOR || null,
              reclamos_grupo_1_ani: establishment.RECLAMOS_GRUPO_1_ANI || null,
              recurso_primario: establishment.RECURSO_PRIMARIO || null,
              access_id: establishment.ACCESS_ID || null,
            }

            // Insertar el establecimiento en Supabase
            const { data: insertedEstablishment, error: establishmentError } = await supabaseAdmin
              .from("establecimientos")
              .upsert(transformedEstablishment)
              .select()

            if (establishmentError) {
              console.error(`Error al insertar establecimiento ${cue}:`, establishmentError.message)
              failCount++
              results.push({
                cue,
                success: false,
                error: establishmentError.message,
              })
              continue
            }

            // Procesar contactos relacionados
            let contactsSuccess = 0
            let contactsFail = 0

            for (const contact of relatedContacts) {
              try {
                const transformedContact = {
                  id: generateUUID(),
                  cue: cue ? Number.parseInt(cue, 10) : null,
                  nombre: contact.NOMBRE || null,
                  apellido: contact.APELLIDO || null,
                  correo: contact.CORREO_INSTITUCIONAL || null,
                  telefono: contact.TELEFONO || null,
                  cargo: contact.CARGO || null,
                }

                // Insertar el contacto en Supabase
                const { error: contactError } = await supabaseAdmin.from("contactos").upsert(transformedContact)

                if (contactError) {
                  console.error(`Error al insertar contacto para CUE ${cue}:`, contactError.message)
                  contactsFail++
                  results.push({
                    cue,
                    contacto: `${contact.NOMBRE} ${contact.APELLIDO}`,
                    success: false,
                    error: contactError.message,
                  })
                } else {
                  contactsSuccess++
                }
              } catch (contactError) {
                console.error(`Error inesperado al procesar contacto para CUE ${cue}:`, contactError)
                contactsFail++
              }
            }

            successCount++
            results.push({
              cue,
              success: true,
              contactos: {
                total: relatedContacts.length,
                exito: contactsSuccess,
                fallidos: contactsFail,
              },
            })
          } catch (itemError) {
            console.error(`Error inesperado al procesar establecimiento:`, itemError)
            failCount++
            results.push({
              indexItem: currentBatch.indexOf(establishment),
              success: false,
              error: itemError.message || "Error inesperado",
            })
          }
        }

        // Actualizar el estado de la migración
        const newProcessedRecords = migrationState.processedRecords + currentBatch.length
        const isCompleted = newProcessedRecords >= establishments.length

        await updateMigrationState({
          lastProcessedId: end,
          completed: isCompleted,
          totalRecords: establishments.length,
          processedRecords: newProcessedRecords,
        })

        console.log(`Lote procesado: ${successCount} exitosos, ${failCount} fallidos`)

        return NextResponse.json({
          success: true,
          message: isCompleted ? "Migración completada" : "Lote procesado correctamente",
          processedInBatch: currentBatch.length,
          totalProcessed: newProcessedRecords,
          totalRecords: establishments.length,
          progress: Math.round((newProcessedRecords / establishments.length) * 100),
          nextBatchStart: isCompleted ? null : end,
          completed: isCompleted,
          results: {
            exitosos: successCount,
            fallidos: failCount,
            detalles: results.slice(0, 10), // Limitar los detalles para no sobrecargar la respuesta
          },
        })
      } catch (error) {
        return handleError(error)
      }
    }

    // Si se solicita reiniciar la migración
    if (action === "reset") {
      try {
        // Asegurar que las tablas existan
        await ensureTablesExist()

        // Eliminar todos los datos de las tablas
        await supabaseAdmin.from("establecimientos").delete().neq("id", "dummy")
        await supabaseAdmin.from("contactos").delete().neq("id", "dummy")

        // Reiniciar el estado de la migración
        await updateMigrationState({
          lastProcessedId: 0,
          completed: false,
          totalRecords: 0,
          processedRecords: 0,
        })

        return NextResponse.json({
          success: true,
          message: "Migración reiniciada correctamente",
        })
      } catch (error) {
        return handleError(error)
      }
    }

    return handleError(new Error("Acción no válida"), 400)
  } catch (error) {
    return handleError(error)
  }
}
