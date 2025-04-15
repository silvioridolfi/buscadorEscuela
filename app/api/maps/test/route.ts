import { NextResponse } from "next/server"

export async function GET() {
  const hasApiKey = !!process.env.GOOGLE_MAPS_API_KEY

  return NextResponse.json({
    hasApiKey,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
}
