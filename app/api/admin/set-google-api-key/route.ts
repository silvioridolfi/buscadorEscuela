import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const adminAuthKey = process.env.ADMIN_AUTH_KEY

    if (!token || !adminAuthKey || token !== adminAuthKey) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Obtener la clave de API del cuerpo de la solicitud
    const body = await request.json()
    const { apiKey } = body

    if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") {
      return NextResponse.json({ error: "API key is required" }, { status: 400 })
    }

    // En un entorno serverless como Vercel, no podemos escribir en el sistema de archivos
    // En su lugar, podemos usar variables de entorno temporales o almacenar en Supabase
    // Para este ejemplo, simplemente devolvemos éxito y sugerimos configurar la variable de entorno

    return NextResponse.json({
      success: true,
      message:
        "Para que la clave de API funcione, debes configurar la variable de entorno GOOGLE_SHEETS_API_KEY en tu proyecto de Vercel.",
    })
  } catch (error) {
    console.error("Error al guardar la clave de API:", error)
    return NextResponse.json(
      { error: "Error al guardar la clave de API", details: (error as Error).message },
      { status: 500 },
    )
  }
}
