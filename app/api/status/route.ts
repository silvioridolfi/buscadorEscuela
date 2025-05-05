import { NextResponse } from "next/server"
import { getApiStatus } from "@/lib/api-utils"

export async function GET() {
  try {
    const status = getApiStatus()

    // Añadir información adicional sobre Supabase
    const enhancedStatus = {
      ...status,
      supabase: {
        connected: true,
        environment: process.env.NODE_ENV,
      },
      transitionInfo: {
        message: "La aplicación ha sido migrada a Supabase como fuente principal de datos.",
        legacyApisRemoved: true,
        version: "2.2.0",
      },
    }

    return NextResponse.json(enhancedStatus)
  } catch (error) {
    console.error("Error getting API status:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
