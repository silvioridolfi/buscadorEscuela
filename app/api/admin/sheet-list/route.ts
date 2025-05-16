import { NextResponse } from "next/server"
import { verifyAdminAuth } from "@/lib/auth-utils"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

export async function POST(request: Request) {
  try {
    // Obtener datos de la solicitud
    const requestData = await request.json()
    const { authKey } = requestData

    // Verificar autenticación
    const isAuthenticated = verifyAdminAuth(authKey)

    if (!isAuthenticated) {
      return NextResponse.json(
        {
          success: false,
          error: "No autorizado: Clave de autenticación inválida",
        },
        { status: 401 },
      )
    }

    // Lista de hojas conocidas
    const knownSheets = ["establecimientos", "contactos"]

    // Intentar obtener información sobre las hojas disponibles
    // Nota: Esto depende de la API específica que estés usando
    // Si la API no proporciona una forma de listar las hojas, tendremos que usar la lista conocida

    return NextResponse.json({
      success: true,
      sheets: knownSheets,
      message:
        "Esta es la lista de hojas conocidas. Si hay más hojas en la fuente de datos, por favor agrégalas manualmente.",
    })
  } catch (error) {
    console.error("Error al obtener la lista de hojas:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
