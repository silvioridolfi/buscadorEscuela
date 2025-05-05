import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get("address")
  const city = searchParams.get("city")
  const district = searchParams.get("district")

  if (!address && !city && !district) {
    return NextResponse.json({ error: "Se requiere al menos una dirección, ciudad o distrito" }, { status: 400 })
  }

  try {
    // Construir la dirección completa
    const fullAddress = [address, city, district ? `Distrito ${district}` : null, "Buenos Aires", "Argentina"]
      .filter(Boolean)
      .join(", ")

    // Obtener la API key
    const apiKey = process.env.GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "API key no configurada" }, { status: 500 })
    }

    // Hacer la solicitud a la API de Geocodificación de Google
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`

    const response = await fetch(geocodeUrl)

    if (!response.ok) {
      throw new Error(`Error en la API de Geocodificación: ${response.status}`)
    }

    const data = await response.json()

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      return NextResponse.json(
        {
          error: "No se encontraron coordenadas para la dirección",
          status: data.status,
          fullAddress,
        },
        { status: 404 },
      )
    }

    // Extraer las coordenadas
    const location = data.results[0].geometry.location

    return NextResponse.json({
      lat: location.lat,
      lng: location.lng,
      formattedAddress: data.results[0].formatted_address,
      fullAddress,
      originalQuery: { address, city, district },
    })
  } catch (error) {
    console.error("Error en geocodificación:", error)
    return NextResponse.json(
      {
        error: "Error al geocodificar la dirección",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
