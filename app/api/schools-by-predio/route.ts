import { NextResponse } from "next/server"
import { getSheetData } from "@/lib/api-utils"

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const predio = searchParams.get("predio")

  if (!predio) {
    return NextResponse.json({ error: "Se requiere un número de PREDIO" }, { status: 400 })
  }

  try {
    const { establishmentsData, contactsData } = await getSheetData()

    if (!Array.isArray(establishmentsData) || establishmentsData.length === 0) {
      return NextResponse.json({ schools: [], error: "No data available" })
    }

    // Normalize the requested PREDIO for comparison - handle all possible formats
    const normalizedPredio = String(predio).trim()

    console.log(`API: Searching for PREDIO: "${normalizedPredio}"`)

    // Filter schools by PREDIO with robust type handling
    const filteredData = establishmentsData
      .filter((school) => {
        // Skip schools without PREDIO
        if (school.PREDIO === undefined || school.PREDIO === null || school.PREDIO === "") {
          return false
        }

        // Convert to string and normalize for comparison
        const schoolPredio = String(school.PREDIO).trim()

        // Try both string and numeric comparison
        const stringMatch = schoolPredio === normalizedPredio
        const numericMatch =
          !isNaN(Number(schoolPredio)) &&
          !isNaN(Number(normalizedPredio)) &&
          Number(schoolPredio) === Number(normalizedPredio)

        const match = stringMatch || numericMatch

        if (match) {
          console.log(`API: Found matching PREDIO for CUE ${school.CUE}, PREDIO value: "${schoolPredio}"`)
        }

        return match
      })
      .map((school) => {
        const contact = contactsData.find((c) => c.CUE === school.CUE) || {}
        return {
          CUE: school.CUE,
          PREDIO: school.PREDIO,
          ESTABLECIMIENTO: school.ESTABLECIMIENTO,
          FED_A_CARGO: school["FED A CARGO"],
          DISTRITO: school.DISTRITO,
          CIUDAD: school.CIUDAD,
          DIRECCION: school["DIRECCIÓN"],
          PLAN_ENLACE: school["PLAN ENLACE"],
          SUBPLAN_ENLACE: school["SUBPLAN ENLACE"],
          FECHA_INICIO_CONECTIVIDAD: school["FECHA INICIO CONECTIVIDAD"],
          PROVEEDOR_INTERNET_PNCE: school["Proveedor INTERNET PNCE"],
          FECHA_INSTALACION_PNCE: school["Fecha Instalación PNCE"],
          PNCE_TIPO_MEJORA: school["PNCE Tipo de mejora"],
          PNCE_FECHA_MEJORA: school["PNCE Fecha de mejora"],
          PNCE_ESTADO: school["PNCE Estado"],
          PBA_GRUPO_1_PROVEEDOR_INTERNET: school["PBA - GRUPO 1 Proveedor INTERNET"],
          PBA_GRUPO_1_FECHA_INSTALACION: school["PBA - GRUPO 1 Fecha instalación"],
          PBA_GRUPO_1_ESTADO: school["PBA - GRUPO 1 Estado"],
          PBA_2019_PROVEEDOR_INTERNET: school["PBA 2019 Proveedor INTERNET"],
          PBA_2019_FECHA_INSTALACION: school["PBA 2019 Fecha instalación"],
          PBA_2019_ESTADO: school["PBA 2019 Estado"],
          PBA_GRUPO_2_A_PROVEEDOR_INTERNET: school["PBA - GRUPO 2 - A Proveedor INTERNET"],
          PBA_GRUPO_2_A_FECHA_INSTALACION: school["PBA - GRUPO 2 - A Fecha instalación"],
          PBA_GRUPO_2_A_TIPO_MEJORA: school["PBA - GRUPO 2 - A Tipo de mejora"],
          PBA_GRUPO_2_A_FECHA_MEJORA: school["PBA - GRUPO 2 - A Fecha de mejora"],
          PBA_GRUPO_2_A_ESTADO: school["PBA - GRUPO 2 - A Estado"],
          PLAN_PISO_TECNOLOGICO: school["PLAN PISO TECNOLÓGICO"],
          PROVEEDOR_PISO_TECNOLOGICO_CUE: school["Proveedor PISO TECNOLÓGICO CUE"],
          FECHA_TERMINADO_PISO_TECNOLOGICO_CUE: school["Fecha terminado PISO TECNOLÓGICO CUE"],
          TIPO_MEJORA: school["Tipo de mejora"],
          FECHA_MEJORA: school["Fecha de mejora"],
          TIPO_PISO_INSTALADO: school["Tipo de Piso instalado"],
          TIPO: school["Tipo"],
          OBSERVACIONES: school["Observaciones"],
          TIPO_ESTABLECIMIENTO: school["Tipo de establecimiento"],
          LISTADO_CONEXION_INTERNET: school["Listado por el que se conecta internet"],
          ESTADO_INSTALACION_PBA: school["Estado de instalacion PBA"],
          PROVEEDOR_ASIGNADO_PBA: school["Proveedor asignado PBA"],
          MB: school["MB"],
          AMBITO: school["Ambito"],
          CUE_ANTERIOR: school["CUE ANTERIOR"],
          RECLAMOS_GRUPO_1_ANI: school["RECLAMOS GRUPO 1 ANI"],
          RECURSO_PRIMARIO: school["RECURSO PRIMARIO"],
          ACCESS_ID: school["Access ID"],
          LAT: school["Lat"],
          LON: school["Lon"],
          NOMBRE: contact["NOMBRE"],
          APELLIDO: contact["APELLIDO"],
          CARGO: contact["CARGO"],
          TELEFONO: contact["TELÉFONO"],
          CORREO_INSTITUCIONAL: contact["CORREO INSTITUCIONAL"],
        }
      })

    console.log(`API: Found ${filteredData.length} schools with PREDIO ${normalizedPredio}`)

    // Set cache control headers to prevent caching
    const headers = new Headers()
    headers.set("Cache-Control", "no-store, max-age=0")
    headers.set("Pragma", "no-cache")
    headers.set("Expires", "0")

    // Return the filtered data with a debug field for production troubleshooting
    return NextResponse.json(
      {
        schools: filteredData,
        debug: {
          requestedPredio: normalizedPredio,
          foundCount: filteredData.length,
          foundCUEs: filteredData.map((school) => school.CUE),
          timestamp: new Date().toISOString(), // Add timestamp to ensure response is unique
        },
      },
      { headers },
    )
  } catch (error) {
    console.error("Error en la ruta de API:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor. Por favor, intente más tarde.",
        debug: { message: error.message, stack: error.stack },
      },
      { status: 500 },
    )
  }
}
