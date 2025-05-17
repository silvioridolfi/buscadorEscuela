import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminAuth } from "@/lib/auth-utils"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (verifyAdminAuth(token)) {
      // Si el token es válido, devolver éxito
      return NextResponse.json({ success: true })
    } else {
      // Si el token no es válido, devolver error
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }
  } catch (error) {
    console.error("Error al verificar el token:", error)
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}
