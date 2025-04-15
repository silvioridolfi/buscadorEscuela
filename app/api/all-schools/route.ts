import { NextResponse } from "next/server"
import { getSheetData } from "@/lib/api-utils"

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

export async function GET() {
  try {
    const { establishmentsData } = await getSheetData()

    if (!Array.isArray(establishmentsData) || establishmentsData.length === 0) {
      return NextResponse.json({ schools: [], error: "No data available" })
    }

    // Return a simplified version with just the fields we need for PREDIO checking
    const simplifiedData = establishmentsData
      .filter((school) => school && school.CUE) // Ensure we have valid school data
      .map((school) => ({
        CUE: school.CUE,
        PREDIO: school.PREDIO ? String(school.PREDIO).trim() : "",
        ESTABLECIMIENTO: school.ESTABLECIMIENTO || "",
      }))

    console.log(`API: Returning ${simplifiedData.length} schools for PREDIO checking`)

    // Set cache control headers to prevent caching
    const headers = new Headers()
    headers.set("Cache-Control", "no-store, max-age=0")
    headers.set("Pragma", "no-cache")
    headers.set("Expires", "0")

    // Return with some debug info
    return NextResponse.json(
      {
        schools: simplifiedData,
        count: simplifiedData.length,
        predioCount: simplifiedData.filter((s) => s.PREDIO && s.PREDIO !== "").length,
        timestamp: new Date().toISOString(), // Add timestamp to ensure response is unique
      },
      { headers },
    )
  } catch (error) {
    console.error("Error fetching all schools:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        debug: { message: error.message, stack: error.stack },
      },
      { status: 500 },
    )
  }
}
