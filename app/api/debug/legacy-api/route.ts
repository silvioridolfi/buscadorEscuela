import { NextResponse } from "next/server"
import { getSheetData, getLegacyApiStatus } from "@/lib/legacy-api-utils"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

export async function GET(request: Request) {
  try {
    // Obtener el estado actual de las APIs
    const apiStatus = getLegacyApiStatus()

    // Intentar obtener una muestra de datos
    let establishmentsData = null
    let contactsData = null
    let error = null

    try {
      // Intentar obtener solo los primeros 5 registros para prueba
      const establishments = await getSheetData("establecimientos")
      establishmentsData = establishments.slice(0, 5)

      const contacts = await getSheetData("contactos")
      contactsData = contacts.slice(0, 5)
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }

    return NextResponse.json({
      success: !error,
      apiStatus,
      sampleData: {
        establishments: establishmentsData,
        contacts: contactsData,
      },
      error,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error en la API de depuración:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
