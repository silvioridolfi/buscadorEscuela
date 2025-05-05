import { NextResponse } from "next/server"
import { getSheetData } from "@/lib/api-utils"
import { supabaseAdmin, type Establecimiento, type Contacto, generateUUID } from "@/lib/supabase"

// Esta ruta API permite ejecutar la migración completa de datos
export async function POST(request: Request) {
  try {
    // Verificar si la solicitud tiene una clave de autorización
    const { searchParams } = new URL(request.url)
    const authKey = searchParams.get("key")

    if (!authKey || authKey !== process.env.MIGRATION_AUTH_KEY) {
      return NextResponse.json({ error: "No autorizado. Clave de migración incorrecta." }, { status: 401 })
    }

    // Registro de eventos para seguimiento
    const logs = []
    const logEvent = (message) => {
      console.log(message)
      logs.push(message)
    }

    // 1. Obtener datos de las hojas de cálculo
    logEvent("Iniciando obtención de datos desde las hojas de cálculo...")
    const { establishmentsData, contactsData } = await getSheetData()

    if (!Array.isArray(establishmentsData) || establishmentsData.length === 0) {
      return NextResponse.json(
        {
          error: "No se pudieron obtener los datos de establecimientos",
          logs,
        },
        { status: 500 },
      )
    }

    logEvent(`Se obtuvieron ${establishmentsData.length} establecimientos y ${contactsData?.length || 0} contactos`)

    // 2. Transformar los datos al formato de Supabase
    logEvent("Transformando datos al formato de Supabase...")

    // Obtener una muestra para depuración
    const sampleSchool = establishmentsData[0]
    logEvent(`Muestra de campos disponibles: ${Object.keys(sampleSchool).join(", ")}`)

    // Eliminar datos existentes antes de la inserción
    logEvent("Eliminando datos existentes de establecimientos...")
    const { error: deleteEstablecimientosError } = await supabaseAdmin
      .from("establecimientos")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")

    if (deleteEstablecimientosError) {
      logEvent(`Advertencia al eliminar establecimientos existentes: ${deleteEstablecimientosError.message}`)
    } else {
      logEvent("Datos existentes de establecimientos eliminados correctamente")
    }

    logEvent("Eliminando datos existentes de contactos...")
    const { error: deleteContactosError } = await supabaseAdmin
      .from("contactos")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")

    if (deleteContactosError) {
      logEvent(`Advertencia al eliminar contactos existentes: ${deleteContactosError.message}`)
    } else {
      logEvent("Datos existentes de contactos eliminados correctamente")
    }

    const establecimientos: Establecimiento[] = establishmentsData.map((school) => {
      // Convertir CUE a número (bigint)
      const cue = Number.parseInt(school.CUE, 10)
      if (isNaN(cue)) {
        logEvent(`Advertencia: CUE inválido: ${school.CUE}, usando 0 como valor predeterminado`)
      }

      // Convertir coordenadas a números
      let lat: number | undefined = undefined
      let lon: number | undefined = undefined

      if (school.Lat && school.Lon) {
        const parsedLat = Number.parseFloat(String(school.Lat).replace(",", "."))
        const parsedLon = Number.parseFloat(String(school.Lon).replace(",", "."))

        if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
          lat = parsedLat
          lon = parsedLon
        }
      }

      // Mapeo explícito de campos conocidos
      return {
        id: generateUUID(),
        cue: isNaN(cue) ? 0 : cue,
        nombre: school.ESTABLECIMIENTO || null,
        predio: school.PREDIO || null,
        fed_a_cargo: school["FED A CARGO"] || null,
        distrito: school.DISTRITO || null,
        ciudad: school.CIUDAD || null,
        direccion: school["DIRECCIÓN"] || null,
        lat,
        lon,
        // Campos adicionales que sabemos que existen en la tabla
        plan_enlace: school["PLAN ENLACE"] || null,
        subplan_enlace: school["SUBPLAN ENLACE"] || null,
        fecha_inicio_conectividad: school["FECHA INICIO CONECTIVIDAD"] || null,
        proveedor_internet_pnce: school["Proveedor INTERNET PNCE"] || null,
        fecha_instalacion_pnce: school["Fecha Instalación PNCE"] || null,
        pnce_tipo_mejora: school["PNCE Tipo de mejora"] || null,
        pnce_fecha_mejora: school["PNCE Fecha de mejora"] || null,
        pnce_estado: school["PNCE Estado"] || null,
        pba_grupo_1_proveedor_internet: school["PBA - GRUPO 1 Proveedor INTERNET"] || null,
        pba_grupo_1_fecha_instalacion: school["PBA - GRUPO 1 Fecha instalación"] || null,
        pba_grupo_1_estado: school["PBA - GRUPO 1 Estado"] || null,
        pba_2019_proveedor_internet: school["PBA 2019 Proveedor INTERNET"] || null,
        pba_2019_fecha_instalacion: school["PBA 2019 Fecha instalación"] || null,
        pba_2019_estado: school["PBA 2019 Estado"] || null,
        pba_grupo_2_a_proveedor_internet: school["PBA - GRUPO 2 - A Proveedor INTERNET"] || null,
        pba_grupo_2_a_fecha_instalacion: school["PBA - GRUPO 2 - A Fecha instalación"] || null,
        pba_grupo_2_a_tipo_mejora: school["PBA - GRUPO 2 - A Tipo de mejora"] || null,
        pba_grupo_2_a_fecha_mejora: school["PBA - GRUPO 2 - A Fecha de mejora"] || null,
        pba_grupo_2_a_estado: school["PBA - GRUPO 2 - A Estado"] || null,
        plan_piso_tecnologico: school["PLAN PISO TECNOLÓGICO"] || null,
        proveedor_piso_tecnologico_cue: school["Proveedor PISO TECNOLÓGICO CUE"] || null,
        fecha_terminado_piso_tecnologico_cue: school["Fecha terminado PISO TECNOLÓGICO CUE"] || null,
        tipo_mejora: school["Tipo de mejora"] || null,
        fecha_mejora: school["Fecha de mejora"] || null,
        tipo_piso_instalado: school["Tipo de Piso instalado"] || null,
        tipo: school["Tipo"] || null,
        observaciones: school["Observaciones"] || null,
        tipo_establecimiento: school["Tipo de establecimiento"] || null,
        listado_conexion_internet: school["Listado por el que se conecta internet"] || null,
        estado_instalacion_pba: school["Estado de instalacion PBA"] || null,
        proveedor_asignado_pba: school["Proveedor asignado PBA"] || null,
        mb: school["MB"] || null,
        ambito: school["Ambito"] || null,
        cue_anterior: school["CUE ANTERIOR"] || null,
        reclamos_grupo_1_ani: school["RECLAMOS GRUPO 1 ANI"] || null,
        recurso_primario: school["RECURSO PRIMARIO"] || null,
        access_id: school["Access ID"] || null,
      }
    })

    const contactos: Contacto[] = contactsData.map((contact) => {
      // Convertir CUE a número (bigint)
      const cue = Number.parseInt(contact.CUE, 10)
      if (isNaN(cue)) {
        logEvent(`Advertencia: CUE inválido en contacto: ${contact.CUE}, usando 0 como valor predeterminado`)
      }

      // Mapeo explícito de campos conocidos para contactos
      return {
        id: generateUUID(),
        cue: isNaN(cue) ? 0 : cue,
        nombre: contact["NOMBRE"] || null,
        apellido: contact["APELLIDO"] || null,
        correo: contact["CORREO INSTITUCIONAL"] || null,
        telefono: contact["TELÉFONO"] || null,
        cargo: contact["CARGO"] || null,
      }
    })

    // Mostrar una muestra del primer establecimiento transformado para verificación
    logEvent(`Muestra de establecimiento transformado: ${JSON.stringify(establecimientos[0], null, 2)}`)

    // 3. Insertar datos en Supabase
    logEvent("Iniciando inserción de datos en Supabase...")
    const resultados = {
      establecimientos: { total: establecimientos.length, insertados: 0, errores: 0 },
      contactos: { total: contactos.length, insertados: 0, errores: 0 },
    }

    // Insertar establecimientos
    logEvent(`Insertando ${establecimientos.length} establecimientos con los campos mapeados...`)
    for (let i = 0; i < establecimientos.length; i += 25) {
      const batch = establecimientos.slice(i, i + 25)
      try {
        const { data, error } = await supabaseAdmin.from("establecimientos").insert(batch)

        if (error) {
          logEvent(`Error al insertar lote de establecimientos ${i}-${i + batch.length}: ${error.message}`)
          resultados.establecimientos.errores += batch.length
        } else {
          logEvent(`Insertados establecimientos ${i}-${i + batch.length} correctamente`)
          resultados.establecimientos.insertados += batch.length
        }
      } catch (error) {
        logEvent(`Error al insertar lote de establecimientos ${i}-${i + batch.length}: ${error.message || error}`)
        resultados.establecimientos.errores += batch.length
      }
    }

    // Insertar contactos
    logEvent(`Insertando ${contactos.length} contactos con los campos mapeados...`)
    for (let i = 0; i < contactos.length; i += 25) {
      const batch = contactos.slice(i, i + 25)
      try {
        const { data, error } = await supabaseAdmin.from("contactos").insert(batch)

        if (error) {
          logEvent(`Error al insertar lote de contactos ${i}-${i + batch.length}: ${error.message}`)
          resultados.contactos.errores += batch.length
        } else {
          logEvent(`Insertados contactos ${i}-${i + batch.length} correctamente`)
          resultados.contactos.insertados += batch.length
        }
      } catch (error) {
        logEvent(`Error al insertar lote de contactos ${i}-${i + batch.length}: ${error.message || error}`)
        resultados.contactos.errores += batch.length
      }
    }

    logEvent("Migración completa finalizada - Campos mapeados correctamente")
    return NextResponse.json({
      success: true,
      message: "Migración completa finalizada - Campos mapeados correctamente",
      resultados,
      logs,
      debug: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        totalEstablecimientos: establecimientos.length,
        totalContactos: contactos.length,
        sampleEstablecimiento: establecimientos[0],
      },
    })
  } catch (error) {
    console.error("Error durante la migración:", error)
    // Asegurarse de que siempre devolvemos un JSON válido con detalles del error
    return NextResponse.json(
      {
        error: "Error durante la migración completa",
        message: error instanceof Error ? error.message : "Error desconocido",
        stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : null) : null,
        debug: {
          timestamp: new Date().toISOString(),
          errorType: error instanceof Error ? error.constructor.name : typeof error,
        },
      },
      { status: 500 },
    )
  }
}
