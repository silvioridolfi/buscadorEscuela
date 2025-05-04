import { NextResponse } from "next/server"
import { getSheetData } from "@/lib/api-utils"
import { supabaseAdmin, type Establecimiento, type Contacto } from "@/lib/supabase"

// Esta ruta API permite ejecutar la migración de datos manualmente
// Se puede proteger con autenticación en un entorno de producción
export async function POST(request: Request) {
  try {
    // Verificar si la solicitud tiene una clave de autorización
    // En un entorno de producción, deberías implementar una autenticación más robusta
    const { searchParams } = new URL(request.url)
    const authKey = searchParams.get("key")

    if (!authKey || authKey !== process.env.MIGRATION_AUTH_KEY) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // 1. Obtener datos de las hojas de cálculo
    const { establishmentsData, contactsData } = await getSheetData()

    if (!Array.isArray(establishmentsData) || establishmentsData.length === 0) {
      return NextResponse.json({ error: "No se pudieron obtener los datos de establecimientos" }, { status: 500 })
    }

    // 2. Transformar los datos al formato de Supabase
    const establecimientos: Establecimiento[] = establishmentsData.map((school) => ({
      cue: school.CUE,
      predio: school.PREDIO,
      establecimiento: school.ESTABLECIMIENTO,
      fed_a_cargo: school["FED A CARGO"],
      distrito: school.DISTRITO,
      ciudad: school.CIUDAD,
      direccion: school["DIRECCIÓN"],
      plan_enlace: school["PLAN ENLACE"],
      subplan_enlace: school["SUBPLAN ENLACE"],
      fecha_inicio_conectividad: school["FECHA INICIO CONECTIVIDAD"],
      proveedor_internet_pnce: school["Proveedor INTERNET PNCE"],
      fecha_instalacion_pnce: school["Fecha Instalación PNCE"],
      pnce_tipo_mejora: school["PNCE Tipo de mejora"],
      pnce_fecha_mejora: school["PNCE Fecha de mejora"],
      pnce_estado: school["PNCE Estado"],
      pba_grupo_1_proveedor_internet: school["PBA - GRUPO 1 Proveedor INTERNET"],
      pba_grupo_1_fecha_instalacion: school["PBA - GRUPO 1 Fecha instalación"],
      pba_grupo_1_estado: school["PBA - GRUPO 1 Estado"],
      pba_2019_proveedor_internet: school["PBA 2019 Proveedor INTERNET"],
      pba_2019_fecha_instalacion: school["PBA 2019 Fecha instalación"],
      pba_2019_estado: school["PBA 2019 Estado"],
      pba_grupo_2_a_proveedor_internet: school["PBA - GRUPO 2 - A Proveedor INTERNET"],
      pba_grupo_2_a_fecha_instalacion: school["PBA - GRUPO 2 - A Fecha instalación"],
      pba_grupo_2_a_tipo_mejora: school["PBA - GRUPO 2 - A Tipo de mejora"],
      pba_grupo_2_a_fecha_mejora: school["PBA - GRUPO 2 - A Fecha de mejora"],
      pba_grupo_2_a_estado: school["PBA - GRUPO 2 - A Estado"],
      plan_piso_tecnologico: school["PLAN PISO TECNOLÓGICO"],
      proveedor_piso_tecnologico_cue: school["Proveedor PISO TECNOLÓGICO CUE"],
      fecha_terminado_piso_tecnologico_cue: school["Fecha terminado PISO TECNOLÓGICO CUE"],
      tipo_mejora: school["Tipo de mejora"],
      fecha_mejora: school["Fecha de mejora"],
      tipo_piso_instalado: school["Tipo de Piso instalado"],
      tipo: school["Tipo"],
      observaciones: school["Observaciones"],
      tipo_establecimiento: school["Tipo de establecimiento"],
      listado_conexion_internet: school["Listado por el que se conecta internet"],
      estado_instalacion_pba: school["Estado de instalacion PBA"],
      proveedor_asignado_pba: school["Proveedor asignado PBA"],
      mb: school["MB"],
      ambito: school["Ambito"],
      cue_anterior: school["CUE ANTERIOR"],
      reclamos_grupo_1_ani: school["RECLAMOS GRUPO 1 ANI"],
      recurso_primario: school["RECURSO PRIMARIO"],
      access_id: school["Access ID"],
      lat: school["Lat"],
      lon: school["Lon"],
    }))

    const contactos: Contacto[] = contactsData.map((contact) => ({
      cue: contact.CUE,
      nombre: contact["NOMBRE"],
      apellido: contact["APELLIDO"],
      cargo: contact["CARGO"],
      telefono: contact["TELÉFONO"],
      correo_institucional: contact["CORREO INSTITUCIONAL"],
    }))

    // 3. Insertar datos en Supabase
    const resultados = {
      establecimientos: { total: establecimientos.length, insertados: 0, errores: 0 },
      contactos: { total: contactos.length, insertados: 0, errores: 0 },
    }

    // Insertar establecimientos
    for (let i = 0; i < establecimientos.length; i += 100) {
      const batch = establecimientos.slice(i, i + 100)
      const { error } = await supabaseAdmin.from("establecimientos").upsert(batch, { onConflict: "cue" })

      if (error) {
        resultados.establecimientos.errores += batch.length
      } else {
        resultados.establecimientos.insertados += batch.length
      }
    }

    // Insertar contactos
    for (let i = 0; i < contactos.length; i += 100) {
      const batch = contactos.slice(i, i + 100)
      const { error } = await supabaseAdmin.from("contactos").upsert(batch, { onConflict: "cue" })

      if (error) {
        resultados.contactos.errores += batch.length
      } else {
        resultados.contactos.insertados += batch.length
      }
    }

    return NextResponse.json({
      success: true,
      message: "Migración completada",
      resultados,
    })
  } catch (error) {
    console.error("Error durante la migración:", error)
    return NextResponse.json(
      {
        error: "Error durante la migración",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
