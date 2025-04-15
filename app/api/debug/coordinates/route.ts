import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")

  if (!lat || !lon) {
    return NextResponse.json({ error: "Se requieren latitud y longitud" }, { status: 400 })
  }

  try {
    // Clean and normalize the coordinates
    const cleanLat = lat.toString().trim().replace(",", ".")
    const cleanLon = lon.toString().trim().replace(",", ".")

    const latitude = Number.parseFloat(cleanLat)
    const longitude = Number.parseFloat(cleanLon)

    const isValidLat = !isNaN(latitude) && latitude >= -90 && latitude <= 90
    const isValidLon = !isNaN(longitude) && longitude >= -180 && longitude <= 180

    const directUrl = `https://www.google.com/maps?q=${latitude},${longitude}`

    return NextResponse.json({
      original: { lat, lon },
      cleaned: { lat: cleanLat, lon: cleanLon },
      parsed: { lat: latitude, lon: longitude },
      isValid: { lat: isValidLat, lon: isValidLon, overall: isValidLat && isValidLon },
      directUrl,
    })
  } catch (error) {
    console.error("Error in coordinates debug:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
