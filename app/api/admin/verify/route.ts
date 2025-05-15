import { NextResponse } from "next/server"
import { verifyAdminAuth } from "@/lib/auth-utils"

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    // Verificar el token
    const isValid = verifyAdminAuth(token)

    if (isValid) {
      return NextResponse.json({ success: true })
    } else {
      // Añadir más información para depuración
      const secretKeyExists = !!process.env.MIGRATION_AUTH_KEY
      return NextResponse.json(
        {
          success: false,
          error: "Token inválido",
          debug: {
            tokenLength: token?.length || 0,
            secretKeyExists,
            // No incluir el valor real de la clave por seguridad
            secretKeyLength: secretKeyExists ? process.env.MIGRATION_AUTH_KEY?.length || 0 : 0,
          },
        },
        { status: 401 },
      )
    }
  } catch (error) {
    console.error("Error al verificar el token:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al verificar el token",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
