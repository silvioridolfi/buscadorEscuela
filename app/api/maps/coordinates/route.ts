import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")

  if (!lat || !lon) {
    return NextResponse.json({ error: "Se requieren latitud y longitud" }, { status: 400 })
  }

  try {
    const latitude = Number.parseFloat(lat)
    const longitude = Number.parseFloat(lon)

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: "Coordenadas inválidas", lat, lon, parsedLat: latitude, parsedLon: longitude },
        { status: 400 },
      )
    }

    const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`

    return NextResponse.json({
      lat,
      lon,
      parsedLat: latitude,
      parsedLon: longitude,
      mapUrl,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Coordinate Debug</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .container { max-width: 800px; margin: 0 auto; }
            .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
            .btn { display: inline-block; background: #00AEC3; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Coordinate Debug</h1>
            <div class="card">
              <h2>Raw Coordinates</h2>
              <p>Latitude: ${lat}</p>
              <p>Longitude: ${lon}</p>
            </div>
            <div class="card">
              <h2>Parsed Coordinates</h2>
              <p>Latitude: ${latitude}</p>
              <p>Longitude: ${longitude}</p>
            </div>
            <div class="card">
              <h2>Map Link</h2>
              <a href="${mapUrl}" target="_blank" class="btn">Open in Google Maps</a>
            </div>
          </div>
        </body>
        </html>
      `,
    })
  } catch (error) {
    console.error("Error in coordinates debug:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
