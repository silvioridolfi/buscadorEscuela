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
  nombre?: string | null // text (equivalente a ESTABLECIMIENTO en la hoja de cálculo)
  distrito?: string | null // text
  ciudad?: string | null // text
  direccion?: string | null // text
  lat?: number | null // double precision
  lon?: number | null // double precision
  predio?: string | null // text
  fed_a_cargo?: string | null // text
  plan_enlace?: string | null // text
  subplan_enlace?: string | null // text
  fecha_inicio_conectividad?: string | null // text
  proveedor_internet_pnce?: string | null // text
  fecha_instalacion_pnce?: string | null // text
  pnce_tipo_mejora?: string | null // text
  pnce_fecha_mejora?: string | null // text
  pnce_estado?: string | null // text
  pba_grupo_1_proveedor_internet?: string | null // text
  pba_grupo_1_fecha_instalacion?: string | null // text
  pba_grupo_1_estado?: string | null // text
  pba_2019_proveedor_internet?: string | null // text
  pba_2019_fecha_instalacion?: string | null // text
  pba_2019_estado?: string | null // text
  pba_grupo_2_a_proveedor_internet?: string | null // text
  pba_grupo_2_a_fecha_instalacion?: string | null // text
  pba_grupo_2_a_tipo_mejora?: string | null // text
  pba_grupo_2_a_fecha_mejora?: string | null // text
  pba_grupo_2_a_estado?: string | null // text
  plan_piso_tecnologico?: string | null // text
  proveedor_piso_tecnologico_cue?: string | null // text
  fecha_terminado_piso_tecnologico_cue?: string | null // text
  tipo_mejora?: string | null // text
  fecha_mejora?: string | null // text
  tipo_piso_instalado?: string | null // text
  tipo?: string | null // text
  observaciones?: string | null // text
  tipo_establecimiento?: string | null // text
  listado_conexion_internet?: string | null // text
  estado_instalacion_pba?: string | null // text
  proveedor_asignado_pba?: string | null // text
  mb?: string | null // text
  ambito?: string | null // text
  cue_anterior?: string | null // text
  reclamos_grupo_1_ani?: string | null // text
  recurso_primario?: string | null // text
  access_id?: string | null // text
  // Campos adicionales que podrían existir en la base de datos
  [key: string]: any
}

export interface Contacto {
  id: string // uuid - REQUERIDO
  cue?: number | null // bigint
  nombre?: string | null // text
  apellido?: string | null // text
  correo?: string | null // text (equivalente a CORREO_INSTITUCIONAL en la hoja de cálculo)
  telefono?: string | null // text
  cargo?: string | null // text
  // Campos adicionales que podrían existir en la base de datos
  [key: string]: any
}
