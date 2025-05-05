import { NextResponse } from "next/server"

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const predio = searchParams.get("predio")

  if (!predio) {
    return NextResponse.json({ error: "Se requiere un número de PREDIO" }, { status: 400 })
  }

  try {
    // Nota: La columna "predio" no existe en la tabla de Supabase
    // Por lo tanto, esta API no puede funcionar como se esperaba
    // Devolvemos un array vacío para evitar errores en el frontend

    // Set cache control headers to prevent caching
    const headers = new Headers()
    headers.set("Cache-Control", "no-store, max-age=0")
    headers.set("Pragma", "no-cache")
    headers.set("Expires", "0")

    // Return empty result with a debug field
    return NextResponse.json(
      {
        schools: [],
        debug: {
          requestedPredio: predio,
          foundCount: 0,
          foundCUEs: [],
          timestamp: new Date().toISOString(),
          message: "La columna 'predio' no existe en la tabla de Supabase",
        },
      },
      { headers },
    )
  } catch (error) {
    console.error("Error en la ruta de API:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor. Por favor, intente más tarde.",
        debug: { message: error.message, stack: error.stack },
      },
      { status: 500 },
    )
  }
}
