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
      return NextResponse.json({ success: false, error: "Token inválido" }, { status: 401 })
    }
  } catch (error) {
    console.error("Error al verificar el token:", error)
    return NextResponse.json({ success: false, error: "Error al verificar el token" }, { status: 500 })
  }
}
