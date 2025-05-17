import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    const adminAuthKey = process.env.ADMIN_AUTH_KEY

    if (!adminAuthKey) {
      console.error("ADMIN_AUTH_KEY no está configurado en el servidor")
      return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 })
    }

    if (token === adminAuthKey) {
      // Si el token coincide exactamente con ADMIN_AUTH_KEY, devolver éxito
      return NextResponse.json({ success: true })
    } else {
      // Si el token no coincide, devolver error
      console.error(`Token inválido. Token recibido: ***${token?.slice(-4) || "null"}`)
      console.error(`Token esperado: ***${adminAuthKey.slice(-4)}`)
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }
  } catch (error) {
    console.error("Error al verificar el token:", error)
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}
