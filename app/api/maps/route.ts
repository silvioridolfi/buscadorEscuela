import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")
  const name = searchParams.get("name")

  if (!lat || !lon) {
    return NextResponse.json({ error: "Se requieren latitud y longitud" }, { status: 400 })
  }

  try {
    // Clean and normalize the coordinates
    const cleanLat = lat.toString().trim().replace(",", ".")
    const cleanLon = lon.toString().trim().replace(",", ".")

    const latitude = Number.parseFloat(cleanLat)
    const longitude = Number.parseFloat(cleanLon)

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 })
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: "Coordenadas fuera de rango" }, { status: 400 })
    }

    // Generate a Google Maps embed URL
    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key no configurada" }, { status: 500 })
    }

    const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${latitude},${longitude}&zoom=15`
    const directUrl = `https://www.google.com/maps?q=${latitude},${longitude}`

    return NextResponse.json({
      mapUrl,
      directUrl,
      coordinates: { lat: latitude, lng: longitude },
      name: name || "Ubicación",
    })
  } catch (error) {
    console.error("Error in maps API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
