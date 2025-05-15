import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

export async function GET() {
  try {
    console.log("Probando conexión a Supabase...")

    // Verificar variables de entorno
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log("URL de Supabase:", supabaseUrl ? "Configurada" : "No configurada")
    console.log("Clave de Supabase:", supabaseKey ? "Configurada" : "No configurada")

    // Intentar una consulta simple para verificar la conexión
    const { data, error, count } = await supabaseAdmin.from("establecimientos").select("*", { count: "exact" }).limit(5)

    if (error) {
      console.error("Error al consultar Supabase:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: error,
          env: {
            supabaseUrl: supabaseUrl ? "Configurada" : "No configurada",
            supabaseKey: supabaseKey ? "Configurada" : "No configurada",
          },
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      count,
      sampleData: data,
      env: {
        supabaseUrl: supabaseUrl ? "Configurada" : "No configurada",
        supabaseKey: supabaseKey ? "Configurada" : "No configurada",
      },
    })
  } catch (error) {
    console.error("Error en la ruta de diagnóstico:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
