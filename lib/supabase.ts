import { createClient } from "@supabase/supabase-js"

// Crear un cliente de Supabase usando las variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Cliente para uso en el lado del cliente (solo operaciones públicas)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Cliente para uso en el lado del servidor (operaciones privilegiadas)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Función para generar UUIDs
export function generateUUID() {
  return crypto.randomUUID()
}

// Tipos para las tablas de Supabase actualizados según la estructura real
export interface Establecimiento {
  id: string // uuid - REQUERIDO
  cue: number // bigint
  nombre?: string // text (equivalente a ESTABLECIMIENTO en la hoja de cálculo)
  distrito?: string // text
  ciudad?: string // text
  direccion?: string // text
  lat?: number // double precision
  lon?: number // double precision
  fed_id?: string // uuid
  info_tecnica_id?: string // uuid
}

export interface Contacto {
  id: string // uuid - REQUERIDO
  cue?: number // bigint
  nombre?: string // text
  apellido?: string // text
  correo?: string // text (equivalente a CORREO_INSTITUCIONAL en la hoja de cálculo)
  telefono?: string // text
}
