import { NextResponse } from "next/server"
import { generateAdminToken } from "@/lib/auth-utils"

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    // Verificar la contraseña
    const expectedPassword = process.env.MIGRATION_AUTH_KEY

    if (!expectedPassword) {
      console.error("MIGRATION_AUTH_KEY no está configurada en las variables de entorno")
      return NextResponse.json({ success: false, error: "Error de configuración del servidor" }, { status: 500 })
    }

    if (password === expectedPassword) {
      // Generar token
      const token = generateAdminToken()
      return NextResponse.json({ success: true, token })
    } else {
      return NextResponse.json({ success: false, error: "Contraseña incorrecta" }, { status: 401 })
    }
  } catch (error) {
    console.error("Error al iniciar sesión:", error)
    return NextResponse.json({ success: false, error: "Error al iniciar sesión" }, { status: 500 })
  }
}
