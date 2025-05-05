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
    // Limpiar y normalizar las coordenadas
    const cleanLat = lat.toString().trim().replace(",", ".")
    const cleanLon = lon.toString().trim().replace(",", ".")

    // Convertir a números para validación
    const latNum = Number.parseFloat(cleanLat)
    const lonNum = Number.parseFloat(cleanLon)

    if (isNaN(latNum) || isNaN(lonNum)) {
      return NextResponse.json(
        {
          error: "Coordenadas inválidas",
          details: { lat, lon, cleanLat, cleanLon, latNum, lonNum },
        },
        { status: 400 },
      )
    }

    // Validar rango de coordenadas
    if (latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
      return NextResponse.json(
        {
          error: "Coordenadas fuera de rango",
          details: { latNum, lonNum },
        },
        { status: 400 },
      )
    }

    // Generar URLs para mapas
    const apiKey = process.env.GOOGLE_MAPS_API_KEY // Usar la clave del servidor, no la pública

    let mapUrl: string

    if (apiKey) {
      // Si tenemos una API key, generar la URL del mapa embebido
      mapUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${latNum},${lonNum}&zoom=15`
    } else {
      // Si no hay API key, usar una alternativa
      mapUrl = `https://maps.google.com/maps?q=${latNum},${lonNum}&z=15&output=embed`
    }

    // URL directa para abrir en Google Maps (no requiere API key)
    const directUrl = `https://www.google.com/maps?q=${latNum},${lonNum}`

    return NextResponse.json({
      mapUrl,
      directUrl,
      coordinates: { lat: latNum, lng: lonNum },
      name: name || "Ubicación",
    })
  } catch (error) {
    console.error("Error in maps embed URL API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
