import { NextResponse } from "next/server"

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

export async function GET() {
  // Set cache control headers to prevent caching
  const headers = new Headers()
  headers.set("Cache-Control", "no-store, max-age=0")
  headers.set("Pragma", "no-cache")
  headers.set("Expires", "0")

  return NextResponse.json(
    {
      version: "1.0.1",
      timestamp: Date.now(),
      environment: process.env.NODE_ENV,
    },
    { headers },
  )
}
