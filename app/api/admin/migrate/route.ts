import { NextResponse } from "next/server"
import { getSheetData } from "@/lib/api-utils"
import { supabaseAdmin, type Establecimiento, type Contacto, generateUUID } from "@/lib/supabase"
import { verifyAdminAuth } from "@/lib/auth-utils"

// Esta ruta API permite ejecutar la migración de datos manualmente
export async function POST(request: Request) {
  try {
    // Verificar si la solicitud tiene una clave de autorización
    const { searchParams } = new URL(request.url)
    const authKey = searchParams.get("key")

    // Verificar la autenticación usando el nuevo sistema
    if (!verifyAdminAuth(authKey)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // 1. Obtener datos de las hojas de cálculo
    console.log("Obteniendo datos de las hojas de cálculo...")
    const { establishmentsData, contactsData } = await getSheetData()

    if (!Array.isArray(establishmentsData) || establishmentsData.length === 0) {
      return NextResponse.json({ error: "No se pudieron obtener los datos de establecimientos" }, { status: 500 })
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

    // 3. Insertar datos en Supabase
    console.log("Insertando datos en Supabase...")
    const resultados = {
      establecimientos: { total: establecimientos.length, insertados: 0, errores: 0 },
      contactos: { total: contactos.length, insertados: 0, errores: 0 },
    }

    // Insertar establecimientos
    console.log("Insertando establecimientos...")
    for (let i = 0; i < establecimientos.length; i += 25) {
      const batch = establecimientos.slice(i, i + 25)
      try {
        const { error } = await supabaseAdmin.from("establecimientos").upsert(batch, {
          onConflict: "cue",
          ignoreDuplicates: false,
        })

        if (error) {
          console.error(`Error al insertar lote de establecimientos ${i}-${i + batch.length}:`, error)
          resultados.establecimientos.errores += batch.length
        } else {
          console.log(`Insertados establecimientos ${i}-${i + batch.length}`)
          resultados.establecimientos.insertados += batch.length
        }
      } catch (error) {
        console.error(`Error al insertar lote de establecimientos ${i}-${i + batch.length}:`, error)
        resultados.establecimientos.errores += batch.length
      }
    }

    // Insertar contactos - Modificado para no usar onConflict con cue
    console.log("Insertando contactos...")
    for (let i = 0; i < contactos.length; i += 25) {
      const batch = contactos.slice(i, i + 25)
      try {
        // Primero, intentamos eliminar contactos existentes con los mismos CUEs para evitar duplicados
        const cues = batch.map((contact) => contact.cue).filter(Boolean)
        if (cues.length > 0) {
          await supabaseAdmin.from("contactos").delete().in("cue", cues)
        }

        // Luego insertamos los nuevos contactos
        const { error } = await supabaseAdmin.from("contactos").insert(batch)

        if (error) {
          console.error(`Error al insertar lote de contactos ${i}-${i + batch.length}:`, error)
          resultados.contactos.errores += batch.length
        } else {
          console.log(`Insertados contactos ${i}-${i + batch.length}`)
          resultados.contactos.insertados += batch.length
        }
      } catch (error) {
        console.error(`Error al insertar lote de contactos ${i}-${i + batch.length}:`, error)
        resultados.contactos.errores += batch.length
      }
    }

    console.log("Migración completada con éxito")
    return NextResponse.json({
      success: true,
      message: "Migración completada",
      resultados,
    })
  } catch (error) {
    console.error("Error durante la migración:", error)
    // Asegurarse de que siempre devolvemos un JSON válido
    return NextResponse.json(
      {
        error: "Error durante la migración",
        message: error instanceof Error ? error.message : "Error desconocido",
        stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : null) : null,
      },
      { status: 500 },
    )
  }
}
