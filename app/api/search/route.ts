import { NextResponse } from "next/server"

const SHEETDB_API_URL = "https://sheetdb.io/api/v1/qrokpjlkogyzr"

function normalizeString(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")

  if (!query) {
    return NextResponse.json({ error: "Search query is required" }, { status: 400 })
  }

  try {
    // Fetch all data from the sheet
    const response = await fetch(SHEETDB_API_URL)

    if (!response.ok) {
      throw new Error(`Failed to fetch data from SheetDB: ${response.status}`)
    }

    const data = await response.json()

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json([])
    }

    const normalizedQuery = normalizeString(query)

    // Perform client-side filtering
    const filteredData = data
      .filter((school) =>
        Object.values(school).some((value) => normalizeString(value.toString()).includes(normalizedQuery)),
      )
      .map((school) => ({
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
        PBA_2019_PROVEEDOR_INTERNET: school["PBA 2019\nProveedor INTERNET"],
        PBA_GRUPO_2_A_PROVEEDOR_INTERNET: school["PBA - GRUPO 2 - A \nProveedor INTERNET "],
        PLAN_PISO_TECNOLOGICO: school["PLAN PISO TECNOLÓGICO"],
        PROVEEDOR_PISO_TECNOLOGICO_CUE: school["Proveedor PISO TECNOLÓGICO CUE"],
        TIPO_PISO_INSTALADO: school["Tipo de Piso instalado"],
        TIPO: school["Tipo"],
        OBSERVACIONES: school["Observaciones"],
        LISTADO_CONEXION_INTERNET: school["Listado por el que se conecta internet"],
        PROVEEDOR_ASIGNADO_PBA: school["Proveedor asignado PBA"],
        LAT: school["Lat"],
        LON: school["Lon"],
        // Contact information
        NOMBRE: school["NOMBRE"],
        APELLIDO: school["APELLIDO"],
        CARGO: school["CARGO"],
        TELEFONO: school["TELÉFONO"],
      }))

    return NextResponse.json(filteredData)
  } catch (error) {
    console.error("Error in API route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

