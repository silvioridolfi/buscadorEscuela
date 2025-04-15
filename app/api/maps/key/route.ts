import { NextResponse } from "next/server"

export async function GET() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || ""

  console.log("API Key configured:", !!apiKey) // Log whether key exists (not the actual key)

  return NextResponse.json({
    apiKey,
    isConfigured: !!apiKey,
  })
}
