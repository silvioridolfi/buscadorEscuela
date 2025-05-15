import { NextResponse } from "next/server"
import { supabaseAdmin, generateUUID } from "@/lib/supabase"
import { getSheetData } from "@/lib/legacy-api-utils"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

// Función para verificar la autenticación
function isAuthenticated(authKey: string | null) {
  const expectedKey = process.env.MIGRATION_AUTH_KEY
  return authKey === expectedKey
}

// Función para obtener el estado actual de la migración
async function getMigrationState() {
  try {
    const { data, error } = await supabaseAdmin.from("migration_state").select("*").single()

    if (error) {
      // Si la tabla no existe o hay otro error, crear la tabla
      await supabaseAdmin.from("migration_state").insert({
        id: "current",
        last_processed_id: 0,
        completed: false,
        total_records: 0,
        processed_records: 0,
        last_updated: new Date().toISOString(),
      })

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
    await supabaseAdmin.from("migration_state").upsert({
      id: "current",
      last_processed_id: state.lastProcessedId,
      completed: state.completed,
      total_records: state.totalRecords,
      processed_records: state.processedRecords,
      last_updated: new Date().toISOString(),
    })
    return true
  } catch (error) {
    console.error("Error al actualizar el estado de la migración:", error)
    return false
  }
}

export async function POST(request: Request) {
  try {
    // Obtener datos de la solicitud
    const data = await request.json()
    const { authKey, action, batchSize = 50, startIndex = 0 } = data

    // Verificar autenticación
    if (!isAuthenticated(authKey)) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

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
          const establishments = await getSheetData("establecimientos")

          if (!establishments || !Array.isArray(establishments) || establishments.length === 0) {
            return NextResponse.json(
              {
                success: false,
                error: "No se pudieron obtener los datos de establecimientos",
              },
              { status: 500 },
            )
          }

          // Obtener datos de contactos
          const contacts = await getSheetData("contactos")

          if (!contacts || !Array.isArray(contacts)) {
            return NextResponse.json(
              {
                success: false,
                error: "No se pudieron obtener los datos de contactos",
              },
              { status: 500 },
            )
          }

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
          console.error("Error al iniciar la migración:", error)
          return NextResponse.json(
            {
              success: false,
              error: "Error al iniciar la migración: " + (error.message || "Error desconocido"),
            },
            { status: 500 },
          )
        }
      }

      // Procesar un lote de datos
      try {
        // Obtener datos de establecimientos
        const establishments = await getSheetData("establecimientos")

        if (!establishments || !Array.isArray(establishments) || establishments.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: "No se pudieron obtener los datos de establecimientos",
            },
            { status: 500 },
          )
        }

        // Obtener datos de contactos
        const contacts = await getSheetData("contactos")

        if (!contacts || !Array.isArray(contacts)) {
          return NextResponse.json(
            {
              success: false,
              error: "No se pudieron obtener los datos de contactos",
            },
            { status: 500 },
          )
        }

        // Determinar el índice de inicio y fin para este lote
        const start = startIndex || migrationState.lastProcessedId
        const end = Math.min(start + batchSize, establishments.length)

        // Extraer el lote actual
        const currentBatch = establishments.slice(start, end)

        // Procesar cada establecimiento en el lote
        const results = []

        for (const establishment of currentBatch) {
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
            console.error("Error al insertar establecimiento:", establishmentError)
            results.push({
              cue,
              success: false,
              error: establishmentError.message,
            })
            continue
          }

          // Procesar contactos relacionados
          for (const contact of relatedContacts) {
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
              console.error("Error al insertar contacto:", contactError)
              results.push({
                cue,
                contacto: `${contact.NOMBRE} ${contact.APELLIDO}`,
                success: false,
                error: contactError.message,
              })
            }
          }

          results.push({
            cue,
            success: true,
            contactos: relatedContacts.length,
          })
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

        return NextResponse.json({
          success: true,
          message: isCompleted ? "Migración completada" : "Lote procesado correctamente",
          processedInBatch: currentBatch.length,
          totalProcessed: newProcessedRecords,
          totalRecords: establishments.length,
          progress: Math.round((newProcessedRecords / establishments.length) * 100),
          nextBatchStart: isCompleted ? null : end,
          completed: isCompleted,
          results,
        })
      } catch (error) {
        console.error("Error al procesar lote:", error)
        return NextResponse.json(
          {
            success: false,
            error: "Error al procesar lote: " + (error.message || "Error desconocido"),
          },
          { status: 500 },
        )
      }
    }

    // Si se solicita reiniciar la migración
    if (action === "reset") {
      try {
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
        console.error("Error al reiniciar la migración:", error)
        return NextResponse.json(
          {
            success: false,
            error: "Error al reiniciar la migración: " + (error.message || "Error desconocido"),
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Acción no válida",
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("Error en la ruta de migración:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor: " + (error.message || "Error desconocido"),
      },
      { status: 500 },
    )
  }
}
