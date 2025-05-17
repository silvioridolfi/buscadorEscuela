import { createClient as createClientBase } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"

// Tipos para las tablas de Supabase
export type Establecimiento = {
  cue: number
  predio: string | null
  establecimiento: string | null
  direccion: string | null
  distrito: string | null
  ciudad: string | null
  lat: number | null
  lon: number | null
  fed_a_cargo: string | null
  plan_enlace: string | null
  subplan_enlace: string | null
  fecha_inicio_conectividad: string | null
  proveedor_internet_pnce: string | null
  fecha_instalacion_pnce: string | null
  pnce_estado: string | null
  mb: string | null
  ambito: string | null
  tipo_establecimiento: string | null
  observaciones: string | null
  contactos?: Contacto[]
  id: string
  [key: string]: any
}

export type Contacto = {
  cue: number
  nombre: string | null
  apellido: string | null
  cargo: string | null
  telefono: string | null
  correo_institucional: string | null
  fed_a_cargo: string | null
  distrito: string | null
  id: string
  [key: string]: any
}

// Tipo combinado para mostrar en la UI
export type EstablecimientoConContacto = Omit<Establecimiento, "contactos"> & Partial<Contacto>

// Función para crear el cliente de Supabase
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Faltan las variables de entorno de Supabase")
  }

  return createClientBase(supabaseUrl, supabaseKey)
}

// Función para crear el cliente de Supabase con privilegios de administrador
export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Faltan las variables de entorno de Supabase")
  }

  return createClientBase(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export const supabaseClient = createClient()
export const supabaseAdmin = createSupabaseAdminClient()

// Función para generar UUIDs
export function generateUUID(): string {
  return uuidv4()
}
