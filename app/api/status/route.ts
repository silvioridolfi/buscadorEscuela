import { NextResponse } from "next/server"
import { getApiStatus } from "@/lib/api-utils"

export async function GET() {
  try {
    const status = getApiStatus()
    return NextResponse.json(status)
  } catch (error) {
    console.error("Error getting API status:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
