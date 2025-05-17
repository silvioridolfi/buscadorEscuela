import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    // Verificar la contraseña con la variable de entorno
    if (password !== process.env.MIGRATION_AUTH_KEY) {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 })
    }

    // Usar directamente el ADMIN_AUTH_KEY como token
    const token = process.env.ADMIN_AUTH_KEY

    if (!token) {
      return NextResponse.json({ error: "Error de configuración: ADMIN_AUTH_KEY no está definido" }, { status: 500 })
    }

    return NextResponse.json({ token })
  } catch (error) {
    console.error("Error en la API de inicio de sesión:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
