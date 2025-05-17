import { NextResponse } from "next/server"
import { generateAdminToken } from "@/lib/auth-utils"

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    // Verificar la contraseña con la variable de entorno
    if (password !== process.env.MIGRATION_AUTH_KEY) {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 })
    }

    // Generar un token para la sesión
    const token = generateAdminToken()

    return NextResponse.json({ token })
  } catch (error) {
    console.error("Error en la API de inicio de sesión:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
