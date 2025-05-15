import { NextResponse } from "next/server"
import { generateAdminToken } from "@/lib/auth-utils"

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    // Verificar la contraseña
    const expectedPassword = process.env.MIGRATION_AUTH_KEY

    if (!expectedPassword) {
      console.error("MIGRATION_AUTH_KEY no está configurada en las variables de entorno")
      return NextResponse.json(
        {
          success: false,
          error: "Error de configuración del servidor: MIGRATION_AUTH_KEY no está definida",
        },
        { status: 500 },
      )
    }

    if (password === expectedPassword) {
      // Generar token
      const token = generateAdminToken()
      return NextResponse.json({ success: true, token })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Contraseña incorrecta",
          debug: {
            passwordLength: password?.length || 0,
            expectedPasswordLength: expectedPassword?.length || 0,
            // Comparación segura sin revelar valores reales
            firstCharMatch: password?.[0] === expectedPassword?.[0],
            lastCharMatch: password?.[password.length - 1] === expectedPassword?.[expectedPassword.length - 1],
          },
        },
        { status: 401 },
      )
    }
  } catch (error) {
    console.error("Error al iniciar sesión:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al iniciar sesión",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
