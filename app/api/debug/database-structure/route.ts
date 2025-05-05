import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    // Obtener la estructura de la tabla establecimientos
    const { data: establecimientosColumns, error: establecimientosError } = await supabaseAdmin.rpc(
      "get_table_definition",
      { table_name: "establecimientos" },
    )

    if (establecimientosError) throw establecimientosError

    // Obtener la estructura de la tabla contactos
    const { data: contactosColumns, error: contactosError } = await supabaseAdmin.rpc("get_table_definition", {
      table_name: "contactos",
    })

    if (contactosError) throw contactosError

    // Obtener algunos datos de muestra
    const { data: sampleEstablecimientos, error: sampleEstError } = await supabaseAdmin
      .from("establecimientos")
      .select("*")
      .limit(5)

    if (sampleEstError) throw sampleEstError

    const { data: sampleContactos, error: sampleContactosError } = await supabaseAdmin
      .from("contactos")
      .select("*")
      .limit(5)

    if (sampleContactosError) throw sampleContactosError

    return NextResponse.json({
      establecimientos: {
        columns: establecimientosColumns,
        sample: sampleEstablecimientos,
      },
      contactos: {
        columns: contactosColumns,
        sample: sampleContactos,
      },
    })
  } catch (error) {
    console.error("Error obteniendo estructura de la base de datos:", error)
    return NextResponse.json(
      {
        error: "Error obteniendo estructura de la base de datos",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
