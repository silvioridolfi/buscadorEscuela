import { NextResponse } from "next/server"
import { verifyAdminAuth } from "@/lib/auth-utils"

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    // Verificar el token
    const isValid = verifyAdminAuth(token)

    if (!isValid) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error("Error en la API de verificación:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
