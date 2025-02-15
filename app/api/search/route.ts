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
    return NextResponse.json({ error: "Se requiere un término de búsqueda" }, { status: 400 })
  }

  try {
    const establishmentsResponse = await fetch(SHEETDB_API_URL)
    const contactsResponse = await fetch(`${SHEETDB_API_URL}?sheet=CONTACTOS`)

    if (!establishmentsResponse.ok || !contactsResponse.ok) {
      throw new Error(`Error al obtener datos de SheetDB: ${establishmentsResponse.status}, ${contactsResponse.status}`)
    }

    const establishmentsData = await establishmentsResponse.json()
    const contactsData = await contactsResponse.json()

    if (!Array.isArray(establishmentsData) || establishmentsData.length === 0) {
      return NextResponse.json([])
    }

    const normalizedQuery = normalizeString(query)

    const filteredData = establishmentsData
      .filter((school) =>
        [school.PREDIO, school.CUE, school.ESTABLECIMIENTO].some((field) =>
          normalizeString(field?.toString() || "").includes(normalizedQuery),
        ),
      )
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
          NOMBRE: contact["NOMBRE"],
          APELLIDO: contact["APELLIDO"],
          CARGO: contact["CARGO"],
          TELEFONO: contact["TELÉFONO"],
        }
      })

    return NextResponse.json(filteredData)
  } catch (error) {
    console.error("Error en la ruta de API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

